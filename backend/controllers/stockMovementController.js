const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');

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

    console.log('Stock movements query params:', { search, category, type, brand, reason, date, sortBy, page, limit });

    const query = {};

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { handledBy: { $regex: search, $options: 'i' } }
      ];
    }

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

    if (date && date !== 'All') {
      const now = new Date();
      let startDate, endDate;
      
      if (date === 'Today') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else if (date === 'This Week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else if (date === 'This Month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Assume it's a specific date string
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
      }
      
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Determine sort order
    let sort = { createdAt: -1 };
    switch (sortBy) {
      case 'date-asc':
        sort = { createdAt: 1 };
        break;
      case 'quantity-desc':
        sort = { quantity: -1 };
        break;
      case 'quantity-asc':
        sort = { quantity: 1 };
        break;
      case 'name-asc':
        sort = { itemName: 1 };
        break;
      case 'name-desc':
        sort = { itemName: -1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Stock movements query:', JSON.stringify(query));
    
    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StockMovement.countDocuments(query)
    ]);

    console.log(`Found ${movements.length} stock movements out of ${total} total`);

    res.json({
      success: true,
      data: movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
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

// Get stock movement stats for today
exports.getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const movements = await StockMovement.find({
      createdAt: { $gte: today, $lt: tomorrow }
    }).lean();

    const stats = {
      stockIn: 0,
      stockOut: 0,
      pullOut: 0,
      totalMovements: movements.length
    };

    movements.forEach(movement => {
      if (movement.type === 'Stock-In') {
        stats.stockIn += movement.quantity;
      } else if (movement.type === 'Stock-Out') {
        stats.stockOut += movement.quantity;
      } else if (movement.type === 'Pull-Out') {
        stats.pullOut += movement.quantity;
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today stats',
      error: error.message
    });
  }
};

// Get stock movements by product
exports.getMovementsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50 } = req.query;

    const movements = await StockMovement.find({ productId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: movements.length,
      data: movements
    });
  } catch (error) {
    console.error('Error fetching product movements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product movements',
      error: error.message
    });
  }
};
