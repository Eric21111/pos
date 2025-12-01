const { getTransactionModel } = require('../utils/getModel');
const { mergeDataFromBothSources, getByIdFromBothSources } = require('../utils/mergeData');
const dbManager = require('../config/databaseManager');
const mongoose = require('mongoose');

// Generate a unique receipt number - use timestamp-based for speed (very unlikely to collide)
const generateUniqueReceiptNumber = async (SalesTransaction) => {
  // Use timestamp-based approach for speed (milliseconds precision makes collisions extremely rare)
  const timestamp = Date.now().toString().slice(-6);
  let receiptNo = timestamp.padStart(6, '0');
  
  // Quick check for collision (only one check for speed)
  const existing = await SalesTransaction.findOne({ receiptNo });
  if (existing) {
    // If collision (extremely rare), append random digit
    receiptNo = (timestamp + Math.floor(Math.random() * 10)).slice(-6);
  }
  
  return receiptNo;
};

// Generate a unique random void ID
const generateVoidId = async (SalesTransaction) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let voidId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!isUnique && attempts < maxAttempts) {
    voidId = 'VOID-';
    for (let i = 0; i < 6; i++) {
      voidId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if voidId already exists
    const existing = await SalesTransaction.findOne({ voidId });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  
  // If still not unique after max attempts, append timestamp
  if (!isUnique) {
    const timestamp = Date.now().toString().slice(-4);
    voidId = `VOID-${timestamp}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
  }
  
  return voidId;
};

// Get the next transaction number by checking both local and cloud databases
// The oldest transaction should be #1, and newer transactions get incrementing numbers
const getNextTransactionNumber = async () => {
  const localConnection = dbManager.getLocalConnection();
  const isOnline = dbManager.isConnected();
  
  const SalesTransactionModule = require('../models/SalesTransaction');
  const schema = SalesTransactionModule.schema;
  
  let maxCloudNumber = 0;
  let maxLocalNumber = 0;
  let minCloudNumber = Infinity;
  let minLocalNumber = Infinity;
  
  // Query cloud database (if online)
  if (isOnline && mongoose.connection.readyState === 1) {
    try {
      const CloudTransaction = mongoose.model('SalesTransaction', schema);
      // Get the highest transaction number from cloud (excluding return transactions)
      const cloudMax = await CloudTransaction.findOne(
        { 
          transactionNumber: { $exists: true, $ne: null },
          paymentMethod: { $ne: 'return' } // Exclude return transactions
        },
        { transactionNumber: 1 }
      )
      .sort({ transactionNumber: -1 })
      .limit(1)
      .lean();
      
      if (cloudMax && cloudMax.transactionNumber) {
        maxCloudNumber = cloudMax.transactionNumber;
      }
      
      // Get the lowest transaction number to check if numbering starts from 1
      const cloudMin = await CloudTransaction.findOne(
        { 
          transactionNumber: { $exists: true, $ne: null },
          paymentMethod: { $ne: 'return' }
        },
        { transactionNumber: 1 }
      )
      .sort({ transactionNumber: 1 })
      .limit(1)
      .lean();
      
      if (cloudMin && cloudMin.transactionNumber) {
        minCloudNumber = cloudMin.transactionNumber;
      }
    } catch (error) {
      console.warn('Error fetching transaction numbers from cloud:', error.message);
    }
  }
  
  // Query local database
  let actualLocalConnection = localConnection;
  if (!actualLocalConnection || actualLocalConnection.readyState !== 1) {
    try {
      await dbManager.connectLocalForSync();
      actualLocalConnection = dbManager.getLocalConnection();
    } catch (error) {
      console.warn('Could not initialize local connection for transaction number:', error.message);
    }
  }
  
  if (actualLocalConnection && actualLocalConnection.readyState === 1) {
    try {
      const LocalTransaction = actualLocalConnection.model('SalesTransaction', schema);
      // Get the highest transaction number from local (excluding return transactions)
      const localMax = await LocalTransaction.findOne(
        { 
          transactionNumber: { $exists: true, $ne: null },
          paymentMethod: { $ne: 'return' } // Exclude return transactions
        },
        { transactionNumber: 1 }
      )
      .sort({ transactionNumber: -1 })
      .limit(1)
      .lean();
      
      if (localMax && localMax.transactionNumber) {
        maxLocalNumber = localMax.transactionNumber;
      }
      
      // Get the lowest transaction number to check if numbering starts from 1
      const localMin = await LocalTransaction.findOne(
        { 
          transactionNumber: { $exists: true, $ne: null },
          paymentMethod: { $ne: 'return' }
        },
        { transactionNumber: 1 }
      )
      .sort({ transactionNumber: 1 })
      .limit(1)
      .lean();
      
      if (localMin && localMin.transactionNumber) {
        minLocalNumber = localMin.transactionNumber;
      }
    } catch (error) {
      console.warn('Error fetching transaction numbers from local:', error.message);
    }
  }
  
  // Determine the next number
  const maxNumber = Math.max(maxCloudNumber, maxLocalNumber);
  const minNumber = Math.min(minCloudNumber === Infinity ? Infinity : minCloudNumber, 
                              minLocalNumber === Infinity ? Infinity : minLocalNumber);
  
  // If the minimum number is 1, we're using sequential numbering from 1
  // Otherwise, we continue from the max number
  // If no transactions exist yet, start from 1
  if (maxNumber === 0 && minNumber === Infinity) {
    return 1; // First transaction gets number 1
  }
  
  // If numbering already starts from 1, continue sequentially
  if (minNumber === 1) {
    return maxNumber + 1;
  }
  
  // If existing transactions don't start from 1, we need to handle this
  // For now, we'll continue from max + 1, but ideally the oldest should be renumbered to 1
  // Since transaction numbers are immutable, we can't change existing ones
  // So we'll continue the sequence and note that the oldest might not be 1
  return maxNumber + 1;
};

exports.recordTransaction = async (req, res) => {
  try {
    console.log('=== Transaction Save Request ===');
    console.log('Request body keys:', Object.keys(req.body));
    
    const { 
      userId, 
      items, 
      paymentMethod, 
      amountReceived, 
      changeGiven, 
      referenceNo,
      receiptNo,
      totalAmount,
      status,
      performedById,
      performedByName,
      originalTransactionId,
      voidReason
    } = req.body;

    console.log('Transaction data received:', {
      userId,
      itemsCount: items?.length,
      paymentMethod,
      totalAmount,
      status,
      isOnline: req.isOnline
    });

    if (!userId || !Array.isArray(items) || !items.length || !paymentMethod || !totalAmount) {
      console.error('Missing required fields:', {
        hasUserId: !!userId,
        isItemsArray: Array.isArray(items),
        itemsLength: items?.length,
        hasPaymentMethod: !!paymentMethod,
        hasTotalAmount: !!totalAmount
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required transaction fields'
      });
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'gcash', 'void', 'return'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      console.error('Invalid payment method:', paymentMethod);
      return res.status(400).json({
        success: false,
        message: `Invalid payment method: ${paymentMethod}. Valid methods are: ${validPaymentMethods.join(', ')}`
      });
    }

    const SalesTransaction = getTransactionModel(req);
    
    // Generate receipt number if not provided
    // Skip duplicate check if receiptNo is provided (trust frontend for speed)
    let finalReceiptNo = receiptNo;
    if (!finalReceiptNo || finalReceiptNo.trim() === '') {
      finalReceiptNo = await generateUniqueReceiptNumber(SalesTransaction);
    }
    
    // Generate transaction number for regular transactions (not returns)
    // Return transactions don't get a transaction number
    let transactionNumber = null;
    if (paymentMethod !== 'return') {
      try {
        transactionNumber = await getNextTransactionNumber();
      } catch (txnNumError) {
        console.error('Error generating transaction number:', txnNumError);
        // Continue without transaction number if generation fails (non-critical)
        transactionNumber = null;
      }
    }
    
    // Validate and prepare items with proper productId conversion
    const preparedItems = items.map(item => {
      let productId = item.productId || item._id;
      
      // Ensure productId is a valid ObjectId
      if (productId) {
        // If it's already an ObjectId, use it as is
        if (productId instanceof mongoose.Types.ObjectId) {
          // Already an ObjectId, use it
        } else if (mongoose.Types.ObjectId.isValid(productId)) {
          // Valid string representation, convert to ObjectId
          productId = new mongoose.Types.ObjectId(productId);
        } else {
          // Invalid format - log error but try to continue
          console.error(`Invalid productId format: ${productId} for item: ${item.itemName || 'Unknown'}`);
          // Try to create a new ObjectId as fallback (should not happen in normal operation)
          productId = new mongoose.Types.ObjectId();
        }
      } else {
        console.error(`Missing productId for item: ${item.itemName || 'Unknown'}`);
        // Create a default ObjectId if missing (should not happen in normal operation)
        productId = new mongoose.Types.ObjectId();
      }
      
      return {
        productId: productId,
        itemName: item.itemName || 'Unknown Item',
        sku: item.sku || '',
        variant: item.variant || '',
        selectedSize: item.selectedSize || '',
        quantity: item.quantity || 1,
        price: item.itemPrice || item.price || 0,
        itemImage: item.itemImage || '',
        returnReason: item.returnReason || null,
        voidReason: item.voidReason || null
      };
    });

    const transactionData = {
      userId,
      performedById: performedById || null,
      performedByName: performedByName || null,
      items: preparedItems,
      paymentMethod,
      amountReceived: amountReceived || null,
      changeGiven: changeGiven || null,
      referenceNo: referenceNo || null,
      receiptNo: finalReceiptNo,
      transactionNumber,
      totalAmount,
      status: status || 'Completed',
      originalTransactionId: originalTransactionId || null
    };

    // If this is a void transaction, add void information
    if (paymentMethod === 'void' || status === 'Voided') {
      transactionData.voidReason = voidReason || null;
      transactionData.voidedBy = performedById || null;
      transactionData.voidedByName = performedByName || null;
      transactionData.voidedAt = new Date();
      transactionData.voidId = await generateVoidId(SalesTransaction);
    }

    // Save to local and cloud in parallel for speed
    const reqDbManager = req.dbManager || dbManager;
    let localConnection = reqDbManager.getLocalConnection();
    
    // Ensure local connection exists
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        await reqDbManager.connectLocalForSync();
        localConnection = reqDbManager.getLocalConnection();
      } catch (error) {
        console.warn('Could not initialize local connection:', error.message);
      }
    }
    
    // Prepare save promises
    const savePromises = [];
    
    // Always try to save to local (works offline)
    if (localConnection && localConnection.readyState === 1) {
      savePromises.push(
        (async () => {
          try {
            const SalesTransactionModule = require('../models/SalesTransaction');
            const LocalTransaction = localConnection.model('SalesTransaction', SalesTransactionModule.schema);
            console.log('Attempting to save transaction to local database...');
            console.log('Transaction data:', JSON.stringify(transactionData, null, 2));
            const localTransaction = await LocalTransaction.create(transactionData);
            console.log('Transaction saved to local database successfully');
            return { type: 'local', transaction: localTransaction };
          } catch (localError) {
            console.error('Failed to write transaction to local database:', localError.message);
            console.error('Local error stack:', localError.stack);
            console.error('Local error code:', localError.code);
            console.error('Local error name:', localError.name);
            if (localError.errors) {
              console.error('Local validation errors:', JSON.stringify(localError.errors, null, 2));
            }
            // If local save fails and we're offline, throw error
            if (!req.isOnline) {
              throw new Error('Failed to save transaction to local database: ' + localError.message);
            }
            return { type: 'local', transaction: null, error: localError };
          }
        })()
      );
    } else {
      // If local connection is not available, try to initialize it
      if (!localConnection) {
        try {
          console.log('Local connection not available, attempting to initialize...');
          await reqDbManager.connectLocalForSync();
          localConnection = reqDbManager.getLocalConnection();
          if (localConnection && localConnection.readyState === 1) {
            console.log('Local connection initialized successfully');
            savePromises.push(
              (async () => {
                try {
                  const SalesTransactionModule = require('../models/SalesTransaction');
                  const LocalTransaction = localConnection.model('SalesTransaction', SalesTransactionModule.schema);
                  console.log('Attempting to save transaction to local database (after initialization)...');
                  const localTransaction = await LocalTransaction.create(transactionData);
                  console.log('Transaction saved to local database (after initialization)');
                  return { type: 'local', transaction: localTransaction };
                } catch (localError) {
                  console.error('Failed to write transaction to local database:', localError.message);
                  console.error('Local error stack:', localError.stack);
                  console.error('Local error code:', localError.code);
                  if (localError.errors) {
                    console.error('Local validation errors:', JSON.stringify(localError.errors, null, 2));
                  }
                  if (!req.isOnline) {
                    throw new Error('Failed to save transaction to local database: ' + localError.message);
                  }
                  return { type: 'local', transaction: null, error: localError };
                }
              })()
            );
          } else {
            console.warn('Local connection initialization failed or connection not ready');
          }
        } catch (initError) {
          console.warn('Could not initialize local connection for transaction save:', initError.message);
          console.warn('Init error stack:', initError.stack);
        }
      } else {
        console.warn(`Local connection exists but not ready. State: ${localConnection.readyState}`);
      }
    }
    
    // Try to save to cloud if online (parallel with local)
    if (req.isOnline) {
      savePromises.push(
        (async () => {
          try {
            console.log('Attempting to save transaction to cloud database...');
            const cloudTransaction = await SalesTransaction.create(transactionData);
            console.log('Transaction saved to cloud database successfully');
            return { type: 'cloud', transaction: cloudTransaction };
          } catch (cloudError) {
            console.error('Failed to write transaction to cloud database:', cloudError.message);
            console.error('Cloud error stack:', cloudError.stack);
            console.error('Cloud error code:', cloudError.code);
            console.error('Cloud error name:', cloudError.name);
            if (cloudError.errors) {
              console.error('Cloud validation errors:', JSON.stringify(cloudError.errors, null, 2));
            }
            return { type: 'cloud', transaction: null, error: cloudError };
          }
        })()
      );
    } else {
      console.log('Not online, skipping cloud save');
    }
    
    // Check if we have any save attempts
    if (savePromises.length === 0) {
      console.error('No save promises created. Local connection state:', localConnection?.readyState, 'Is online:', req.isOnline);
      return res.status(503).json({
        success: false,
        message: 'No database connection available. Cannot save transaction.',
        error: 'Both local and cloud connections are unavailable',
        details: {
          localConnectionState: localConnection?.readyState || 'not available',
          isOnline: req.isOnline
        }
      });
    }
    
    console.log(`Attempting to save transaction to ${savePromises.length} database(s)...`);
    
    // Wait for all saves to complete (in parallel)
    const results = await Promise.all(savePromises);
    
    // Extract transactions from results
    const localResult = results.find(r => r.type === 'local');
    const cloudResult = results.find(r => r.type === 'cloud');
    
    const localTransaction = localResult?.transaction || null;
    const cloudTransaction = cloudResult?.transaction || null;
    
    console.log('Save results - Local:', localTransaction ? 'SUCCESS' : 'FAILED', 'Cloud:', cloudTransaction ? 'SUCCESS' : 'FAILED');
    
    // Check for critical errors
    if (localResult?.error && !req.isOnline) {
      console.error('Critical: Local save failed and we are offline');
      return res.status(503).json({
        success: false,
        message: 'Failed to save transaction to local database',
        error: localResult.error.message,
        details: {
          errorCode: localResult.error.code,
          errorName: localResult.error.name,
          validationErrors: localResult.error.errors || null
        }
      });
    }
    
    // Use cloud transaction if available, otherwise use local
    const transaction = cloudTransaction || localTransaction;
    
    if (!transaction) {
      // Provide detailed error information
      const errors = [];
      if (localResult?.error) {
        errors.push(`Local: ${localResult.error.message}`);
      }
      if (cloudResult?.error) {
        errors.push(`Cloud: ${cloudResult.error.message}`);
      }
      
      console.error('Transaction save failed to all databases');
      console.error('Local error:', localResult?.error);
      console.error('Cloud error:', cloudResult?.error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to save transaction to any database',
        error: errors.length > 0 ? errors.join('; ') : 'Unknown error',
        details: {
          localError: localResult?.error?.message || null,
          localErrorCode: localResult?.error?.code || null,
          localErrorName: localResult?.error?.name || null,
          localValidationErrors: localResult?.error?.errors || null,
          cloudError: cloudResult?.error?.message || null,
          cloudErrorCode: cloudResult?.error?.code || null,
          cloudErrorName: cloudResult?.error?.name || null,
          cloudValidationErrors: cloudResult?.error?.errors || null,
          isOnline: req.isOnline,
          localConnectionState: localConnection?.readyState || 'not available'
        }
      });
    }

    // If this is a void transaction, also save to VoidLog
    if (paymentMethod === 'void' || status === 'Voided') {
      try {
        const VoidLogModule = require('../models/VoidLog');
        const VoidLogSchema = VoidLogModule.schema;
        
        // Get VoidLog model
        let VoidLog;
        if (req && req.dbManager) {
          const connection = req.dbManager.getConnection();
          if (connection) {
            VoidLog = connection.model('VoidLog', VoidLogSchema);
          } else {
            VoidLog = mongoose.model('VoidLog', VoidLogSchema);
          }
        } else {
          VoidLog = mongoose.model('VoidLog', VoidLogSchema);
        }
        
        // Generate void ID for void log
        const voidLogId = transaction.voidId || await generateVoidId(SalesTransaction);
        
        const voidLogData = {
          voidId: voidLogId,
          items: (transaction.items || items).map(item => ({
            productId: item.productId || item._id,
            itemName: item.itemName,
            sku: item.sku,
            variant: item.variant || item.selectedVariation || null,
            selectedSize: item.selectedSize || item.size || null,
            quantity: item.quantity,
            price: item.itemPrice || item.price || 0,
            itemImage: item.itemImage || '',
            voidReason: item.voidReason || voidReason
          })),
          totalAmount: transaction.totalAmount || totalAmount,
          voidReason: transaction.voidReason || voidReason,
          voidedBy: transaction.voidedBy || performedById || '',
          voidedById: transaction.voidedBy || performedById || '',
          voidedByName: transaction.voidedByName || performedByName,
          voidedAt: transaction.voidedAt || new Date(),
          originalTransactionId: transaction._id,
          source: 'cart',
          userId: userId || null,
          notes: ''
        };
        
        // Save void log asynchronously (don't block transaction response)
        Promise.all([
          // Save to local if available
          (async () => {
            if (localConnection && localConnection.readyState === 1) {
              try {
                const LocalVoidLog = localConnection.model('VoidLog', VoidLogSchema);
                await LocalVoidLog.create(voidLogData);
                console.log('Void log saved to local database');
              } catch (err) {
                console.error('Failed to save void log to local:', err.message);
              }
            }
          })(),
          // Save to cloud if online
          (async () => {
            if (req.isOnline && VoidLog) {
              try {
                await VoidLog.create(voidLogData);
                console.log('Void log saved to cloud database');
              } catch (err) {
                console.error('Failed to save void log to cloud:', err.message);
              }
            }
          })()
        ]).catch(err => {
          console.error('Error saving void log (non-critical):', err.message);
        });
      } catch (voidLogError) {
        // Non-critical error - log but don't fail the transaction
        console.error('Error creating void log (non-critical):', voidLogError.message);
      }
    }

    res.json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record transaction',
      error: error.message
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { search = '', paymentMethod, status, userId, limit = 1000 } = req.query;

    // Build query for database-level filtering (more efficient)
    const query = {};
    
    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (userId && userId !== 'All') {
      query.userId = userId;
    }

    // Get transactions from both local and cloud with query filter and limit
    const limitNum = parseInt(limit, 10) || 1000;
    const allTransactions = await mergeDataFromBothSources('SalesTransaction', query, {
      sort: { checkedOutAt: -1 },
      limit: limitNum
    });

    // Apply search filter in memory (can't do complex search at DB level easily)
    let filteredTransactions = allTransactions;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredTransactions = filteredTransactions.filter(t => {
        // Check items
        const itemMatch = t.items?.some(item => 
          item.itemName?.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower)
        );
        // Check other fields
        return itemMatch ||
          t.performedByName?.toLowerCase().includes(searchLower) ||
          t.referenceNo?.toLowerCase().includes(searchLower) ||
          t.receiptNo?.toLowerCase().includes(searchLower);
      });
    }

    // Ensure transactions are sorted by date/time (most recent first)
    // Sort by checkedOutAt, then createdAt, then updatedAt (all descending)
    filteredTransactions.sort((a, b) => {
      const dateA = new Date(a.checkedOutAt || a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.checkedOutAt || b.createdAt || b.updatedAt || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    // Limit results to prevent huge payloads (limitNum already declared above)
    if (limitNum > 0 && filteredTransactions.length > limitNum) {
      filteredTransactions = filteredTransactions.slice(0, limitNum);
    }

    res.json({
      success: true,
      data: filteredTransactions,
      count: filteredTransactions.length,
      total: allTransactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const SalesTransaction = getTransactionModel(req);

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.transactionNumber; // Transaction number is immutable once set

    // If items are being updated, map them properly
    if (updateData.items && Array.isArray(updateData.items)) {
      updateData.items = updateData.items.map(item => ({
        productId: item.productId || item._id,
        itemName: item.itemName,
        sku: item.sku,
        variant: item.variant,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        price: item.itemPrice || item.price || 0,
        returnReason: item.returnReason || null
      }));
    }

    const transaction = await SalesTransaction.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Also update in local if online
    if (req.dbManager && req.dbManager.isOnline()) {
      try {
        const localConnection = req.dbManager.getLocalConnection();
        if (localConnection && localConnection.readyState === 1) {
          const SalesTransactionModule = require('../models/SalesTransaction');
          const LocalTransaction = localConnection.model('SalesTransaction', SalesTransactionModule.schema);
          await LocalTransaction.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
          );
          console.log('Transaction also updated in local database');
        }
      } catch (localError) {
        console.warn('Failed to update transaction in local database:', localError.message);
      }
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message
    });
  }
};

// Get dashboard statistics for today
exports.getDashboardStats = async (req, res) => {
  try {
    const { getProductModel } = require('../utils/getModel');
    const Product = getProductModel(req);
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all completed transactions from today (exclude voided and returns)
    const todayTransactions = await mergeDataFromBothSources('SalesTransaction', {
      status: { $in: ['Completed', 'Partially Returned'] },
      paymentMethod: { $nin: ['void', 'return'] },
      checkedOutAt: { $gte: today, $lt: tomorrow }
    }, {
      sort: { checkedOutAt: -1 }
    });
    
    // Calculate total sales today as sum of selling cost (price * quantity) for all items
    let totalSalesToday = 0;
    todayTransactions.forEach(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          const sellingPrice = item.price || 0;
          const quantity = item.quantity || 0;
          totalSalesToday += sellingPrice * quantity;
        });
      }
    });
    
    // Calculate total transactions count
    const totalTransactions = todayTransactions.length;
    
    // Calculate profit: (selling price - cost price) * quantity for each item
    // First, collect all unique product IDs from today's transactions
    const productIds = new Set();
    todayTransactions.forEach(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          if (item.productId) {
            productIds.add(item.productId.toString());
          }
        });
      }
    });
    
    // Fetch all products at once for better performance
    const allProducts = await mergeDataFromBothSources('Product', {
      _id: { $in: Array.from(productIds).map(id => new mongoose.Types.ObjectId(id)) }
    }, {});
    
    // Create a map of productId -> costPrice for quick lookup
    const productCostMap = new Map();
    allProducts.forEach(product => {
      if (product._id) {
        productCostMap.set(product._id.toString(), product.costPrice || 0);
      }
    });
    
    // Calculate total profit: (selling cost - cost price) for each item, then sum all profits
    // Example: Item with cost price 100, selling price 500, quantity 1
    //   Selling cost = 500 * 1 = 500
    //   Cost price = 100 * 1 = 100
    //   Profit = 500 - 100 = 400
    // Then add this profit to other item profits
    let totalProfit = 0;
    todayTransactions.forEach(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          const productId = item.productId?.toString();
          const costPrice = productCostMap.get(productId) || 0;
          const sellingPrice = item.price || 0;
          const quantity = item.quantity || 0;
          
          // Calculate selling cost (price * quantity) and cost price (costPrice * quantity)
          const sellingCost = sellingPrice * quantity;
          const totalCostPrice = costPrice * quantity;
          
          // Profit per item = selling cost - cost price
          const itemProfit = sellingCost - totalCostPrice;
          totalProfit += itemProfit;
        });
      }
    });
    
    // Get low stock items (products where currentStock <= reorderNumber)
    const allProductsForStock = await mergeDataFromBothSources('Product', {}, {});
    const lowStockItems = allProductsForStock.filter(p => {
      const stock = p.currentStock || 0;
      const reorder = p.reorderNumber || 0;
      return stock <= reorder && stock > 0; // Only count items that have stock but are at or below reorder level
    }).length;
    
    res.json({
      success: true,
      data: {
        totalSalesToday,
        totalTransactions,
        profit: totalProfit,
        lowStockItems
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Migration function to renumber transactions so oldest is #1
// This should only be run once to fix existing transaction numbering
exports.renumberTransactions = async (req, res) => {
  try {
    const SalesTransaction = getTransactionModel(req);
    const dbManager = req.dbManager || require('../config/databaseManager');
    const localConnection = dbManager.getLocalConnection();
    
    // Get all regular transactions (excluding returns) sorted by date (oldest first)
    const allTransactions = await mergeDataFromBothSources('SalesTransaction', 
      { paymentMethod: { $ne: 'return' } },
      { sort: { checkedOutAt: 1, createdAt: 1 } }
    );
    
    // Filter out return transactions
    const regularTransactions = allTransactions.filter(t => 
      t.paymentMethod !== 'return' || !t.originalTransactionId
    );
    
    // Sort by date to ensure oldest is first
    regularTransactions.sort((a, b) => {
      const dateA = new Date(a.checkedOutAt || a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.checkedOutAt || b.createdAt || b.updatedAt || 0);
      return dateA - dateB; // Ascending (oldest first)
    });
    
    let renumbered = 0;
    let errors = [];
    
    // Renumber transactions starting from 1
    for (let i = 0; i < regularTransactions.length; i++) {
      const transaction = regularTransactions[i];
      const newNumber = i + 1;
      
      // Skip if already has the correct number
      if (transaction.transactionNumber === newNumber) {
        continue;
      }
      
      try {
        // Update in cloud if online
        if (req.isOnline && mongoose.connection.readyState === 1) {
          await SalesTransaction.findByIdAndUpdate(
            transaction._id,
            { $set: { transactionNumber: newNumber } },
            { runValidators: false } // Skip validation to allow renumbering
          );
        }
        
        // Update in local database
        if (localConnection && localConnection.readyState === 1) {
          const SalesTransactionModule = require('../models/SalesTransaction');
          const LocalTransaction = localConnection.model('SalesTransaction', SalesTransactionModule.schema);
          await LocalTransaction.findByIdAndUpdate(
            transaction._id,
            { $set: { transactionNumber: newNumber } },
            { runValidators: false }
          );
        }
        
        renumbered++;
      } catch (error) {
        errors.push({ transactionId: transaction._id, error: error.message });
        console.error(`Failed to renumber transaction ${transaction._id}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: `Renumbered ${renumbered} transactions. Oldest transaction is now #1.`,
      renumbered,
      total: regularTransactions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error renumbering transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renumber transactions',
      error: error.message
    });
  }
};

