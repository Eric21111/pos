const express = require("express");
const router = express.Router();
const { getInventoryAnalytics } = require("../controllers/reportController");

// GET /api/reports/inventory-analytics?timeframe=daily|weekly|monthly|yearly|custom&startDate=...&endDate=...
router.get("/inventory-analytics", getInventoryAnalytics);

module.exports = router;
