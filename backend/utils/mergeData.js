const mongoose = require('mongoose');

/**
 * Get data from the local database
 * Simplified version - no cloud/local merging needed
 */
async function mergeDataFromBothSources(modelName, query = {}, options = {}) {
  // Import schema
  const schemaModule = require(`../models/${modelName}`);
  const schema = schemaModule.schema || schemaModule;
  
  try {
    const Model = mongoose.model(modelName, schema);
    const limit = options.limit || 5000;
    let data = await Model.find(query).limit(limit).lean();
    
    // Apply sorting if specified
    if (options.sort) {
      data.sort((a, b) => {
        for (const [field, direction] of Object.entries(options.sort)) {
          const aVal = a[field];
          const bVal = b[field];
          const dir = direction === 'desc' ? -1 : 1;
          
          if (aVal < bVal) return -1 * dir;
          if (aVal > bVal) return 1 * dir;
          return 0;
        }
        return 0;
      });
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${modelName}:`, error.message);
    return [];
  }
}

/**
 * Get single document by ID
 */
async function getByIdFromBothSources(modelName, id) {
  const schemaModule = require(`../models/${modelName}`);
  const schema = schemaModule.schema || schemaModule;
  
  try {
    const Model = mongoose.model(modelName, schema);
    return await Model.findById(id).lean();
  } catch (error) {
    console.error(`Error fetching ${modelName} by ID:`, error.message);
    return null;
  }
}

module.exports = {
  mergeDataFromBothSources,
  getByIdFromBothSources
};
