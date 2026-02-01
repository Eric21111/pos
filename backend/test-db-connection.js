require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    const dbManager = require('./config/databaseManager');
    
    console.log('\n========================================');
    console.log('  DATABASE CONNECTION TEST');
    console.log('========================================\n');
    
    await dbManager.connect();
    
    console.log('\n✓ Connection Successful!');
    console.log('\n--- Connection Details ---');
    console.log('Mode:', dbManager.getCurrentMode());
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    
    console.log('\n--- Collections & Data ---');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('No collections found (empty database)');
    } else {
      for (const coll of collections) {
        const count = await mongoose.connection.db.collection(coll.name).countDocuments();
        console.log(`${coll.name}: ${count} documents`);
      }
    }
    
    console.log('\n========================================\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Connection Failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testConnection();
