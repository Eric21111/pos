const express = require('express');
const router = express.Router();
const {
  createStockMovement,
  getStockMovements,
  getTodayStats,
  getMovementsByProduct
} = require('../controllers/stockMovementController');

router.post('/', createStockMovement);
router.get('/', getStockMovements);
router.get('/stats/today', getTodayStats);
router.get('/product/:productId', getMovementsByProduct);

module.exports = router;
