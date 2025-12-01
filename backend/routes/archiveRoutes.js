const express = require('express');
const router = express.Router();
const {
  createArchiveItem,
  getArchiveItems,
  getArchiveItemById,
  deleteArchiveItem
} = require('../controllers/archiveController');

router.get('/', getArchiveItems);
router.get('/:id', getArchiveItemById);
router.post('/', createArchiveItem);
router.delete('/:id', deleteArchiveItem);

module.exports = router;



