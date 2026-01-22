const dbManager = require('../config/databaseManager');
const mongoose = require('mongoose');


async function mergeDataFromBothSources(modelName, query = {}, options = {}) {
  const localConnection = dbManager.getLocalConnection();
  const isOnline = dbManager.isConnected();
  

  const schemaModule = require(`../models/${modelName}`);
  const schema = schemaModule.schema || schemaModule;
  
  let cloudData = [];
  let localData = [];
  

  if (modelName === 'Cart') {
    // Only get from local
    if (localConnection && localConnection.readyState === 1) {
      try {
        const LocalModel = localConnection.model(modelName, schema);
        localData = await LocalModel.find(query).lean();
      } catch (error) {
        console.warn(`Error fetching ${modelName} from local:`, error.message);
      }
    }
    return localData; // Return only local data for carts
  }
  
  // Get cloud data (if online)
  if (isOnline && mongoose.connection.readyState === 1) {
    try {
      const CloudModel = mongoose.model(modelName, schema);
      let cloudQuery = query;
      
      // For Employees: Only get owner accounts from cloud
      if (modelName === 'Employee') {
        cloudQuery = { ...query, role: 'Owner' };
      }
      
      // Add limit for performance (default 5000, can be overridden in options)
      const limit = options.limit || 5000;
      cloudData = await CloudModel.find(cloudQuery).limit(limit).lean();
    } catch (error) {
      console.warn(`Error fetching ${modelName} from cloud:`, error.message);
    }
  }
  
  
  let actualLocalConnection = localConnection;
  if (!actualLocalConnection || actualLocalConnection.readyState !== 1) {
    try {
      await dbManager.connectLocalForSync();
      actualLocalConnection = dbManager.getLocalConnection();
    } catch (error) {
      console.warn(`Could not initialize local connection for ${modelName}:`, error.message);
    }
  }
  
  if (actualLocalConnection && actualLocalConnection.readyState === 1) {
    try {
      const LocalModel = actualLocalConnection.model(modelName, schema);
      // Add limit for performance (default 5000, can be overridden in options)
      const limit = options.limit || 5000;
      localData = await LocalModel.find(query).limit(limit).lean();
    } catch (error) {
      console.warn(`Error fetching ${modelName} from local:`, error.message);
    }
  }
  
  // If offline, return only local data (even if empty)
  if (!isOnline) {
    console.log(`[${modelName}] Offline mode: Returning ${localData.length} items from local database`);
    return localData;
  }
  
 
  const mergedMap = new Map(); 
  const idToSkuMap = new Map(); 
  const skuToIdMap = new Map();
  
  
  const normalizeId = (item) => {
    if (item._id) {
      return item._id.toString();
    }
    if (item.id) {
      return item.id.toString();
    }
    return null;
  };
  
  
  const getAlternativeKey = (item) => {
   
    if (modelName === 'Product' && item.sku) {
      return `sku:${item.sku.toLowerCase().trim()}`;
    }
 
    if (modelName === 'SalesTransaction') {
      if (item.referenceNo) {
        return `ref:${item.referenceNo}`;
      }
      if (item.receiptNo) {
        return `receipt:${item.receiptNo}`;
      }
    }
    return null;
  };
  
 
  const emailToIdMap = new Map(); 
  
  
  cloudData.forEach(item => {
    const id = normalizeId(item);
    if (id) {
      mergedMap.set(id, { ...item, source: 'cloud' });
      
 
      if (modelName === 'Product' && item.sku) {
        const skuKey = item.sku.toLowerCase().trim();
        idToSkuMap.set(id, skuKey);
      
        if (skuToIdMap.has(skuKey) && skuToIdMap.get(skuKey) !== id) {
          console.warn(`[${modelName}] Product with SKU ${item.sku} has different _id in cloud. Existing: ${skuToIdMap.get(skuKey)}, New: ${id}`);
        }
        skuToIdMap.set(skuKey, id);
      }
     
      if (modelName === 'Employee' && item.email) {
        emailToIdMap.set(item.email.toLowerCase().trim(), id);
      }
    }
  });
  

  localData.forEach(item => {
    const id = normalizeId(item);
    
    if (!id) {
      console.warn(`[${modelName}] Item without _id found in local data, skipping:`, item);
      return; 
    }
    

    if (modelName === 'Employee' && item.email) {
      const emailKey = item.email.toLowerCase().trim();
      const existingIdByEmail = emailToIdMap.get(emailKey);
      
    
      if (existingIdByEmail && existingIdByEmail !== id) {
        console.warn(`[${modelName}] Employee with email ${emailKey} found with different _id. Cloud: ${existingIdByEmail}, Local: ${id}. Using cloud version.`);
        return;
      }
      
      
      if (!existingIdByEmail) {
        emailToIdMap.set(emailKey, id);
      }
    }
    
    if (mergedMap.has(id)) {
    
      const existingItem = mergedMap.get(id);
      const localUpdated = new Date(item.updatedAt || item.createdAt || 0);
      const cloudUpdated = new Date(existingItem.updatedAt || existingItem.createdAt || 0);
      
    
      if (localUpdated > cloudUpdated) {
        mergedMap.set(id, { ...item, source: 'local-newer', needsSync: true });
      
        if (modelName === 'Product' && item.sku) {
          const skuKey = item.sku.toLowerCase().trim();
          idToSkuMap.set(id, skuKey);
          skuToIdMap.set(skuKey, id);
        }
      }

      return; 
    }
    
    if (modelName === 'Product' && item.sku) {
      const skuKey = item.sku.toLowerCase().trim();
      const existingIdBySku = skuToIdMap.get(skuKey);
      
      if (existingIdBySku && existingIdBySku !== id) {
        
        console.warn(`[${modelName}] Product with SKU ${item.sku} found with different _id. Existing: ${existingIdBySku}, New: ${id}. Using existing.`);
        return; 
      }
      
      mergedMap.set(id, { ...item, source: 'local' });
      idToSkuMap.set(id, skuKey);
      skuToIdMap.set(skuKey, id);
    } else {
      
      mergedMap.set(id, { ...item, source: 'local' });
    }
  });
  
 
  let merged = Array.from(mergedMap.values());
  
  // Final deduplication pass (safety check - should not find duplicates since we use _id as key)
  // This is a defensive check in case the map somehow has duplicates
  const seenIds = new Set();
  const seenSKUs = new Set(); // For products
  const seenEmails = new Set(); // For employees
  const seenRefs = new Set(); // For transactions
  
  merged = merged.filter(item => {
    const id = normalizeId(item);
    
    // PRIMARY CHECK: Always deduplicate by _id first
    if (id) {
      if (seenIds.has(id)) {
        console.warn(`[${modelName}] Duplicate item found with ID: ${id}, removing duplicate`);
        return false; // Remove duplicate
      }
      seenIds.add(id);
    } else {
      console.warn(`[${modelName}] Item without _id found in final pass, skipping:`, item);
      return false; // Skip items without ID
    }
    
    // SECONDARY CHECKS: Additional deduplication for specific models
    if (modelName === 'Product' && item.sku) {
      const skuKey = item.sku.toLowerCase().trim();
      if (seenSKUs.has(skuKey)) {
        console.warn(`[${modelName}] Duplicate product found with SKU: ${item.sku} (ID: ${id}), removing duplicate`);
        return false; // Remove duplicate
      }
      seenSKUs.add(skuKey);
    }
    
    if (modelName === 'Employee' && item.email) {
      const emailKey = item.email.toLowerCase().trim();
      if (seenEmails.has(emailKey)) {
        console.warn(`[${modelName}] Duplicate employee found with email: ${emailKey} (ID: ${id}), removing duplicate`);
        return false; // Remove duplicate
      }
      seenEmails.add(emailKey);
    }
    
    if (modelName === 'SalesTransaction') {
      const refKey = item.referenceNo || item.receiptNo;
      if (refKey) {
        if (seenRefs.has(refKey)) {
          console.warn(`[${modelName}] Duplicate transaction found with key: ${refKey} (ID: ${id}), removing duplicate`);
          return false; // Remove duplicate
        }
        seenRefs.add(refKey);
      }
    }
    
    return true; // Keep unique item
  });
  
  if (modelName === 'Employee') {
    console.log(`[${modelName} Merge] Final count after deduplication: ${merged.length}`);
  }
  
  // Apply sorting if specified
  if (options.sort) {
    merged.sort((a, b) => {
      for (const [field, direction] of Object.entries(options.sort)) {
        const aVal = a[field];
        const bVal = b[field];
        const dir = direction === 'desc' ? -1 : 1;
        
        if (aVal < bVal) return -1 * dir;
        if (aVal > bVal) return 1 * dir;
        return 0;
      }
      return 0;
    });
  }
  
  return merged;
}

/**
 * Get single document by ID from both sources
 */
async function getByIdFromBothSources(modelName, id) {
  const localConnection = dbManager.getLocalConnection();
  const isOnline = dbManager.isConnected();
  
  const schemaModule = require(`../models/${modelName}`);
  const schema = schemaModule.schema || schemaModule;
  
  let cloudDoc = null;
  let localDoc = null;
  
  // Try cloud first (if online)
  if (isOnline && mongoose.connection.readyState === 1) {
    try {
      const CloudModel = mongoose.model(modelName, schema);
      cloudDoc = await CloudModel.findById(id).lean();
    } catch (error) {
      console.warn(`Error fetching ${modelName} from cloud:`, error.message);
    }
  }
  
  // Try local (ensure connection exists)
  let actualLocalConnection = localConnection;
  if (!actualLocalConnection || actualLocalConnection.readyState !== 1) {
    try {
      await dbManager.connectLocalForSync();
      actualLocalConnection = dbManager.getLocalConnection();
    } catch (error) {
      console.warn(`Could not initialize local connection for ${modelName}:`, error.message);
    }
  }
  
  if (actualLocalConnection && actualLocalConnection.readyState === 1) {
    try {
      const LocalModel = actualLocalConnection.model(modelName, schema);
      localDoc = await LocalModel.findById(id).lean();
    } catch (error) {
      console.warn(`Error fetching ${modelName} from local:`, error.message);
    }
  }
  
  // If offline, return local only
  if (!isOnline) {
    return localDoc;
  }
  
  // If both exist, prefer cloud unless local is newer
  if (cloudDoc && localDoc) {
    const localUpdated = new Date(localDoc.updatedAt || localDoc.createdAt);
    const cloudUpdated = new Date(cloudDoc.updatedAt || cloudDoc.createdAt);
    
    if (localUpdated > cloudUpdated) {
      return { ...localDoc, source: 'local-newer', needsSync: true };
    }
    return { ...cloudDoc, source: 'cloud' };
  }
  
  // Return whichever exists
  return cloudDoc || localDoc;
}

module.exports = {
  mergeDataFromBothSources,
  getByIdFromBothSources
};

