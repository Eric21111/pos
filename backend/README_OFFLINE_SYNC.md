# Offline-First Database System

This system implements a hybrid database architecture that automatically switches between MongoDB Atlas (cloud) and local MongoDB based on network connectivity.

## Features

1. **Automatic Database Switching**
   - When online: Uses MongoDB Atlas (cloud)
   - When offline: Uses local MongoDB
   - Automatic detection and switching

2. **Dual Write (When Online)**
   - All writes go to both cloud and local databases
   - Ensures data redundancy

3. **Automatic Sync**
   - When connection is restored, automatically syncs local data to cloud
   - Syncs all collections: Products, Employees, Transactions, Stock Movements, Carts

4. **Conflict Resolution**
   - Uses timestamp-based conflict resolution
   - Newer data takes precedence

## Setup

### 1. Environment Variables

Add to your `.env` file:

```env
# MongoDB Atlas (Cloud) Connection
# Note: Add your database name after the cluster URL (e.g., /pos_system)
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/pos_system?retryWrites=true&w=majority

# MongoDB Local Connection
MONGODB_LOCAL_URI=mongodb://localhost:27017/pos-system

# Fallback (optional)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pos_system?retryWrites=true&w=majority
```

**Important Notes:**
- The database name should be included in the connection string (e.g., `/pos_system` after the cluster URL)
- If your Atlas URI ends with `/?appName=...`, add the database name before the `?`: `/pos_system?appName=...`
- Both local and cloud should ideally use the same database name for consistency

### 2. Local MongoDB Setup

Make sure MongoDB is running locally:

```bash
# Windows
mongod

# Or use the provided script
start-mongodb.bat
```

### 3. Database Manager

The `databaseManager.js` automatically:
- Connects to cloud when online
- Falls back to local when offline
- Monitors network status every 10 seconds
- Triggers sync when connection is restored

## How It Works

### Network Detection

The system checks network connectivity by:
- Attempting to connect to a reliable server (Google)
- Checking connection status every 10 seconds
- Automatically switching databases based on connectivity

### Data Flow

1. **Online Mode:**
   - All reads/writes go to MongoDB Atlas
   - Simultaneously writes to local MongoDB (dual write)
   - Local database acts as backup

2. **Offline Mode:**
   - All reads/writes go to local MongoDB
   - Operations continue normally
   - Data is queued for sync

3. **Sync Process:**
   - When connection is restored:
     - Detects all local documents
     - Compares timestamps with cloud
     - Uploads new documents
     - Updates documents if local is newer

## API Endpoints

### Manual Sync

```POST /api/sync```

Manually trigger a sync from local to cloud.

## Updating Controllers

To make controllers work with the dual database system:

1. Import the model helper:
```javascript
const { getProductModel } = require('../utils/getModel');
```

2. Get model in each function:
```javascript
exports.getAllProducts = async (req, res) => {
  try {
    const Product = getProductModel(req);
    const products = await Product.find();
    // ... rest of code
  }
}
```

3. The middleware automatically handles dual writes when online.

## Testing

1. **Test Online Mode:**
   - Ensure internet connection
   - Make API calls - should use cloud database
   - Check local database - should also have data

2. **Test Offline Mode:**
   - Disconnect internet
   - Make API calls - should use local database
   - Operations should work normally

3. **Test Sync:**
   - Make changes while offline
   - Reconnect internet
   - Wait for automatic sync (or trigger manually)
   - Verify data appears in cloud database

## Troubleshooting

### Local MongoDB Not Connecting

- Ensure MongoDB is running: `mongod` or use `start-mongodb.bat`
- Check connection string in `.env`
- Verify MongoDB is accessible on port 27017

### Sync Not Working

- Check network connectivity
- Verify both cloud and local connections are active
- Check console logs for sync errors
- Manually trigger sync: `POST /api/sync`

### Data Conflicts

- System uses timestamp-based resolution
- Newer data always wins
- Check `updatedAt` fields for conflict resolution

