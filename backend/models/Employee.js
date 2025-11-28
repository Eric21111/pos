const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    required: true
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactNo: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Sales Clerk', 'Manager', 'Cashier', 'Supervisor', 'Owner'],
    default: 'Sales Clerk'
  },
  pin: {
    type: String,
    required: true
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  dateJoinedActual: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  profileImage: {
    type: String,
    default: ''
  },
  // User Access Control Permissions
  permissions: {
    posTerminal: {
      type: Boolean,
      default: true
    },
    inventory: {
      type: Boolean,
      default: false
    },
    viewTransactions: {
      type: Boolean,
      default: true
    },
    generateReports: {
      type: Boolean,
      default: false
    }
  },
  requiresPinReset: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash PIN before saving
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('pin')) {
    return next();
  }
  
  try {
    // Validate PIN length before hashing (must be exactly 6 digits)
    if (!/^\d{6}$/.test(this.pin)) {
      const error = new Error('PIN must be exactly 6 digits');
      return next(error);
    }
    
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Ensure name/first/last stay in sync
employeeSchema.pre('validate', function(next) {
  if ((!this.firstName || !this.lastName || this.isModified('name')) && this.name) {
    const parts = this.name.trim().split(/\s+/);
    if (!this.firstName || this.isModified('name')) {
      this.firstName = parts[0] || '';
    }
    if (!this.lastName || this.isModified('name')) {
      this.lastName = parts.slice(1).join(' ') || '';
    }
  }

  if (this.isModified('firstName') || this.isModified('lastName') || !this.name) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  next();
});

// Method to compare PIN
employeeSchema.methods.comparePin = async function(candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

module.exports = mongoose.model('Employee', employeeSchema);

