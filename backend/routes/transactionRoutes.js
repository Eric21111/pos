const express = require('express');
const router = express.Router();
const { recordTransaction, getTransactions } = require('../controllers/transactionController');

router.get('/', getTransactions);
router.post('/', recordTransaction);

module.exports = router;

