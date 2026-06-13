const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, transactionController.createTransaction);
router.get('/', authMiddleware, transactionController.getAllTransactions);
router.get('/analytics/data', authMiddleware, transactionController.getAnalytics);
router.get('/:id', authMiddleware, transactionController.getTransactionDetail);

module.exports = router;
