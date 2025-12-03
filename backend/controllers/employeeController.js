const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}).sort({ dateJoined: -1 }).lean();

    // Remove PIN from response
    const employeesWithoutPin = employees.map(emp => {
      const { pin, ...rest } = emp;
      return rest;
    });

    res.json({
      success: true,
      count: employeesWithoutPin.length,
      data: employeesWithoutPin
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const { pin, ...employeeWithoutPin } = employee;

    res.json({
      success: true,
      data: employeeWithoutPin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};


// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      name,
      contactNo,
      email,
      role,
      pin,
      dateJoined,
      status,
      profileImage,
      permissions,
      dateJoinedActual,
      requiresPinReset
    } = req.body;

    // Validate required fields
    if (!email || !role || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Email, role, and PIN are required'
      });
    }

    // Check if employee with email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    // Don't hash PIN here - the model's pre-save hook will handle it
    const employeeData = {
      firstName: firstName || '',
      lastName: lastName || '',
      name: name || `${firstName || ''} ${lastName || ''}`.trim(),
      contactNo: contactNo || '',
      email,
      role,
      pin: pin, // Pass raw PIN - model will hash it
      dateJoined: dateJoined || new Date(),
      dateJoinedActual: dateJoinedActual || new Date(),
      status: status || 'Active',
      profileImage: profileImage || '',
      permissions: permissions || {},
      requiresPinReset: requiresPinReset || false
    };

    const employee = await Employee.create(employeeData);

    const { pin: _, ...employeeWithoutPin } = employee.toObject();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employeeWithoutPin
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
};


// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If PIN is being updated, hash it
    if (updateData.pin) {
      const salt = await bcrypt.genSalt(10);
      updateData.pin = await bcrypt.hash(updateData.pin, salt);
    }

    updateData.lastUpdated = Date.now();

    const employee = await Employee.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const { pin, ...employeeWithoutPin } = employee.toObject();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employeeWithoutPin
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};


// Verify PIN
exports.verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required'
      });
    }

    // Get all active employees (status is 'Active' with capital A in the schema)
    const employees = await Employee.find({ status: 'Active' }).select('+pin');

    // Try to match PIN with any employee
    for (const employee of employees) {
      if (!employee.pin) continue;

      const isMatch = await bcrypt.compare(pin, employee.pin);
      if (isMatch) {
        const { pin: _, ...employeeWithoutPin } = employee.toObject();
        
        return res.json({
          success: true,
          message: 'PIN verified successfully',
          data: employeeWithoutPin,
          requiresPinReset: employee.requiresPinReset || false
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid PIN'
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying PIN',
      error: error.message
    });
  }
};

// Reset PIN
exports.resetPin = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPin, requiresPinReset } = req.body;

    if (!newPin) {
      return res.status(400).json({
        success: false,
        message: 'New PIN is required'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    const employee = await Employee.findByIdAndUpdate(
      id,
      { 
        pin: hashedPin, 
        requiresPinReset: requiresPinReset !== undefined ? requiresPinReset : false,
        lastUpdated: Date.now()
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'PIN reset successfully'
    });
  } catch (error) {
    console.error('Error resetting PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting PIN',
      error: error.message
    });
  }
};


// Toggle employee status
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const newStatus = employee.status === 'active' ? 'inactive' : 'active';

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { status: newStatus, lastUpdated: Date.now() },
      { new: true }
    );

    const { pin, ...employeeWithoutPin } = updatedEmployee.toObject();

    res.json({
      success: true,
      message: `Employee ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: employeeWithoutPin
    });
  } catch (error) {
    console.error('Error toggling employee status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling employee status',
      error: error.message
    });
  }
};

// Get employees by role
exports.getEmployeesByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const employees = await Employee.find({ role }).sort({ dateJoined: -1 }).lean();

    const employeesWithoutPin = employees.map(emp => {
      const { pin, ...rest } = emp;
      return rest;
    });

    res.json({
      success: true,
      count: employeesWithoutPin.length,
      data: employeesWithoutPin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Send temporary PIN via email
exports.sendTemporaryPin = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Generate temporary PIN
    const tempPin = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash and save the temporary PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(tempPin, salt);

    await Employee.findByIdAndUpdate(id, {
      pin: hashedPin,
      requiresPinReset: true,
      lastUpdated: Date.now()
    });

    // Send email with temporary PIN
    if (employee.email) {
      try {
        await sendEmail({
          to: employee.email,
          subject: 'Your Temporary PIN',
          text: `Your temporary PIN is: ${tempPin}\n\nPlease change this PIN after logging in.`,
          html: `<p>Your temporary PIN is: <strong>${tempPin}</strong></p><p>Please change this PIN after logging in.</p>`
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Temporary PIN sent successfully',
      tempPin // Include in response for testing/display purposes
    });
  } catch (error) {
    console.error('Error sending temporary PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending temporary PIN',
      error: error.message
    });
  }
};


// Search employees
exports.searchEmployees = async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const employees = await Employee.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { role: { $regex: query, $options: 'i' } }
      ]
    }).sort({ dateJoined: -1 }).lean();
    
    const employeesWithoutPin = employees.map(emp => {
      const { pin, ...rest } = emp;
      return rest;
    });
    
    res.json({
      success: true,
      count: employeesWithoutPin.length,
      data: employeesWithoutPin
    });
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching employees',
      error: error.message
    });
  }
};

// Update PIN (alias for resetPin)
exports.updatePin = async (req, res) => {
  try {
    const { id } = req.params;
    const { pin, newPin } = req.body;
    
    const pinToSet = newPin || pin;
    
    if (!pinToSet) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pinToSet, salt);
    
    const employee = await Employee.findByIdAndUpdate(
      id,
      { pin: hashedPin, requiresPinReset: false, lastUpdated: Date.now() },
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.json({
      success: true,
      message: 'PIN updated successfully'
    });
  } catch (error) {
    console.error('Error updating PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating PIN',
      error: error.message
    });
  }
};
