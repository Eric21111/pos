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

