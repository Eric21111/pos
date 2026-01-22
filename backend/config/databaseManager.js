const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-system';
  }

  async initialize() {
    try {
      await this.connect();
    } catch (error) {
      console.error('Failed to initialize database:', error.message);
      throw error;
    }
  }

  async connect() {
    try {
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
      }

      console.log('Connecting to MongoDB...');
      await mongoose.connect(this.mongoURI);

      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
      this.connection = mongoose.connection;
      return mongoose.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;