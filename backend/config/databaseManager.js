const mongoose = require('mongoose');
const https = require('https');

class DatabaseManager {
  constructor() {
    this.mainConnection = null; 
    this.localConnection = null; 
    this.isOnline = true;
    this.syncInProgress = false;
    this.syncQueue = [];
    
    
    this.cloudURI = process.env.MONGODB_ATLAS_URI || 'mongodb+srv://consolvestudio_db_user:XNt5ADLwcWKz8ta8@cys.biyeclf.mongodb.net/pos_system?appName=Cys';
    this.localURI = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/pos-system';
    
  
    if (!this.cloudURI) {
      console.warn('Warning: MONGODB_ATLAS_URI or MONGODB_URI not set. Cloud database will not be available.');
      this.isOnline = false;
    }
    

    this.setupNetworkDetection();
  }

  setupNetworkDetection() {
  
    setInterval(() => {
      this.checkNetworkStatus();
    }, 10000); 
  }

  async checkNetworkStatus() {
    return new Promise((resolve) => {
     
      if (mongoose.connection.readyState === 1 && mongoose.connection.host?.includes('mongodb.net')) {
        if (!this.isOnline) {
          this.isOnline = true;
          console.log('Network: Online (detected via MongoDB Atlas connection)');
        }
        resolve(true);
        return;
      }

      const options = {
        hostname: 'www.google.com',
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: 5000 
      };

      const req = https.request(options, (res) => {
        if (!this.isOnline) {
          console.log('Network: Online detected');
          this.handleOnline();
        }
        resolve(true);
      });

      req.on('error', (error) => {
       
        if (this.isOnline && mongoose.connection.readyState !== 1) {
          console.log('Network: Offline detected (and not connected to cloud)');
          this.handleOffline();
        } else if (this.isOnline && mongoose.connection.readyState === 1 && mongoose.connection.host?.includes('mongodb.net')) {
          // We're connected to cloud, so we're still online despite ping failure
          console.log('Network: Ping failed but MongoDB Atlas connected - staying online');
        }
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        // Only switch to offline if we're not connected to cloud
        if (this.isOnline && mongoose.connection.readyState !== 1) {
          console.log('Network: Timeout (and not connected to cloud)');
          this.handleOffline();
        } else if (this.isOnline && mongoose.connection.readyState === 1 && mongoose.connection.host?.includes('mongodb.net')) {
          // We're connected to cloud, so we're still online despite timeout
          console.log('Network: Ping timeout but MongoDB Atlas connected - staying online');
        }
        resolve(false);
      });

      req.end();
    });
  }

  async handleOnline() {
    if (this.isOnline && mongoose.connection.readyState === 1 && mongoose.connection.host?.includes('mongodb.net')) {
      // Already online and connected to cloud
      return;
    }
    
    console.log('Switching to cloud database...');
    this.isOnline = true;
    
    
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 99) {
      await this.connectCloud();
    } else if (mongoose.connection.host?.includes('mongodb.net')) {
     
      this.isOnline = true;
    } else {
     
      await mongoose.connection.close();
      await this.connectCloud();
    }
    
    // Sync local data to cloud (only if successfully connected)
    if (mongoose.connection.readyState === 1 && mongoose.connection.host?.includes('mongodb.net')) {
      setTimeout(() => this.syncLocalToCloud(), 2000); // Delay sync to ensure connection is stable
    }
  }

  async handleOffline() {
    if (!this.isOnline) return; // Already offline
    
    console.log('Switching to local database...');
    this.isOnline = false;
    
    // Switch main connection to local
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 99) {
      await this.connectLocal();
    } else {
      // Close current connection and reconnect to local
      await mongoose.connection.close();
      await this.connectLocal();
    }
  }

  async connectCloud() {
    try {
      // Check if cloud URI is configured
      if (!this.cloudURI) {
        console.warn('MongoDB Atlas URI not configured. Skipping cloud connection.');
        await this.handleOffline();
        return null;
      }

      if (mongoose.connection.readyState === 1 && mongoose.connection.host?.includes('mongodb.net')) {
        // Already connected to cloud, mark as online
        this.isOnline = true;
        return mongoose.connection;
      }

      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(this.cloudURI);

      console.log(`MongoDB Atlas Connected: ${mongoose.connection.host}`);
      this.mainConnection = mongoose.connection;
      // Successfully connected to cloud = we're online
      this.isOnline = true;
      return mongoose.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB Atlas:', error.message);
      // Fallback to local
      if (!this.localConnection || this.localConnection.readyState !== 1) {
        await this.handleOffline();
      }
      return null;
    }
  }

  async connectLocal() {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.host === 'localhost') {
        return mongoose.connection;
      }

      console.log('Connecting to local MongoDB...');
      await mongoose.connect(this.localURI);

      console.log(`Local MongoDB Connected: ${mongoose.connection.host}`);
      this.mainConnection = mongoose.connection;
      return mongoose.connection;
    } catch (error) {
      console.error('Failed to connect to local MongoDB:', error.message);
      throw error;
    }
  }

  // Maintain separate local connection for sync
  async connectLocalForSync() {
    try {
      if (this.localConnection && this.localConnection.readyState === 1) {
        console.log('Local connection already established for sync');
        return this.localConnection;
      }

      console.log('Connecting to local MongoDB for sync...');
      console.log('Local URI:', this.localURI);
      this.localConnection = mongoose.createConnection(this.localURI);

      await new Promise((resolve, reject) => {
        this.localConnection.once('connected', () => {
          console.log(`Local MongoDB (Sync) Connected: ${this.localConnection.host}`);
          console.log(`Local Database Name: ${this.localConnection.name}`);
          resolve();
        });
        this.localConnection.once('error', (err) => {
          console.error('Local MongoDB (Sync) connection error:', err.message);
          reject(err);
        });
        
        setTimeout(() => {
          if (this.localConnection.readyState !== 1) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });

      return this.localConnection;
    } catch (error) {
      console.error('Failed to connect to local MongoDB for sync:', error.message);
      return null;
    }
  }

  async initialize() {
    try {
      // Try to connect to cloud first if URI is configured
      if (this.cloudURI) {
        await this.connectCloud();
        this.mainConnection = mongoose.connection;
        this.isOnline = true;
      } else {
        // No cloud URI configured, start in offline mode
        console.log('No cloud URI configured. Starting in offline mode with local database.');
        await this.handleOffline();
      }
      
      // Also connect to local separately (for sync purposes)
      try {
        await this.connectLocalForSync();
      } catch (error) {
        console.warn('Local MongoDB not available for sync, sync will be skipped:', error.message);
      }
    } catch (error) {
      console.warn('Connection failed, using local database:', error.message);
      await this.handleOffline();
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  getCloudConnection() {
    // Return main connection if it's cloud, otherwise return null
    if (this.isOnline && mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    return null;
  }

  getLocalConnection() {
    // Return separate local connection for sync
    return this.localConnection;
  }

  isConnected() {
    return this.isOnline;
  }

  async syncLocalToCloud() {
    if (this.syncInProgress) {
      console.log('Sync already in progress...');
      return;
    }

    if (!this.isOnline) {
      console.log('Cannot sync: System is offline');
      return;
    }

    // Ensure local connection exists
    if (!this.localConnection || this.localConnection.readyState !== 1) {
      try {
        await this.connectLocalForSync();
      } catch (error) {
        console.log('Local database not available for sync:', error.message);
        return;
      }
    }

    if (mongoose.connection.readyState !== 1) {
      console.log('Cloud database not available for sync');
      return;
    }

    this.syncInProgress = true;
    console.log('Starting sync from local to cloud...');

    try {
      const syncService = require('../services/syncService');
      await syncService.syncAllData();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error during sync:', error.message);
    } finally {
      this.syncInProgress = false;
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;

