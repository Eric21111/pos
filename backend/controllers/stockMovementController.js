const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const { mergeDataFromBothSources } = require('../utils/mergeData');

// Create a stock movement log
exports.createStockMovement = async (req, res) => {
  try {
    const {
      productId,
      type,
      quantity,
      stockBefore,
      stockAfter,
      reason,
      handledBy,
      handledById,
      notes
    } = req.body;

    if (!productId || !type || !quantity || stockBefore === undefined || stockAfter === undefined || !reason || !handledBy) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const stockMovement = await StockMovement.create({
      productId,
      sku: product.sku,
      itemName: product.itemName,
      itemImage: product.itemImage || '',
      category: product.category,
      brandName: product.brandName || '',
      type,
      quantity,
      stockBefore,
      stockAfter,
      reason,
      handledBy,
      handledById: handledById || '',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Stock movement logged successfully',
      data: stockMovement
    });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating stock movement',
      error: error.message
    });
  }
};

// Get all stock movements with filters
exports.getStockMovements = async (req, res) => {
  try {
    const {
      search = '',
      category,
      type,
      brand,
      reason,
      date,
      sortBy = 'date-desc',
      page = 1,
      limit = 60
    } = req.query;

    const filters = {};

    // Search filter
    if (search) {
      filters.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { handledBy: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      filters.category = category;
    }

    // Type filter
    if (type && type !== 'All') {
      filters.type = type;
    }

    // Brand filter
    if (brand && brand !== 'All') {
      filters.brandName = brand;
    }

    // Reason filter
    if (reason && reason !== 'All') {
      filters.reason = reason;
    }

    // Date filter
    if (date && date !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date === 'Today') {
        filters.createdAt = { $gte: today, $lt: tomorrow };
      } else if (date === 'This Week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.createdAt = { $gte: weekAgo };
      } else if (date === 'This Month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filters.createdAt = { $gte: monthAgo };
      }
    }

    // Sort
    let sort = {};
    switch (sortBy) {
      case 'date-desc':
        sort = { createdAt: -1 };
        break;
      case 'date-asc':
        sort = { createdAt: 1 };
        break;
      case 'name-asc':
        sort = { itemName: 1 };
        break;
      case 'name-desc':
        sort = { itemName: -1 };
        break;
      case 'sku-asc':
        sort = { sku: 1 };
        break;
      case 'sku-desc':
        sort = { sku: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Build query for database-level filtering (more efficient)
    const query = {};
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (type && type !== 'All') {
      query.type = type;
    }
    
    if (brand && brand !== 'All') {
      query.brandName = brand;
    }
    
    if (reason && reason !== 'All') {
      query.reason = reason;
    }
    
    // Date filter at database level
    if (date && date !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date === 'Today') {
        query.createdAt = { $gte: today, $lt: tomorrow };
      } else if (date === 'This Week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        query.createdAt = { $gte: weekAgo };
      } else if (date === 'This Month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query.createdAt = { $gte: monthAgo };
      }
    }

    // Get movements from both local and cloud with query filter and limit
    const limitNum = parseInt(limit, 10) || 500;
    const allMovements = await mergeDataFromBothSources('StockMovement', query, {
      sort: { createdAt: -1 },
      limit: limitNum
    });
    
    // Apply search filter in memory (text search is complex)
    let filteredMovements = allMovements;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMovements = filteredMovements.filter(m => 
        (m.itemName && m.itemName.toLowerCase().includes(searchLower)) ||
        (m.sku && m.sku.toLowerCase().includes(searchLower)) ||
        (m.handledBy && m.handledBy.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting (already sorted by mergeDataFromBothSources, but re-sort if needed)
    switch (sortBy) {
      case 'date-asc':
        filteredMovements.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'name-asc':
        filteredMovements.sort((a, b) => (a.itemName || '').localeCompare(b.itemName || ''));
        break;
      case 'name-desc':
        filteredMovements.sort((a, b) => (b.itemName || '').localeCompare(a.itemName || ''));
        break;
      case 'sku-asc':
        filteredMovements.sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
        break;
      case 'sku-desc':
        filteredMovements.sort((a, b) => (b.sku || '').localeCompare(a.sku || ''));
        break;
      default:
        // Already sorted by date-desc from mergeDataFromBothSources
        break;
    }
    
    // Limit results for pagination (limitNum already declared above for mergeDataFromBothSources)
    // Use pagination limit (default 60) which may be different from query limit
    const paginationLimit = parseInt(limit, 10) || 60;
    const pageNum = parseInt(page, 10) || 1;
    const skip = (pageNum - 1) * paginationLimit;
    const paginatedMovements = filteredMovements.slice(skip, skip + paginationLimit);
    
    // Pagination info
    const total = filteredMovements.length;

    res.json({
      success: true,
      data: paginatedMovements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock movements',
      error: error.message
    });
  }
};

// Get stock movement statistics for today
exports.getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Use mergeDataFromBothSources to get deduplicated movements
    // This ensures we count correctly even if duplicates exist in cloud and local
    const allMovements = await mergeDataFromBothSources('StockMovement', {
      createdAt: { $gte: today, $lt: tomorrow }
    }, {
      sort: { createdAt: -1 }
    });

    // Count deduplicated movements by type
    const stockIns = allMovements.filter(m => m.type === 'Stock-In').length;
    const stockOuts = allMovements.filter(m => m.type === 'Stock-Out').length;
    const pullOuts = allMovements.filter(m => m.type === 'Pull-Out').length;

    res.json({
      success: true,
      data: {
        stockIns,
        stockOuts,
        pullOuts
      }
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Get stock movement by ID
exports.getStockMovementById = async (req, res) => {
  try {
    const movement = await StockMovement.findById(req.params.id).lean();

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }

    res.json({
      success: true,
      data: movement
    });
  } catch (error) {
    console.error('Error fetching stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock movement',
      error: error.message
    });
  }
};

