const express = require('express');
const router = express.Router();
const {
  createStockMovement,
  getStockMovements,
  getTodayStats,
  getMovementsByProduct,
  getStockStatsOverTime
} = require('../controllers/stockMovementController');

router.post('/', createStockMovement);
router.get('/', getStockMovements);
router.get('/stats/today', getTodayStats);
router.get('/stats/over-time', getStockStatsOverTime);
router.get('/product/:productId', getMovementsByProduct);

module.exports = router;
