# Mobile App API Setup Guide

This guide explains how to connect the mobile app to the backend API.

## Connection Options

The mobile app can connect in two ways:

### Option 1: Local Backend (Offline Access) ✅ CURRENT SETUP

Connect to backend running on your computer. Uses local MongoDB database.

**Benefits:**
- ✅ Works offline (no internet required)
- ✅ Fast (no network latency)
- ✅ Uses local database
- ✅ Perfect for development and offline use

**See:** `mobile/LOCAL_SETUP.md` for detailed setup instructions.

**Quick steps:**
1. Find your computer's IP address
2. Update `mobile/config/api.js` with your IP
3. Start local MongoDB
4. Start backend: `cd backend && npm start`
5. Mobile app connects to local backend → local database

### Option 2: Cloud Backend (Online Only)

Deploy backend to Railway, Render, etc. Connects to MongoDB Atlas.

**Benefits:**
- ✅ Works from anywhere
- ✅ No computer IP needed
- ✅ Always online
- ✅ Better for production

**See:** `backend/DEPLOYMENT_GUIDE.md` for deployment instructions.

## Backend Configuration

The backend is already configured with CORS enabled and will automatically connect to **MongoDB Atlas (cloud database)** when online. The owner account is stored in the cloud database.

### Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. **Make sure MongoDB Atlas connection is configured** in your `.env` file or the default connection string in `databaseManager.js` is correct.

4. Start the backend server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:5000` by default.
   
   **Check the console** - you should see:
   - "Database Manager initialized"
   - "Network: Online" (if connected to cloud)
   - "Server is running on port 5000"

## Mobile App Configuration

### ✅ For Cloud Deployment (Recommended)

1. **Deploy your backend** (see `backend/DEPLOYMENT_GUIDE.md`)
2. **Update `mobile/config/api.js`**:
   ```javascript
   const BACKEND_URL = 'https://your-backend.railway.app'; // Your deployed backend URL
   ```
3. **Done!** The mobile app will connect to your cloud backend, which connects to MongoDB Atlas.

### ⚠️ For Local Development Only (Not Recommended)

**Only use this for local testing. For production, deploy to cloud.**

**Expo Go cannot use `localhost`** - you would need your computer's IP address.

#### Step 1: Find Your Computer's IP Address

**Windows:**
1. Open Command Prompt (Win + R, type `cmd`, press Enter)
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet)
4. Example: `192.168.1.100`

**Mac/Linux:**
1. Open Terminal
2. Type: `ifconfig` or `ip addr`
3. Look for your network interface (usually `en0` for Wi-Fi or `eth0` for Ethernet)
4. Find the `inet` address (not `127.0.0.1`)
5. Example: `192.168.1.100`

#### Step 2: Update API Configuration

1. Open `mobile/config/api.js`
2. Replace `YOUR_COMPUTER_IP` with your actual IP address:

   ```javascript
   const YOUR_COMPUTER_IP = '192.168.1.100'; // ⚠️ Your actual IP
   
   const API_BASE_URL = __DEV__ 
     ? `http://${YOUR_COMPUTER_IP}:5000`
     : 'https://your-production-api.com';
   ```

#### Step 3: Verify Setup

1. **Same Wi-Fi Network**: Make sure your phone and computer are on the same Wi-Fi network
2. **Firewall**: Allow incoming connections on port 5000 (Windows Firewall may prompt you)
3. **Backend Running**: Make sure your backend server is running and connected to MongoDB Atlas

#### Step 4: Test Connection

1. Start your backend: `cd backend && npm start`
2. Check backend console - should show "Network: Online" if connected to cloud
3. Start Expo Go app
4. Try logging in with the owner account PIN

### For Development (Emulator/Simulator Only)

If you're using an Android emulator or iOS simulator (NOT Expo Go), you can use `localhost`:

1. Open `mobile/config/api.js`
2. Use:
   ```javascript
   const API_BASE_URL = __DEV__ 
     ? 'http://localhost:5000'
     : 'https://your-production-api.com';
   ```

### For Production

When deploying to production, update the production URL in `mobile/config/api.js`:

```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000'
  : 'https://your-actual-backend-url.com';
```

## API Endpoints

The mobile app uses the following API endpoints (all prefixed with `/api`):

- **Products**: `/api/products`
- **Transactions**: `/api/transactions`
- **Employees**: `/api/employees`
- **Cart**: `/api/cart`
- **Stock Movements**: `/api/stock-movements`
- **Archive**: `/api/archive`
- **Void Logs**: `/api/void-logs`
- **Discounts**: `/api/discounts`
- **Categories**: `/api/categories`

All API calls are centralized in `mobile/services/api.js`.

## Testing the Connection

1. Start the backend server
2. Start the mobile app
3. Try logging in with a PIN (the app will attempt to verify the PIN via the API)
4. Check the backend console for incoming requests

## Troubleshooting

### "Network request failed" or "Connection refused"

- Make sure the backend server is running
- Check that you're using the correct IP address (not `localhost` for physical devices)
- Verify both devices are on the same network
- Check firewall settings

### "CORS error"

- The backend already has CORS enabled. If you still see CORS errors, check the backend `server.js` file.

### "Invalid PIN" or authentication issues

- **For Expo Go**: Make sure you're using the owner account PIN (stored in cloud database)
- The mobile app only accepts owner accounts (`role: 'Owner'`)
- Verify the PIN format (should be 6 digits)
- Check the backend logs for authentication errors
- Make sure the backend is connected to MongoDB Atlas (cloud database)
- Verify owner account exists in cloud database with `role: 'Owner'`

### "Only owner account can access the mobile app"

- This is expected! The mobile app only accepts owner accounts
- Make sure you're using the owner account PIN
- Verify the owner account exists in the cloud database with `role: 'Owner'`
- You can create/update owner account using: `node backend/scripts/createOwner.js`

## Notes

- The mobile app and web frontend share the same backend API
- All API logic is centralized in the backend - no duplicate API calls in the frontend
- The mobile app uses the same API endpoints as the web frontend
- **Owner account is stored in MongoDB Atlas (cloud database)**
- The mobile app only accepts owner account PINs for login
- When using Expo Go, you MUST use your computer's IP address (not localhost)

## Owner Account Setup

The owner account is stored in the cloud database (MongoDB Atlas). To create or update the owner account:

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Run the owner creation script:
   ```bash
   node scripts/createOwner.js
   ```

   This will create/update the owner account with:
   - Email: `owner@pos.local`
   - Role: `Owner`
   - Default PIN: `1234` (you can change this in the script or via web interface)
   - Stored in both cloud and local databases

3. The owner account will be synced to MongoDB Atlas automatically when the backend is online.

