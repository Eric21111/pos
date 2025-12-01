// Middleware to write to both cloud and local databases when online
const dualWrite = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json to intercept responses
  res.json = async function(data) {
    // If operation was successful and we're online, also write to local
    if (data.success && req.isOnline && req.dbManager) {
      const localConnection = req.dbManager.getLocalConnection();
      
      if (localConnection && localConnection.readyState === 1) {
        // Extract the model name and operation from the request
        const modelName = req.route?.path?.includes('products') ? 'Product' :
                         req.route?.path?.includes('transactions') ? 'SalesTransaction' :
                         req.route?.path?.includes('employees') ? 'Employee' :
                         req.route?.path?.includes('stock-movements') ? 'StockMovement' :
                         req.route?.path?.includes('cart') ? 'Cart' : null;
        
        if (modelName && data.data) {
          try {
            const schemaModule = require(`../models/${modelName}`);
            const schema = schemaModule.schema || schemaModule;
            const LocalModel = localConnection.model(modelName, schema);
            
            // Handle different operations
            if (req.method === 'POST') {
              // Create operation
              await LocalModel.create(data.data);
            } else if (req.method === 'PUT' || req.method === 'PATCH') {
              // Update operation
              if (req.params.id && data.data) {
                await LocalModel.findByIdAndUpdate(req.params.id, data.data, { new: true });
              }
            } else if (req.method === 'DELETE') {
              // Delete operation
              if (req.params.id) {
                await LocalModel.findByIdAndDelete(req.params.id);
              }
            }
          } catch (error) {
            console.warn(`Dual write failed for ${modelName}:`, error.message);
            // Don't fail the request if dual write fails
          }
        }
      }
    }
    
    // Call original json method
    return originalJson(data);
  };
  
  next();
};

module.exports = dualWrite;

