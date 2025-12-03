const express = require('express');
const router = express.Router();
const {
  createArchiveItem,
  getAllArchiveItems,
  getArchiveItemById,
  deleteArchiveItem,
  restoreArchiveItem
} = require('../controllers/archiveController');

router.get('/', getAllArchiveItems);
router.get('/:id', getArchiveItemById);
router.post('/', createArchiveItem);
router.delete('/:id', deleteArchiveItem);
router.post('/:id/restore', restoreArchiveItem);

module.exports = router;
