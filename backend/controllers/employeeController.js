const { getEmployeeModel } = require('../utils/getModel');
const { mergeDataFromBothSources, getByIdFromBothSources } = require('../utils/mergeData');
const { sendEmail } = require('../utils/emailService');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    // Get employees from both local and cloud
    const employees = await mergeDataFromBothSources('Employee', {}, {
      sort: { dateJoined: -1 }
    });

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
    // Get employee from both local and cloud
    const employee = await getByIdFromBothSources('Employee', req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Remove PIN from response
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

    // Check if email already exists (check both databases)
    const Employee = getEmployeeModel(req);
    const allEmployees = await mergeDataFromBothSources('Employee', {});
    const existingEmployee = allEmployees.find(emp => emp.email?.toLowerCase() === email.toLowerCase());
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

    // Only owner accounts are stored in both databases
    // Other accounts (employees) are stored only in local database
    const isOwner = employeeData.role === 'Owner';
    // ALWAYS save to local first (works offline)
    const dbManager = req.dbManager || require('../config/databaseManager');
    let localConnection = dbManager.getLocalConnection();

    // Ensure local connection exists
    if (!localConnection || localConnection.readyState !== 1) {
      try {
        await dbManager.connectLocalForSync();
        localConnection = dbManager.getLocalConnection();
      } catch (error) {
        console.warn('Could not initialize local connection:', error.message);
      }
    }

    if (!localConnection || localConnection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Local database not available. Employee accounts require local storage.'
      });
    }

    const EmployeeModule = require('../models/Employee');
    const LocalEmployee = localConnection.model('Employee', EmployeeModule.schema);
    let localEmployee = null;

    try {
      localEmployee = await LocalEmployee.create(employeeData);
      console.log('Employee saved to local database');
    } catch (localError) {
      console.error('Failed to write employee to local database:', localError.message);
      return res.status(503).json({
        success: false,
        message: 'Failed to save employee to local database',
        error: localError.message
      });
    }

    // Try to save to cloud if online and owner account (but don't fail if it fails)
    let cloudEmployee = null;
    if (isOwner && req.isOnline && localEmployee) {
      try {
        const Employee = getEmployeeModel(req);
        // Use the same _id from local to ensure consistency
        const cloudEmployeeData = {
          ...employeeData,
          _id: localEmployee._id
        };
        // Use findByIdAndUpdate with upsert to ensure same _id
        cloudEmployee = await Employee.findByIdAndUpdate(
          localEmployee._id,
          cloudEmployeeData,
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        console.log('Owner account also saved to cloud database with same _id:', localEmployee._id);
      } catch (cloudError) {
        console.warn('Failed to write owner account to cloud database:', cloudError.message);
        // Continue with local employee if cloud save fails
        if (localEmployee) {
          console.log('Using local employee since cloud save failed');
        }
      }
    }

    // Use cloud employee if available, otherwise use local
    const employee = cloudEmployee || localEmployee;

    // Return employee without PIN
    const employeeResponse = employee.toObject();
    delete employeeResponse.pin;

    // Send email with temporary PIN
    try {
      const emailSubject = 'Welcome to POS System - Your Temporary PIN';
      const emailText = `Hello ${firstName},\n\nYour account has been created successfully.\n\nYour temporary PIN is: ${pin}\n\nPlease use this PIN to log in. You will be required to change it upon your first login.\n\nBest regards,\nPOS System Team`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #AD7F65;">Welcome to POS System</h2>
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>Your account has been created successfully.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; color: #666;">Your Temporary PIN:</p>
            <h1 style="color: #76462B; letter-spacing: 5px; margin: 10px 0;">${pin}</h1>
          </div>
          <p>Please use this PIN to log in. You will be required to change it upon your first login.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `;

      await sendEmail(email, emailSubject, emailText, emailHtml);
      console.log(`Temporary PIN email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send PIN email:', emailError);
      // Don't fail the request if email fails, just log it
    }

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

    // Check if this is an owner account
    // First, try to find employee to check role
    const allEmployees = await mergeDataFromBothSources('Employee', {});
    const existingEmployee = allEmployees.find(emp => emp._id?.toString() === req.params.id);

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const isOwner = existingEmployee.role === 'Owner';

    let employee;

    // If PIN is being updated, validate it
    if (updateData.pin) {
      if (updateData.pin.length !== 6 || !/^\d{6}$/.test(updateData.pin)) {
        return res.status(400).json({
          success: false,
          message: 'PIN must be exactly 6 digits'
        });
      }
    }

    if (isOwner && req.isOnline) {
      // Owner account: update in cloud
      const Employee = getEmployeeModel(req);
      employee = await Employee.findById(req.params.id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // If email is being updated, check for duplicates
      if (updateData.email) {
        const allEmployees = await mergeDataFromBothSources('Employee', {});
        const emailExists = allEmployees.some(emp =>
          emp.email?.toLowerCase() === updateData.email.toLowerCase() &&
          emp._id?.toString() !== req.params.id
        );
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Employee with this email already exists'
          });
        }

        employee.email = updateData.email.toLowerCase();
      }

      // Update other fields
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

      // Update PIN if provided (will be hashed by pre-save hook)
      if (updateData.pin) {
        employee.pin = updateData.pin;
      }

      await employee.save();

      // Also update in local (owner accounts are in both)
      if (req.dbManager) {
        try {
          const localConnection = req.dbManager.getLocalConnection();
          if (localConnection && localConnection.readyState === 1) {
            const EmployeeModule = require('../models/Employee');
            const LocalEmployee = localConnection.model('Employee', EmployeeModule.schema);
            const localEmployee = await LocalEmployee.findById(employee._id);
            if (localEmployee) {
              Object.assign(localEmployee, updateData);
              if (updateData.pin) {
                localEmployee.pin = updateData.pin;
              }
              await localEmployee.save();
            }
          }
        } catch (localError) {
          console.warn('Failed to update local owner account:', localError.message);
        }
      }
    } else {
      // Non-owner accounts: update ONLY in local
      const localConnection = req.dbManager?.getLocalConnection();
      if (!localConnection || localConnection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: 'Local database not available. Employee accounts require local storage.'
        });
      }

      const EmployeeModule = require('../models/Employee');
      const LocalEmployee = localConnection.model('Employee', EmployeeModule.schema);
      employee = await LocalEmployee.findById(req.params.id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found in local database'
        });
      }

      // If email is being updated, check for duplicates
      if (updateData.email) {
        const allEmployeesCheck = await mergeDataFromBothSources('Employee', {});
        const emailExists = allEmployeesCheck.some(emp =>
          emp.email?.toLowerCase() === updateData.email.toLowerCase() &&
          emp._id?.toString() !== req.params.id
        );
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Employee with this email already exists'
          });
        }

        employee.email = updateData.email.toLowerCase();
      }

      // Update other fields
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

      // Update PIN if provided
      if (updateData.pin) {
        employee.pin = updateData.pin;
      }

      await employee.save();
    }

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

// Update PIN - checks both cloud and local databases
exports.updatePin = async (req, res) => {
  try {
    const { currentPin, newPin, requiresPinReset } = req.body;

    if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'New PIN must be exactly 6 numeric digits'
      });
    }

    const dbManager = require('../config/databaseManager');
    const mongoose = require('mongoose');
    const EmployeeModule = require('../models/Employee');
    const EmployeeSchema = EmployeeModule.schema || EmployeeModule;
    const localConnection = dbManager.getLocalConnection();

    let employee = null;
    let localEmployee = null;

    // Try to find employee in cloud first
    if (dbManager.isConnected() && mongoose.connection.readyState === 1) {
      try {
        const CloudEmployee = mongoose.model('Employee', EmployeeSchema);
        employee = await CloudEmployee.findById(req.params.id);
      } catch (error) {
        console.warn('Error fetching employee from cloud:', error.message);
      }
    }

    // Try to find employee in local
    if (localConnection && localConnection.readyState === 1) {
      try {
        const LocalEmployee = localConnection.model('Employee', EmployeeSchema);
        localEmployee = await LocalEmployee.findById(req.params.id);
      } catch (error) {
        console.warn('Error fetching employee from local:', error.message);
      }
    }

    // Use cloud employee if available, otherwise use local
    if (!employee && localEmployee) {
      employee = localEmployee;
    } else if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Verify current PIN if provided
    if (currentPin) {
      const isCurrentValid = await employee.comparePin(currentPin);
      if (!isCurrentValid) {
        return res.status(401).json({
          success: false,
          message: 'Current PIN is incorrect'
        });
      }
    }

    // Update PIN
    employee.pin = newPin;
    employee.requiresPinReset = typeof requiresPinReset === 'boolean' ? requiresPinReset : false;
    await employee.save();

    // Also update in local if employee exists there and it's a different instance
    if (localEmployee && localEmployee._id.toString() === employee._id.toString() && localEmployee !== employee) {
      try {
        localEmployee.pin = newPin;
        localEmployee.requiresPinReset = typeof requiresPinReset === 'boolean' ? requiresPinReset : false;
        await localEmployee.save();
        console.log('PIN also updated in local database');
      } catch (localError) {
        console.warn('Failed to update PIN in local database:', localError.message);
      }
    }

    // Also update in cloud if employee exists there and it's a different instance
    if (dbManager.isConnected() && mongoose.connection.readyState === 1 && employee !== localEmployee) {
      try {
        const CloudEmployee = mongoose.model('Employee', EmployeeSchema);
        const cloudEmployee = await CloudEmployee.findById(req.params.id);
        if (cloudEmployee) {
          cloudEmployee.pin = newPin;
          cloudEmployee.requiresPinReset = typeof requiresPinReset === 'boolean' ? requiresPinReset : false;
          await cloudEmployee.save();
          console.log('PIN also updated in cloud database');
          // Use cloud employee for response (most up-to-date)
          employee = cloudEmployee;
        }
      } catch (cloudError) {
        console.warn('Failed to update PIN in cloud database:', cloudError.message);
      }
    }

    const employeeResponse = employee.toObject();
    delete employeeResponse.pin;

    res.json({
      success: true,
      message: 'PIN updated successfully',
      data: employeeResponse
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

// Verify PIN (for login) - supports both email-based and PIN-only login
// Checks both cloud and local databases
exports.verifyPin = async (req, res) => {
  try {
    const { email, pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required'
      });
    }

    // Trim and validate PIN format
    const trimmedPin = pin.toString().trim();
    if (trimmedPin.length !== 6 || !/^\d{6}$/.test(trimmedPin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 6 numeric digits'
      });
    }

    const { mergeDataFromBothSources } = require('../utils/mergeData');
    const mongoose = require('mongoose');
    const EmployeeModule = require('../models/Employee');
    const EmployeeSchema = EmployeeModule.schema || EmployeeModule;
    const dbManager = require('../config/databaseManager');
    const localConnection = dbManager.getLocalConnection();

    let employee = null;

    // Get employees from both cloud and local databases using the merge utility
    // This ensures proper deduplication by _id - same ID = same employee
    let allEmployeeDocs = [];

    try {
      // Simplified approach: Fetch directly from both databases
      // This is more reliable than using mergeDataFromBothSources for PIN verification
      const isOnline = dbManager.isConnected();

      // Get from cloud (if online)
      if (isOnline && mongoose.connection.readyState === 1) {
        try {
          const CloudEmployee = mongoose.model('Employee', EmployeeSchema);
          // Explicitly include PIN field (in case it's excluded by default)
          const cloudEmployees = await CloudEmployee.find({ status: 'Active' }).lean(false);
          // Filter to only include employees with PIN and ensure PIN is accessible
          const validCloudEmployees = [];
          for (const emp of cloudEmployees) {
            // Access PIN to ensure it's loaded (Mongoose might lazy-load it)
            const pinValue = emp.pin;
            if (pinValue) {
              validCloudEmployees.push(emp);
            } else {
              // Try to reload with explicit PIN selection
              try {
                const reloaded = await CloudEmployee.findById(emp._id);
                if (reloaded && reloaded.pin) {
                  validCloudEmployees.push(reloaded);
                }
              } catch (reloadError) {
                console.warn(`[verifyPin] Could not reload employee ${emp._id} with PIN:`, reloadError.message);
              }
            }
          }
          allEmployeeDocs = allEmployeeDocs.concat(validCloudEmployees);
          console.log(`[verifyPin] Found ${validCloudEmployees.length} active employees with PIN in cloud`);
        } catch (error) {
          console.warn('Error fetching employees from cloud:', error.message);
        }
      }

      // Get from local
      if (localConnection && localConnection.readyState === 1) {
        try {
          const LocalEmployee = localConnection.model('Employee', EmployeeSchema);
          const localEmployees = await LocalEmployee.find({ status: 'Active' }).lean(false);
          // Deduplicate by _id (don't add if already in cloud list)
          const existingIds = new Set(allEmployeeDocs.map(emp => emp._id?.toString()));
          const uniqueLocalEmployees = [];
          for (const emp of localEmployees) {
            const empId = emp._id?.toString();
            if (existingIds.has(empId)) continue;
            
            const pinValue = emp.pin;
            if (pinValue) {
              uniqueLocalEmployees.push(emp);
            } else {
              // Try to reload with explicit PIN selection
              try {
                const reloaded = await LocalEmployee.findById(emp._id);
                if (reloaded && reloaded.pin) {
                  uniqueLocalEmployees.push(reloaded);
                }
              } catch (reloadError) {
                console.warn(`[verifyPin] Could not reload employee ${emp._id} with PIN:`, reloadError.message);
              }
            }
          }
          allEmployeeDocs = allEmployeeDocs.concat(uniqueLocalEmployees);
          console.log(`[verifyPin] Found ${uniqueLocalEmployees.length} additional active employees with PIN in local`);
        } catch (error) {
          console.warn('Error fetching employees from local:', error.message);
        }
      }

      // Final deduplication pass by _id (safety check)
      const seenIds = new Set();
      allEmployeeDocs = allEmployeeDocs.filter(emp => {
        const id = emp._id?.toString();
        if (!id || !emp.pin) return false;
        if (seenIds.has(id)) {
          console.warn(`[verifyPin] Duplicate employee found with ID: ${id}, removing duplicate`);
          return false;
        }
        seenIds.add(id);
        return true;
      });
      
      console.log(`[verifyPin] Total unique active employees with PIN: ${allEmployeeDocs.length}`);

    } catch (error) {
      console.warn('Error fetching employees using merge utility:', error.message);
      // Fallback to direct query if merge fails
      // Get from cloud (if online)
      if (dbManager.isConnected() && mongoose.connection.readyState === 1) {
        try {
          const CloudEmployee = mongoose.model('Employee', EmployeeSchema);
          const cloudEmployees = await CloudEmployee.find({ status: 'Active' }).select('+pin');
          allEmployeeDocs = allEmployeeDocs.concat(cloudEmployees.filter(emp => emp.pin));
        } catch (error) {
          console.warn('Error fetching employees from cloud:', error.message);
        }
      }

      // Get from local
      if (localConnection && localConnection.readyState === 1) {
        try {
          const LocalEmployee = localConnection.model('Employee', EmployeeSchema);
          const localEmployees = await LocalEmployee.find({ status: 'Active' }).select('+pin');
          // Deduplicate by _id
          const existingIds = new Set(allEmployeeDocs.map(emp => emp._id?.toString()));
          const uniqueLocalEmployees = localEmployees.filter(emp => 
            emp.pin && !existingIds.has(emp._id?.toString())
          );
          allEmployeeDocs = allEmployeeDocs.concat(uniqueLocalEmployees);
        } catch (error) {
          console.warn('Error fetching employees from local:', error.message);
        }
      }

      // Final deduplication pass
      const seenIds = new Set();
      allEmployeeDocs = allEmployeeDocs.filter(emp => {
        const id = emp._id?.toString();
        if (!id) return false;
        if (seenIds.has(id)) {
          console.warn(`[verifyPin] Duplicate employee found with ID: ${id}, removing duplicate`);
          return false;
        }
        seenIds.add(id);
        return true;
      });
    }

    // If email is provided, use email-based lookup (backward compatibility)
    if (email) {
      const emailLower = email.toLowerCase();
      employee = allEmployeeDocs.find(emp => emp.email?.toLowerCase() === emailLower);

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

      // Ensure PIN field is available
      if (!employee.pin) {
        console.error(`Employee ${employee._id} (${employee.email}) has no PIN field`);
        // Try to reload the employee with PIN field explicitly
        const isOnline = dbManager.isConnected();
        if (isOnline && mongoose.connection.readyState === 1) {
          try {
            const CloudEmployee = mongoose.model('Employee', EmployeeSchema);
            const reloadedEmployee = await CloudEmployee.findById(employee._id).select('+pin');
            if (reloadedEmployee && reloadedEmployee.pin) {
              employee = reloadedEmployee;
            }
          } catch (error) {
            console.warn('Error reloading employee from cloud:', error.message);
          }
        }
        
        if (!employee.pin && localConnection && localConnection.readyState === 1) {
          try {
            const LocalEmployee = localConnection.model('Employee', EmployeeSchema);
            const reloadedEmployee = await LocalEmployee.findById(employee._id).select('+pin');
            if (reloadedEmployee && reloadedEmployee.pin) {
              employee = reloadedEmployee;
            }
          } catch (error) {
            console.warn('Error reloading employee from local:', error.message);
          }
        }
        
        if (!employee.pin) {
          return res.status(500).json({
            success: false,
            message: 'Employee PIN data is missing. Please contact administrator.'
          });
        }
      }

      const isPinValid = await employee.comparePin(trimmedPin);

      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid PIN'
        });
      }
    } else {
      // PIN-only login: try PIN against all active employees from both databases
      const matchingEmployees = [];

      // Debug: Log how many employees we're checking
      console.log(`[verifyPin] Checking PIN against ${allEmployeeDocs.length} active employees`);
      
      if (allEmployeeDocs.length === 0) {
        console.warn('[verifyPin] No active employees found in database');
        return res.status(401).json({
          success: false,
          message: 'Invalid PIN'
        });
      }

      for (const empDoc of allEmployeeDocs) {
        if (empDoc.status === 'Active') {
          // Ensure PIN field is available
          if (!empDoc.pin) {
            console.warn(`[verifyPin] Employee ${empDoc._id} (${empDoc.email || empDoc.name}) has no PIN field, skipping`);
            // Try to reload with PIN field
            const isOnline = dbManager.isConnected();
            let reloadedEmp = null;
            
            if (isOnline && mongoose.connection.readyState === 1) {
              try {
                const CloudEmployee = mongoose.model('Employee', EmployeeSchema);
                reloadedEmp = await CloudEmployee.findById(empDoc._id).select('+pin');
              } catch (error) {
                // Continue to try local
              }
            }
            
            if (!reloadedEmp && localConnection && localConnection.readyState === 1) {
              try {
                const LocalEmployee = localConnection.model('Employee', EmployeeSchema);
                reloadedEmp = await LocalEmployee.findById(empDoc._id).select('+pin');
              } catch (error) {
                // Skip if not found
              }
            }
            
            if (reloadedEmp && reloadedEmp.pin) {
              empDoc.pin = reloadedEmp.pin;
            } else {
              continue; // Skip this employee if no PIN available
            }
          }

          try {
            // Debug: Log employee info (without PIN)
            console.log(`[verifyPin] Comparing PIN for employee ${empDoc._id} (${empDoc.name || empDoc.email || 'unknown'})`);
            const isPinValid = await empDoc.comparePin(trimmedPin);
            console.log(`[verifyPin] PIN comparison result for ${empDoc._id}: ${isPinValid}`);
            if (isPinValid) {
              matchingEmployees.push(empDoc);
              console.log(`[verifyPin] PIN match found for employee ${empDoc._id} (${empDoc.name || empDoc.email})`);
            }
          } catch (compareError) {
            console.error(`[verifyPin] Error comparing PIN for employee ${empDoc._id}:`, compareError);
            console.error(`[verifyPin] Error details:`, compareError.message, compareError.stack);
            // Continue to next employee if comparison fails
            continue;
          }
        }
      }

      if (matchingEmployees.length === 0) {
        console.log(`[verifyPin] No employees found with matching PIN`);
        return res.status(401).json({
          success: false,
          message: 'Invalid PIN'
        });
      }

      // If multiple employees have the same PIN, this is a security issue
      if (matchingEmployees.length > 1) {
        console.error(`SECURITY WARNING: Multiple employees (${matchingEmployees.length}) found with the same PIN!`);
        console.error('Matching employees:', matchingEmployees.map(emp => ({
          id: emp._id,
          name: emp.name,
          email: emp.email
        })));

        return res.status(409).json({
          success: false,
          message: 'Multiple accounts found with this PIN. Please contact administrator or use email login.',
          error: 'DUPLICATE_PIN',
          matchingCount: matchingEmployees.length
        });
      }

      // Only one match found - safe to proceed
      employee = matchingEmployees[0];
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
    console.error('[verifyPin] Unexpected error:', error);
    console.error('[verifyPin] Error stack:', error.stack);
    console.error('[verifyPin] Request body:', req.body);
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
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
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

