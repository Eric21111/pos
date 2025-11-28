const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  itemName: String,
  sku: String,
  itemPrice: Number,
  quantity: {
    type: Number,
    default: 1
  },
  selectedSize: String,
  variant: String,
  itemImage: String
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);

