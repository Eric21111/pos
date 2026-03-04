const express = require("express");
const router = express.Router();
const {
  createGCashPayment,
  checkPaymentStatus,
  handleWebhook,
  cancelPayment,
  getConfigStatus,
} = require("../controllers/gcashPaymentController");

// GET /api/payments/gcash/config-status — Check if GCash is configured
router.get("/gcash/config-status", getConfigStatus);

// POST /api/payments/gcash/create — Create GCash payment + dynamic QR
router.post("/gcash/create", createGCashPayment);

// GET /api/payments/gcash/status/:merchantOrderId — Poll payment status
router.get("/gcash/status/:merchantOrderId", checkPaymentStatus);

// POST /api/payments/gcash/webhook — PayMongo webhook (no auth middleware)
router.post("/gcash/webhook", handleWebhook);

// POST /api/payments/gcash/cancel/:merchantOrderId — Cancel pending payment
router.post("/gcash/cancel/:merchantOrderId", cancelPayment);

module.exports = router;
