# How Sync Works - No Hosting Required! 🚀

## Quick Answer: **You DON'T need to host your backend separately!**

The sync runs on **your local backend** when it's running. Here's how it works:

## When Sync Happens

### ✅ Automatic Sync (When Backend is Running)

1. **When you come back online:**
   - Backend detects internet connection restored
   - Automatically syncs local data to cloud
   - Happens automatically every time connection is restored

2. **On startup (if online):**
   - When you start the backend server
   - If system is online, it checks for pending sync
   - Syncs any data that was created while offline

### ⚠️ Important Notes

- **Backend must be RUNNING** for sync to happen
- If backend is not running when you come back online, sync won't happen automatically
- You can manually trigger sync anytime using the API endpoint

## How to Use Sync

### Option 1: Automatic (Recommended)
Just keep your backend running:
```bash
npm run dev
# or
npm start
```

The system will:
- ✅ Automatically detect when you go offline → switch to local DB
- ✅ Automatically detect when you come back online → sync to cloud
- ✅ Check every 10 seconds for network status

### Option 2: Manual Sync
If you want to trigger sync manually:

**Using API:**
```bash
POST http://localhost:5000/api/sync
```

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/sync
```

## Common Scenarios

### Scenario 1: Working Offline
1. Internet disconnects
2. System automatically switches to local MongoDB
3. You continue working normally
4. Data is saved to local database

### Scenario 2: Coming Back Online (Backend Running)
1. Internet reconnects
2. System detects connection (within 10 seconds)
3. **Automatically syncs** all local data to cloud
4. You see: "Starting sync from local to cloud..." in console

### Scenario 3: Starting Backend After Being Offline
1. You worked offline, then closed backend
2. You reconnect to internet
3. You start backend: `npm run dev`
4. System checks if online → **syncs on startup**
5. All offline data is synced to cloud

### Scenario 4: Backend Not Running When Coming Online
1. You worked offline
2. You closed backend
3. Internet reconnects (but backend is off)
4. **No automatic sync** (backend must be running)
5. When you start backend later → sync happens on startup

## Do You Need to Host?

### ❌ NO - For Most Use Cases
- Run backend locally on your machine
- Sync happens automatically when backend is running
- Perfect for single-location POS systems

### ✅ YES - Only If You Want:
- **24/7 automatic sync** (even when your computer is off)
- **Multiple locations** accessing the same cloud database
- **Always-on availability**

## Hosting Options (If You Want)

If you decide to host:

1. **Free Options:**
   - Railway.app
   - Render.com
   - Fly.io
   - Heroku (limited free tier)

2. **Paid Options:**
   - AWS EC2
   - DigitalOcean
   - Azure
   - Google Cloud

3. **Self-Hosted:**
   - Raspberry Pi (at your location)
   - Old computer running 24/7
   - VPS (Virtual Private Server)

## Troubleshooting Sync

### Sync Not Happening?

1. **Check if backend is running:**
   ```bash
   # Should see: "Server is running on port 5000"
   ```

2. **Check network status:**
   - Visit: `http://localhost:5000`
   - Should show: `"online": true` or `"online": false`

3. **Check console logs:**
   - Look for: "Switching to cloud database..."
   - Look for: "Starting sync from local to cloud..."

4. **Manual sync test:**
   ```bash
   curl -X POST http://localhost:5000/api/sync
   ```

### Sync Failing?

1. **Check MongoDB Atlas connection:**
   - Verify `MONGODB_ATLAS_URI` in `.env`
   - Test connection in MongoDB Compass

2. **Check local MongoDB:**
   - Ensure MongoDB is running: `mongod`
   - Verify `MONGODB_LOCAL_URI` in `.env`

3. **Check console for errors:**
   - Look for connection errors
   - Look for sync errors

## Summary

✅ **No hosting required** - works perfectly locally  
✅ **Automatic sync** - when backend is running  
✅ **Manual sync available** - via API endpoint  
✅ **Startup sync** - checks and syncs on backend start  

Just keep your backend running, and sync will happen automatically! 🎉

