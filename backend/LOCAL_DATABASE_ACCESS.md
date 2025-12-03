# Local Database Access

This document explains how to access and manage the local MongoDB database.

## Prerequisites

- MongoDB installed locally
- MongoDB running on default port (27017)

## Starting MongoDB

### Windows
```bash
mongod
```

Or use the provided batch file:
```bash
start-mongodb.bat
```

### Mac/Linux
```bash
mongod --dbpath /data/db
```

## Connecting to Database

### Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `pos_system`

### Using MongoDB Shell

```bash
mongosh
use pos_system
```

## Common Commands

### View Collections
```javascript
show collections
```

### View Products
```javascript
db.products.find().pretty()
```

### View Employees
```javascript
db.employees.find().pretty()
```

### View Transactions
```javascript
db.salestransactions.find().sort({createdAt: -1}).limit(10).pretty()
```

### Count Documents
```javascript
db.products.countDocuments()
db.employees.countDocuments()
db.salestransactions.countDocuments()
```

## Backup Database

```bash
mongodump --db pos_system --out ./backup
```

## Restore Database

```bash
mongorestore --db pos_system ./backup/pos_system
```

## Environment Configuration

The database connection is configured in `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/pos_system
```

## Troubleshooting

### MongoDB Not Starting

1. Check if port 27017 is available
2. Ensure data directory exists
3. Check MongoDB logs for errors

### Connection Refused

1. Verify MongoDB is running: `mongosh`
2. Check firewall settings
3. Verify connection string in `.env`
