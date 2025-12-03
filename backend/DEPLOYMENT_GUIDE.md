# Deployment Guide

This guide covers deploying the POS system backend.

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB installed locally

### Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pos_system
NODE_ENV=development
```

4. Start MongoDB:
```bash
mongod
```

5. Start server:
```bash
npm start
```

## Production Deployment

### Environment Variables

Required environment variables:

```env
PORT=5000
MONGODB_URI=mongodb://your-mongodb-host:27017/pos_system
NODE_ENV=production
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Docker Deployment

1. Build image:
```bash
docker build -t pos-backend .
```

2. Run container:
```bash
docker run -p 5000:5000 --env-file .env pos-backend
```

### PM2 Deployment

1. Install PM2:
```bash
npm install -g pm2
```

2. Start application:
```bash
pm2 start server.js --name pos-backend
```

3. Save process list:
```bash
pm2 save
```

4. Setup startup script:
```bash
pm2 startup
```

## Database Setup

### Create Owner Account

```bash
node scripts/createOwner.js
```

This creates the default owner account with PIN: `123456`

### Database Backup

```bash
mongodump --db pos_system --out ./backup
```

### Database Restore

```bash
mongorestore --db pos_system ./backup/pos_system
```

## Troubleshooting

### Backend Not Starting

1. Check MongoDB is running
2. Verify `MONGODB_URI` in `.env`
3. Check port 5000 is available

### Database Connection Issues

1. Verify MongoDB is accessible
2. Check connection string format
3. Ensure database user has correct permissions

