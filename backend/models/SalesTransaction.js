const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  itemName: String,
  sku: String,
  variant: String,
  selectedSize: String,
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: false });

const salesTransactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  performedById: String,
  performedByName: String,
  items: {
    type: [transactionItemSchema],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'gcash', 'void'],
    required: true
  },
  amountReceived: Number,
  changeGiven: Number,
  referenceNo: String,
  receiptNo: String,
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Returned', 'Partially Returned', 'Voided'],
    default: 'Completed'
  },
  checkedOutAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SalesTransaction', salesTransactionSchema);

