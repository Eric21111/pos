const Product = require('../models/Product');


exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ dateAdded: -1 }).lean();
    

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
        sizes: product.sizes || null
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
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
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
    
    
    if (!productData.sizes && productData.selectedSizes) {
     
      if (productData.selectedSizes.length > 0 && productData.sizeQuantities) {
        productData.sizes = productData.sizeQuantities;
      }
    }
  
    delete productData.selectedSizes;
    delete productData.sizeQuantities;
    
  
    if (!productData.dateAdded) {
      productData.dateAdded = Date.now();
    }
    
    const product = await Product.create(productData);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
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


exports.updateProduct = async (req, res) => {
  try {

    const updateData = { ...req.body };
    
   
    if (!updateData.sizes && updateData.selectedSizes) {
      
      if (updateData.selectedSizes.length > 0 && updateData.sizeQuantities) {
        updateData.sizes = updateData.sizeQuantities;
      } else if (updateData.selectedSizes.length === 0) {
        updateData.sizes = null;
      }
    }
    

    delete updateData.selectedSizes;
    delete updateData.sizeQuantities;
    
 
    updateData.lastUpdated = Date.now();
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
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
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};


exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category }).sort({ dateAdded: -1 });
    
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
   

    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid items data'
      });
    }
    
    const findSizeKey = (sizes = {}, size = '') => {
      const normalized = size?.toLowerCase();
      return Object.keys(sizes).find((key) => key?.toLowerCase() === normalized);   
    };
    
    // Update stock for each item
    const updatePromises = items.map(async (item) => {
      const product = await Product.findById(item._id);
      
      if (!product) {
        throw new Error(`Product with ID ${item._id} not found`);
      }
      
      // Handle products with sizes differently
      if (product.sizes && item.size) {
        const sizeKey = findSizeKey(product.sizes, item.size);
        
        if (!sizeKey) {
          throw new Error(`Size ${item.size} not found for product ${product.itemName}`);
        }
        
        // Check if there's enough stock for the specific size
        if (product.sizes[sizeKey] < item.quantity) {
          throw new Error(`Insufficient stock for ${product.itemName} (${item.size}). Available: ${product.sizes[sizeKey]}, Requested: ${item.quantity}`);
        }
        
        // Deduct from specific size stock
        product.sizes[sizeKey] -= item.quantity;
        
        // Mark sizes as modified for Mongoose to save it
        product.markModified('sizes');
        
        // Also update the total currentStock
        product.currentStock -= item.quantity;
      } else {
        // Regular product without sizes
        // Check if there's enough stock
        if (product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.itemName}. Available: ${product.currentStock}, Requested: ${item.quantity}`);
        }
        
        // Deduct the quantity from current stock
        product.currentStock -= item.quantity;
      }
      
      product.lastUpdated = Date.now();
      await product.save();
      
      return {
        productId: product._id,
        productName: product.itemName,
        size: item.size || null,
        oldStock: product.currentStock + item.quantity,
        newStock: product.currentStock,
        quantityDeducted: item.quantity
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
    res.status(400).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
};


exports.searchProducts = async (req, res) => {
  try {
    const query = req.params.query;
    const products = await Product.find({
      $or: [
        { itemName: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
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

