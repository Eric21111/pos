const dbManager = require('../config/databaseManager');
const mongoose = require('mongoose');

class SyncService {
  constructor() {
    this.syncInProgress = false;
    this.lastSyncTime = null;
  }

  async syncAllData() {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (!dbManager.isConnected()) {
      console.log('Cannot sync: System is offline');
      return;
    }

    // Cloud connection is the main mongoose connection
    if (mongoose.connection.readyState !== 1) {
      console.log('Cloud database not available for sync');
      return;
    }

    // Get local connection (separate connection for sync)
    let localConnection = dbManager.getLocalConnection();
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        console.log('Local connection not ready, attempting to connect...');
        localConnection = await dbManager.connectLocalForSync();
        console.log('Local connection established for sync');
      } catch (error) {
        console.error('Local database not available for sync:', error.message);
        return;
      }
    }

    if (!localConnection || localConnection.readyState !== 1) {
      console.error('Local database connection failed. ReadyState:', localConnection?.readyState);
      return;
    }

    this.syncInProgress = true;
    console.log('========================================');
    console.log('Starting BIDIRECTIONAL sync...');
    console.log('Local DB:', localConnection.name);
    console.log('Cloud DB:', mongoose.connection.name);
    console.log('========================================');

    try {
      // Sync Products (most important for stock sync)
      console.log('\n========================================');
      console.log('Starting Product sync (checking stock differences)...');
      console.log('========================================');
      
      // Sync Local -> Cloud
      console.log('\n[DIRECTION: Local -> Cloud]');
      await this.syncCollection('Product', localConnection);
      
      // Sync Cloud -> Local
      console.log('\n[DIRECTION: Cloud -> Local]');
      await this.syncCollectionFromCloud('Product', localConnection);
      
      // Sync Employees (only owner accounts are synced - handled in syncCollection)
      console.log('\n[DIRECTION: Local -> Cloud]');
      await this.syncCollection('Employee', localConnection);
      console.log('\n[DIRECTION: Cloud -> Local]');
      await this.syncCollectionFromCloud('Employee', localConnection);
      
      // Sync Transactions
      console.log('\n[DIRECTION: Local -> Cloud]');
      await this.syncCollection('SalesTransaction', localConnection);
      console.log('\n[DIRECTION: Cloud -> Local]');
      await this.syncCollectionFromCloud('SalesTransaction', localConnection);
      
      // Sync Stock Movements
      console.log('\n[DIRECTION: Local -> Cloud]');
      await this.syncCollection('StockMovement', localConnection);
      console.log('\n[DIRECTION: Cloud -> Local]');
      await this.syncCollectionFromCloud('StockMovement', localConnection);
      
      // Sync Void Logs
      console.log('\n[DIRECTION: Local -> Cloud]');
      await this.syncCollection('VoidLog', localConnection);
      console.log('\n[DIRECTION: Cloud -> Local]');
      await this.syncCollectionFromCloud('VoidLog', localConnection);
      
      // Carts are NOT synced - they remain local only

      this.lastSyncTime = new Date();
      console.log('========================================');
      console.log('Bidirectional sync completed successfully at', this.lastSyncTime);
      console.log('========================================');
    } catch (error) {
      console.error('Error during full sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncCollection(modelName, localConnection) {
    try {
      console.log(`\n[${modelName}] Starting sync...`);
      
      // Import schema
      const schemaModule = require(`../models/${modelName}`);
      const schema = schemaModule.schema || schemaModule;
      
      // Get models for both connections
      const LocalModel = localConnection.model(modelName, schema);
      const CloudModel = mongoose.model(modelName, schema);

      // Verify connections
      if (!LocalModel) {
        console.error(`[${modelName}] Failed to get LocalModel`);
        return;
      }
      if (!CloudModel) {
        console.error(`[${modelName}] Failed to get CloudModel`);
        return;
      }

      // Get all documents from local
      let localDocs = await LocalModel.find({}).lean();
      
      // For Products: Log sample data to debug
      if (modelName === 'Product' && localDocs.length > 0) {
        console.log(`[${modelName}] Sample local product: SKU=${localDocs[0].sku}, Stock=${localDocs[0].currentStock}`);
      }
      
      // For Employees: Only sync owner accounts
      if (modelName === 'Employee') {
        localDocs = localDocs.filter(doc => doc.role === 'Owner');
        console.log(`[${modelName}] Filtering: Only syncing owner accounts (${localDocs.length} owners found)`);
      }
      
      console.log(`[${modelName}] Found ${localDocs.length} documents in local database (${localConnection.name})`);

      if (localDocs.length === 0) {
        console.log(`[${modelName}] No documents to sync`);
        return;
      }

      let synced = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;

      for (const doc of localDocs) {
        try {
          // For Employees: Skip non-owner accounts
          if (modelName === 'Employee' && doc.role !== 'Owner') {
            skipped++;
            continue;
          }
          
          // Check if document exists in cloud
          const existing = await CloudModel.findById(doc._id);
          
          if (!existing) {
            // Document doesn't exist in cloud, create it
            // This happens when this device added the item while offline
            await CloudModel.create(doc);
            synced++;
            const itemInfo = modelName === 'Product' ? `SKU: ${doc.sku}, Name: ${doc.itemName}, Stock: ${doc.currentStock}` : '';
            console.log(`[${modelName}] ✓ Synced NEW document to cloud (added while offline): ${doc._id || doc.sku || doc._id} ${itemInfo}`);
          } else {
            // Document exists in cloud
            const localUpdated = new Date(doc.updatedAt || doc.createdAt);
            const cloudUpdated = new Date(existing.updatedAt || existing.createdAt);
            
            // Update cloud if local is newer (local offline transactions must be synced to cloud)
            let shouldUpdate = localUpdated > cloudUpdated;
            let updateReason = localUpdated > cloudUpdated ? 'local is newer (offline transaction)' : '';
            
            // For products: Also update if timestamps are same but stock differs
            // This handles edge cases where timestamps might be identical
            if (modelName === 'Product') {
              const stockDiffers = doc.currentStock !== existing.currentStock;
              const sizesDiffer = JSON.stringify(doc.sizes || {}) !== JSON.stringify(existing.sizes || {});
              
              // If local is newer, always update (local transaction wins)
              // If timestamps are same but stock differs, update (local is source of truth)
              if (localUpdated.getTime() === cloudUpdated.getTime() && (stockDiffers || sizesDiffer)) {
                shouldUpdate = true;
                updateReason = stockDiffers 
                  ? `timestamps same, stock differs (local=${doc.currentStock}, cloud=${existing.currentStock})`
                  : 'timestamps same, sizes differ';
                console.log(`[${modelName}] ⚠ Stock/sizes difference with same timestamp for ${doc.sku || doc._id}: local=${doc.currentStock}, cloud=${existing.currentStock}`);
              } else if (stockDiffers && shouldUpdate) {
                updateReason = `local is newer, stock differs (local=${doc.currentStock}, cloud=${existing.currentStock})`;
                console.log(`[${modelName}] ⚠ Stock difference detected for ${doc.sku || doc._id}: local=${doc.currentStock}, cloud=${existing.currentStock} - Local is newer, updating cloud`);
              } else if (sizesDiffer && shouldUpdate) {
                updateReason = updateReason ? updateReason + ', sizes differ' : 'local is newer, sizes differ';
                console.log(`[${modelName}] ⚠ Sizes difference detected for ${doc.sku || doc._id} - Local is newer, updating cloud`);
              }
            }
            
            if (shouldUpdate) {
              // Use replaceOne to ensure all fields are updated correctly, including stock
              // This ensures the cloud database has the exact same data as local
              await CloudModel.replaceOne({ _id: doc._id }, doc);
              updated++;
              const stockInfo = modelName === 'Product' ? ` (stock: ${doc.currentStock || 'N/A'})` : '';
              console.log(`[${modelName}] ✓ Updated document: ${doc._id || doc.sku}${stockInfo} - Reason: ${updateReason}`);
            } else {
              skipped++;
              // Log why it was skipped for products
              if (modelName === 'Product') {
                console.log(`[${modelName}] ⊘ Skipped ${doc.sku || doc._id}: timestamps same, stock same (local=${doc.currentStock}, cloud=${existing.currentStock})`);
              }
            }
          }
        } catch (error) {
          console.error(`[${modelName}] ✗ Error syncing document ${doc._id}:`, error.message);
          errors++;
        }
      }

      console.log(`[${modelName}] Sync complete: ${synced} new, ${updated} updated, ${skipped} skipped, ${errors} errors`);
      if (modelName === 'Product' && updated === 0 && skipped > 0) {
        console.log(`[${modelName}] ⚠ WARNING: All products were skipped. This might indicate stock differences are not being detected.`);
      }
    } catch (error) {
      console.error(`[${modelName}] ✗ ERROR syncing collection:`, error.message);
      console.error(error.stack);
    }
  }

  async syncCollectionFromCloud(modelName, localConnection) {
    try {
      console.log(`\n[${modelName}] Starting sync from cloud to local...`);
      
      // Import schema
      const schemaModule = require(`../models/${modelName}`);
      const schema = schemaModule.schema || schemaModule;
      
      // Get models for both connections
      const LocalModel = localConnection.model(modelName, schema);
      const CloudModel = mongoose.model(modelName, schema);

      // Verify connections
      if (!LocalModel) {
        console.error(`[${modelName}] Failed to get LocalModel`);
        return;
      }
      if (!CloudModel) {
        console.error(`[${modelName}] Failed to get CloudModel`);
        return;
      }

      // Get all documents from cloud
      let cloudDocs = await CloudModel.find({}).lean();
      
      // For Employees: Only sync owner accounts from cloud
      if (modelName === 'Employee') {
        cloudDocs = cloudDocs.filter(doc => doc.role === 'Owner');
        console.log(`[${modelName}] Filtering: Only syncing owner accounts (${cloudDocs.length} owners found)`);
      }
      
      // For Products: Log sample data to debug
      if (modelName === 'Product' && cloudDocs.length > 0) {
        console.log(`[${modelName}] Sample cloud product: SKU=${cloudDocs[0].sku}, Stock=${cloudDocs[0].currentStock}`);
      }
      
      console.log(`[${modelName}] Found ${cloudDocs.length} documents in cloud database (${mongoose.connection.name})`);

      if (cloudDocs.length === 0) {
        console.log(`[${modelName}] No documents to sync from cloud`);
        return;
      }

      let synced = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;

      for (const doc of cloudDocs) {
        try {
          // For Employees: Skip non-owner accounts
          if (modelName === 'Employee' && doc.role !== 'Owner') {
            skipped++;
            continue;
          }
          
          // Check if document exists in local
          const existing = await LocalModel.findById(doc._id);
          
          if (!existing) {
            // Document doesn't exist in local, create it
            // This happens when another device (e.g., mobile) added the item while this device was offline
            await LocalModel.create(doc);
            synced++;
            const itemInfo = modelName === 'Product' ? `SKU: ${doc.sku}, Name: ${doc.itemName}, Stock: ${doc.currentStock}` : '';
            console.log(`[${modelName}] ✓ Synced NEW document from cloud (added by another device): ${doc._id || doc.sku || doc._id} ${itemInfo}`);
          } else {
            // Document exists in local
            const cloudUpdated = new Date(doc.updatedAt || doc.createdAt);
            const localUpdated = new Date(existing.updatedAt || existing.createdAt);
            
            // IMPORTANT: Only update from cloud if cloud is NEWER
            // We NEVER overwrite local data if local is newer (local offline transactions must be preserved)
            let shouldUpdate = cloudUpdated > localUpdated;
            let updateReason = cloudUpdated > localUpdated ? 'cloud is newer' : '';
            
            // For products: Only check stock differences if cloud is newer
            // If local is newer, local transaction is the source of truth
            if (modelName === 'Product' && shouldUpdate) {
              // Check if stock or sizes differ (only if we're already updating)
              const stockDiffers = doc.currentStock !== existing.currentStock;
              const sizesDiffer = JSON.stringify(doc.sizes || {}) !== JSON.stringify(existing.sizes || {});
              
              if (stockDiffers) {
                updateReason = `cloud is newer, stock differs (cloud=${doc.currentStock}, local=${existing.currentStock})`;
                console.log(`[${modelName}] ⚠ Stock difference detected for ${doc.sku || doc._id}: cloud=${doc.currentStock}, local=${existing.currentStock} - Cloud is newer, updating local`);
              }
              
              if (sizesDiffer) {
                updateReason = updateReason ? updateReason + ', sizes differ' : 'cloud is newer, sizes differ';
                console.log(`[${modelName}] ⚠ Sizes difference detected for ${doc.sku || doc._id} - Cloud is newer, updating local`);
              }
            } else if (modelName === 'Product' && !shouldUpdate) {
              // Local is newer - check if there's a stock difference but DON'T update (local wins)
              const stockDiffers = doc.currentStock !== existing.currentStock;
              if (stockDiffers) {
                console.log(`[${modelName}] ⊘ Local is newer, preserving local transaction: ${doc.sku || doc._id} (local=${existing.currentStock}, cloud=${doc.currentStock})`);
              }
            }
            
            if (shouldUpdate) {
              // Use replaceOne to ensure all fields are updated correctly, including stock
              // This ensures the local database has the exact same data as cloud
              await LocalModel.replaceOne({ _id: doc._id }, doc);
              updated++;
              const stockInfo = modelName === 'Product' ? ` (stock: ${doc.currentStock || 'N/A'})` : '';
              console.log(`[${modelName}] ✓ Updated local document: ${doc._id || doc.sku}${stockInfo} - Reason: ${updateReason}`);
            } else {
              skipped++;
              // Log why it was skipped for products
              if (modelName === 'Product') {
                const stockSame = doc.currentStock === existing.currentStock;
                const reason = localUpdated > cloudUpdated 
                  ? 'local is newer (preserving local transaction)' 
                  : stockSame 
                    ? 'timestamps same, stock same' 
                    : 'timestamps same';
                console.log(`[${modelName}] ⊘ Skipped ${doc.sku || doc._id}: ${reason} (cloud=${doc.currentStock}, local=${existing.currentStock})`);
              }
            }
          }
        } catch (error) {
          console.error(`[${modelName}] ✗ Error syncing document from cloud ${doc._id}:`, error.message);
          errors++;
        }
      }

      console.log(`[${modelName}] Cloud->Local sync complete: ${synced} new, ${updated} updated, ${skipped} skipped, ${errors} errors`);
      if (modelName === 'Product' && updated === 0 && skipped > 0) {
        console.log(`[${modelName}] ⚠ WARNING: All products were skipped. This might indicate stock differences are not being detected.`);
      }
    } catch (error) {
      console.error(`[${modelName}] ✗ ERROR syncing collection from cloud:`, error.message);
      console.error(error.stack);
    }
  }

  async syncDocument(modelName, documentId) {
    if (!dbManager.isConnected()) {
      console.log('Cannot sync: System is offline');
      return false;
    }

    const cloudConnection = dbManager.getCloudConnection();
    const localConnection = dbManager.getLocalConnection();

    if (!cloudConnection || !localConnection) {
      return false;
    }

    try {
      const schemaModule = require(`../models/${modelName}`);
      const schema = schemaModule.schema || schemaModule;
      const LocalModel = localConnection.model(modelName, schema);
      const CloudModel = mongoose.model(modelName, schema);

      const localDoc = await LocalModel.findById(documentId).lean();
      if (!localDoc) {
        return false;
      }

      const existing = await CloudModel.findById(documentId);
      if (!existing) {
        await CloudModel.create(localDoc);
      } else {
        const localUpdated = new Date(localDoc.updatedAt || localDoc.createdAt);
        const cloudUpdated = new Date(existing.updatedAt || existing.createdAt);
        if (localUpdated > cloudUpdated) {
          await CloudModel.findByIdAndUpdate(documentId, localDoc, { new: true });
        }
      }

      return true;
    } catch (error) {
      console.error(`Error syncing ${modelName} document ${documentId}:`, error.message);
      return false;
    }
  }
}

module.exports = new SyncService();

