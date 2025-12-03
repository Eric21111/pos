const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const VoidLog = require('../models/VoidLog');

dotenv.config();

const run = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('\n📊 Fixing VoidLog indexes...');

    // Drop the existing voidId index if it exists
    try {
      await VoidLog.collection.dropIndex('voidId_1');
      console.log('✅ Dropped existing voidId index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ voidId index does not exist, skipping drop');
      } else {
        console.error('⚠️ Error dropping index:', error.message);
      }
    }

    // Create a new unique index on voidId
    try {
      await VoidLog.collection.createIndex({ voidId: 1 }, { unique: true, sparse: true });
      console.log('✅ Created new unique voidId index');
    } catch (error) {
      console.error('❌ Error creating index:', error.message);
    }

    console.log('\n✅ VoidLog index fix complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

run();
