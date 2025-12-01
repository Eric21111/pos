const express = require('express');
const router = express.Router();
const {
  createStockMovement,
  getStockMovements,
  getTodayStats,
  getStockMovementById
} = require('../controllers/stockMovementController');

router.post('/', createStockMovement);
router.get('/', getStockMovements);
router.get('/stats/today', getTodayStats);
router.get('/:id', getStockMovementById);

module.exports = router;

