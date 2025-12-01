const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');

dotenv.config();

const OWNER_EMAIL = 'owner@pos.local';

const run = async () => {
  try {
    await connectDB();

    // Try to find owner in cloud database first
    let owner = null;
    try {
      owner = await Employee.findOne({ email: OWNER_EMAIL, role: 'Owner' });
    } catch (error) {
      console.log('Cloud database not available, checking local...');
    }

    // If not found in cloud, check local database
    if (!owner) {
      const dbManager = require('../config/databaseManager');
      const localConnection = dbManager.getLocalConnection();
      
      if (localConnection && localConnection.readyState === 1) {
        const LocalEmployee = localConnection.model('Employee', Employee.schema);
        owner = await LocalEmployee.findOne({ email: OWNER_EMAIL, role: 'Owner' });
      }
    }

    if (!owner) {
      console.log('❌ Owner account not found in database.');
      console.log('💡 Run: node scripts/createOwner.js to create owner account');
      process.exit(1);
    }

    console.log('\n✅ Owner Account Found:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name: ${owner.name || owner.firstName || 'Owner'}`);
    console.log(`Email: ${owner.email}`);
    console.log(`Role: ${owner.role}`);
    console.log(`Status: ${owner.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📌 PIN Information:');
    console.log('The PIN is hashed in the database for security.');
    console.log('You cannot retrieve the original PIN, but you can:');
    console.log('1. Try common PINs: 123456, 000000, 111111, etc.');
    console.log('2. Reset the PIN using: node scripts/createOwner.js');
    console.log('   (This will set PIN to: 123456)');
    console.log('3. Or reset via web interface');
    console.log('\n💡 To test if a PIN works, try logging in with it.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();

