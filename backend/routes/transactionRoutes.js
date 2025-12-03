const express = require('express');
const router = express.Router();
const {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  createTransaction,
  voidTransaction,
  returnItems,
  getTransactionStats,
  recalculateTransactionNumbers,
  getDashboardStats,
  getTopSellingProducts,
  getSalesOverTime
} = require('../controllers/transactionController');

router.get('/', getAllTransactions);
router.get('/stats', getTransactionStats);
router.get('/dashboard/stats', getDashboardStats);
router.get('/top-selling', getTopSellingProducts);
router.get('/sales-over-time', getSalesOverTime);
router.post('/', createTransaction);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);
router.post('/:id/void', voidTransaction);
router.post('/:id/return', returnItems);
router.post('/renumber', recalculateTransactionNumbers);

module.exports = router;
