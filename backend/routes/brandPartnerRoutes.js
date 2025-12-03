const express = require('express');
const router = express.Router();
const {
  getBrandPartners,
  createBrandPartner,
} = require('../controllers/brandPartnerController');

router.get('/', getBrandPartners);
router.post('/', createBrandPartner);

module.exports = router;






