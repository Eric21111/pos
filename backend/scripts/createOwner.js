const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Employee = require('../models/Employee');

dotenv.config();

const OWNER_EMAIL = 'owner@pos.local';

const run = async () => {
  try {
    await connectDB();

    const existing = await Employee.findOne({ email: OWNER_EMAIL });
    if (existing) {
      console.log('✅ Owner account already exists. Updating credentials...');
      existing.pin = '1234';
      existing.requiresPinReset = false;
      existing.role = 'Owner';
      existing.status = 'Active';
      if (!existing.firstName) {
        existing.firstName = 'Owner';
      }
      if (!existing.lastName) {
        existing.lastName = '';
      }
      existing.name = `${existing.firstName} ${existing.lastName}`.trim() || 'Owner';
      existing.permissions = {
        posTerminal: true,
        inventory: true,
        viewTransactions: true,
        generateReports: true
      };
      existing.dateJoinedActual = existing.dateJoinedActual || new Date();
      await existing.save();
      console.log('🔐 Owner PIN reset to 1234 (hashed in DB).');
    } else {
      console.log('ℹ️ Owner account not found. Creating new one...');
      await Employee.create({
        firstName: 'Owner',
        lastName: '',
        name: 'Owner',
        contactNo: '+630000000000',
        email: OWNER_EMAIL,
        role: 'Owner',
        pin: '1234',
        status: 'Active',
        profileImage: '',
        permissions: {
          posTerminal: true,
          inventory: true,
          viewTransactions: true,
          generateReports: true
        },
        requiresPinReset: false,
        dateJoinedActual: new Date()
      });
      console.log('✅ Owner account created with PIN 1234.');
    }
  } catch (error) {
    console.error('❌ Failed to create/update owner account:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();

