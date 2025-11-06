const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Tops', 'Bottoms', 'Dresses', 'Makeup', 'Accessories', 'Shoes', 'Head Wear', 'Others']
  },
  brandName: {
    type: String,
    default: '',
    trim: true
  },
  variant: {
    type: String,
    default: '',
    trim: true
  },
  size: {
    type: String,
    default: '',
    trim: true
  },
  sizes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  itemPrice: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reorderNumber: {
    type: Number,
    default: 0,
    min: 0
  },
  expirationDate: {
    type: Date,
    default: null
  },
  supplierName: {
    type: String,
    default: '',
    trim: true
  },
  supplierContact: {
    type: String,
    default: '',
    trim: true
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  itemImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});


productSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);

