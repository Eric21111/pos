const { getCategoryModel, getProductModel } = require('../utils/getModel');
const { mergeDataFromBothSources, getByIdFromBothSources } = require('../utils/mergeData');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await mergeDataFromBothSources('Category', {}, { 
      sort: { dateCreated: -1 } 
    });
    
    // Get product counts for each category
    const Product = getProductModel(req);
    const productCounts = {};
    
    try {
      const products = await mergeDataFromBothSources('Product', {}, {});
      products.forEach(product => {
        if (product.category) {
          productCounts[product.category] = (productCounts[product.category] || 0) + 1;
        }
      });
    } catch (error) {
      console.warn('Error fetching product counts:', error.message);
    }
    
    // Format categories with product counts
    const formattedCategories = categories.map(category => ({
      ...category,
      _id: category._id.toString(),
      productCount: productCounts[category.name] || 0
    }));
    
    res.json({
      success: true,
      count: formattedCategories.length,
      data: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await getByIdFromBothSources('Category', req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get product count for this category
    const products = await mergeDataFromBothSources('Product', { category: category.name }, {});
    category.productCount = products.length;
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };
    
    // Validate required fields
    if (!categoryData.name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    // Set default status if not provided
    if (!categoryData.status) {
      categoryData.status = 'active';
    }
    
    // If online, save to cloud first, then use cloud _id for local
    let cloudCategory = null;
    let localCategory = null;
    const dbManager = req.dbManager || require('../config/databaseManager');
    
    if (req.isOnline) {
      try {
        const Category = getCategoryModel(req);
        cloudCategory = await Category.create(categoryData);
        
        // Use cloud _id for local to ensure they're the same document
        categoryData._id = cloudCategory._id;
      } catch (error) {
        // Check if it's a duplicate key error
        if (error.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }
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
        const LocalCategory = localConnection.model('Category', require('../models/Category').schema);
        // If we have cloud _id, use findByIdAndUpdate with upsert to ensure same _id
        if (categoryData._id && cloudCategory) {
          localCategory = await LocalCategory.findByIdAndUpdate(
            categoryData._id,
            categoryData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
        } else {
          localCategory = await LocalCategory.create(categoryData);
        }
      } catch (error) {
        // Check if it's a duplicate key error
        if (error.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }
        console.error('Error saving to local:', error);
        // If creation failed but we have cloud category, that's okay
        if (!cloudCategory) {
          throw error;
        }
      }
    }
    
    // Use cloud category if available, otherwise local
    const savedCategory = cloudCategory || localCategory;
    
    res.status(201).json({
      success: true,
      data: savedCategory,
      savedTo: {
        local: !!localCategory,
        cloud: !!cloudCategory
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updateData = { ...req.body };
    
    // Don't allow updating the name if it would create a duplicate
    if (updateData.name) {
      const existingCategory = await getByIdFromBothSources('Category', categoryId);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
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
      try {
        const LocalCategory = localConnection.model('Category', require('../models/Category').schema);
        await LocalCategory.findByIdAndUpdate(categoryId, updateData, { new: true });
        localUpdated = true;
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }
        console.error('Error updating local:', error);
      }
    }
    
    // Update cloud if online
    if (req.isOnline) {
      try {
        const Category = getCategoryModel(req);
        await Category.findByIdAndUpdate(categoryId, updateData, { new: true });
        cloudUpdated = true;
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }
        console.error('Error updating cloud:', error);
      }
    }
    
    // Get updated category
    const updatedCategory = await getByIdFromBothSources('Category', categoryId);
    
    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get product count
    const products = await mergeDataFromBothSources('Product', { category: updatedCategory.name }, {});
    updatedCategory.productCount = products.length;
    
    res.json({
      success: true,
      data: updatedCategory,
      updatedIn: {
        local: localUpdated,
        cloud: cloudUpdated
      }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if category has products
    const category = await getByIdFromBothSources('Category', categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const products = await mergeDataFromBothSources('Product', { category: category.name }, {});
    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. There are ${products.length} products in this category. Please reassign or delete products first.`
      });
    }
    
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
      const LocalCategory = localConnection.model('Category', require('../models/Category').schema);
      await LocalCategory.findByIdAndDelete(categoryId);
      deletedFromLocal = true;
    }
    
    // Delete from cloud if online
    if (req.isOnline) {
      try {
        const Category = getCategoryModel(req);
        await Category.findByIdAndDelete(categoryId);
        deletedFromCloud = true;
      } catch (error) {
        console.error('Error deleting from cloud:', error);
      }
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully',
      deletedFrom: {
        local: deletedFromLocal,
        cloud: deletedFromCloud
      }
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// Archive/Unarchive category (toggle status)
exports.archiveCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await getByIdFromBothSources('Category', categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    
    // Update status
    const updateData = { status: newStatus };
    updateData.lastUpdated = Date.now();
    
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
    
    // Update local
    if (localConnection && localConnection.readyState === 1) {
      const LocalCategory = localConnection.model('Category', require('../models/Category').schema);
      await LocalCategory.findByIdAndUpdate(categoryId, updateData, { new: true });
    }
    
    // Update cloud if online
    if (req.isOnline) {
      try {
        const Category = getCategoryModel(req);
        await Category.findByIdAndUpdate(categoryId, updateData, { new: true });
      } catch (error) {
        console.error('Error updating cloud:', error);
      }
    }
    
    // Get updated category
    const updatedCategory = await getByIdFromBothSources('Category', categoryId);
    const products = await mergeDataFromBothSources('Product', { category: updatedCategory.name }, {});
    updatedCategory.productCount = products.length;
    
    res.json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error archiving category:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving category',
      error: error.message
    });
  }
};



