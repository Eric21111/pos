const dbManager = require('../config/databaseManager');
const mongoose = require('mongoose');

/**
 * Merges data from cloud and local databases
 * When online: Returns merged data from both sources (cloud takes precedence for duplicates)
 * When offline: Returns only local data
 */
async function mergeDataFromBothSources(modelName, query = {}, options = {}) {
  const localConnection = dbManager.getLocalConnection();
  const isOnline = dbManager.isConnected();
  
  // Import schema
  const schemaModule = require(`../models/${modelName}`);
  const schema = schemaModule.schema || schemaModule;
  
  let cloudData = [];
  let localData = [];
  
  // Carts are NEVER fetched from cloud - they're local only
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
  
  // Get local data (always try, even when online)
  // If local connection doesn't exist, try to initialize it
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
  
  // Merge data: cloud takes precedence, but include local-only items
  // PRIMARY KEY: Always use _id as the primary key to ensure same ID = same item
  const mergedMap = new Map(); // Key: _id.toString(), Value: item data
  const idToSkuMap = new Map(); // For products: track _id -> SKU mapping
  const skuToIdMap = new Map(); // For products: track SKU -> _id mapping (for deduplication)
  
  // Helper to normalize ID for consistent comparison
  const normalizeId = (item) => {
    if (item._id) {
      return item._id.toString();
    }
    if (item.id) {
      return item.id.toString();
    }
    return null;
  };
  
  // Helper to get alternative key for deduplication (for products with same SKU but different _id)
  const getAlternativeKey = (item) => {
    // For products, also track by SKU
    if (modelName === 'Product' && item.sku) {
      return `sku:${item.sku.toLowerCase().trim()}`;
    }
    // For transactions, use referenceNo or receiptNo
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
  
  // For employees, also track by email for better deduplication
  const emailToIdMap = new Map(); // email -> _id mapping for employees
  
  // First, add all cloud data (using _id as primary key)
  cloudData.forEach(item => {
    const id = normalizeId(item);
    if (id) {
      mergedMap.set(id, { ...item, source: 'cloud' });
      
      // Track SKU for products (for deduplication)
      if (modelName === 'Product' && item.sku) {
        const skuKey = item.sku.toLowerCase().trim();
        idToSkuMap.set(id, skuKey);
        // If SKU already mapped to different ID, log warning
        if (skuToIdMap.has(skuKey) && skuToIdMap.get(skuKey) !== id) {
          console.warn(`[${modelName}] Product with SKU ${item.sku} has different _id in cloud. Existing: ${skuToIdMap.get(skuKey)}, New: ${id}`);
        }
        skuToIdMap.set(skuKey, id);
      }
      
      // Track email for employees
      if (modelName === 'Employee' && item.email) {
        emailToIdMap.set(item.email.toLowerCase().trim(), id);
      }
    }
  });
  
  // Then, add local data (check by _id first, then by alternative keys)
  localData.forEach(item => {
    const id = normalizeId(item);
    
    if (!id) {
      console.warn(`[${modelName}] Item without _id found in local data, skipping:`, item);
      return; // Skip items without a valid _id
    }
    
    // For employees, also check by email if _id doesn't match
    if (modelName === 'Employee' && item.email) {
      const emailKey = item.email.toLowerCase().trim();
      const existingIdByEmail = emailToIdMap.get(emailKey);
      
      // If email exists but _id is different, it's the same employee with different _id
      if (existingIdByEmail && existingIdByEmail !== id) {
        console.warn(`[${modelName}] Employee with email ${emailKey} found with different _id. Cloud: ${existingIdByEmail}, Local: ${id}. Using cloud version.`);
        return; // Skip local version, use cloud version
      }
      
      // If email doesn't exist, track it
      if (!existingIdByEmail) {
        emailToIdMap.set(emailKey, id);
      }
    }
    
    // Check if item with same _id already exists (PRIMARY CHECK)
    if (mergedMap.has(id)) {
      // Item exists in both databases with same _id - check which is newer
      const existingItem = mergedMap.get(id);
      const localUpdated = new Date(item.updatedAt || item.createdAt || 0);
      const cloudUpdated = new Date(existingItem.updatedAt || existingItem.createdAt || 0);
      
      // If local is newer, use local data but mark as needing sync
      if (localUpdated > cloudUpdated) {
        mergedMap.set(id, { ...item, source: 'local-newer', needsSync: true });
        // Update SKU mapping if it's a product
        if (modelName === 'Product' && item.sku) {
          const skuKey = item.sku.toLowerCase().trim();
          idToSkuMap.set(id, skuKey);
          skuToIdMap.set(skuKey, id);
        }
      }
      // Otherwise, keep the cloud version (already in map)
      return; // Skip adding duplicate
    }
    
    // Item doesn't exist with this _id - check by alternative key (for products with same SKU)
    if (modelName === 'Product' && item.sku) {
      const skuKey = item.sku.toLowerCase().trim();
      const existingIdBySku = skuToIdMap.get(skuKey);
      
      if (existingIdBySku && existingIdBySku !== id) {
        // Same SKU but different _id - this shouldn't happen, but handle it
        console.warn(`[${modelName}] Product with SKU ${item.sku} found with different _id. Existing: ${existingIdBySku}, New: ${id}. Using existing.`);
        return; // Skip local version, use existing version
      }
      
      // New SKU or same _id, add it
      mergedMap.set(id, { ...item, source: 'local' });
      idToSkuMap.set(id, skuKey);
      skuToIdMap.set(skuKey, id);
    } else {
      // For non-products, just add if _id doesn't exist
      mergedMap.set(id, { ...item, source: 'local' });
    }
  });
  
  // Convert map to array (already deduplicated by _id in the map)
  let merged = Array.from(mergedMap.values());
  
  // Final deduplication pass (safety check - should not find duplicates since we use _id as key)
  // This is a defensive check in case the map somehow has duplicates
  const seenIds = new Set();
  const seenSKUs = new Set(); // For products
  const seenEmails = new Set(); // For employees
  const seenRefs = new Set(); // For transactions
  const seenStockMovements = new Set(); // For stock movements
  
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
    
    // For StockMovement: deduplicate by productId + createdAt (within 1 second) + type + quantity
    // This handles cases where same movement was logged in both cloud and local with different _id
    if (modelName === 'StockMovement') {
      const productId = item.productId?.toString();
      const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      const type = item.type || '';
      const quantity = item.quantity || 0;
      const stockBefore = item.stockBefore || 0;
      const stockAfter = item.stockAfter || 0;
      
      if (productId && createdAt) {
        // Create a unique key based on productId, type, quantity, stockBefore, stockAfter, and time (rounded to nearest second)
        const timeKey = Math.floor(createdAt / 1000); // Round to nearest second
        const movementKey = `${productId}:${type}:${quantity}:${stockBefore}:${stockAfter}:${timeKey}`;
        
        if (seenStockMovements.has(movementKey)) {
          console.warn(`[${modelName}] Duplicate stock movement found with key: ${movementKey} (ID: ${id}), removing duplicate`);
          return false; // Remove duplicate
        }
        seenStockMovements.add(movementKey);
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

