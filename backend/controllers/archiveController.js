const { getArchiveModel, getModel } = require('../utils/getModel');
const { mergeDataFromBothSources, getByIdFromBothSources } = require('../utils/mergeData');

exports.createArchiveItem = async (req, res) => {
  try {
    const {
      productId,
      itemName,
      sku,
      variant,
      selectedSize,
      category,
      brandName,
      itemPrice,
      costPrice,
      quantity,
      itemImage,
      reason,
      returnReason,
      originalTransactionId,
      returnTransactionId,
      archivedBy,
      archivedById,
      notes
    } = req.body;

    if (!productId || !itemName || !sku || !category || !quantity || !reason || !originalTransactionId || !archivedBy) {
      return res.status(400).json({
        success: false,
        message: 'Missing required archive item fields'
      });
    }

    const Archive = getArchiveModel(req);

    const archiveData = {
      productId,
      itemName,
      sku,
      variant: variant || '',
      selectedSize: selectedSize || '',
      category,
      brandName: brandName || '',
      itemPrice: itemPrice || 0,
      costPrice: costPrice || 0,
      quantity,
      itemImage: itemImage || '',
      reason,
      returnReason: returnReason || '',
      originalTransactionId,
      returnTransactionId: returnTransactionId || null,
      archivedBy,
      archivedById: archivedById || '',
      notes: notes || '',
      archivedAt: new Date()
    };

    // Create archive item in primary database
    const archiveItem = await Archive.create(archiveData);

    // Also write to local if online (dual write for redundancy)
    if (req.isOnline && req.dbManager) {
      try {
        const localConnection = req.dbManager.getLocalConnection();
        if (localConnection && localConnection.readyState === 1) {
          const ArchiveModule = require('../models/Archive');
          const LocalArchive = localConnection.model('Archive', ArchiveModule.schema);
          await LocalArchive.create(archiveData);
          console.log('Archive item also written to local database');
        }
      } catch (localError) {
        console.warn('Failed to write archive item to local database:', localError.message);
      }
    }

    res.json({
      success: true,
      message: 'Item archived successfully',
      data: archiveItem
    });
  } catch (error) {
    console.error('Error creating archive item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive item',
      error: error.message
    });
  }
};

exports.getArchiveItems = async (req, res) => {
  try {
    const { search = '', reason, category, startDate, endDate } = req.query;

    // Get archive items from both local and cloud
    const allArchiveItems = await mergeDataFromBothSources('Archive', {}, {
      sort: { archivedAt: -1 }
    });

    // Apply filters
    let filteredItems = allArchiveItems;

    // Reason filter
    if (reason) {
      filteredItems = filteredItems.filter(item => item.reason === reason);
    }

    // Category filter
    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    // Date range filter
    if (startDate || endDate) {
      filteredItems = filteredItems.filter(item => {
        const archivedDate = new Date(item.archivedAt);
        if (startDate && archivedDate < new Date(startDate)) return false;
        if (endDate && archivedDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item => {
        return (
          item.itemName?.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower) ||
          item.brandName?.toLowerCase().includes(searchLower) ||
          item.returnReason?.toLowerCase().includes(searchLower)
        );
      });
    }

    res.json({
      success: true,
      count: filteredItems.length,
      data: filteredItems
    });
  } catch (error) {
    console.error('Error fetching archive items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch archive items',
      error: error.message
    });
  }
};

exports.getArchiveItemById = async (req, res) => {
  try {
    const archiveItem = await getByIdFromBothSources('Archive', req.params.id);

    if (!archiveItem) {
      return res.status(404).json({
        success: false,
        message: 'Archive item not found'
      });
    }

    res.json({
      success: true,
      data: archiveItem
    });
  } catch (error) {
    console.error('Error fetching archive item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch archive item',
      error: error.message
    });
  }
};

exports.deleteArchiveItem = async (req, res) => {
  try {
    const { id } = req.params;
    const Archive = getArchiveModel(req);

    const archiveItem = await Archive.findByIdAndDelete(id);

    if (!archiveItem) {
      return res.status(404).json({
        success: false,
        message: 'Archive item not found'
      });
    }

    // Also delete from local if online
    if (req.isOnline && req.dbManager) {
      try {
        const localConnection = req.dbManager.getLocalConnection();
        if (localConnection && localConnection.readyState === 1) {
          const ArchiveModule = require('../models/Archive');
          const LocalArchive = localConnection.model('Archive', ArchiveModule.schema);
          await LocalArchive.findByIdAndDelete(id);
          console.log('Archive item also deleted from local database');
        }
      } catch (localError) {
        console.warn('Failed to delete archive item from local database:', localError.message);
      }
    }

    res.json({
      success: true,
      message: 'Archive item deleted successfully',
      data: archiveItem
    });
  } catch (error) {
    console.error('Error deleting archive item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete archive item',
      error: error.message
    });
  }
};

