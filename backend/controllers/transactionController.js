const mongoose = require('mongoose');
const SalesTransaction = require('../models/SalesTransaction');
const VoidLog = require('../models/VoidLog');
const Product = require('../models/Product');

// Helper function to safely convert to ObjectId
const toObjectId = (id) => {
  if (!id) return null;
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }
    return null;
  } catch (e) {
    console.error('Error converting to ObjectId:', e);
    return null;
  }
};

// Generate a unique receipt number
const generateUniqueReceiptNumber = async () => {
  const timestamp = Date.now().toString().slice(-6);
  let receiptNo = timestamp.padStart(6, '0');
  
  const existing = await SalesTransaction.findOne({ receiptNo });
  if (existing) {
    receiptNo = (timestamp + Math.floor(Math.random() * 10)).slice(-6);
  }
  
  return receiptNo;
};

// Generate a unique void ID
const generateVoidId = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let voidId;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    voidId = 'VOID-';
    for (let i = 0; i < 6; i++) {
      voidId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const existing = await SalesTransaction.findOne({ voidId });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    const timestamp = Date.now().toString().slice(-4);
    voidId = `VOID-${timestamp}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
  }
  
  return voidId;
};

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await SalesTransaction.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await SalesTransaction.findById(req.params.id).lean();
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message
    });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const transaction = await SalesTransaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update allowed fields
    if (updateData.status) {
      transaction.status = updateData.status;
    }
    if (updateData.items) {
      transaction.items = updateData.items;
    }
    if (updateData.totalAmount !== undefined) {
      transaction.totalAmount = updateData.totalAmount;
    }

    await transaction.save();
    
    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction',
      error: error.message
    });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discount,
      discountType,
      discountValue,
      totalAmount,
      paymentMethod,
      amountPaid,
      amountReceived,
      change,
      changeGiven,
      cashierName,
      cashierId,
      userId,
      performedById,
      performedByName,
      status,
      customerName,
      customerType,
      seniorCitizenId,
      pwdId,
      referenceNo,
      receiptNo: providedReceiptNo,
      originalTransactionId,
      checkedOutAt
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    const receiptNo = providedReceiptNo || await generateUniqueReceiptNumber();

    const transactionData = {
      receiptNo,
      userId: userId || cashierId || performedById || 'system',
      performedById: performedById || cashierId || '',
      performedByName: performedByName || cashierName || '',
      items: items.map(item => {
        const productId = toObjectId(item._id || item.productId);
        if (!productId) {
          console.warn('Invalid productId for item:', item.itemName, 'ID:', item._id || item.productId);
        }
        return {
          productId: productId,
          itemName: item.itemName || 'Unknown Item',
          sku: item.sku || '',
          variant: item.variant || item.selectedVariation || null,
          selectedSize: item.selectedSize || item.size || null,
          quantity: item.quantity || 1,
          price: item.itemPrice || item.price || 0,
          itemImage: item.itemImage || '',
          returnReason: item.returnReason || null
        };
      }).filter(item => item.productId !== null),
      subtotal: subtotal || 0,
      discount: discount || 0,
      discountType: discountType || null,
      discountValue: discountValue || 0,
      totalAmount: totalAmount || 0,
      paymentMethod: paymentMethod || 'cash',
      amountReceived: amountReceived || amountPaid || 0,
      changeGiven: changeGiven || change || 0,
      status: status || 'Completed',
      customerName: customerName || null,
      customerType: customerType || 'regular',
      seniorCitizenId: seniorCitizenId || null,
      pwdId: pwdId || null,
      referenceNo: referenceNo || null,
      originalTransactionId: originalTransactionId || null,
      checkedOutAt: checkedOutAt || new Date()
    };

    // Validate that we have at least one valid item
    if (transactionData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid items to process. All product IDs were invalid.'
      });
    }

    console.log('Creating transaction with data:', JSON.stringify(transactionData, null, 2));

    const transaction = await SalesTransaction.create(transactionData);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    console.error('Error details:', error.errors || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
};

exports.voidTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { voidReason, voidedBy, voidedById, voidedByName } = req.body;

    if (!voidReason || !voidedByName) {
      return res.status(400).json({
        success: false,
        message: 'Void reason and voided by name are required'
      });
    }

    const transaction = await SalesTransaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status === 'voided') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is already voided'
      });
    }

    const voidId = await generateVoidId();

    // Update transaction status
    transaction.status = 'voided';
    transaction.voidId = voidId;
    transaction.voidReason = voidReason;
    transaction.voidedBy = voidedBy || voidedById;
    transaction.voidedById = voidedById || voidedBy;
    transaction.voidedByName = voidedByName;
    transaction.voidedAt = new Date();
    await transaction.save();

    // Create void log
    await VoidLog.create({
      voidId,
      items: transaction.items.map(item => ({
        productId: item.productId,
        itemName: item.itemName,
        sku: item.sku,
        variant: item.variant,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        price: item.price,
        itemImage: item.itemImage,
        voidReason
      })),
      totalAmount: transaction.totalAmount,
      voidReason,
      voidedBy: voidedBy || voidedById,
      voidedById: voidedById || voidedBy,
      voidedByName,
      voidedAt: new Date(),
      originalTransactionId: transaction._id,
      source: 'transaction'
    });

    // Restore stock for voided items
    for (const item of transaction.items) {
      try {
        const product = await Product.findById(item.productId);
        if (product) {
          if (product.sizes && item.selectedSize) {
            const sizeKey = Object.keys(product.sizes).find(
              key => key.toLowerCase() === item.selectedSize.toLowerCase()
            );
            if (sizeKey) {
              const sizeData = product.sizes[sizeKey];
              if (typeof sizeData === 'object' && sizeData.quantity !== undefined) {
                product.sizes[sizeKey].quantity += item.quantity;
              } else {
                product.sizes[sizeKey] = (sizeData || 0) + item.quantity;
              }
              product.markModified('sizes');
            }
          }
          product.currentStock += item.quantity;
          product.lastUpdated = Date.now();
          await product.save();
        }
      } catch (stockError) {
        console.error('Error restoring stock for item:', item.itemName, stockError);
      }
    }

    res.json({
      success: true,
      message: 'Transaction voided successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error voiding transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to void transaction',
      error: error.message
    });
  }
};

exports.returnItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, returnReason, returnedBy, returnedById, returnedByName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items to return are required'
      });
    }

    const originalTransaction = await SalesTransaction.findById(id);
    if (!originalTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Original transaction not found'
      });
    }

    // Calculate return amount
    let returnAmount = 0;
    const returnItems = items.map(item => {
      const originalItem = originalTransaction.items.find(
        oi => oi.productId?.toString() === item.productId?.toString() &&
              oi.selectedSize === item.selectedSize
      );
      
      const price = originalItem?.price || item.price || 0;
      returnAmount += price * item.quantity;
      
      return {
        productId: item.productId,
        itemName: item.itemName,
        sku: item.sku,
        variant: item.variant,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        price,
        itemImage: item.itemImage,
        returnReason: item.returnReason || returnReason
      };
    });

    const receiptNo = await generateUniqueReceiptNumber();

    // Create return transaction
    const returnTransaction = await SalesTransaction.create({
      receiptNo,
      items: returnItems,
      subtotal: -returnAmount,
      discount: 0,
      totalAmount: -returnAmount,
      paymentMethod: 'return',
      amountPaid: 0,
      change: returnAmount,
      cashierName: returnedByName || '',
      cashierId: returnedById || returnedBy || '',
      status: 'completed',
      originalTransactionId: originalTransaction._id,
      returnReason,
      returnedBy: returnedBy || returnedById,
      returnedById: returnedById || returnedBy,
      returnedByName
    });

    // Update original transaction
    originalTransaction.hasReturns = true;
    originalTransaction.returnTransactionIds = originalTransaction.returnTransactionIds || [];
    originalTransaction.returnTransactionIds.push(returnTransaction._id);
    await originalTransaction.save();

    // Restore stock for returned items
    for (const item of returnItems) {
      try {
        const product = await Product.findById(item.productId);
        if (product) {
          if (product.sizes && item.selectedSize) {
            const sizeKey = Object.keys(product.sizes).find(
              key => key.toLowerCase() === item.selectedSize.toLowerCase()
            );
            if (sizeKey) {
              const sizeData = product.sizes[sizeKey];
              if (typeof sizeData === 'object' && sizeData.quantity !== undefined) {
                product.sizes[sizeKey].quantity += item.quantity;
              } else {
                product.sizes[sizeKey] = (sizeData || 0) + item.quantity;
              }
              product.markModified('sizes');
            }
          }
          product.currentStock += item.quantity;
          product.lastUpdated = Date.now();
          await product.save();
        }
      } catch (stockError) {
        console.error('Error restoring stock for returned item:', item.itemName, stockError);
      }
    }

    res.json({
      success: true,
      message: 'Items returned successfully',
      data: {
        returnTransaction,
        originalTransaction,
        returnAmount
      }
    });
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process return',
      error: error.message
    });
  }
};

exports.getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { status: 'completed', paymentMethod: { $ne: 'return' } };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const [totalTransactions, totalSales, byPaymentMethod] = await Promise.all([
      SalesTransaction.countDocuments(query),
      SalesTransaction.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      SalesTransaction.aggregate([
        { $match: query },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        totalTransactions,
        totalSales: totalSales[0]?.total || 0,
        byPaymentMethod: byPaymentMethod.reduce((acc, item) => {
          acc[item._id] = { count: item.count, total: item.total };
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction statistics',
      error: error.message
    });
  }
};

// Get dashboard stats (sales, transactions, profit, low stock) with timeframe support
exports.getDashboardStats = async (req, res) => {
  try {
    const { timeframe = 'daily' } = req.query;
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate, endDate;
    
    switch (timeframe.toLowerCase()) {
      case 'daily':
        // Today only
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        // Current week (Sunday to Saturday)
        startDate = new Date(now);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        // Default to daily
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }

    // Get transactions for the timeframe (excluding returns and voided)
    // Use $or to check both checkedOutAt and createdAt for consistency with sales chart
    const transactions = await SalesTransaction.find({
      $or: [
        { checkedOutAt: { $gte: startDate, $lt: endDate } },
        { checkedOutAt: { $exists: false }, createdAt: { $gte: startDate, $lt: endDate } }
      ],
      status: { $not: { $regex: /^voided$/i } },
      paymentMethod: { $ne: 'return' }
    }).lean();

    // Calculate total sales
    const totalSalesToday = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    
    // Count transactions
    const totalTransactions = transactions.length;

    // Calculate profit (need to get cost from products)
    let profit = 0;
    for (const transaction of transactions) {
      for (const item of transaction.items || []) {
        const product = await Product.findById(item.productId).lean();
        if (product) {
          const costPrice = product.costPrice || 0;
          const sellingPrice = item.price || 0;
          profit += (sellingPrice - costPrice) * (item.quantity || 1);
        }
      }
    }

    // Get low stock items count (this is not timeframe dependent)
    const products = await Product.find({}).lean();
    const lowStockItems = products.filter(p => {
      const stock = p.currentStock || 0;
      const reorder = p.reorderNumber || 5;
      return stock <= reorder && stock >= 0;
    }).length;

    res.json({
      success: true,
      data: {
        totalSalesToday,
        totalTransactions,
        profit,
        lowStockItems
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};


// Get top selling products based on transaction data
exports.getTopSellingProducts = async (req, res) => {
  try {
    const { sort = 'most', limit = 5, period = 'daily' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;
    
    switch (period.toLowerCase()) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        startDate = new Date(now);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }
    
    // Aggregate sales data from completed transactions
    const salesData = await SalesTransaction.aggregate([
      // Only include completed transactions (not voided or returns) within the time period
      { 
        $match: { 
          status: { $nin: ['Voided', 'voided'] },
          paymentMethod: { $nin: ['return', 'void'] },
          $or: [
            { checkedOutAt: { $gte: startDate, $lt: endDate } },
            { checkedOutAt: { $exists: false }, createdAt: { $gte: startDate, $lt: endDate } }
          ]
        } 
      },
      // Unwind items array to get individual product sales
      { $unwind: '$items' },
      // Group by product ID and sum quantities
      {
        $group: {
          _id: '$items.productId',
          itemName: { $first: '$items.itemName' },
          sku: { $first: '$items.sku' },
          itemImage: { $first: '$items.itemImage' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      // Sort by quantity sold
      { $sort: { totalQuantitySold: sort === 'most' ? -1 : 1 } },
      // Limit results
      { $limit: parseInt(limit) }
    ]);

    // Enrich with product details
    const enrichedData = await Promise.all(
      salesData.map(async (item) => {
        let product = null;
        if (item._id) {
          product = await Product.findById(item._id).lean();
        }
        return {
          productId: item._id,
          itemName: item.itemName || product?.itemName || 'Unknown Product',
          sku: item.sku || product?.sku || '-',
          itemImage: item.itemImage || product?.itemImage || '',
          category: product?.category || '-',
          totalQuantitySold: item.totalQuantitySold,
          totalRevenue: item.totalRevenue,
          currentStock: product?.currentStock || 0
        };
      })
    );

    res.json({
      success: true,
      data: enrichedData
    });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top selling products',
      error: error.message
    });
  }
};


// Get sales over time data for charts
// Uses the same logic as getDashboardStats for consistency
exports.getSalesOverTime = async (req, res) => {
  try {
    const { timeframe = 'daily' } = req.query;
    
    let limit;
    switch (timeframe.toLowerCase()) {
      case 'daily':
        limit = 7;
        break;
      case 'weekly':
        limit = 8;
        break;
      case 'monthly':
        limit = 12;
        break;
      default:
        limit = 7;
    }

    // Generate date ranges for each period (same logic as getDashboardStats)
    const periods = [];
    const now = new Date();
    
    for (let i = limit - 1; i >= 0; i--) {
      let startDate, endDate, label;
      
      if (timeframe.toLowerCase() === 'daily') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        label = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeframe.toLowerCase() === 'weekly') {
        // Start of week (Sunday)
        startDate = new Date(now);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek - (i * 7));
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        
        const weekNum = Math.ceil((startDate.getDate() + new Date(startDate.getFullYear(), startDate.getMonth(), 1).getDay()) / 7);
        label = `Week ${weekNum}`;
      } else if (timeframe.toLowerCase() === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
        
        label = startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
      
      periods.push({ startDate, endDate, label });
    }

    // Fetch sales for each period using the SAME query logic as getDashboardStats
    const salesData = await Promise.all(
      periods.map(async ({ startDate, endDate, label }) => {
        const transactions = await SalesTransaction.find({
          $or: [
            { checkedOutAt: { $gte: startDate, $lt: endDate } },
            { checkedOutAt: { $exists: false }, createdAt: { $gte: startDate, $lt: endDate } }
          ],
          status: { $not: { $regex: /^voided$/i } },
          paymentMethod: { $ne: 'return' }
        }).lean();

        const totalSales = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const transactionCount = transactions.length;

        return {
          period: label,
          totalSales,
          transactionCount
        };
      })
    );

    // Calculate growth (absolute difference, not percentage)
    const formattedData = salesData.map((item, index, arr) => {
      const prevSales = index > 0 ? arr[index - 1].totalSales : item.totalSales;
      const growth = item.totalSales - prevSales;

      return {
        ...item,
        growth
      };
    });

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching sales over time:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales data',
      error: error.message
    });
  }
};
