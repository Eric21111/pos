const dbManager = require('../config/databaseManager');
const mongoose = require('mongoose');

// Middleware to check network status and use appropriate database
const networkDetection = async (req, res, next) => {
  try {
    // Check network status (non-blocking)
    dbManager.checkNetworkStatus().catch(() => {
      // Silently handle network check errors
    });
    
    // Ensure local connection is always available (for offline mode)
    let localConnection = dbManager.getLocalConnection();
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        await dbManager.connectLocalForSync();
        localConnection = dbManager.getLocalConnection();
      } catch (error) {
        console.warn('Could not initialize local connection in middleware:', error.message);
      }
    }
    
    // Check if mongoose connection is available
    if (mongoose.connection.readyState !== 1) {
      // Try to reconnect
      try {
        if (dbManager.isConnected()) {
          await dbManager.connectCloud();
        } else {
          // If offline, ensure local connection is available
          if (!localConnection || localConnection.readyState !== 1) {
            await dbManager.connectLocal();
          }
        }
      } catch (error) {
        // If cloud connection fails, try local
        if (dbManager.isConnected()) {
          try {
            await dbManager.connectLocal();
          } catch (localError) {
            return res.status(503).json({
              success: false,
              message: 'Database connection unavailable',
              offline: true,
              error: localError.message
            });
          }
        } else {
          return res.status(503).json({
            success: false,
            message: 'Database connection unavailable',
            offline: !dbManager.isConnected(),
            error: error.message
          });
        }
      }
    }
    
    // Attach status to request
    req.isOnline = dbManager.isConnected();
    req.dbManager = dbManager;
    
    next();
  } catch (error) {
    console.error('Network detection error:', error);
    // Even on error, try to continue with local database
    req.isOnline = false;
    req.dbManager = dbManager;
    next(); // Continue instead of failing
  }
};

module.exports = networkDetection;

