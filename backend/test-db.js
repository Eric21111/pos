const mongoose = require('mongoose');

const cloudURI = 'mongodb+srv://libradillaeric116_db_user:jtzUYlu73JjrvkMz@expense-tracker.m9uzs1f.mongodb.net/pos-system?retryWrites=true&w=majority&appName=expense-tracker';

async function testConnection() {
    console.log('Testing connection to:', cloudURI);
    try {
        await mongoose.connect(cloudURI);
        console.log('Successfully connected to Cloud DB!');
        await mongoose.connection.close();
    } catch (error) {
        console.error('Connection failed:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testConnection();
