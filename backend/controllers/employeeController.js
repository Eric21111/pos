const Employee = require('../models/Employee');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .select('-pin') // Exclude PIN from response
      .sort({ dateJoined: -1 })
      .lean();
    
    res.json({
      success: true,
      count: employees.length,
      data: employees
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
    const employee = await Employee.findById(req.params.id)
      .select('-pin'); // Exclude PIN from response
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.json({
      success: true,
      data: employee
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

    const trimmedFirstName = firstName ? firstName.trim() : '';
    const trimmedLastName = lastName ? lastName.trim() : '';
    const derivedName = (name && name.trim()) || `${trimmedFirstName} ${trimmedLastName}`.trim();

    // Validate required fields
    if (!trimmedFirstName || !trimmedLastName || !derivedName || !contactNo || !email || !pin || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, contactNo, email, pin, role'
      });
    }

    // Validate PIN length
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 6 digits'
      });
    }

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    const employeeData = {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      name: derivedName,
      contactNo,
      email: email.toLowerCase(),
      role,
      pin,
      status: status || 'Active',
      profileImage: profileImage || '',
      permissions: permissions || {
        posTerminal: true,
        inventory: false,
        viewTransactions: true,
        generateReports: false
      },
      requiresPinReset: typeof requiresPinReset === 'boolean' ? requiresPinReset : true
    };

    if (dateJoined) {
      employeeData.dateJoined = new Date(dateJoined);
    }

    if (dateJoinedActual) {
      employeeData.dateJoinedActual = new Date(dateJoinedActual);
    }

    const employee = await Employee.create(employeeData);
    
    // Return employee without PIN
    const employeeResponse = employee.toObject();
    delete employeeResponse.pin;

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employeeResponse
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // If PIN is being updated, validate it
    if (updateData.pin) {
      if (updateData.pin.length !== 6 || !/^\d{6}$/.test(updateData.pin)) {
        return res.status(400).json({
          success: false,
          message: 'PIN must be exactly 6 digits'
        });
      }
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingEmployee = await Employee.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee with this email already exists'
        });
      }
      
      employee.email = updateData.email.toLowerCase();
    }

    if (updateData.firstName !== undefined) {
      employee.firstName = updateData.firstName.trim();
    }

    if (updateData.lastName !== undefined) {
      employee.lastName = updateData.lastName.trim();
    }

    if (updateData.contactNo !== undefined) {
      employee.contactNo = updateData.contactNo;
    }

    if (updateData.role !== undefined) {
      employee.role = updateData.role;
    }

    if (updateData.status !== undefined) {
      employee.status = updateData.status;
    }

    if (updateData.profileImage !== undefined) {
      employee.profileImage = updateData.profileImage;
    }

    if (updateData.permissions !== undefined) {
      employee.permissions = updateData.permissions;
    }

    if (updateData.dateJoinedActual) {
      employee.dateJoinedActual = new Date(updateData.dateJoinedActual);
    }

    if (updateData.dateJoined) {
      employee.dateJoined = new Date(updateData.dateJoined);
    }

    if (updateData.requiresPinReset !== undefined) {
      employee.requiresPinReset = updateData.requiresPinReset;
    }

    if (updateData.name) {
      employee.name = updateData.name.trim();
    }

    await employee.save();

    const employeeResponse = employee.toObject();
    delete employeeResponse.pin;

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employeeResponse
    });
  } catch (error) {
    res.status(400).json({
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
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};

// Update PIN
exports.updatePin = async (req, res) => {
  try {
    const { currentPin, newPin, requiresPinReset } = req.body;

    if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'New PIN must be exactly 6 numeric digits'
      });
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (currentPin) {
      const isCurrentValid = await employee.comparePin(currentPin);
      if (!isCurrentValid) {
        return res.status(401).json({
          success: false,
          message: 'Current PIN is incorrect'
        });
      }
    }

    employee.pin = newPin;
    employee.requiresPinReset = typeof requiresPinReset === 'boolean' ? requiresPinReset : false;
    await employee.save();

    const employeeResponse = employee.toObject();
    delete employeeResponse.pin;

    res.json({
      success: true,
      message: 'PIN updated successfully',
      data: employeeResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating PIN',
      error: error.message
    });
  }
};

// Verify PIN (for login)
exports.verifyPin = async (req, res) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Email and PIN are required'
      });
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Employee account is inactive'
      });
    }

    const isPinValid = await employee.comparePin(pin);
    
    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }

    // Return employee data without PIN
    const employeeResponse = employee.toObject();
    delete employeeResponse.pin;

    res.json({
      success: true,
      message: 'PIN verified successfully',
      data: employeeResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying PIN',
      error: error.message
    });
  }
};

// Search employees
exports.searchEmployees = async (req, res) => {
  try {
    const query = req.params.query;
    const employees = await Employee.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { role: { $regex: query, $options: 'i' } }
      ]
    })
    .select('-pin')
    .sort({ dateJoined: -1 });
    
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching employees',
      error: error.message
    });
  }
};

