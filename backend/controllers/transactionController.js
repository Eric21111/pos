const SalesTransaction = require('../models/SalesTransaction');

exports.recordTransaction = async (req, res) => {
  try {
    const { 
      userId, 
      items, 
      paymentMethod, 
      amountReceived, 
      changeGiven, 
      referenceNo,
      receiptNo,
      totalAmount,
      status,
      performedById,
      performedByName
    } = req.body;

    if (!userId || !Array.isArray(items) || !items.length || !paymentMethod || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required transaction fields'
      });
    }

    const transaction = await SalesTransaction.create({
      userId,
      performedById,
      performedByName,
      items: items.map(item => ({
        productId: item.productId || item._id,
        itemName: item.itemName,
        sku: item.sku,
        variant: item.variant,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        price: item.itemPrice || item.price || 0
      })),
      paymentMethod,
      amountReceived,
      changeGiven,
      referenceNo,
      receiptNo,
      totalAmount,
      status: status || 'Completed'
    });

    res.json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record transaction',
      error: error.message
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { search = '', paymentMethod, status, userId } = req.query;

    const filters = {};

    if (paymentMethod) {
      filters.paymentMethod = paymentMethod;
    }

    if (status) {
      filters.status = status;
    }

    if (userId) {
      filters.userId = userId;
    }

    if (search) {
      filters.$or = [
        { 'items.itemName': { $regex: search, $options: 'i' } },
        { performedByName: { $regex: search, $options: 'i' } },
        { referenceNo: { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await SalesTransaction.find(filters)
      .sort({ checkedOutAt: -1 })
      .lean();

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

