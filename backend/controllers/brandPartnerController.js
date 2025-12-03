const BrandPartner = require('../models/BrandPartner');

const formatValidationError = (message) => ({
  success: false,
  message,
});

exports.getBrandPartners = async (req, res) => {
  try {
    const partners = await BrandPartner.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: partners,
    });
  } catch (error) {
    console.error('Error fetching brand partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand partners.',
    });
  }
};

exports.createBrandPartner = async (req, res) => {
  try {
    const { brandName, email, contactNumber, contactPerson, logo } = req.body;

    if (!brandName || !brandName.trim()) {
      return res.status(400).json(formatValidationError('Brand name is required.'));
    }

    const normalizedBrandName = brandName.trim();

    const existing = await BrandPartner.findOne({ brandName: normalizedBrandName });
    if (existing) {
      return res.status(409).json(formatValidationError('Brand name already exists.'));
    }

    const newPartner = await BrandPartner.create({
      brandName: normalizedBrandName,
      email: email?.trim() || '',
      contactNumber: contactNumber?.trim() || '',
      contactPerson: contactPerson?.trim() || '',
      logo: logo || '',
    });

    res.status(201).json({
      success: true,
      data: newPartner,
    });
  } catch (error) {
    console.error('Error creating brand partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create brand partner.',
    });
  }
};






