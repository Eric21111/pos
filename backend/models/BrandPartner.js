const mongoose = require('mongoose');

const brandPartnerSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

brandPartnerSchema.index({ brandName: 1 }, { unique: true });

module.exports = mongoose.model('BrandPartner', brandPartnerSchema);






