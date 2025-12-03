const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/database');

dotenv.config();

// Import all models
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const SalesTransaction = require('../models/SalesTransaction');
const StockMovement = require('../models/StockMovement');
const Cart = require('../models/Cart');
const VoidLog = require('../models/VoidLog');
const Category = require('../models/Category');
const BrandPartner = require('../models/BrandPartner');
const Discount = require('../models/Discount');

const collections = {
  products: { model: Product, name: 'products' },
  employees: { model: Employee, name: 'employees' },
  transactions: { model: SalesTransaction, name: 'salestransactions' },
  stockMovements: { model: StockMovement, name: 'stockmovements' },
  carts: { model: Cart, name: 'carts' },
  voidLogs: { model: VoidLog, name: 'voidlogs' },
  categories: { model: Category, name: 'categories' },
  brandPartners: { model: BrandPartner, name: 'brandpartners' },
  discounts: { model: Discount, name: 'discounts' }
};

const deleteAllData = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('\n📊 Deleting all data from database...\n');

    for (const [key, { model, name }] of Object.entries(collections)) {
      try {
        const result = await model.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} documents from ${name}`);
      } catch (error) {
        console.error(`❌ Error deleting ${name}:`, error.message);
      }
    }

    console.log('\n✅ Database cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

const deleteCollection = async (collectionName) => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    const collectionInfo = collections[collectionName];
    if (!collectionInfo) {
      console.error(`❌ Unknown collection: ${collectionName}`);
      console.log('Available collections:', Object.keys(collections).join(', '));
      process.exit(1);
    }

    console.log(`\n📊 Deleting all data from ${collectionInfo.name}...`);
    
    const result = await collectionInfo.model.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} documents from ${collectionInfo.name}`);

    console.log('\n✅ Collection cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--all') {
  deleteAllData();
} else if (args[0] === '--collection' && args[1]) {
  deleteCollection(args[1]);
} else {
  console.log('Usage:');
  console.log('  node deleteDatabaseData.js --all                    Delete all data');
  console.log('  node deleteDatabaseData.js --collection <name>      Delete specific collection');
  console.log('\nAvailable collections:', Object.keys(collections).join(', '));
  process.exit(1);
}
