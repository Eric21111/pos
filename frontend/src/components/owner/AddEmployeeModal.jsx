import { useState, useRef, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import pinIcon from '../../assets/owner/pin.svg';
import circleIcon from '../../assets/owner/circle.svg';
import cameraIcon from '../../assets/owner/camera.svg';

const AddEmployeeModal = ({ isOpen, onClose }) => {
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [formData, setFormData] = useState({
    name: '',
    contactNo: '+63',
    email: '',
    role: 'Sales Clerk',
    dateJoined: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  });
  const [accessControl, setAccessControl] = useState({
    posTerminal: true,
    inventory: false,
    viewTransactions: true,
    generateReports: false,
  });

  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) {
      setNewPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setFormData({
        name: '',
        contactNo: '+63',
        email: '',
        role: 'Sales Clerk',
        dateJoined: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      });
      setAccessControl({
        posTerminal: true,
        inventory: false,
        viewTransactions: true,
        generateReports: false,
      });
    }
  }, [isOpen]);

  const handlePinChange = (index, value, pinType) => {
    if (value && !/^\d$/.test(value)) return;

    if (pinType === 'new') {
      const updatedPin = [...newPin];
      updatedPin[index] = value;
      setNewPin(updatedPin);

      if (value && index < 3) {
        newPinRefs.current[index + 1]?.focus();
      }
    } else {
      const updatedPin = [...confirmPin];
      updatedPin[index] = value;
      setConfirmPin(updatedPin);

      if (value && index < 3) {
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
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    const digits = pastedData.split('').filter(char => /^\d$/.test(char));

    if (pinType === 'new') {
      const updatedPin = [...newPin];
      digits.forEach((digit, i) => {
        if (i < 4) {
          updatedPin[i] = digit;
        }
      });
      setNewPin(updatedPin);
      const nextEmptyIndex = updatedPin.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex === -1 ? 3 : nextEmptyIndex;
      newPinRefs.current[focusIndex]?.focus();
    } else {
      const updatedPin = [...confirmPin];
      digits.forEach((digit, i) => {
        if (i < 4) {
          updatedPin[i] = digit;
        }
      });
      setConfirmPin(updatedPin);
      const nextEmptyIndex = updatedPin.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex === -1 ? 3 : nextEmptyIndex;
      confirmPinRefs.current[focusIndex]?.focus();
    }
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

  const handleUpdatePin = () => {
    if (newPin.join('') === confirmPin.join('') && newPin.join('').length === 4) {
      console.log('PIN updated:', newPin.join(''));
    }
  };

  const handleAddEmployee = () => {
    console.log('Adding employee:', { formData, accessControl, pin: newPin.join('') });
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
              <div className="w-60 h-60 ml-30 mt-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                <img src={circleIcon} alt="Circle background" className="w-full h-full object-cover" />
                <img src={cameraIcon} alt="Camera" className="absolute w-20 h-20" />
              </div>
            </div>

            <div className="mt-16 flex justify-center">
              <div
                className="w-[360px] rounded-2xl shadow-md p-2 pl-10 pr-10"
                style={{
                  borderTop: '5px solid #AD7F65',
                  backgroundColor: '#fff',
                }}
              >
                <h4 className="font-semibold text-[#76462B] mb-3 flex items-center gap-2">
                  <img src={pinIcon} alt="PIN icon" className="w-5 h-5" />
                  Set PIN
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">New Pin</p>
                    <div className="flex gap-2">
                      {Array(4)
                        .fill('')
                        .map((_, i) => (
                          <input
                            key={i}
                            ref={(el) => (newPinRefs.current[i] = el)}
                            type="password"
                            maxLength="1"
                            value={newPin[i]}
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
                      {Array(4)
                        .fill('')
                        .map((_, i) => (
                          <input
                            key={i}
                            ref={(el) => (confirmPinRefs.current[i] = el)}
                            type="password"
                            maxLength="1"
                            value={confirmPin[i]}
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
                    onClick={handleUpdatePin}
                    className="px-5 py-2 rounded-md text-white text-sm font-medium bg-[#AD7F65] hover:opacity-90"
                  >
                    Update PIN
                  </button>
                  <button className="px-5 py-2 rounded-md bg-gray-100 text-sm font-medium hover:bg-gray-200">
                    Cancel
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
                    placeholder="eg. John Doe"
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
                    placeholder="yourname12345@gmail.com"
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
                  <p className="text-gray-500 mb-1">Date Joined</p>
                  <input
                    type="text"
                    name="dateJoined"
                    value={formData.dateJoined}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#AD7F65] bg-gray-50"
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

            <div className="flex justify-end gap-3">
              <button
                onClick={handleAddEmployee}
                className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                style={{
                  background:
                    'linear-gradient(to right, #C2A68C, #AD7F65, #76462B)',
                }}
              >
                Add Employee
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

export default AddEmployeeModal;

