const dbManager = require('../config/databaseManager');
const mongoose = require('mongoose');

exports.getCartByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Carts are ALWAYS stored in local database only
    const localConnection = dbManager.getLocalConnection();
    if (!localConnection || localConnection.readyState !== 1) {
      // If local not available, return empty cart
      return res.json({
        success: true,
        data: { userId, items: [] }
      });
    }

    const CartModule = require('../models/Cart');
    const LocalCart = localConnection.model('Cart', CartModule.schema);
    const cart = await LocalCart.findOne({ userId }).lean();

    res.json({
      success: true,
      data: cart || { userId, items: [] }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
};

exports.saveCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { items } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }

    // Carts are ALWAYS stored in local database only (never in cloud)
    const localConnection = dbManager.getLocalConnection();
    if (!localConnection || localConnection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Local database not available. Carts require local storage.'
      });
    }

    const sanitizedItems = items.map((item) => ({
      productId: item._id || item.productId,
      itemName: item.itemName || '',
      sku: item.sku || '',
      itemPrice: item.itemPrice || 0,
      quantity: item.quantity || 1,
      selectedSize: item.selectedSize || '',
      variant: item.variant || '',
      itemImage: item.itemImage || ''
    }));

    const CartModule = require('../models/Cart');
    const LocalCart = localConnection.model('Cart', CartModule.schema);
    const cart = await LocalCart.findOneAndUpdate(
      { userId },
      { items: sanitizedItems },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      success: true,
      message: 'Cart saved successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save cart',
      error: error.message
    });
  }
};

