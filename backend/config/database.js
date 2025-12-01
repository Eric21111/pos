const dbManager = require('./databaseManager');

const connectDB = async () => {
  try {
    await dbManager.initialize();
    console.log('Database Manager initialized');
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    // Don't exit, try to continue with local database
    try {
      await dbManager.handleOffline();
      console.log('Falling back to local database');
    } catch (localError) {
      console.error(`Failed to connect to local database: ${localError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

