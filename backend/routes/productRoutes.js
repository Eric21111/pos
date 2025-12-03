const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  updateStockAfterTransaction,
  toggleDisplayInTerminal
} = require('../controllers/productController');


router.route('/')
  .get(getAllProducts)
  .post(createProduct);

router.get('/search/:query', searchProducts);

// Get low stock and out of stock products (for notifications)
router.get('/low-stock', async (req, res) => {
  try {
    const { mergeDataFromBothSources } = require('../utils/mergeData');
    const products = await mergeDataFromBothSources('Product', {}, {});
    
    const stockAlertItems = products.filter(p => {
      const stock = p.currentStock || 0;
      const reorder = p.reorderNumber || 5; // Default threshold of 5 if not set
      return stock <= reorder && stock >= 0;
    }).map(p => {
      const stock = p.currentStock || 0;
      return {
        _id: p._id,
        itemName: p.itemName,
        sku: p.sku,
        currentStock: stock,
        reorderNumber: p.reorderNumber || 5,
        itemImage: p.itemImage || '',
        category: p.category || '',
        alertType: stock === 0 ? 'out_of_stock' : 'low_stock'
      };
    });
    
    // Sort: out of stock first, then low stock
    stockAlertItems.sort((a, b) => {
      if (a.alertType === 'out_of_stock' && b.alertType !== 'out_of_stock') return -1;
      if (a.alertType !== 'out_of_stock' && b.alertType === 'out_of_stock') return 1;
      return a.currentStock - b.currentStock;
    });
    
    res.json({
      success: true,
      count: stockAlertItems.length,
      data: stockAlertItems
    });
  } catch (error) {
    console.error('Error fetching stock alert products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock alert products',
      error: error.message
    });
  }
});

// Update stock after successful transaction
router.post('/update-stock', updateStockAfterTransaction);

// Get SKU counts by brand for dashboard chart
router.get('/sku-stats', async (req, res) => {
  try {
    const { mergeDataFromBothSources } = require('../utils/mergeData');
    const products = await mergeDataFromBothSources('Product', {}, {});
    
    // Group products by brand name and count SKUs
    const brandStats = {};
    products.forEach(product => {
      const brand = product.brandName?.trim() || 'Unbranded';
      if (!brandStats[brand]) {
        brandStats[brand] = {
          brand,
          skuCount: 0,
          totalStock: 0
        };
      }
      brandStats[brand].skuCount += 1;
      brandStats[brand].totalStock += product.currentStock || 0;
    });
    
    // Convert to array and sort by SKU count descending
    const statsArray = Object.values(brandStats)
      .sort((a, b) => b.skuCount - a.skuCount);
    
    res.json({
      success: true,
      data: statsArray
    });
  } catch (error) {
    console.error('Error fetching SKU stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SKU stats',
      error: error.message
    });
  }
});

router.get('/category/:category', getProductsByCategory);


router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

router.patch('/:id/toggle-display', toggleDisplayInTerminal);

module.exports = router;

