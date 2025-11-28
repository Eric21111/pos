import { useState, useRef, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import circleIcon from '../../assets/owner/circle.svg';
import cameraIcon from '../../assets/owner/camera.svg';

const getDisplayDate = () =>
  new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

const getTodayISO = () => new Date().toISOString().split('T')[0];

const AddEmployeeModal = ({ isOpen, onClose, onEmployeeAdded, onEmployeeCreated }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNo: '+63',
    email: '',
    role: 'Sales Clerk',
    dateCreated: getDisplayDate(),
    dateJoined: getTodayISO(),
  });
  const [accessControl, setAccessControl] = useState({
    posTerminal: true,
    inventory: false,
    viewTransactions: true,
    generateReports: false,
  });
  const [profilePreview, setProfilePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Generate random 6-digit PIN
  const generateRandomPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        contactNo: '+63',
        email: '',
        role: 'Sales Clerk',
        dateCreated: getDisplayDate(),
        dateJoined: getTodayISO(),
      });
      setAccessControl({
        posTerminal: true,
        inventory: false,
        viewTransactions: true,
        generateReports: false,
      });
      setProfilePreview('');
    }
  }, [isOpen]);
  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccessControlToggle = (key) => {
    setAccessControl((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddEmployee = async () => {
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.contactNo || !formData.dateJoined) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setLoading(true);

    // Generate random temporary PIN
    const tempPin = generateRandomPin();

    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          contactNo: formData.contactNo,
          email: formData.email,
          role: formData.role,
          pin: tempPin,
          dateJoined: new Date(formData.dateCreated),
          dateJoinedActual: new Date(formData.dateJoined),
          profileImage: profilePreview,
          permissions: accessControl,
          requiresPinReset: true
        })
      });

      const data = await response.json();

      if (data.success) {
        const employeeName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          contactNo: '+63',
          email: '',
          role: 'Sales Clerk',
          dateCreated: getDisplayDate(),
          dateJoined: getTodayISO(),
        });
        setAccessControl({
          posTerminal: true,
          inventory: false,
          viewTransactions: true,
          generateReports: false,
        });
        setProfilePreview('');
        
        // Close add modal
        onClose();
        
        // Notify parent to show temporary PIN modal
        if (onEmployeeCreated) {
          onEmployeeCreated(employeeName, tempPin);
        }
        
        // Refresh employee list
        if (onEmployeeAdded) {
          onEmployeeAdded();
        }
      } else {
        setError(data.message || 'Failed to add employee');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      setError('Failed to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10002] p-4 backdrop-blur-sm bg-transparent">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden relative">
        <div className="relative">
          <div
            className="flex justify-between items-center px-8 py-4"
            style={{
              background:
                'linear-gradient(to right, #C2A68C, #AD7F65, #76462B)',
            }}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold text-lg">
                Add New Employee
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 p-8">
          <div>
            <div className="flex items-start gap-6">
              <button
                type="button"
                onClick={handleImageSelect}
                className="w-60 h-60 ml-30 mt-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center relative focus:outline-none"
              >
                {profilePreview ? (
                  <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <img src={circleIcon} alt="Circle background" className="w-full h-full object-cover" />
                    <img src={cameraIcon} alt="Camera" className="absolute w-20 h-20 opacity-80" />
                    <span className="absolute bottom-6 text-white text-sm font-medium">Upload Photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl shadow-md"
              style={{ borderTop: '5px solid #AD7F65' }}
            >
              <h4 className="font-semibold text-[#76462B] mb-4">
                Profile Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">First Name (Username)</p>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="e.g. John"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#AD7F65]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Last Name</p>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g. Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#AD7F65]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Contact No.</p>
                  <input
                    type="text"
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#AD7F65]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Email</p>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#AD7F65]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Role/Position</p>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#AD7F65] bg-white"
                  >
                    <option value="Sales Clerk">Sales Clerk</option>
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Date Created</p>
                  <input
                    type="text"
                    name="dateCreated"
                    value={formData.dateCreated}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#AD7F65] bg-gray-50"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Date Joined</p>
                  <input
                    type="date"
                    name="dateJoined"
                    value={formData.dateJoined}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#AD7F65] bg-white"
                  />
                </div>
              </div>
            </div>

            <div
              className="p-6 rounded-2xl shadow-md"
              style={{ borderTop: '5px solid #AD7F65' }}
            >
              <h4 className="font-semibold text-[#76462B] mb-4">
                User Access Control
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'POS Terminal',
                  'Inventory',
                  'View Transactions',
                  'Generate Reports',
                ].map((item, idx) => {
                  const accessKey = item === 'POS Terminal' ? 'posTerminal' :
                                   item === 'Inventory' ? 'inventory' :
                                   item === 'View Transactions' ? 'viewTransactions' :
                                   'generateReports';
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center border rounded-lg px-3 py-2 text-sm"
                    >
                      <span>{item}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={accessControl[accessKey]}
                          onChange={() => handleAccessControlToggle(accessKey)}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#AD7F65] transition-all"></div>
                        <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleAddEmployee}
                disabled={loading}
                className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    'linear-gradient(to right, #C2A68C, #AD7F65, #76462B)',
                }}
              >
                {loading ? 'Adding...' : 'Add Employee'}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-gray-200 font-medium hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;

