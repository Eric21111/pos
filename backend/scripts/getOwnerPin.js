const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Employee = require('../models/Employee');

dotenv.config();

const OWNER_EMAIL = 'owner@pos.local';

const run = async () => {
  try {
    await connectDB();

    const owner = await Employee.findOne({ email: OWNER_EMAIL, role: 'Owner' });

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

