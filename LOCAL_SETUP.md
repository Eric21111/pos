# Local Development Setup

This guide explains how to set up the mobile app to work with a local backend.

## Prerequisites

1. ✅ Backend server running with local MongoDB
2. ✅ Your computer and phone on the same Wi-Fi network
3. ✅ Expo Go app installed on your phone

## Setup Steps

### 1. Start Local MongoDB

Make sure MongoDB is running locally:
```bash
mongod
```

### 2. Start Backend Server

```bash
cd backend
npm install
npm start
```

You should see:
- "Server is running on port 5000"
- "MongoDB Connected: localhost"

### 3. Configure Mobile App

1. Find your computer's local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`

2. Update `mobile/config/api.js`:
```javascript
export const API_BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
```

Example: `http://192.168.1.100:5000/api`

### 4. Start Expo App

```bash
cd mobile
npm install
npx expo start
```

### 5. Test Connection

1. Open Expo Go on your phone
2. Scan the QR code
3. Try logging in with your owner PIN

## Troubleshooting

### Cannot Connect to Backend

1. Make sure phone and computer are on the same Wi-Fi
2. Check if backend is running: `http://YOUR_IP:5000` in browser
3. Check firewall settings - allow port 5000

### Login Issues

1. Make sure owner account exists in local database
2. Run `node backend/scripts/createOwner.js` to create owner account
3. Default PIN: `123456`

## Notes

- All data is stored locally on your computer
- No cloud connection required
- Owner account must exist in local database
