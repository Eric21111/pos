# Expo Go Setup Guide

## Prerequisites

1. ✅ Backend server running with local MongoDB
2. ✅ Your computer and phone on the same Wi-Fi network
3. ✅ Expo Go app installed on your phone

## Quick Start

### 1. Start Backend

```bash
cd backend
npm start
```

Verify:
- Console shows "Server is running on port 5000"
- Console shows "MongoDB Connected: localhost"

### 2. Configure API URL

Edit `mobile/config/api.js`:
```javascript
export const API_BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
```

### 3. Start Expo

```bash
cd mobile
npx expo start
```

### 4. Login

- Use the owner account PIN
- Default PIN from script: `1234` (if using `createOwner.js`)

## Troubleshooting

### Phone Can't Connect

- Ensure same Wi-Fi network
- Try `http://YOUR_IP:5000` in phone browser
- Check firewall allows port 5000

### Invalid PIN

- Make sure owner account exists in database
- Create owner: `node backend/scripts/createOwner.js`

## Owner Account

The owner account is stored in your local MongoDB database.

- Email: `owner@pos.local`
- Role: `Owner`
- PIN: Set via web interface or `createOwner.js` script

