# Backend Deployment Guide

This guide explains how to deploy your backend to the cloud so the mobile app can connect without requiring your computer's IP address.

## Why Deploy?

- ✅ Mobile app works from anywhere (not just same Wi-Fi network)
- ✅ No need for computer IP address
- ✅ Always online - connects directly to MongoDB Atlas
- ✅ Better for production use

## Quick Deployment Options

### Option 1: Railway (Recommended - Easy & Free)

1. **Sign up** at [railway.app](https://railway.app)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or upload code)

3. **Configure Environment Variables**
   Add these in Railway dashboard:
   ```
   MONGODB_ATLAS_URI=your_mongodb_atlas_connection_string
   PORT=5000
   NODE_ENV=production
   ```

4. **Deploy**
   - Railway will auto-detect Node.js
   - It will run `npm start`
   - Your backend will be live at: `https://your-project.railway.app`

5. **Update Mobile App Config**
   - Open `mobile/config/api.js`
   - Set `BACKEND_URL = 'https://your-project.railway.app'`

### Option 2: Render (Free Tier Available)

1. **Sign up** at [render.com](https://render.com)

2. **Create New Web Service**
   - Connect your GitHub repo
   - Select "Node" environment
   - Build command: `npm install`
   - Start command: `npm start`

3. **Add Environment Variables**
   ```
   MONGODB_ATLAS_URI=your_mongodb_atlas_connection_string
   PORT=5000
   NODE_ENV=production
   ```

4. **Deploy**
   - Render will deploy automatically
   - Your backend will be at: `https://your-service.onrender.com`

5. **Update Mobile App Config**
   - Open `mobile/config/api.js`
   - Set `BACKEND_URL = 'https://your-service.onrender.com'`

### Option 3: Fly.io (Free Tier)

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Initialize**
   ```bash
   cd backend
   fly launch
   ```

4. **Set Environment Variables**
   ```bash
   fly secrets set MONGODB_ATLAS_URI=your_mongodb_atlas_connection_string
   fly secrets set PORT=5000
   fly secrets set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Update Mobile App Config**
   - Your backend will be at: `https://your-app.fly.dev`
   - Set `BACKEND_URL = 'https://your-app.fly.dev'`

## Environment Variables Needed

Make sure these are set in your deployment platform:

```env
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/pos_system
PORT=5000
NODE_ENV=production
```

## After Deployment

1. **Test Your Backend**
   - Visit: `https://your-backend-url.com`
   - Should see: `{"message":"Welcome to POS System API","online":true,"database":"MongoDB Atlas"}`

2. **Update Mobile App**
   - Open `mobile/config/api.js`
   - Set `BACKEND_URL` to your deployed URL
   - Example: `const BACKEND_URL = 'https://pos-backend.railway.app';`

3. **Test Mobile App**
   - Start Expo Go
   - Try logging in with owner account PIN
   - Should connect to cloud database via deployed backend

## Important Notes

- ✅ Backend connects to MongoDB Atlas (cloud database)
- ✅ Owner account is stored in MongoDB Atlas
- ✅ Mobile app connects to deployed backend (not local)
- ✅ Works from anywhere, no Wi-Fi network required
- ✅ Always online when backend is deployed

## Troubleshooting

### Backend Not Connecting to MongoDB Atlas

1. Check `MONGODB_ATLAS_URI` environment variable
2. Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
3. Check deployment logs for connection errors

### Mobile App Can't Connect

1. Verify backend URL in `mobile/config/api.js`
2. Test backend URL in browser: `https://your-backend-url.com`
3. Check CORS is enabled (already configured in `server.js`)
4. Verify backend is running (check deployment logs)

### Owner Account Not Found

1. Make sure owner account exists in MongoDB Atlas
2. Run: `node scripts/createOwner.js` (locally, it will sync to cloud)
3. Or create owner via web interface (will sync to cloud)

