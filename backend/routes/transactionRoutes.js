const express = require('express');
const router = express.Router();
const { recordTransaction, getTransactions, updateTransaction, renumberTransactions, getDashboardStats } = require('../controllers/transactionController');

router.get('/', getTransactions);
router.get('/dashboard/stats', getDashboardStats);
router.post('/', recordTransaction);
router.put('/:id', updateTransaction);
router.post('/renumber', renumberTransactions); // Migration endpoint to renumber transactions

module.exports = router;

