import { useState, useRef, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import pinIcon from '../../assets/owner/pin.svg';
import cameraIcon from '../../assets/owner/camera.svg';
import circleIcon from '../../assets/owner/circle.svg';
import defaultAvatar from '../../assets/default.jpeg';

const EMPTY_PIN = ['', '', '', '', '', ''];

const EditEmployeeProfile = ({ isOpen, onClose, employee, onEmployeeUpdated }) => {
  const [newPin, setNewPin] = useState(EMPTY_PIN);
  const [confirmPin, setConfirmPin] = useState(EMPTY_PIN);
  const [formData, setFormData] = useState({
    name: '',
    contactNo: '',
    email: '',
    role: '',
    dateJoined: ''
  });
  const [status, setStatus] = useState('Active');
  const [permissions, setPermissions] = useState({
    posTerminal: false,
    inventory: false,
    viewTransactions: false,
    generateReports: false
  });
  const [profilePreview, setProfilePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && employee) {
      setFormData({
        name: employee.name || '',
        contactNo: employee.contactNo || '',
        email: employee.email || '',
        role: employee.role || 'Sales Clerk',
        dateJoined: employee.dateJoinedActual
          ? new Date(employee.dateJoinedActual).toISOString().split('T')[0]
          : ''
      });
      setStatus(employee.status || 'Active');
      setPermissions({
        posTerminal: employee.permissions?.posTerminal ?? false,
        inventory: employee.permissions?.inventory ?? false,
        viewTransactions: employee.permissions?.viewTransactions ?? false,
        generateReports: employee.permissions?.generateReports ?? false
      });
      setProfilePreview(employee.profileImage || employee.image || defaultAvatar);
      setNewPin(EMPTY_PIN);
      setConfirmPin(EMPTY_PIN);
      setMessage('');
      setError('');
    }
    if (!isOpen) {
      setNewPin(EMPTY_PIN);
      setConfirmPin(EMPTY_PIN);
      setMessage('');
      setError('');
    }
  }, [isOpen, employee]);

  const handlePinChange = (index, value, pinType) => {
    if (value && !/^\d$/.test(value)) return;

    if (pinType === 'new') {
      const updatedPin = [...newPin];
      updatedPin[index] = value;
      setNewPin(updatedPin);

      if (value && index < 5) {
        newPinRefs.current[index + 1]?.focus();
      }
    } else {
      const updatedPin = [...confirmPin];
      updatedPin[index] = value;
      setConfirmPin(updatedPin);

      if (value && index < 5) {
        confirmPinRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePinKeyDown = (e, index, pinType) => {
    if (e.key === 'Backspace') {
      if (e.target.value) {
        e.preventDefault();
        if (pinType === 'new') {
          const updatedPin = [...newPin];
          updatedPin[index] = '';
          setNewPin(updatedPin);
        } else {
          const updatedPin = [...confirmPin];
          updatedPin[index] = '';
          setConfirmPin(updatedPin);
        }
      } else if (index > 0) {
        e.preventDefault();
        if (pinType === 'new') {
          newPinRefs.current[index - 1]?.focus();
        } else {
          confirmPinRefs.current[index - 1]?.focus();
        }
      }
    }
  };

  const handlePinPaste = (e, pinType) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.split('').filter(char => /^\d$/.test(char));

    if (pinType === 'new') {
      const updatedPin = [...newPin];
      digits.forEach((digit, i) => {
        if (i < 6) {
          updatedPin[i] = digit;
        }
      });
      setNewPin(updatedPin);
      const nextEmptyIndex = updatedPin.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      newPinRefs.current[focusIndex]?.focus();
    } else {
      const updatedPin = [...confirmPin];
      digits.forEach((digit, i) => {
        if (i < 6) {
          updatedPin[i] = digit;
        }
      });
      setConfirmPin(updatedPin);
      const nextEmptyIndex = updatedPin.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      confirmPinRefs.current[focusIndex]?.focus();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePinUpdate = async () => {
    const pinValue = newPin.join('');
    if (pinValue.length !== 6 || pinValue !== confirmPin.join('')) {
      setError('PINs must match and be 6 digits.');
      return;
    }

    setPinLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${employee._id}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin: pinValue, requiresPinReset: true })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update PIN');
      }
      setMessage('PIN updated successfully.');
      setNewPin(EMPTY_PIN);
      setConfirmPin(EMPTY_PIN);
    } catch (err) {
      setError(err.message || 'Failed to update PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.contactNo) {
      setError('Name, email, and contact number are required.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status,
          permissions,
          profileImage: profilePreview,
          dateJoinedActual: formData.dateJoined
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update employee.');
      }

      setMessage('Employee updated successfully.');
      onEmployeeUpdated?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-10002 p-4 backdrop-blur-sm bg-transparent">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden relative">
        <div className="relative">
          <div
            className="h-[8px] w-full"
            style={{
              background:
                'radial-gradient(circle at center, #C2A68C 0%, #AD7F65 50%, #76462B 100%)',
            }}
          />
          <div
            className="flex justify-between items-center px-8 py-4"
            style={{
              background:
                'linear-gradient(to right, #C2A68C, #AD7F65, #76462B)',
            }}
          >
            <h2 className="text-white font-semibold text-lg">
              Update Employee Profile
            </h2>
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
                onClick={handlePhotoClick}
                className="w-32 h-32 rounded-full overflow-hidden shrink-0 bg-gray-100 relative focus:outline-none"
              >
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <img src={circleIcon} alt="circle" className="w-full h-full object-cover" />
                    <img src={cameraIcon} alt="camera" className="absolute w-10 h-10 inset-0 m-auto" />
                  </>
                )}
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white bg-black/40 px-2 py-0.5 rounded-full">
                  Change Photo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </button>

              <div className="flex flex-col gap-3 flex-1">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="text-2xl font-bold text-gray-800 focus:outline-none border-b border-transparent focus:border-b-[#AD7F65]"
                />

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="text-[#F5A623] font-medium text-base bg-transparent border border-[#F5A623] rounded-lg px-3 py-1 focus:outline-none"
                >
                  {['Cashier', 'Sales Clerk', 'Manager', 'Supervisor', 'Owner'].map((role) => (
                    <option value={role} key={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:border-[#AD7F65]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-16 flex justify-center">
              <div
                className="w-[360px] rounded-2xl shadow-md p-2 pl-10"
                style={{
                  borderTop: '5px solid #AD7F65',
                  backgroundColor: '#fff',
                }}
              >
                <h4 className="font-semibold text-[#76462B] mb-3 flex items-center gap-2">
                  <img src={pinIcon} alt="PIN icon" className="w-5 h-5" />
                  Change PIN
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">New Pin</p>
                    <div className="flex gap-2">
                      {newPin.map((value, i) => (
                        <input
                          key={i}
                          ref={(el) => (newPinRefs.current[i] = el)}
                          type="password"
                          maxLength="1"
                          value={value}
                          onChange={(e) => handlePinChange(i, e.target.value, 'new')}
                          onKeyDown={(e) => handlePinKeyDown(e, i, 'new')}
                          onPaste={(e) => handlePinPaste(e, 'new')}
                          className="w-10 h-10 bg-white border border-gray-300 rounded-lg text-center text-lg shadow-sm focus:outline-none focus:border-[#AD7F65] focus:shadow-md transition-all"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Confirm PIN</p>
                    <div className="flex gap-2">
                      {confirmPin.map((value, i) => (
                        <input
                          key={i}
                          ref={(el) => (confirmPinRefs.current[i] = el)}
                          type="password"
                          maxLength="1"
                          value={value}
                          onChange={(e) => handlePinChange(i, e.target.value, 'confirm')}
                          onKeyDown={(e) => handlePinKeyDown(e, i, 'confirm')}
                          onPaste={(e) => handlePinPaste(e, 'confirm')}
                          className="w-10 h-10 bg-white border border-gray-300 rounded-lg text-center text-lg shadow-sm focus:outline-none focus:border-[#AD7F65] focus:shadow-md transition-all"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-3 justify-end">
                  <button
                    onClick={handlePinUpdate}
                    disabled={pinLoading}
                    className="px-5 py-2 rounded-md text-white text-sm font-medium bg-[#AD7F65] hover:opacity-90 disabled:opacity-50"
                  >
                    {pinLoading ? 'Updating...' : 'Update PIN'}
                  </button>
                  <button
                    onClick={() => {
                      setNewPin(EMPTY_PIN);
                      setConfirmPin(EMPTY_PIN);
                    }}
                    className="px-5 py-2 rounded-md bg-gray-100 text-sm font-medium hover:bg-gray-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
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
                  <p className="text-gray-500 mb-1">Name</p>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#AD7F65]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Contact number</p>
                  <input
                    type="text"
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#AD7F65]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Email</p>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#AD7F65]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Date Joined</p>
                  <input
                    type="date"
                    name="dateJoined"
                    value={formData.dateJoined}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#AD7F65]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Position</p>
                  <input
                    type="text"
                    value={`Employee - ${formData.role}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
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
                  { label: 'POS Terminal', key: 'posTerminal' },
                  { label: 'Inventory', key: 'inventory' },
                  { label: 'View Transactions', key: 'viewTransactions' },
                  { label: 'Generate Reports', key: 'generateReports' },
                ].map(({ label, key }) => (
                  <div
                    key={key}
                    className="flex justify-between items-center border rounded-lg px-3 py-2 text-sm"
                  >
                    <span>{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={permissions[key]}
                        onChange={() => handlePermissionToggle(key)}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#AD7F65] transition-all"></div>
                      <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {(error || message) && (
              <div
                className={`px-4 py-3 rounded-xl text-sm ${
                  error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {error || message}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
                style={{
                  background:
                    'linear-gradient(to right, #C2A68C, #AD7F65, #76462B)',
                }}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-gray-200 font-medium hover:bg-gray-300 transition-all"
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

export default EditEmployeeProfile;
