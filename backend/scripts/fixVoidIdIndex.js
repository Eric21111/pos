const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const dbManager = require('../config/databaseManager');

dotenv.config();

const fixVoidIdIndex = async () => {
  try {
    console.log('🔄 Connecting to databases...');
    await connectDB();
    
    // Wait for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const SalesTransactionModule = require('../models/SalesTransaction');
    const schema = SalesTransactionModule.schema;
    
    // Fix cloud database
    if (mongoose.connection.readyState === 1) {
      console.log('\n📊 Fixing CLOUD database...');
      try {
        const db = mongoose.connection.db;
        const collection = db.collection('salestransactions');
        
        // Remove voidId field from non-void transactions
        console.log('   Removing voidId from non-void transactions...');
        const result = await collection.updateMany(
          { 
            $and: [
              { paymentMethod: { $ne: 'void' } },
              { status: { $ne: 'Voided' } },
              { voidId: null }
            ]
          },
          { $unset: { voidId: "" } }
        );
        console.log(`   ✅ Updated ${result.modifiedCount} documents`);
        
        // Drop and recreate the voidId index
        console.log('   Dropping voidId index...');
        try {
          await collection.dropIndex('voidId_1');
          console.log('   ✅ Index dropped');
        } catch (dropError) {
          if (dropError.code === 27) {
            console.log('   ℹ️  Index does not exist, skipping drop');
          } else {
            throw dropError;
          }
        }
        
        // Recreate the index
        console.log('   Recreating voidId index...');
        await collection.createIndex(
          { voidId: 1 },
          { 
            unique: true, 
            sparse: true,
            name: 'voidId_1'
          }
        );
        console.log('   ✅ Index recreated');
        
        console.log('   ✅ Cloud database fixed!');
      } catch (cloudError) {
        console.error('   ❌ Error fixing cloud database:', cloudError.message);
      }
    }
    
    // Fix local database
    console.log('\n📊 Fixing LOCAL database...');
    try {
      let localConnection = dbManager.getLocalConnection();
      if (!localConnection || localConnection.readyState !== 1) {
        await dbManager.connectLocalForSync();
        localConnection = dbManager.getLocalConnection();
      }
      
      if (localConnection && localConnection.readyState === 1) {
        const db = localConnection.db;
        const collection = db.collection('salestransactions');
        
        // Remove voidId field from non-void transactions
        console.log('   Removing voidId from non-void transactions...');
        const result = await collection.updateMany(
          { 
            $and: [
              { paymentMethod: { $ne: 'void' } },
              { status: { $ne: 'Voided' } },
              { voidId: null }
            ]
          },
          { $unset: { voidId: "" } }
        );
        console.log(`   ✅ Updated ${result.modifiedCount} documents`);
        
        // Drop and recreate the voidId index
        console.log('   Dropping voidId index...');
        try {
          await collection.dropIndex('voidId_1');
          console.log('   ✅ Index dropped');
        } catch (dropError) {
          if (dropError.code === 27) {
            console.log('   ℹ️  Index does not exist, skipping drop');
          } else {
            throw dropError;
          }
        }
        
        // Recreate the index
        console.log('   Recreating voidId index...');
        await collection.createIndex(
          { voidId: 1 },
          { 
            unique: true, 
            sparse: true,
            name: 'voidId_1'
          }
        );
        console.log('   ✅ Index recreated');
        
        console.log('   ✅ Local database fixed!');
      } else {
        console.log('   ⚠️  Local database not available');
      }
    } catch (localError) {
      console.error('   ❌ Error fixing local database:', localError.message);
    }
    
    console.log('\n✅ Fix completed!');
    console.log('\nYou can now try saving transactions again.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixVoidIdIndex();

