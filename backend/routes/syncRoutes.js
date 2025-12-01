const express = require('express');
const router = express.Router();
const syncService = require('../services/syncService');
const dbManager = require('../config/databaseManager');
const mongoose = require('mongoose');

// Manual sync endpoint
router.post('/sync', async (req, res) => {
  try {
    console.log('========================================');
    console.log('Manual sync triggered via API');
    console.log('========================================');
    console.log('System online:', dbManager.isConnected());
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    console.log('Mongoose connection host:', mongoose.connection.host);
    console.log('Mongoose connection name:', mongoose.connection.name);
    
    const localConnection = dbManager.getLocalConnection();
    console.log('Local connection state:', localConnection?.readyState);
    console.log('Local connection name:', localConnection?.name);
    console.log('Local connection host:', localConnection?.host);
    
    await syncService.syncAllData();
    
    res.json({
      success: true,
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString(),
      online: dbManager.isConnected(),
      cloudDB: mongoose.connection.name,
      localDB: localConnection?.name
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error.message
    });
  }
});

// Check sync status
router.get('/status', async (req, res) => {
  try {
    const localConnection = dbManager.getLocalConnection();
    
    // Count documents in local
    let localCounts = {};
    if (localConnection && localConnection.readyState === 1) {
      const models = ['Product', 'Employee', 'SalesTransaction', 'StockMovement', 'Cart'];
      for (const modelName of models) {
        try {
          const schemaModule = require(`../models/${modelName}`);
          const schema = schemaModule.schema || schemaModule;
          const LocalModel = localConnection.model(modelName, schema);
          const count = await LocalModel.countDocuments({});
          localCounts[modelName] = count;
        } catch (error) {
          localCounts[modelName] = 'Error: ' + error.message;
        }
      }
    }
    
    // Count documents in cloud
    let cloudCounts = {};
    if (mongoose.connection.readyState === 1) {
      const models = ['Product', 'Employee', 'SalesTransaction', 'StockMovement', 'Cart'];
      for (const modelName of models) {
        try {
          const schemaModule = require(`../models/${modelName}`);
          const schema = schemaModule.schema || schemaModule;
          const CloudModel = mongoose.model(modelName, schema);
          const count = await CloudModel.countDocuments({});
          cloudCounts[modelName] = count;
        } catch (error) {
          cloudCounts[modelName] = 'Error: ' + error.message;
        }
      }
    }
    
    res.json({
      success: true,
      online: dbManager.isConnected(),
      cloudConnection: {
        state: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      localConnection: {
        state: localConnection?.readyState || 'Not connected',
        host: localConnection?.host || 'N/A',
        name: localConnection?.name || 'N/A'
      },
      localCounts,
      cloudCounts,
      syncInProgress: syncService.syncInProgress,
      lastSyncTime: syncService.lastSyncTime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force sync employees from Atlas to local (all employees, not just owners)
router.post('/sync-employees', async (req, res) => {
  try {
    console.log('========================================');
    console.log('Manual employee sync from Atlas to Local');
    console.log('========================================');
    
    if (!dbManager.isConnected()) {
      return res.status(400).json({
        success: false,
        message: 'System is offline. Cannot sync from Atlas.'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Atlas connection not available'
      });
    }

    const localConnection = dbManager.getLocalConnection();
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        await dbManager.connectLocalForSync();
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Local database not available: ' + error.message
        });
      }
    }

    // Import Employee schema
    const EmployeeModule = require('../models/Employee');
    const EmployeeSchema = EmployeeModule.schema || EmployeeModule;
    
    // Get models
    const LocalEmployee = localConnection.model('Employee', EmployeeSchema);
    const CloudEmployee = mongoose.model('Employee', EmployeeSchema);

    // Get all employees from Atlas (no filter)
    const cloudEmployees = await CloudEmployee.find({}).lean();
    console.log(`Found ${cloudEmployees.length} employees in Atlas`);

    let synced = 0;
    let updated = 0;
    let errors = 0;

    for (const employee of cloudEmployees) {
      try {
        const existing = await LocalEmployee.findById(employee._id);
        
        // Prepare employee data - ensure all required fields are present
        const employeeData = {
          ...employee,
          _id: employee._id,
          // Ensure timestamps are preserved
          createdAt: employee.createdAt || new Date(),
          updatedAt: employee.updatedAt || new Date()
        };
        
        if (!existing) {
          // Employee doesn't exist in local, create it
          // Use insertOne with bypassDocumentValidation to skip pre-save hooks
          // since PIN is already hashed in Atlas
          await LocalEmployee.collection.insertOne(employeeData);
          synced++;
          console.log(`✓ Synced new employee: ${employee.name || employee.email} (${employee._id})`);
        } else {
          // Employee exists, update it (cloud is source of truth for this sync)
          // Use replaceOne directly on collection to bypass validation/hooks
          await LocalEmployee.collection.replaceOne({ _id: employee._id }, employeeData);
          updated++;
          console.log(`✓ Updated employee: ${employee.name || employee.email} (${employee._id})`);
        }
      } catch (error) {
        console.error(`✗ Error syncing employee ${employee._id}:`, error.message);
        console.error('  Full error:', error);
        if (error.stack) {
          console.error('  Stack:', error.stack);
        }
        errors++;
      }
    }

    console.log(`Employee sync complete: ${synced} new, ${updated} updated, ${errors} errors`);

    res.json({
      success: true,
      message: 'Employee sync completed',
      synced,
      updated,
      errors,
      total: cloudEmployees.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Employee sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Employee sync failed',
      error: error.message
    });
  }
});

module.exports = router;

