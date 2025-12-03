const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const SalesTransaction = require('../models/SalesTransaction');

dotenv.config();

const run = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('\n📊 Deleting all transactions...');
    
    const result = await SalesTransaction.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} transactions`);

    console.log('\n✅ Transaction deletion complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

run();
