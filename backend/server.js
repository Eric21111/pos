const express = require('express');
const dotenv = require('dotenv');

// Load env vars before other imports
dotenv.config();

const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
const networkDetection = require('./middleware/networkDetection');
const { initStockAlertCron } = require('./services/stockAlertCron');

const app = express();

// Connect to database
connectDB();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database connection check middleware
app.use(networkDetection);

app.get('/', (req, res) => {
  const dbManager = require('./config/databaseManager');
  res.json({
    message: 'Welcome to POS System API',
    database: `${dbManager.getCurrentMode()} MongoDB`
  });
});

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/print', require('./routes/printRoutes'));

const employeeRoutes = require('./routes/employeeRoutes');
const verificationRoutes = require('./routes/verificationRoutes');

// Use Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/stock-movements', require('./routes/stockMovementRoutes'));
app.use('/api/archive', require('./routes/archiveRoutes'));
app.use('/api/void-logs', require('./routes/voidLogRoutes'));
app.use('/api/discounts', require('./routes/discountRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/brand-partners', require('./routes/brandPartnerRoutes'));
app.use('/api/sync', require('./routes/syncRoutes'));

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Access from other devices using your computer's IP address`);

  // Initialize stock alert cron job
  initStockAlertCron();

  // Schedule Data Sync (Every 5 minutes)
  const cron = require('node-cron');
  const dataSyncService = require('./services/dataSyncService');

  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Triggering Data Sync...');
    await dataSyncService.sync();
  });
});
