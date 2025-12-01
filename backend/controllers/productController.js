const { getProductModel, getStockMovementModel } = require('../utils/getModel');
const syncService = require('../services/syncService');
const { mergeDataFromBothSources, getByIdFromBothSources } = require('../utils/mergeData');


exports.getAllProducts = async (req, res) => {
  try {
    // Get products from both local and cloud
    const products = await mergeDataFromBothSources('Product', {}, { 
      sort: { dateAdded: -1 } 
    });
    

    const formattedProducts = products.map(product => {
      return {
        ...product,
        _id: product._id.toString(),
        variant: product.variant || '',
        size: product.size || '',
        brandName: product.brandName || '',
        costPrice: product.costPrice || 0,
        reorderNumber: product.reorderNumber || 0,
        supplierName: product.supplierName || '',
        supplierContact: product.supplierContact || '',
        sizes: product.sizes || null,
        displayInTerminal: product.displayInTerminal !== undefined ? product.displayInTerminal : true,
        terminalStatus: product.displayInTerminal !== false ? 'shown' : 'not shown'
      };
    });
    
    res.json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};


exports.getProductById = async (req, res) => {
  try {
    // Get product from both local and cloud
    const product = await getByIdFromBothSources('Product', req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Ensure displayInTerminal and terminalStatus are included in response
    const productResponse = {
      ...product,
      displayInTerminal: product.displayInTerminal !== undefined ? product.displayInTerminal : true,
      terminalStatus: product.displayInTerminal !== false ? 'shown' : 'not shown'
    };
    
    res.json({
      success: true,
      data: productResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};


exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    
    // Handle sizes: if sizes already exists (with prices), keep it; otherwise convert from sizeQuantities
    if (!productData.sizes && productData.selectedSizes) {
      if (productData.selectedSizes.length > 0 && productData.sizeQuantities) {
        productData.sizes = productData.sizeQuantities;
      }
    }
    // If sizes is already provided (from frontend with price structure), use it as-is
    // The frontend sends sizes as objects with {quantity, price} when differentPricesPerSize is true
  
    delete productData.selectedSizes;
    delete productData.sizeQuantities;
    delete productData.sizePrices;
    delete productData.differentPricesPerSize;
    
    if (!productData.dateAdded) {
      productData.dateAdded = Date.now();
    }
    
    // ALWAYS save to local first (works offline)
    let localProduct = null;
    const dbManager = req.dbManager || require('../config/databaseManager');
    let localConnection = dbManager.getLocalConnection();
    
    // Ensure local connection exists
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        await dbManager.connectLocalForSync();
        localConnection = dbManager.getLocalConnection();
      } catch (error) {
        console.warn('Could not initialize local connection:', error.message);
      }
    }
    
    if (localConnection && localConnection.readyState === 1) {
      try {
        const ProductModule = require('../models/Product');
        const LocalProduct = localConnection.model('Product', ProductModule.schema);
        localProduct = await LocalProduct.create(productData);
        console.log('Product saved to local database');
      } catch (localError) {
        console.error('Failed to write to local database:', localError.message);
        // If local save fails and we're offline, return error
        if (!req.isOnline) {
          return res.status(503).json({
            success: false,
            message: 'Failed to save product to local database',
            error: localError.message
          });
        }
      }
    }
    
    // Try to save to cloud if online (but don't fail if it fails)
    let cloudProduct = null;
    if (req.isOnline && localProduct) {
      try {
        const Product = getProductModel(req);
        // Use the same _id from local to ensure consistency
        const cloudProductData = {
          ...productData,
          _id: localProduct._id
        };
        // Use findByIdAndUpdate with upsert to ensure same _id
        cloudProduct = await Product.findByIdAndUpdate(
          localProduct._id,
          cloudProductData,
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        console.log('Product saved to cloud database with same _id:', localProduct._id);
      } catch (cloudError) {
        console.warn('Failed to write to cloud database:', cloudError.message);
        // If cloud save fails but local succeeded, continue with local product
        if (localProduct) {
          console.log('Using local product since cloud save failed');
        }
      }
    } else if (req.isOnline && !localProduct) {
      // If online but local save failed, try cloud only
      try {
        const Product = getProductModel(req);
        cloudProduct = await Product.create(productData);
        console.log('Product saved to cloud database (local save failed)');
      } catch (cloudError) {
        console.warn('Failed to write to cloud database:', cloudError.message);
      }
    }
    
    // Use cloud product if available, otherwise use local
    const product = cloudProduct || localProduct;
    
    if (!product) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save product to any database'
      });
    }
    
    // Ensure displayInTerminal and terminalStatus are included in response
    const productResponse = {
      ...product.toObject ? product.toObject() : product,
      displayInTerminal: product.displayInTerminal !== undefined ? product.displayInTerminal : true,
      terminalStatus: product.displayInTerminal !== false ? 'shown' : 'not shown'
    };
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: productResponse
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};


// Helper function to log stock movements
const logStockMovement = async (req, product, stockBefore, stockAfter, type, reason, handledBy, handledById, sizeQuantities = null) => {
  try {
    const StockMovement = getStockMovementModel(req);
    const quantity = Math.abs(stockAfter - stockBefore);
    
    // Only log if there's an actual change
    if (quantity === 0) return;

    const movementData = {
      productId: product._id,
      sku: product.sku,
      itemName: product.itemName,
      itemImage: product.itemImage || '',
      category: product.category,
      brandName: product.brandName || '',
      type: type || (stockAfter > stockBefore ? 'Stock-In' : 'Stock-Out'),
      quantity: quantity,
      stockBefore,
      stockAfter,
      reason: reason || 'Other',
      handledBy: handledBy || 'System',
      handledById: handledById || '',
      notes: '',
      sizeQuantities: sizeQuantities || null
    };

    await StockMovement.create(movementData);

    // Don't write to local when online - let sync service handle it
    // This prevents duplicates since cloud and local would have different _id values
    // When offline, the main connection is already local, so it's already written
  } catch (error) {
    console.error('Error logging stock movement:', error);
    // Don't throw - logging failure shouldn't break the update
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = { ...req.body };
    
    // Extract stock movement data before deleting
    const stockMovementType = updateData.stockMovementType; // 'Stock-In', 'Stock-Out', 'Pull-Out'
    const stockMovementReason = updateData.stockMovementReason;
    const handledBy = updateData.handledBy;
    const handledById = updateData.handledById;
    const stockMovementSizeQuantities = updateData.stockMovementSizeQuantities; // Size-specific quantities
    
    // Remove stock movement fields from update data
    delete updateData.stockMovementType;
    delete updateData.stockMovementReason;
    delete updateData.handledBy;
    delete updateData.handledById;
    delete updateData.stockMovementSizeQuantities;
   
    // Handle sizes: if sizes already exists (with prices), keep it; otherwise convert from sizeQuantities
    if (!updateData.sizes && updateData.selectedSizes) {
      if (updateData.selectedSizes.length > 0 && updateData.sizeQuantities) {
        updateData.sizes = updateData.sizeQuantities;
      } else if (updateData.selectedSizes.length === 0) {
        updateData.sizes = null;
      }
    }
    // If sizes is already provided (from frontend with price structure), use it as-is
    // The frontend sends sizes as objects with {quantity, price} when differentPricesPerSize is true
    
    delete updateData.selectedSizes;
    delete updateData.sizeQuantities;
    delete updateData.sizePrices;
    delete updateData.differentPricesPerSize;
    updateData.lastUpdated = Date.now();
    
    // Helper function to check if product has zero stock
    const hasZeroStock = (productData) => {
      // Check if product has sizes
      if (productData.sizes && typeof productData.sizes === 'object' && Object.keys(productData.sizes).length > 0) {
        // For products with sizes, check if all sizes have 0 stock
        const allSizesZero = Object.values(productData.sizes).every(sizeData => {
          if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
            return (sizeData.quantity || 0) === 0;
          }
          return (typeof sizeData === 'number' ? sizeData : 0) === 0;
        });
        return allSizesZero;
      }
      // For products without sizes, check currentStock
      return (productData.currentStock || 0) === 0;
    };
    
    // Automatically set displayInTerminal to false if stock reaches 0
    // But only if displayInTerminal wasn't explicitly set in the request
    // If displayInTerminal is explicitly set (even if stock is 0), respect the user's choice
    // However, if stock is 0 and displayInTerminal is not explicitly set, auto-set to false
    if (hasZeroStock(updateData)) {
      // Only auto-set to false if it wasn't explicitly set in the request
      // Check if displayInTerminal is in the original request body (not undefined)
      if (req.body.displayInTerminal === undefined) {
        // If stock is 0 and displayInTerminal wasn't explicitly set, auto-set to false
        updateData.displayInTerminal = false;
        console.log(`[updateProduct] Stock reached 0 for product ${productId}, automatically setting displayInTerminal to false`);
      } else {
        // If displayInTerminal was explicitly set in the request, use that value (even if stock is 0)
        updateData.displayInTerminal = req.body.displayInTerminal;
        console.log(`[updateProduct] displayInTerminal explicitly set to ${req.body.displayInTerminal} for product ${productId}`);
      }
    } else {
      // Stock is not 0 - if displayInTerminal is explicitly set, use it
      // Otherwise, we'll preserve the existing value when we fetch the product
      if (req.body.displayInTerminal !== undefined) {
        updateData.displayInTerminal = req.body.displayInTerminal;
        console.log(`[updateProduct] displayInTerminal explicitly set to ${req.body.displayInTerminal} for product ${productId} (stock > 0)`);
      }
    }
    
    // ALWAYS update local first (works offline)
    const dbManager = req.dbManager || require('../config/databaseManager');
    let localConnection = dbManager.getLocalConnection();
    
    // Ensure local connection exists
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        await dbManager.connectLocalForSync();
        localConnection = dbManager.getLocalConnection();
      } catch (error) {
        console.warn('Could not initialize local connection:', error.message);
      }
    }
    
    let localProduct = null;
    let productBefore = null;
    let stockBefore = null;
    
    if (localConnection && localConnection.readyState === 1) {
      try {
        const ProductModule = require('../models/Product');
        const LocalProduct = localConnection.model('Product', ProductModule.schema);
        productBefore = await LocalProduct.findById(productId);
        
        if (!productBefore) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }
        
        stockBefore = productBefore.currentStock;
        
        // If displayInTerminal is explicitly set in the request, use that value
        // Only auto-set to false if stock is 0 and displayInTerminal wasn't explicitly set
        // If stock is not 0 and displayInTerminal is explicitly set, respect the user's choice
        if (updateData.displayInTerminal === undefined && !hasZeroStock(updateData)) {
          // If not explicitly set and stock is not 0, preserve existing value
          updateData.displayInTerminal = productBefore.displayInTerminal !== undefined 
            ? productBefore.displayInTerminal 
            : true;
        }
        
        console.log(`[updateProduct] Updating product ${productId} with displayInTerminal:`, updateData.displayInTerminal);
        console.log(`[updateProduct] Stock check - hasZeroStock:`, hasZeroStock(updateData));
        
        localProduct = await LocalProduct.findByIdAndUpdate(
          productId,
          updateData,
          {
            new: true,
            runValidators: true
          }
        );
        console.log(`Product ${productId} updated in local database`);
      } catch (localError) {
        console.error('Failed to update local database:', localError.message);
        // If local update fails and we're offline, return error
        if (!req.isOnline) {
          return res.status(503).json({
            success: false,
            message: 'Failed to update product in local database',
            error: localError.message
          });
        }
      }
    }
    
    // Try to update cloud if online (but don't fail if it fails)
    let cloudProduct = null;
    if (req.isOnline) {
      try {
        const Product = getProductModel(req);
        if (!productBefore) {
          productBefore = await Product.findById(productId);
          if (productBefore) {
            stockBefore = productBefore.currentStock;
          }
        }
        cloudProduct = await Product.findByIdAndUpdate(
          productId,
          updateData,
          {
            new: true,
            runValidators: true
          }
        );
        console.log(`Product ${productId} updated in cloud database`);
      } catch (cloudError) {
        console.warn('Failed to update cloud database:', cloudError.message);
        // Continue with local product if cloud update fails
        if (localProduct) {
          console.log('Using local product since cloud update failed');
        }
      }
    }
    
    // Use cloud product if available, otherwise use local
    const product = cloudProduct || localProduct;
    
    if (!product) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update product in any database'
      });
    }
    
    if (!productBefore) {
      productBefore = product;
      stockBefore = product.currentStock;
    }
    
    // Ensure stockBefore is set if it wasn't set earlier
    if (stockBefore === null && productBefore) {
      stockBefore = productBefore.currentStock;
    }

    // When offline, main connection is already local, so product is already updated
    // When online, we need to also update the separate local connection for sync
    if (req.isOnline) {
      // Online: Update separate local connection for sync
      let localConnection = dbManager.getLocalConnection();
      if (!localConnection || localConnection.readyState !== 1) {
        try {
          await dbManager.connectLocalForSync();
          localConnection = dbManager.getLocalConnection();
        } catch (error) {
          console.warn('Could not initialize local connection for sync:', error.message);
        }
      }
      
      if (localConnection && localConnection.readyState === 1) {
        try {
          const ProductModule = require('../models/Product');
          const LocalProduct = localConnection.model('Product', ProductModule.schema);
          const productData = product.toObject();
          await LocalProduct.replaceOne({ _id: productId }, productData);
          console.log(`Product ${productId} synced to local - Stock: ${product.currentStock}, SKU: ${product.sku}`);
        } catch (localError) {
          console.warn('Failed to sync product to local database:', localError.message);
          // Don't fail - cloud update succeeded
        }
      }
    } else {
      // Offline: Main connection is already local, product is already updated
      console.log(`Product ${productId} updated in local (offline mode) - Stock: ${product.currentStock}, SKU: ${product.sku}`);
    }

    // Log stock movement if stock changed and movement data provided
    const stockAfter = product.currentStock;
    
    // Final check: if stock is 0, ensure displayInTerminal is false (even if it wasn't set earlier)
    // This ensures real-time updates when stock reaches 0
    const finalHasZeroStock = hasZeroStock(product);
    if (finalHasZeroStock && product.displayInTerminal !== false) {
      // Stock is 0 but displayInTerminal is not false - update it
      product.displayInTerminal = false;
      await product.save();
      console.log(`[updateProduct] Final check: Stock is 0 for product ${productId}, ensuring displayInTerminal is false`);
    }
    
    if (stockBefore !== null && stockBefore !== undefined && stockBefore !== stockAfter && stockMovementType && stockMovementReason && handledBy) {
      await logStockMovement(
        req,
        product,
        stockBefore,
        stockAfter,
        stockMovementType,
        stockMovementReason,
        handledBy,
        handledById,
        stockMovementSizeQuantities
      );
    }
    
    // Refresh product to get latest displayInTerminal value
    let finalProduct = product;
    try {
      // Try to get the updated product from the database
      if (req.isOnline) {
        const Product = getProductModel(req);
        const refreshed = await Product.findById(productId);
        if (refreshed) finalProduct = refreshed;
      } else if (localConnection && localConnection.readyState === 1) {
        const ProductModule = require('../models/Product');
        const LocalProduct = localConnection.model('Product', ProductModule.schema);
        const refreshed = await LocalProduct.findById(productId);
        if (refreshed) finalProduct = refreshed;
      }
    } catch (refreshError) {
      console.warn('Could not refresh product after update:', refreshError.message);
      // Use the product we already have
    }
    
    // Ensure displayInTerminal and terminalStatus are included in response
    const productResponse = {
      ...finalProduct.toObject ? finalProduct.toObject() : finalProduct,
      displayInTerminal: finalProduct.displayInTerminal !== undefined ? finalProduct.displayInTerminal : true,
      terminalStatus: finalProduct.displayInTerminal !== false ? 'shown' : 'not shown'
    };
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: productResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};


exports.deleteProduct = async (req, res) => {
  try {
    const Product = getProductModel(req);
    const dbManager = req.dbManager || require('../config/databaseManager');
    let localConnection = dbManager.getLocalConnection();
    const productId = req.params.id;
    
    // Prepare delete promises for both databases
    const deletePromises = [];
    let deletedFromCloud = false;
    let deletedFromLocal = false;
    
    // Delete from cloud database (if online)
    if (req.isOnline) {
      deletePromises.push(
        (async () => {
          try {
            const cloudProduct = await Product.findByIdAndDelete(productId);
            if (cloudProduct) {
              console.log('Product deleted from cloud database');
              deletedFromCloud = true;
              return { type: 'cloud', success: true };
            }
            return { type: 'cloud', success: false };
          } catch (cloudError) {
            console.warn('Failed to delete product from cloud database:', cloudError.message);
            return { type: 'cloud', success: false, error: cloudError };
          }
        })()
      );
    }
    
    // Delete from local database (always try, works offline)
    // Ensure local connection exists
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        await dbManager.connectLocalForSync();
        localConnection = dbManager.getLocalConnection();
      } catch (error) {
        console.warn('Could not initialize local connection:', error.message);
      }
    }
    
    if (localConnection && localConnection.readyState === 1) {
      deletePromises.push(
        (async () => {
          try {
            const ProductModule = require('../models/Product');
            const LocalProduct = localConnection.model('Product', ProductModule.schema);
            const localProduct = await LocalProduct.findByIdAndDelete(productId);
            if (localProduct) {
              console.log('Product deleted from local database');
              deletedFromLocal = true;
              return { type: 'local', success: true };
            }
            return { type: 'local', success: false };
          } catch (localError) {
            console.error('Failed to delete product from local database:', localError.message);
            // If local delete fails and we're offline, this is critical
            if (!req.isOnline) {
              throw new Error('Failed to delete product from local database: ' + localError.message);
            }
            return { type: 'local', success: false, error: localError };
          }
        })()
      );
    }
    
    // Wait for all delete operations to complete (in parallel)
    const results = await Promise.all(deletePromises);
    
    // Check if product was found and deleted from at least one database
    const cloudResult = results.find(r => r.type === 'cloud');
    const localResult = results.find(r => r.type === 'local');
    
    // Check for critical errors
    if (localResult?.error && !req.isOnline) {
      return res.status(503).json({
        success: false,
        message: 'Failed to delete product from local database',
        error: localResult.error.message
      });
    }
    
    // If product wasn't found in either database
    if (!deletedFromCloud && !deletedFromLocal) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully from database(s)',
      deletedFrom: {
        cloud: deletedFromCloud,
        local: deletedFromLocal
      }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};


exports.getProductsByCategory = async (req, res) => {
  try {
    // Get products from both local and cloud
    const products = await mergeDataFromBothSources('Product', { category: req.params.category }, { 
      sort: { dateAdded: -1 } 
    });
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Update stock after successful transaction
exports.updateStockAfterTransaction = async (req, res) => {
  try {
    const { items, performedByName, performedById, type, reason } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid items data'
      });
    }
    
    // Determine if we're adding or subtracting stock
    const isStockIn = type === 'Stock-In';
    const isStockOut = type === 'Stock-Out' || type === 'Pull-Out';
    const movementType = type || 'Stock-Out'; // Default to Stock-Out for backward compatibility
    const movementReason = reason || (isStockIn ? 'Returned Item' : 'Sold');
    
    const findSizeKey = (sizes = {}, size = '') => {
      const normalized = size?.toLowerCase();
      return Object.keys(sizes).find((key) => key?.toLowerCase() === normalized);   
    };
    
    const Product = getProductModel(req);
    const StockMovement = getStockMovementModel(req);
    
    // Update stock for each item
    const updatePromises = items.map(async (item) => {
      if (!item._id && !item.sku) {
        throw new Error('Item missing both _id and sku fields');
      }

      // Try to find product by ID first, then by SKU if needed
      let product = null;
      if (item._id) {
        product = await Product.findById(item._id);
      }
      
      // If not found by ID, try to find by SKU (in case product exists in different database)
      if (!product && item.sku) {
        product = await Product.findOne({ sku: item.sku });
      }
      
      // If still not found, try getting from both databases
      if (!product && item._id) {
        product = await getByIdFromBothSources('Product', item._id);
      }
      
      if (!product) {
        const identifier = item._id || item.sku || 'unknown';
        throw new Error(`Product not found (ID: ${item._id || 'N/A'}, SKU: ${item.sku || 'N/A'})`);
      }
      
      const stockBefore = product.currentStock;
      
      // Handle products with sizes differently
      if (product.sizes && item.size) {
        const sizeKey = findSizeKey(product.sizes, item.size);
        
        // Helper function to get quantity from size (handles both old format: number, and new format: {quantity, price})
        const getSizeQuantity = (sizeData) => {
          if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
            return sizeData.quantity;
          }
          return typeof sizeData === 'number' ? sizeData : 0;
        };
        
        // Helper function to get price from size (if exists)
        const getSizePrice = (sizeData) => {
          if (typeof sizeData === 'object' && sizeData !== null && sizeData.price !== undefined) {
            return sizeData.price;
          }
          return null;
        };
        
        if (!sizeKey) {
          // If adding stock and size doesn't exist, create it
          if (isStockIn) {
            // Preserve price structure if it exists elsewhere, otherwise use simple number
            const hasPriceStructure = Object.values(product.sizes).some(s => typeof s === 'object' && s !== null && s.price !== undefined);
            if (hasPriceStructure) {
              product.sizes[item.size] = {
                quantity: item.quantity,
                price: item.price || product.itemPrice || 0
              };
            } else {
            product.sizes[item.size] = item.quantity;
            }
            product.markModified('sizes');
          } else {
            throw new Error(`Size ${item.size} not found for product ${product.itemName}`);
          }
        } else {
          const currentSizeData = product.sizes[sizeKey];
          const currentQuantity = getSizeQuantity(currentSizeData);
          const currentPrice = getSizePrice(currentSizeData);
          
          // Check if there's enough stock for the specific size (only for Stock-Out)
          if (isStockOut && currentQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.itemName} (${item.size}). Available: ${currentQuantity}, Requested: ${item.quantity}`);
          }
          
          // Add or subtract from specific size stock
          const newQuantity = isStockIn 
            ? (currentQuantity || 0) + item.quantity
            : Math.max(0, currentQuantity - item.quantity);
          
          // Preserve price structure if it exists
          if (currentPrice !== null || (typeof currentSizeData === 'object' && currentSizeData !== null)) {
            product.sizes[sizeKey] = {
              quantity: newQuantity,
              price: currentPrice !== null ? currentPrice : (item.price || product.itemPrice || 0)
            };
          } else {
            product.sizes[sizeKey] = newQuantity;
          }
          
          // Mark sizes as modified for Mongoose to save it
          product.markModified('sizes');
        }
        
        // Also update the total currentStock
        if (isStockIn) {
          product.currentStock = (product.currentStock || 0) + item.quantity;
        } else {
          product.currentStock = Math.max(0, product.currentStock - item.quantity);
        }
      } else {
        // Regular product without sizes
        // Check if there's enough stock (only for Stock-Out)
        if (isStockOut && product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.itemName}. Available: ${product.currentStock}, Requested: ${item.quantity}`);
        }
        
        // Add or subtract the quantity from current stock
        if (isStockIn) {
          product.currentStock = (product.currentStock || 0) + item.quantity;
        } else {
          product.currentStock = Math.max(0, product.currentStock - item.quantity);
        }
      }
      
      product.lastUpdated = Date.now();
      
      // Automatically set displayInTerminal to false if stock reaches 0
      // Helper function to check if product has zero stock
      const hasZeroStock = (prod) => {
        // Check if product has sizes
        if (prod.sizes && typeof prod.sizes === 'object' && Object.keys(prod.sizes).length > 0) {
          // For products with sizes, check if all sizes have 0 stock
          const allSizesZero = Object.values(prod.sizes).every(sizeData => {
            if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
              return (sizeData.quantity || 0) === 0;
            }
            return (typeof sizeData === 'number' ? sizeData : 0) === 0;
          });
          return allSizesZero;
        }
        // For products without sizes, check currentStock
        return (prod.currentStock || 0) === 0;
      };
      
      if (hasZeroStock(product)) {
        product.displayInTerminal = false;
        console.log(`[updateStockAfterTransaction] Stock reached 0 for product ${product._id}, automatically setting displayInTerminal to false`);
      }
      
      await product.save();
      
      // Also update in local if online (dual write)
      if (req.isOnline && req.dbManager) {
        try {
          const localConnection = req.dbManager.getLocalConnection();
          if (localConnection && localConnection.readyState === 1) {
            const ProductModule = require('../models/Product');
            const LocalProduct = localConnection.model('Product', ProductModule.schema);
            const localProduct = await LocalProduct.findById(product._id);
            if (localProduct) {
              // Update local product stock
              if (localProduct.sizes && item.size) {
                const normalizedSize = item.size?.toLowerCase();
                const sizeKey = Object.keys(localProduct.sizes).find((key) => key?.toLowerCase() === normalizedSize);
                
                // Helper functions to handle both formats
                const getLocalSizeQuantity = (sizeData) => {
                  if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
                    return sizeData.quantity;
                  }
                  return typeof sizeData === 'number' ? sizeData : 0;
                };
                
                const getLocalSizePrice = (sizeData) => {
                  if (typeof sizeData === 'object' && sizeData !== null && sizeData.price !== undefined) {
                    return sizeData.price;
                  }
                  return null;
                };
                
                if (sizeKey) {
                  const currentSizeData = localProduct.sizes[sizeKey];
                  const currentQuantity = getLocalSizeQuantity(currentSizeData);
                  const currentPrice = getLocalSizePrice(currentSizeData);
                  
                  const newQuantity = isStockIn 
                    ? (currentQuantity || 0) + item.quantity
                    : Math.max(0, currentQuantity - item.quantity);
                  
                  // Preserve price structure if it exists
                  if (currentPrice !== null || (typeof currentSizeData === 'object' && currentSizeData !== null)) {
                    localProduct.sizes[sizeKey] = {
                      quantity: newQuantity,
                      price: currentPrice !== null ? currentPrice : (item.price || localProduct.itemPrice || 0)
                    };
                  } else {
                    localProduct.sizes[sizeKey] = newQuantity;
                  }
                  localProduct.markModified('sizes');
                } else if (isStockIn) {
                  // Create new size if adding stock
                  localProduct.sizes = localProduct.sizes || {};
                  const hasPriceStructure = Object.values(localProduct.sizes).some(s => typeof s === 'object' && s !== null && s.price !== undefined);
                  if (hasPriceStructure) {
                    localProduct.sizes[item.size] = {
                      quantity: item.quantity,
                      price: item.price || localProduct.itemPrice || 0
                    };
                  } else {
                  localProduct.sizes[item.size] = item.quantity;
                  }
                  localProduct.markModified('sizes');
                }
              }
              localProduct.currentStock = product.currentStock;
              
              // Automatically set displayInTerminal to false if stock reaches 0
              const hasZeroStockLocal = (prod) => {
                if (prod.sizes && typeof prod.sizes === 'object' && Object.keys(prod.sizes).length > 0) {
                  const allSizesZero = Object.values(prod.sizes).every(sizeData => {
                    if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
                      return (sizeData.quantity || 0) === 0;
                    }
                    return (typeof sizeData === 'number' ? sizeData : 0) === 0;
                  });
                  return allSizesZero;
                }
                return (prod.currentStock || 0) === 0;
              };
              
              if (hasZeroStockLocal(localProduct)) {
                localProduct.displayInTerminal = false;
              }
              
              localProduct.lastUpdated = Date.now();
              await localProduct.save();
            }
          }
        } catch (localError) {
          console.warn('Failed to update local product stock:', localError.message);
        }
      }
      
      // Log stock movement
      const stockAfter = product.currentStock;
      if (stockBefore !== stockAfter) {
        await logStockMovement(
          req,
          product,
          stockBefore,
          stockAfter,
          movementType,
          movementReason,
          performedByName || 'System',
          performedById || ''
        );
      }
      
      return {
        productId: product._id,
        productName: product.itemName,
        size: item.size || null,
        oldStock: stockBefore,
        newStock: product.currentStock,
        quantityChanged: item.quantity,
        operation: isStockIn ? 'added' : 'deducted'
      };
    });
    
    const results = await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      updates: results
    });
    
  } catch (error) {
    console.error('Error updating stock:', error);
    console.error('Error stack:', error.stack);
    console.error('Items that failed:', JSON.stringify(items, null, 2));
    res.status(400).json({
      success: false,
      message: `Error updating stock: ${error.message}`,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


exports.searchProducts = async (req, res) => {
  try {
    const query = req.params.query;
    // Get products from both local and cloud, then filter by search query
    const allProducts = await mergeDataFromBothSources('Product', {}, { 
      sort: { dateAdded: -1 } 
    });
    
    // Filter by search query
    const searchLower = query.toLowerCase();
    const products = allProducts.filter(product => {
      const searchableText = [
        product.itemName,
        product.sku,
        product.brandName,
        product.category,
        product.variant
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(searchLower);
    });
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
};

