const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts
} = require('../controllers/productController');


router.route('/')
  .get(getAllProducts)
  .post(createProduct);

router.get('/search/:query', searchProducts);


router.get('/category/:category', getProductsByCategory);


router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;

