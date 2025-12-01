const { getDiscountModel, getProductModel } = require('../utils/getModel');
const { mergeDataFromBothSources, getByIdFromBothSources } = require('../utils/mergeData');

exports.getAllDiscounts = async (req, res) => {
  try {
    const discounts = await mergeDataFromBothSources('Discount', {}, { 
      sort: { dateCreated: -1 } 
    });
    
    const formattedDiscounts = discounts.map(discount => {
      const discountValue = discount.discountType === 'percentage' 
        ? `${discount.discountValue}% OFF`
        : `₱${discount.discountValue} OFF`;

      const appliesToText = discount.appliesTo === 'all' 
        ? 'All Products'
        : discount.appliesTo === 'category'
        ? `Category: ${discount.category}`
        : 'Specific Products';

      return {
        ...discount,
        _id: discount._id.toString(),
        discountValue: discountValue,
        appliesTo: appliesToText, // Formatted text for display
        appliesToType: discount.appliesTo, // Original value for logic checks ('all', 'category', 'products')
        usage: discount.usageLimit 
          ? { used: discount.usageCount || 0, total: discount.usageLimit }
          : null,
        validFrom: discount.noExpiration ? 'Permanent' : (discount.validFrom ? new Date(discount.validFrom).toISOString().split('T')[0] : null),
        validTo: discount.noExpiration ? null : (discount.validTo ? new Date(discount.validTo).toISOString().split('T')[0] : null)
      };
    });
    
    res.json({
      success: true,
      count: formattedDiscounts.length,
      data: formattedDiscounts
    });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching discounts',
      error: error.message
    });
  }
};

exports.getDiscountById = async (req, res) => {
  try {
    const discount = await getByIdFromBothSources('Discount', req.params.id);
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }
    
    res.json({
      success: true,
      data: discount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching discount',
      error: error.message
    });
  }
};

exports.createDiscount = async (req, res) => {
  try {
    const discountData = { ...req.body };
    
    // Convert date strings to Date objects
    if (discountData.validFrom && !discountData.noExpiration) {
      discountData.validFrom = new Date(discountData.validFrom);
    }
    if (discountData.validUntil && !discountData.noExpiration) {
      discountData.validTo = new Date(discountData.validUntil);
      delete discountData.validUntil;
    }
    
    if (discountData.noExpiration) {
      discountData.validFrom = null;
      discountData.validTo = null;
    }
    
    // Set default values
    discountData.usageCount = 0;
    if (!discountData.usageLimit || discountData.usageLimit === '0' || discountData.usageLimit === 0) {
      discountData.usageLimit = null;
    }
    if (!discountData.minPurchaseAmount) {
      discountData.minPurchaseAmount = 0;
    }
    if (!discountData.maxPurchaseAmount) {
      discountData.maxPurchaseAmount = null;
    }
    
    // If online, save to cloud first, then use cloud _id for local
    let cloudDiscount = null;
    let localDiscount = null;
    const dbManager = req.dbManager || require('../config/databaseManager');
    
    if (req.isOnline) {
      try {
        const Discount = getDiscountModel(req);
        cloudDiscount = await Discount.create(discountData);
        
        // Use cloud _id for local to ensure they're the same document
        discountData._id = cloudDiscount._id;
      } catch (error) {
        console.error('Error saving to cloud:', error);
        // Continue to save locally even if cloud save fails
      }
    }
    
    // ALWAYS save to local (works offline and for dual-write)
    let localConnection = dbManager.getLocalConnection();
    
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
        const LocalDiscount = localConnection.model('Discount', require('../models/Discount').schema);
        // If we have cloud _id, use findByIdAndUpdate with upsert to ensure same _id
        if (discountData._id && cloudDiscount) {
          localDiscount = await LocalDiscount.findByIdAndUpdate(
            discountData._id,
            discountData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
        } else {
          localDiscount = await LocalDiscount.create(discountData);
        }
      } catch (error) {
        console.error('Error saving to local:', error);
        // If creation failed but we have cloud discount, that's okay
        if (!cloudDiscount) {
          throw error;
        }
      }
    }
    
    // Use cloud discount if available, otherwise local
    const savedDiscount = cloudDiscount || localDiscount;
    
    // If discount applies to a category, update products in that category
    if (discountData.appliesTo === 'category' && discountData.category) {
      try {
        await attachDiscountToCategory(savedDiscount._id, discountData.category, req);
      } catch (error) {
        console.error('Error attaching discount to category:', error);
        // Don't fail the request, just log the error
      }
    }
    
    res.status(201).json({
      success: true,
      data: savedDiscount,
      savedTo: {
        local: !!localDiscount,
        cloud: !!cloudDiscount
      }
    });
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating discount',
      error: error.message
    });
  }
};

exports.updateDiscount = async (req, res) => {
  try {
    const discountId = req.params.id;
    const updateData = { ...req.body };
    
    // Convert date strings to Date objects
    if (updateData.validFrom && !updateData.noExpiration) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validUntil && !updateData.noExpiration) {
      updateData.validTo = new Date(updateData.validUntil);
      delete updateData.validUntil;
    }
    
    if (updateData.noExpiration) {
      updateData.validFrom = null;
      updateData.validTo = null;
    }
    
    updateData.lastUpdated = Date.now();
    
    // Update in both databases
    const dbManager = req.dbManager || require('../config/databaseManager');
    let localConnection = dbManager.getLocalConnection();
    
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        await dbManager.connectLocalForSync();
        localConnection = dbManager.getLocalConnection();
      } catch (error) {
        console.warn('Could not initialize local connection:', error.message);
      }
    }
    
    let localUpdated = false;
    let cloudUpdated = false;
    
    // Update local
    if (localConnection && localConnection.readyState === 1) {
      const LocalDiscount = localConnection.model('Discount', require('../models/Discount').schema);
      await LocalDiscount.findByIdAndUpdate(discountId, updateData, { new: true });
      localUpdated = true;
    }
    
    // Update cloud if online
    if (req.isOnline) {
      try {
        const Discount = getDiscountModel(req);
        await Discount.findByIdAndUpdate(discountId, updateData, { new: true });
        cloudUpdated = true;
      } catch (error) {
        console.error('Error updating cloud:', error);
      }
    }
    
    // Get updated discount
    const updatedDiscount = await getByIdFromBothSources('Discount', discountId);
    
    if (!updatedDiscount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedDiscount,
      updatedIn: {
        local: localUpdated,
        cloud: cloudUpdated
      }
    });
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating discount',
      error: error.message
    });
  }
};

exports.deleteDiscount = async (req, res) => {
  try {
    const discountId = req.params.id;
    
    const dbManager = req.dbManager || require('../config/databaseManager');
    let localConnection = dbManager.getLocalConnection();
    
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        await dbManager.connectLocalForSync();
        localConnection = dbManager.getLocalConnection();
      } catch (error) {
        console.warn('Could not initialize local connection:', error.message);
      }
    }
    
    let deletedFromLocal = false;
    let deletedFromCloud = false;
    
    // Delete from local
    if (localConnection && localConnection.readyState === 1) {
      const LocalDiscount = localConnection.model('Discount', require('../models/Discount').schema);
      await LocalDiscount.findByIdAndDelete(discountId);
      deletedFromLocal = true;
    }
    
    // Delete from cloud if online
    if (req.isOnline) {
      try {
        const Discount = getDiscountModel(req);
        await Discount.findByIdAndDelete(discountId);
        deletedFromCloud = true;
      } catch (error) {
        console.error('Error deleting from cloud:', error);
      }
    }
    
    // Remove discount from products if it was category-based
    try {
      const discount = await getByIdFromBothSources('Discount', discountId);
      if (discount && discount.appliesTo === 'category' && discount.category) {
        await removeDiscountFromCategory(discountId, discount.category, req);
      }
    } catch (error) {
      console.error('Error removing discount from category:', error);
    }
    
    res.json({
      success: true,
      message: 'Discount deleted successfully',
      deletedFrom: {
        local: deletedFromLocal,
        cloud: deletedFromCloud
      }
    });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting discount',
      error: error.message
    });
  }
};

// Helper function to attach discount to products in a category
async function attachDiscountToCategory(discountId, category, req) {
  const Product = getProductModel(req);
  const dbManager = req.dbManager || require('../config/databaseManager');
  
  // Update products in cloud if online
  if (req.isOnline) {
    await Product.updateMany(
      { category: category },
      { $addToSet: { discountIds: discountId } }
    );
  }
  
  // Update products in local
  let localConnection = dbManager.getLocalConnection();
  if (!localConnection || localConnection.readyState !== 1) {
    try {
      await dbManager.connectLocalForSync();
      localConnection = dbManager.getLocalConnection();
    } catch (error) {
      console.warn('Could not initialize local connection:', error.message);
      return;
    }
  }
  
  if (localConnection && localConnection.readyState === 1) {
    const LocalProduct = localConnection.model('Product', require('../models/Product').schema);
    await LocalProduct.updateMany(
      { category: category },
      { $addToSet: { discountIds: discountId } }
    );
  }
}

// Helper function to remove discount from products in a category
async function removeDiscountFromCategory(discountId, category, req) {
  const Product = getProductModel(req);
  const dbManager = req.dbManager || require('../config/databaseManager');
  
  // Update products in cloud if online
  if (req.isOnline) {
    await Product.updateMany(
      { category: category, discountIds: discountId },
      { $pull: { discountIds: discountId } }
    );
  }
  
  // Update products in local
  let localConnection = dbManager.getLocalConnection();
  if (!localConnection || localConnection.readyState !== 1) {
    try {
      await dbManager.connectLocalForSync();
      localConnection = dbManager.getLocalConnection();
    } catch (error) {
      console.warn('Could not initialize local connection:', error.message);
      return;
    }
  }
  
  if (localConnection && localConnection.readyState === 1) {
    const LocalProduct = localConnection.model('Product', require('../models/Product').schema);
    await LocalProduct.updateMany(
      { category: category, discountIds: discountId },
      { $pull: { discountIds: discountId } }
    );
  }
}

