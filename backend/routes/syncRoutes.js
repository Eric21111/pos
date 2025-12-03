const express = require('express');

const router = express.Router();

// Simple sync endpoint – extend this to call any real sync logic you need
router.post('/all', async (req, res) => {
  try {
    // TODO: add real sync logic here (e.g. pulling/pushing data)
    // For now we assume everything is already up to date.
    const hasChanges = false;

    return res.json({
      success: true,
      message: hasChanges
        ? 'Sync completed successfully'
        : 'Data is already up to date',
      hasChanges,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync /all failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Sync failed',
    });
  }
});

module.exports = router;


