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
  },
  itemImage: {
    type: String,
    default: ''
  },
  returnReason: {
    type: String,
    default: null
  },
  voidReason: {
    type: String,
    default: null
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
    enum: ['cash', 'gcash', 'void', 'return'],
    required: true
  },
  amountReceived: Number,
  changeGiven: Number,
  referenceNo: String,
  receiptNo: String,
  transactionNumber: {
    type: Number,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    index: true
  },
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
  },
  originalTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesTransaction',
    default: null
  },
  voidedBy: {
    type: String,
    default: null
  },
  voidedByName: {
    type: String,
    default: null
  },
  voidedAt: {
    type: Date,
    default: null
  },
  voidReason: {
    type: String,
    default: null
  },
  voidId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
salesTransactionSchema.index({ checkedOutAt: -1 }); // Most common sort
salesTransactionSchema.index({ status: 1 });
salesTransactionSchema.index({ receiptNo: 1 });
salesTransactionSchema.index({ transactionNumber: -1 }); // For getting highest transaction number
salesTransactionSchema.index({ userId: 1 });
salesTransactionSchema.index({ paymentMethod: 1 });
salesTransactionSchema.index({ referenceNo: 1 });
salesTransactionSchema.index({ createdAt: -1 });
salesTransactionSchema.index({ 'items.productId': 1 }); // For product transaction lookups

// Export schema for dynamic connection
module.exports.schema = salesTransactionSchema;

// Export default model for backward compatibility
module.exports = mongoose.model('SalesTransaction', salesTransactionSchema);

