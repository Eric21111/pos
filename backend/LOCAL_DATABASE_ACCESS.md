# Accessing Local MongoDB Database in MongoDB Compass

## Yes, your local database is accessible via MongoDB Compass!

The local database is running on `mongodb://localhost:27017/pos-system` and can be accessed using MongoDB Compass.

## Connection Details

**Connection String:**
```
mongodb://localhost:27017/pos-system
```

**Or use the simplified connection:**
- **Host:** `localhost`
- **Port:** `27017`
- **Database:** `pos-system`

## Steps to Connect in MongoDB Compass

1. **Open MongoDB Compass**
2. **Click "New Connection"**
3. **Enter the connection string:**
   ```
   mongodb://localhost:27017/pos-system
   ```
   Or use the form:
   - Hostname: `localhost`
   - Port: `27017`
   - Authentication: None (if MongoDB is running without auth)
   - Default Database: `pos-system`

4. **Click "Connect"**

## Important Notes

### Prerequisites
- **MongoDB must be running locally** on your machine
- If you're using the provided script, run `start-mongodb.bat` first
- Or start MongoDB manually: `mongod`

### Database Name
- The local database name is: **`pos-system`**
- This matches your connection string: `mongodb://localhost:27017/pos-system`

### What You'll See
Once connected, you'll see all collections:
- `products` - All products
- `employees` - All employees
- `salestransactions` - All transactions
- `stockmovements` - All stock movement logs
- `carts` - Shopping carts

### Data in Local Database
- **When Online:** Data is written to both cloud (Atlas) and local
- **When Offline:** Data is written only to local
- **After Sync:** Local data is synced to cloud when connection is restored

## Troubleshooting

### Can't Connect?
1. **Check if MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # Or check if mongod process is running
   ```

2. **Verify the port:**
   - Default MongoDB port is `27017`
   - Check if another service is using this port

3. **Check connection string:**
   - Make sure it's exactly: `mongodb://localhost:27017/pos-system`
   - No authentication required if MongoDB is running locally without auth

### Database Not Showing?
- Make sure you've created at least one document in the database
- Empty databases might not appear in some MongoDB tools
- Try creating a test document first

## Viewing Data

Once connected, you can:
- ✅ View all collections
- ✅ Browse documents
- ✅ Edit documents directly
- ✅ Query data
- ✅ See indexes
- ✅ Monitor database performance

## Dual Database System

Remember:
- **Cloud Database (Atlas):** `pos_system` (with underscore)
- **Local Database (Compass):** `pos-system` (with hyphen)

Both databases work together:
- Online: Data written to both
- Offline: Data written to local only
- Sync: Local data synced to cloud when online

