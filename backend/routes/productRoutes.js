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
  toggleDisplayInTerminal,
  getInventoryStats
} = require('../controllers/productController');


router.route('/')
  .get(getAllProducts)
  .post(createProduct);

router.get('/search/:query', searchProducts);
router.get('/inventory-stats', getInventoryStats);

// Get low stock and out of stock products (optimized)
router.get('/low-stock', async (req, res) => {
  try {
    const Product = require('../models/Product');

    // Find products where currentStock <= reorderNumber (default 5)
    // We use $expr to compare fields within the document
    const stockAlertItems = await Product.aggregate([
      {
        $project: {
          itemName: 1,
          sku: 1,
          currentStock: { $ifNull: ["$currentStock", 0] },
          reorderNumber: { $ifNull: ["$reorderNumber", 5] },
          itemImage: { $ifNull: ["$itemImage", ""] },
          category: { $ifNull: ["$category", ""] },
          // Determine alert type for sorting
          alertType: {
            $cond: {
              if: { $eq: [{ $ifNull: ["$currentStock", 0] }, 0] },
              then: 'out_of_stock',
              else: 'low_stock'
            }
          }
        }
      },
      {
        $match: {
          $expr: { $lte: ["$currentStock", "$reorderNumber"] }
        }
      },
      {
        $sort: {
          alertType: -1, // 'out_of_stock' usually comes last alphabetically, so we might need custom sort or just sort by stock
          currentStock: 1
        }
      },
      { $limit: 50 } // Limit to 50 items to prevent payload issues
    ]);

    // Reshape data to match frontend expectation if needed (aggregate returns _id)
    // The previous implementation mapped it, but aggregate result is already close.
    // Just need to ensure consistent field names.

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
    const Product = require('../models/Product');
    const products = await Product.find({});

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

