# Database Storage Rules

## Overview

This document outlines which data is stored in which databases (cloud vs local).

## Storage Rules

### ✅ Stored in BOTH Databases (Cloud + Local)

When online, the following data is written to both MongoDB Atlas (cloud) and local MongoDB:

1. **Products** - All product data
2. **Transactions** - All sales transactions
3. **Stock Movements** - All stock movement logs
4. **Owner Accounts** - Only employees with role = "Owner"

### ❌ Stored ONLY in Local Database

The following data is **NEVER** stored in cloud, only in local MongoDB:

1. **Carts** - Shopping cart data (temporary, user-specific)
2. **Non-Owner Employee Accounts** - All employees except Owner role
   - Sales Clerk
   - Manager
   - Cashier
   - Supervisor

## Implementation Details

### Carts
- **Controller:** `cartController.js`
- **Storage:** Always uses local connection only
- **Sync:** Carts are NOT synced to cloud
- **Reason:** Carts are temporary and user-specific, no need for cloud storage

### Employee Accounts
- **Controller:** `employeeController.js`
- **Owner Accounts:**
  - Stored in both cloud and local when online
  - Synced to cloud
- **Non-Owner Accounts:**
  - Stored ONLY in local database
  - NOT synced to cloud
  - Reason: Employee accounts are location-specific

### Products, Transactions, Stock Movements
- **Storage:** Both databases when online
- **Sync:** Automatically synced when connection restored
- **Display:** Shows merged data from both sources

## How It Works

### When Online:
- Products → Cloud + Local ✅
- Transactions → Cloud + Local ✅
- Stock Movements → Cloud + Local ✅
- Owner Accounts → Cloud + Local ✅
- Non-Owner Accounts → Local only ❌
- Carts → Local only ❌

### When Offline:
- All data → Local only
- When back online → Syncs to cloud (except carts and non-owner accounts)

## Accessing Local Database

The local database is accessible via MongoDB Compass:

**Connection String:**
```
mongodb://localhost:27017/pos-system
```

**Database Name:** `pos-system`

## Verification

To verify the storage rules are working:

1. **Check Carts:**
   - Create a cart → Should only appear in local database
   - Check MongoDB Compass → Should see cart in `pos-system` database
   - Check MongoDB Atlas → Should NOT see cart

2. **Check Non-Owner Employees:**
   - Create employee with role "Sales Clerk" → Should only be in local
   - Create employee with role "Owner" → Should be in both databases

3. **Check Products/Transactions:**
   - Create product/transaction → Should be in both databases
   - Check both MongoDB Compass and MongoDB Atlas

