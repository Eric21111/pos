const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
const networkDetection = require('./middleware/networkDetection');
const syncService = require('./services/syncService');

dotenv.config();

const app = express();


connectDB().then(() => {

  setTimeout(async () => {
    const dbManager = require('./config/databaseManager');
    if (dbManager.isConnected()) {
      console.log('System is online. Checking for pending sync...');
      try {
        await syncService.syncAllData();
        console.log('Startup sync completed (if any data was pending)');
      } catch (error) {
        console.log('Startup sync skipped or failed:', error.message);
      }
    }
  }, 5000);
});

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));


app.use(networkDetection);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to POS System API',
    online: req.isOnline,
    database: req.isOnline ? 'MongoDB Atlas' : 'Local MongoDB'
  });
});

// Sync routes
app.use('/api', require('./routes/syncRoutes'));

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

