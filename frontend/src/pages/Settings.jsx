import { useState, useContext, useEffect, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/header';
import { FaBell, FaEdit, FaUser, FaKey, FaPalette, FaBox, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { SidebarContext } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/inventory/SuccessModal';
import defaultAvatar from '../assets/default.jpeg';

const Settings = () => {
  const { isExpanded } = useContext(SidebarContext);
  const { isOwner, currentUser, login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [oldPin, setOldPin] = useState(['', '', '', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [dateJoined, setDateJoined] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isEditingFirstName, setIsEditingFirstName] = useState(false);
  const [isEditingLastName, setIsEditingLastName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [archives, setArchives] = useState([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      const fallbackFirst = currentUser.firstName || currentUser.name?.split(' ')[0] || '';
      const fallbackLast =
        currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || '';

      setFirstName(fallbackFirst);
      setLastName(fallbackLast);
      setEmail(currentUser.email || '');
      setContactNumber(currentUser.contactNo || '');
      setRole(currentUser.role || '');
      setStatus(currentUser.status || '');
      setProfileImage(currentUser.image || currentUser.profileImage || defaultAvatar);

      if (currentUser.dateJoinedActual || currentUser.dateJoined) {
        const date = new Date(currentUser.dateJoinedActual || currentUser.dateJoined);
        setDateJoined(date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }));
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'archives') {
      fetchArchives();
    }
  }, [activeTab]);

  const fetchArchives = async () => {
    setArchivesLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/archive');
      const data = await response.json();

      if (data.success) {
        setArchives(data.data || []);
      } else {
        setArchives([]);
      }
    } catch (error) {
      console.error('Error fetching archives:', error);
      setArchives([]);
    } finally {
      setArchivesLoading(false);
    }
  };

  const handlePinInput = (value, index, type) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const updatedPin = [...(type === 'old' ? oldPin : type === 'new' ? newPin : confirmPin)];
    updatedPin[index] = value;

    if (type === 'old') {
      setOldPin(updatedPin);
    } else if (type === 'new') {
      setNewPin(updatedPin);
    } else {
      setConfirmPin(updatedPin);
    }

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`${type}-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!currentUser?._id && !currentUser?.id) {
      setError('User not found');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setProfileLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/employees/${currentUser._id || currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName} ${lastName}`.trim(),
          email: email.trim().toLowerCase(),
          contactNo: contactNumber.trim(),
          profileImage
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsEditingFirstName(false);
        setIsEditingLastName(false);
        setIsEditingEmail(false);
        setIsEditingContact(false);
        setSuccessMessage('Profile updated successfully!');
        setShowSuccessModal(true);
        const updatedUser = {
          ...currentUser,
          ...(data.data || {}),
          firstName: data.data?.firstName ?? firstName.trim(),
          lastName: data.data?.lastName ?? lastName.trim(),
          name: data.data?.name ?? `${firstName} ${lastName}`.trim(),
          email: data.data?.email ?? email.trim().toLowerCase(),
          contactNo: data.data?.contactNo ?? contactNumber.trim(),
          profileImage: data.data?.profileImage ?? profileImage
        };
        login(updatedUser);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePin = async () => {
    const oldPinValue = oldPin.join('');
    const newPinValue = newPin.join('');
    const confirmPinValue = confirmPin.join('');

    // Validation
    if (oldPinValue.length !== 6) {
      setError('Please enter your current 6-digit PIN');
      return;
    }

    if (newPinValue.length !== 6) {
      setError('New PIN must be 6 digits');
      return;
    }

    if (newPinValue !== confirmPinValue) {
      setError('New PIN and Confirm PIN do not match!');
      return;
    }

    if (!currentUser?._id && !currentUser?.id) {
      setError('User not found');
      return;
    }

    setPinLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/employees/${currentUser._id || currentUser.id}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: oldPinValue,
          newPin: newPinValue,
          requiresPinReset: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('PIN updated successfully!');
        setShowSuccessModal(true);
        setOldPin(['', '', '', '', '', '']);
        setNewPin(['', '', '', '', '', '']);
        setConfirmPin(['', '', '', '', '', '']);
        if (data.data) {
          login({ ...currentUser, ...data.data });
        }
      } else {
        setError(data.message || 'Failed to update PIN');
      }
    } catch (error) {
      console.error('Error updating PIN:', error);
      setError('Failed to update PIN. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleCancelPin = () => {
    setOldPin(['', '', '', '', '', '']);
    setNewPin(['', '', '', '', '', '']);
    setConfirmPin(['', '', '', '', '', '']);
    setError('');
  };

  const computedName = useMemo(() => {
    return [firstName, lastName].filter(Boolean).join(' ') || currentUser?.name || '';
  }, [firstName, lastName, currentUser?.name]);

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="p-8 min-h-screen">
      <Header pageName="Account Settings" showBorder={false} />


      <p className="text-gray-600 mb-6">manage your account settings and preferences</p>

      {isOwner() && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-6 py-3 font-medium transition-all ${activeTab === 'personal'
                ? 'text-white shadow-md rounded-xl'
                : 'bg-white text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg'
              }`}
            style={
              activeTab === 'personal'
                ? { background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }
                : {}
            }
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('archives')}
            className={`px-6 py-3 font-medium transition-all ${activeTab === 'archives'
                ? 'text-white shadow-md rounded-xl'
                : 'bg-white text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg'
              }`}
            style={
              activeTab === 'archives'
                ? { background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }
                : {}
            }
          >
            Archives
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'archives' ? (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archive Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {archivesLoading ? (
                    <tr>
                      <td colSpan="11" className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355] mb-2"></div>
                          <span>Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : archives.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-24 h-24 flex items-center justify-center mb-4">
                            <FaBox className="w-full h-full text-gray-300" />
                          </div>
                          <p className="text-gray-400 text-lg">No Archive yet</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    archives.map((archive, index) => {
                      const archiveNumber = archives.length - index;
                      return (
                        <tr key={archive._id || archive.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                            #{archiveNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {archive.itemImage ? (
                              <img
                                src={archive.itemImage}
                                alt={archive.itemName}
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/50';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                <span className="text-xs">No Image</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                            {archive.sku}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{archive.itemName}</div>
                              {archive.variant && (
                                <div className="text-xs text-gray-500">({archive.variant})</div>
                              )}
                              {archive.selectedSize && (
                                <div className="text-xs text-gray-500">Size: {archive.selectedSize}</div>
                              )}
                              {archive.brandName && (
                                <div className="text-xs text-gray-500">Brand: {archive.brandName}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              {archive.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {archive.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₱{parseFloat(archive.itemPrice || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                              {archive.reason}
                            </span>
                            {archive.returnReason && (
                              <div className="mt-1 text-xs text-gray-600">
                                {archive.returnReason}
                              </div>
                            )}
                            {archive.notes && (
                              <div className="mt-1 text-xs text-gray-500 italic">
                                {archive.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(archive.archivedAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {archive.archivedBy || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => console.log('View archive:', archive)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <FaEye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 mb-8 items-start">
              <div className="flex items-center gap-6 mt-17 ml-40">
                <img
                  src={profileImage}
                  alt={computedName}
                  className="w-40 h-40 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-2xl font-bold mb-1">{computedName}</h2>
                  <p className="text-[#AD7F65] mb-2">{role}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'Active'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      }`}>
                      {status}
                    </span>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg hover:border-[#AD7F65] hover:text-[#AD7F65] transition-colors"
                    >
                      Change Photo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              </div>

              <div className={`relative transition-all duration-300 ${isExpanded ? 'w-full max-w-[580px]' : 'w-full max-w-[700px]'
                }`}>
                <div className="relative border-t-0 border-l-0 border-r-0 border-b-0 border-2  rounded-[30px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">

                  <div className="absolute top-0 pt-4 left-0 right-0 h-1 bg-[radial-gradient(circle_at_center,_#C2A68C_0%,_#AD7F65_50%,_#76462B_100%)] rounded-t-[20px]" style={{ borderRadius: '20px 20px 0 0' }}></div>


                  <div className="flex flex-col px-6 py-8">

                    <div className="flex items-center gap-2 mb-4">
                      <FaUser className="text-[#AD7F65] text-sm" />
                      <h3 className="text-base font-semibold text-[#76462B]">Profile Information</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-4">

                      <div className="space-y-4">
                        <div className="relative">
                          <div className="flex items-center mb-0.5 pr-6">
                            <label className="text-xs text-gray-600 shrink-0">First Name</label>
                            <div className="flex-1"></div>
                            <button
                              onClick={() => setIsEditingFirstName(!isEditingFirstName)}
                              className="absolute right-0 text-gray-400 hover:text-[#AD7F65] shrink-0"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          </div>
                          {isEditingFirstName ? (
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
                              onBlur={() => setIsEditingFirstName(false)}
                              autoFocus
                            />
                          ) : (
                            <p className="text-xs font-medium text-gray-800">{firstName}</p>
                          )}
                        </div>
                        <div className="relative">
                          <div className="flex items-center mb-0.5 pr-6">
                            <label className="text-xs text-gray-600 shrink-0">Last Name</label>
                            <div className="flex-1"></div>
                            <button
                              onClick={() => setIsEditingLastName(!isEditingLastName)}
                              className="absolute right-0 text-gray-400 hover:text-[#AD7F65] shrink-0"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          </div>
                          {isEditingLastName ? (
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
                              onBlur={() => setIsEditingLastName(false)}
                              autoFocus
                            />
                          ) : (
                            <p className="text-xs font-medium text-gray-800">{lastName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-0.5">Position</label>
                          <p className="text-xs font-medium text-gray-800">{role}</p>
                        </div>
                      </div>


                      <div className="space-y-4">
                        <div className="relative">
                          <div className="flex items-center mb-0.5 pr-6">
                            <label className="text-xs text-gray-600 shrink-0">Email</label>
                            <div className="flex-1"></div>
                            <button
                              onClick={() => setIsEditingEmail(!isEditingEmail)}
                              className="absolute right-0 text-gray-400 hover:text-[#AD7F65] shrink-0"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          </div>
                          {isEditingEmail ? (
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
                              onBlur={() => setIsEditingEmail(false)}
                              autoFocus
                            />
                          ) : (
                            <p className="text-xs font-medium text-gray-800 break-all">{email}</p>
                          )}
                        </div>
                        <div className="relative">
                          <div className="flex items-center mb-0.5 pr-6">
                            <label className="text-xs text-gray-600 shrink-0">Contact number</label>
                            <div className="flex-1"></div>
                            <button
                              onClick={() => setIsEditingContact(!isEditingContact)}
                              className="absolute right-0 text-gray-400 hover:text-[#AD7F65] shrink-0"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          </div>
                          {isEditingContact ? (
                            <input
                              type="tel"
                              value={contactNumber}
                              onChange={(e) => setContactNumber(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
                              onBlur={() => setIsEditingContact(false)}
                              autoFocus
                            />
                          ) : (
                            <p className="text-xs font-medium text-gray-800">{contactNumber}</p>
                          )}
                        </div>
                        {role?.toLowerCase() !== 'owner' && (
                          <div>
                            <label className="block text-xs text-gray-600 mb-0.5">Date Joined</label>
                            <p className="text-xs font-medium text-gray-800">{dateJoined}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={profileLoading}
                        className="px-4 py-1.5 text-sm bg-[#AD7F65] text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {profileLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-10 ">
              <div className="relative w-full max-w-md mx-auto">

                <div className="relative pt-4 m-2.5  border-l-0 border-r-0 border-b-0 border-t-0  rounded-[30px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] w-130 h-80">

                  <div className="absolute top-0 pt-4 left-0 right-0 h-1 bg-[radial-gradient(circle_at_center,_#C2A68C_0%,_#AD7F65_50%,_#76462B_100%)] rounded-t-[20px]" style={{ borderRadius: '20px 20px 0 0' }}></div>


                  <div className="flex flex-col items-center justify-center h-full px-6 py-8">

                    <div className="flex items-center gap-2 mb-6 w-full justify-center relative">
                      <FaKey className="text-[#AD7F65] text-lg" />
                      <h3 className="text-[17px] font-semibold text-[#76462B]">Change PIN</h3>
                      <span className="text-xs text-gray-400 absolute right-0">Note</span>
                    </div>


                    <div className="space-y-5 w-full flex flex-col items-center">


                      <div className="flex items-center gap-6 justify-center">
                        <label className="text-sm text-gray-800 font-medium min-w-[80px]">Old Pin</label>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <input
                              key={i}
                              id={`old-pin-${i}`}
                              type="password"
                              maxLength={1}
                              value={oldPin[i]}
                              onChange={(e) => handlePinInput(e.target.value, i, "old")}
                              disabled={pinLoading}
                              className="w-10 h-10 text-center text-base font-semibold rounded-lg bg-[#FAFAFA] border border-gray-200 
                                       shadow-sm focus:border-[#AD7F65] focus:bg-white focus:shadow-md transition-all outline-none disabled:opacity-50"
                            />
                          ))}
                        </div>
                      </div>


                      <div className="flex items-center gap-6 justify-center">
                        <label className="text-sm text-gray-800 font-medium min-w-[80px]">New Pin</label>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <input
                              key={i}
                              id={`new-pin-${i}`}
                              type="password"
                              maxLength={1}
                              value={newPin[i]}
                              onChange={(e) => handlePinInput(e.target.value, i, "new")}
                              disabled={pinLoading}
                              className="w-10 h-10 text-center text-base font-semibold rounded-lg bg-[#FAFAFA] border border-gray-200 
                                       shadow-sm focus:border-[#AD7F65] focus:bg-white focus:shadow-md transition-all outline-none disabled:opacity-50"
                            />
                          ))}
                        </div>
                      </div>


                      <div className="flex items-center gap-6 justify-center">
                        <label className="text-sm text-gray-800 font-medium min-w-[80px]">Confirm PIN</label>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <input
                              key={i}
                              id={`confirm-pin-${i}`}
                              type="password"
                              maxLength={1}
                              value={confirmPin[i]}
                              onChange={(e) => handlePinInput(e.target.value, i, "confirm")}
                              disabled={pinLoading}
                              className="w-10 h-10 text-center text-base font-semibold rounded-lg bg-[#FAFAFA] border border-gray-200 
                                       shadow-sm focus:border-[#AD7F65] focus:bg-white focus:shadow-md transition-all outline-none disabled:opacity-50"
                            />
                          ))}
                        </div>
                      </div>

                    </div>


                    <div className="flex justify-center gap-3 mt-8">
                      <button
                        onClick={handleUpdatePin}
                        disabled={pinLoading}
                        className="px-6 py-2 bg-[#AD7F65] text-white text-sm rounded-xl font-medium shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pinLoading ? 'Updating...' : 'Update PIN'}
                      </button>

                      <button
                        onClick={handleCancelPin}
                        disabled={pinLoading}
                        className="px-6 py-2 bg-[#ECECEC] text-gray-700 text-sm rounded-xl font-medium shadow hover:bg-gray-300 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>



              <div className={`relative space-y-4 border-t-0 border-l-0 border-r-0 mt-2.5  border-b-0 border-2 p-6 bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] pl-20 pr-20 transition-all duration-300 ${isExpanded ? 'w-full max-w-[600px]' : 'w-full max-w-[800px]'
                }`}>

                <div className="absolute top-0 pt-4 left-0 right-0 h-1 bg-[radial-gradient(circle_at_center,_#C2A68C_0%,_#AD7F65_50%,_#76462B_100%)] rounded-t-[20px]" style={{ borderRadius: '20px 20px 0 0' }}></div>

                <div className="mb-3 mt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FaPalette className="text-[#AD7F65] text-base" />
                    <h3 className="text-[17px] font-semibold text-[#76462B]">Preferences</h3>
                  </div>
                  <p className="text-xs text-gray-500">Customize your experience</p>
                </div>

                <div className=" from-white to-[#F5E9E1] shadow-sm">
                  <label className="block text-xs text-[#76462B] mb-2 font-medium">Theme</label>
                  <div className="grid grid-cols-2 gap-4">

                    <button
                      onClick={() => setSelectedTheme('dark')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedTheme === 'dark'
                          ? 'border-[#76462B] shadow-md'
                          : 'border-[#D8B9A4] shadow-sm'
                        }`}
                    >
                      <div className="w-full h-14 rounded-lg bg-[#1E1E1E] shadow-inner"></div>
                      <span className="text-xs text-gray-700 mt-2">Dark Mode</span>
                    </button>


                    <button
                      onClick={() => setSelectedTheme('light')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedTheme === 'light'
                          ? 'border-[#76462B] shadow-md'
                          : 'border-[#D8B9A4] shadow-sm'
                        }`}
                    >
                      <div className="w-full h-14 rounded-lg bg-white shadow-inner"></div>
                      <span className="text-xs text-gray-700 mt-2">Light Mode</span>
                    </button>

                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setError('');
        }}
        message={successMessage}
      />
    </div>
  );
};

export default memo(Settings);

