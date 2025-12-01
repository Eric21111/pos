const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const dbManager = require('../config/databaseManager');

// Import all models
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const SalesTransaction = require('../models/SalesTransaction');
const StockMovement = require('../models/StockMovement');
const Archive = require('../models/Archive');
const Cart = require('../models/Cart');
const Discount = require('../models/Discount');
const VoidLog = require('../models/VoidLog');

dotenv.config();

// Collection mapping - using actual model names (Mongoose will pluralize automatically)
const collections = {
  'products': { model: Product, name: 'products' },
  'employees': { model: Employee, name: 'employees' },
  'transactions': { model: SalesTransaction, name: 'salestransactions' },
  'stock-movements': { model: StockMovement, name: 'stockmovements' },
  'archives': { model: Archive, name: 'archives' },
  'carts': { model: Cart, name: 'carts' },
  'discounts': { model: Discount, name: 'discounts' },
  'void-logs': { model: VoidLog, name: 'voidlogs' }
};

const deleteCollection = async (modelInfo, connection = null) => {
  try {
    // Use the model directly - Mongoose handles collection name
    const Model = modelInfo.model;
    const result = await Model.deleteMany({});
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    // If model doesn't work, try using collection name directly
    try {
      if (connection) {
        const db = connection.db;
        const collection = db.collection(modelInfo.name);
        const result = await collection.deleteMany({});
        return { success: true, deletedCount: result.deletedCount };
      } else {
        const db = mongoose.connection.db;
        const collection = db.collection(modelInfo.name);
        const result = await collection.deleteMany({});
        return { success: true, deletedCount: result.deletedCount };
      }
    } catch (collectionError) {
      return { success: false, error: error.message + ' | ' + collectionError.message };
    }
  }
};

const deleteAllData = async (includeLocal = false) => {
  try {
    console.log('🔄 Connecting to databases...');
    await connectDB();
    
    // Force connection to cloud database
    const cloudURI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || 'mongodb+srv://consolvestudio_db_user:XNt5ADLwcWKz8ta8@cys.biyeclf.mongodb.net/pos_system?appName=Cys';
    let cloudConnection = null;
    
    // Wait a bit for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = {
      cloud: {},
      local: {}
    };

    // Delete from cloud database (MongoDB Atlas)
    console.log('\n📊 Deleting data from CLOUD database (MongoDB Atlas)...');
    try {
      // Check if already connected to cloud
      const mainConnection = mongoose.connection;
      const isCloudConnected = mainConnection.readyState === 1 && mainConnection.host?.includes('mongodb.net');
      
      if (!isCloudConnected) {
        console.log('   Connecting to MongoDB Atlas...');
        // Force connect to cloud
        await dbManager.handleOnline();
        await new Promise(resolve => setTimeout(resolve, 2000));
        cloudConnection = mongoose.connection;
      } else {
        cloudConnection = mainConnection;
        console.log('   ✅ Already connected to MongoDB Atlas');
      }
      
      // Verify we're connected to cloud
      if (cloudConnection.readyState === 1 && cloudConnection.host?.includes('mongodb.net')) {
        for (const [key, modelInfo] of Object.entries(collections)) {
          console.log(`   Deleting ${key} (collection: ${modelInfo.name}) from cloud...`);
          const result = await deleteCollection(modelInfo, cloudConnection);
          if (result.success) {
            results.cloud[key] = { deletedCount: result.deletedCount };
            console.log(`   ✅ ${key}: ${result.deletedCount} documents deleted from cloud`);
          } else {
            results.cloud[key] = { error: result.error };
            console.log(`   ❌ ${key}: Error - ${result.error}`);
          }
        }
      } else {
        console.log('   ⚠️  Cloud database connection failed or not connected to cloud');
        results.cloud = { error: 'Not connected to cloud database' };
      }
    } catch (error) {
      console.log(`   ❌ Error connecting to cloud database: ${error.message}`);
      results.cloud = { error: error.message };
    }

    // Delete from local database if requested
    if (includeLocal) {
      console.log('\n📊 Deleting data from local database...');
      try {
        const localConnection = dbManager.getLocalConnection();
        if (localConnection && localConnection.readyState === 1) {
          for (const [key, modelInfo] of Object.entries(collections)) {
            console.log(`   Deleting ${key} (collection: ${modelInfo.name})...`);
            const result = await deleteCollection(modelInfo, localConnection);
            if (result.success) {
              results.local[key] = { deletedCount: result.deletedCount };
              console.log(`   ✅ ${key}: ${result.deletedCount} documents deleted`);
            } else {
              results.local[key] = { error: result.error };
              console.log(`   ❌ ${key}: Error - ${result.error}`);
            }
          }
        } else {
          console.log('   ⚠️  Local database not connected');
        }
      } catch (error) {
        console.log(`   ⚠️  Error accessing local database: ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
};

const deleteSpecificCollection = async (collectionName, includeLocal = false) => {
  try {
    if (!collections[collectionName]) {
      throw new Error(`Collection "${collectionName}" not found. Available: ${Object.keys(collections).join(', ')}`);
    }

    console.log(`🔄 Connecting to databases...`);
    await connectDB();
    
    // Force connection to cloud database
    const cloudURI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || 'mongodb+srv://consolvestudio_db_user:XNt5ADLwcWKz8ta8@cys.biyeclf.mongodb.net/pos_system?appName=Cys';
    let cloudConnection = null;
    
    // Wait a bit for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    const modelInfo = collections[collectionName];
    const results = {};

    // Delete from cloud database (MongoDB Atlas)
    console.log(`\n📊 Deleting ${collectionName} (collection: ${modelInfo.name}) from CLOUD database (MongoDB Atlas)...`);
    try {
      // Check if already connected to cloud
      const mainConnection = mongoose.connection;
      const isCloudConnected = mainConnection.readyState === 1 && mainConnection.host?.includes('mongodb.net');
      
      if (!isCloudConnected) {
        console.log('   Connecting to MongoDB Atlas...');
        // Force connect to cloud
        await dbManager.handleOnline();
        await new Promise(resolve => setTimeout(resolve, 2000));
        cloudConnection = mongoose.connection;
      } else {
        cloudConnection = mainConnection;
        console.log('   ✅ Already connected to MongoDB Atlas');
      }
      
      // Verify we're connected to cloud
      if (cloudConnection.readyState === 1 && cloudConnection.host?.includes('mongodb.net')) {
        const result = await deleteCollection(modelInfo, cloudConnection);
        if (result.success) {
          results.cloud = { deletedCount: result.deletedCount };
          console.log(`   ✅ ${collectionName}: ${result.deletedCount} documents deleted from cloud`);
        } else {
          results.cloud = { error: result.error };
          console.log(`   ❌ ${collectionName}: Error - ${result.error}`);
        }
      } else {
        console.log('   ⚠️  Cloud database connection failed or not connected to cloud');
        results.cloud = { error: 'Not connected to cloud database' };
      }
    } catch (error) {
      console.log(`   ❌ Error connecting to cloud database: ${error.message}`);
      results.cloud = { error: error.message };
    }

    // Delete from local database if requested
    if (includeLocal) {
      console.log(`\n📊 Deleting ${collectionName} (collection: ${modelInfo.name}) from local database...`);
      try {
        const localConnection = dbManager.getLocalConnection();
        if (localConnection && localConnection.readyState === 1) {
          const result = await deleteCollection(modelInfo, localConnection);
          if (result.success) {
            results.local = { deletedCount: result.deletedCount };
            console.log(`   ✅ ${collectionName}: ${result.deletedCount} documents deleted`);
          } else {
            results.local = { error: result.error };
            console.log(`   ❌ ${collectionName}: Error - ${result.error}`);
          }
        } else {
          console.log('   ⚠️  Local database not connected');
        }
      } catch (error) {
        console.log(`   ⚠️  Error accessing local database: ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  const collectionName = args.find(arg => !arg.startsWith('--'));
  const includeLocal = args.includes('--local') || args.includes('-l');
  const skipConfirm = args.includes('--yes') || args.includes('-y');

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         DATABASE DATA DELETION SCRIPT                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (!skipConfirm) {
    console.log('⚠️  WARNING: This will permanently delete data from the database!');
    console.log('\nAvailable collections:');
    Object.keys(collections).forEach(name => {
      console.log(`   - ${name}`);
    });
    
    if (collectionName) {
      console.log(`\n📌 Target: ${collectionName} collection`);
    } else {
      console.log(`\n📌 Target: ALL collections`);
    }
    
    if (includeLocal) {
      console.log('📌 Scope: Cloud database (MongoDB Atlas) + Local database');
    } else {
      console.log('📌 Scope: Cloud database (MongoDB Atlas) only');
    }
    
    console.log('\n⚠️  This action cannot be undone!');
    console.log('\nTo proceed, run with --yes or -y flag:');
    if (collectionName) {
      console.log(`   node deleteDatabaseData.js ${collectionName} --yes`);
    } else {
      console.log('   node deleteDatabaseData.js --yes');
    }
    if (includeLocal) {
      console.log('   (add --local to also delete from local database)');
    }
    process.exit(0);
  }

  try {
    let results;
    
    if (collectionName) {
      results = await deleteSpecificCollection(collectionName, includeLocal);
    } else {
      results = await deleteAllData(includeLocal);
    }

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    DELETION SUMMARY                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    if (results.cloud) {
      console.log('Cloud Database (MongoDB Atlas):');
      if (collectionName) {
        if (results.cloud.deletedCount !== undefined) {
          console.log(`   ${collectionName}: ${results.cloud.deletedCount} documents deleted`);
        } else {
          console.log(`   ${collectionName}: Error - ${results.cloud.error}`);
        }
      } else {
        Object.entries(results.cloud).forEach(([name, result]) => {
          if (result.deletedCount !== undefined) {
            console.log(`   ${name}: ${result.deletedCount} documents deleted`);
          } else {
            console.log(`   ${name}: Error - ${result.error}`);
          }
        });
      }
    }

    if (results.local) {
      console.log('\nLocal Database:');
      if (collectionName) {
        if (results.local.deletedCount !== undefined) {
          console.log(`   ${collectionName}: ${results.local.deletedCount} documents deleted`);
        } else {
          console.log(`   ${collectionName}: Error - ${results.local.error}`);
        }
      } else {
        Object.entries(results.local).forEach(([name, result]) => {
          if (result.deletedCount !== undefined) {
            console.log(`   ${name}: ${result.deletedCount} documents deleted`);
          } else {
            console.log(`   ${name}: Error - ${result.error}`);
          }
        });
      }
    }

    console.log('\n✅ Deletion process completed!');
    
    // Close connections
    await mongoose.connection.close();
    const localConnection = dbManager.getLocalConnection();
    if (localConnection) {
      await localConnection.close();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { deleteAllData, deleteSpecificCollection };


