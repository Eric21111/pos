const mongoose = require('mongoose');
const dbManager = require('../config/databaseManager');

// Helper to get models using the current connection (default mongoose connection)
const getProductModel = (req) => {
  const ProductModule = require('../models/Product');
  // Use default mongoose connection which switches between cloud/local
  if (mongoose.models.Product) {
    return mongoose.models.Product;
  }
  return mongoose.model('Product', ProductModule.schema);
};

const getStockMovementModel = (req) => {
  const StockMovementModule = require('../models/StockMovement');
  if (mongoose.models.StockMovement) {
    return mongoose.models.StockMovement;
  }
  return mongoose.model('StockMovement', StockMovementModule.schema);
};

const getEmployeeModel = (req) => {
  const EmployeeModule = require('../models/Employee');
  if (mongoose.models.Employee) {
    return mongoose.models.Employee;
  }
  return mongoose.model('Employee', EmployeeModule.schema);
};

const getTransactionModel = (req) => {
  const SalesTransactionModule = require('../models/SalesTransaction');
  if (mongoose.models.SalesTransaction) {
    return mongoose.models.SalesTransaction;
  }
  return mongoose.model('SalesTransaction', SalesTransactionModule.schema);
};

const getCartModel = (req) => {
  const CartModule = require('../models/Cart');
  if (mongoose.models.Cart) {
    return mongoose.models.Cart;
  }
  return mongoose.model('Cart', CartModule.schema);
};

const getArchiveModel = (req) => {
  const ArchiveModule = require('../models/Archive');
  if (mongoose.models.Archive) {
    return mongoose.models.Archive;
  }
  return mongoose.model('Archive', ArchiveModule.schema);
};

const getDiscountModel = (req) => {
  const DiscountModule = require('../models/Discount');
  if (mongoose.models.Discount) {
    return mongoose.models.Discount;
  }
  return mongoose.model('Discount', DiscountModule.schema);
};

const getCategoryModel = (req) => {
  const CategoryModule = require('../models/Category');
  if (mongoose.models.Category) {
    return mongoose.models.Category;
  }
  return mongoose.model('Category', CategoryModule.schema);
};

// Generic getModel function for any model
const getModel = (req, modelName) => {
  const modelMap = {
    'Product': getProductModel,
    'StockMovement': getStockMovementModel,
    'Employee': getEmployeeModel,
    'SalesTransaction': getTransactionModel,
    'Cart': getCartModel,
    'Archive': getArchiveModel,
    'Discount': getDiscountModel,
    'Category': getCategoryModel
  };
  
  const getter = modelMap[modelName];
  if (!getter) {
    throw new Error(`Unknown model: ${modelName}`);
  }
  return getter(req);
};

module.exports = {
  getProductModel,
  getStockMovementModel,
  getEmployeeModel,
  getTransactionModel,
  getCartModel,
  getArchiveModel,
  getDiscountModel,
  getCategoryModel,
  getModel
};

