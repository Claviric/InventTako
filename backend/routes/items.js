const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, itemController.getItems);
router.post('/', authMiddleware, itemController.createItem);
router.get('/:id', authMiddleware, itemController.getItemById);
router.put('/:id', authMiddleware, itemController.updateItem);
router.delete('/:id', authMiddleware, itemController.deleteItem);

module.exports = router;
