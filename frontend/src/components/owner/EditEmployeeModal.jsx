import { useState } from 'react';
import { FaTimes, FaEdit, FaUser, FaKey, FaUserCheck } from 'react-icons/fa';

const EditEmployeeModal = ({ isOpen, onClose, employee }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [permissions, setPermissions] = useState({
    posTerminal: true,
    inventoryManagement: false,
    viewTransactions: false,
    generateReports: false
  });

  if (!isOpen || !employee) return null;

  const handlePinChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      
      // Auto-focus next input
      if (value && index < 3) {
        document.getElementById(`pin-${index + 1}`)?.focus();
      }
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };

  const togglePermission = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSaveChanges = () => {
    console.log('Saving changes...', { employee, permissions, pin });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10002] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl relative shadow-2xl my-8">
        {/* Header with Radial Gradient Border */}
        <div className="relative overflow-hidden" style={{ borderTopLeftRadius: '30px', borderTopRightRadius: '30px' }}>
          <div
            className="h-[10px] w-full"
            style={{
              background: 'radial-gradient(circle at center, #C2A68C 0%, #AD7F65 50%, #76462B 100%)'
            }}
          />
          <div 
            className="px-6 py-4 flex items-center justify-between"
            style={{
              background: 'radial-gradient(circle at center, #C2A68C 0%, #AD7F65 50%, #76462B 100%)'
            }}
          >
            <div className="flex items-center gap-3">
              <FaUser className="text-white" />
              <h2 className="text-white font-bold text-lg">Edit Employee Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Employee Summary Card */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  {/* Profile Picture */}
                  <div className="w-40 h-40 rounded-full overflow-hidden shrink-0">
                    <img
                      src={employee.image}
                      alt={employee.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Employee Information */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">{employee.name}</h3>
                    <p className="text-sm mb-4" style={{ color: '#FF8C42' }}>{employee.role}</p>
                    
                    {/* Permissions */}
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-sm text-gray-600">Permissions:</label>
                      <div className="flex gap-2">
                        <button className="px-4 py-1 rounded-full text-sm" style={{ backgroundColor: '#F5F0ED', color: '#76462B' }}>
                          POS Terminal
                        </button>
                        <button className="px-4 py-1 rounded-full text-sm" style={{ backgroundColor: '#F5F0ED', color: '#76462B' }}>
                          View Transaction
                        </button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Status:</label>
                      <span
                        className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
                          employee.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {employee.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information Card */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FaUser className="text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-800">Profile Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-gray-500">Name</label>
                      <FaEdit className="text-gray-400 text-xs cursor-pointer hover:text-gray-600" />
                    </div>
                    <p className="text-gray-800 font-medium">{employee.name}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-gray-500">Contact number</label>
                      <FaEdit className="text-gray-400 text-xs cursor-pointer hover:text-gray-600" />
                    </div>
                    <p className="text-gray-800 font-medium">09123478999</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-gray-500">Email</label>
                      <FaEdit className="text-gray-400 text-xs cursor-pointer hover:text-gray-600" />
                    </div>
                    <p className="text-gray-800 font-medium">yourname12345@gmail.com</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-gray-500">Date Joined</label>
                      <FaEdit className="text-gray-400 text-xs cursor-pointer hover:text-gray-600" />
                    </div>
                    <p className="text-gray-800 font-medium">Oct. 04, 2023</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-gray-500">Position</label>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <p className="text-gray-800 font-medium">Employee - {employee.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Change PIN Card */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Radial Gradient Top Border */}
                <div className="relative overflow-hidden" style={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                  <div
                    className="h-[10px] w-full"
                    style={{
                      background: 'radial-gradient(circle at center, #C2A68C 0%, #AD7F65 50%, #76462B 100%)'
                    }}
                  />
                  <div 
                    className="px-4 py-3"
                    style={{
                      background: 'radial-gradient(circle at center, #C2A68C 0%, #AD7F65 50%, #76462B 100%)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FaKey className="text-white" />
                      <h3 className="text-white font-bold text-base">Change PIN</h3>
                    </div>
                    <p className="text-white text-xs ml-7">Note</p>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-4">Enter a new 4-digit PIN for this employee</p>
                  <div className="flex gap-3 mb-4 justify-center">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        id={`pin-${index}`}
                        type="text"
                        maxLength={1}
                        value={pin[index]}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(index, e)}
                        className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                        style={{ borderColor: pin[index] ? '#AD7F65' : '#d1d5db' }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all text-sm"
                      style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
                    >
                      Update PIN
                    </button>
                    <button className="flex-1 px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all font-medium text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {/* User Access Control Card */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FaUserCheck className="text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-800">User Access Control</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Manage permissions</p>
                
                <div className="space-y-4">
                  {/* POS Terminal */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">POS Terminal</p>
                      <p className="text-xs text-gray-500">Access to Point of Sale Terminal</p>
                    </div>
                    <button
                      onClick={() => togglePermission('posTerminal')}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        permissions.posTerminal ? 'bg-[#AD7F65]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          permissions.posTerminal ? 'transform translate-x-7' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Inventory Management */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Inventory Management</p>
                      <p className="text-xs text-gray-500">Add, Edit, Delete Products</p>
                    </div>
                    <button
                      onClick={() => togglePermission('inventoryManagement')}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        permissions.inventoryManagement ? 'bg-[#AD7F65]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          permissions.inventoryManagement ? 'transform translate-x-7' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* View Transactions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">View Transactions</p>
                      <p className="text-xs text-gray-500">View Sales History</p>
                    </div>
                    <button
                      onClick={() => togglePermission('viewTransactions')}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        permissions.viewTransactions ? 'bg-[#AD7F65]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          permissions.viewTransactions ? 'transform translate-x-7' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Generate Reports */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Generate Reports</p>
                      <p className="text-xs text-gray-500">Create and Download Business Reports</p>
                    </div>
                    <button
                      onClick={() => togglePermission('generateReports')}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        permissions.generateReports ? 'bg-[#AD7F65]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          permissions.generateReports ? 'transform translate-x-7' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  className="w-full mt-6 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveChanges}
              className="px-8 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-8 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;

