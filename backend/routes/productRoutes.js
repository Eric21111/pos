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
  updateStockAfterTransaction
} = require('../controllers/productController');


router.route('/')
  .get(getAllProducts)
  .post(createProduct);

router.get('/search/:query', searchProducts);

// Update stock after successful transaction
router.post('/update-stock', updateStockAfterTransaction);

router.get('/category/:category', getProductsByCategory);


router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;

