import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FaBox, FaEdit, FaEye, FaKey, FaPalette, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/default.jpeg';
import SuccessModal from '../components/inventory/SuccessModal';
import Header from '../components/shared/header';
import { useAuth } from '../context/AuthContext';
import { SidebarContext } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { isExpanded } = useContext(SidebarContext);
  const { isOwner, currentUser, login } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [oldPin, setOldPin] = useState(['', '', '', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
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
      const newImageData = reader.result;
      setProfileImage(newImageData);
      setError('');
      handleAutoSaveProfileImage(newImageData);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (overrides = {}) => {
    if (!currentUser?._id && !currentUser?.id) {
      setError('User not found');
      return;
    }

    const mergedProfile = {
      firstName: overrides.firstName ?? firstName,
      lastName: overrides.lastName ?? lastName,
      email: overrides.email ?? email,
      contactNumber: overrides.contactNumber ?? contactNumber,
      profileImage: overrides.profileImage ?? profileImage,
      image: overrides.image ?? overrides.profileImage ?? profileImage
    };

    if (!mergedProfile.firstName?.trim() || !mergedProfile.lastName?.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (!mergedProfile.email?.trim()) {
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
          firstName: mergedProfile.firstName.trim(),
          lastName: mergedProfile.lastName.trim(),
          name: `${mergedProfile.firstName} ${mergedProfile.lastName}`.trim(),
          email: mergedProfile.email.trim().toLowerCase(),
          contactNo: mergedProfile.contactNumber.trim(),
          profileImage: mergedProfile.profileImage,
          image: mergedProfile.image
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
        const apiUser = data.data || {};
        const finalProfileImage =
          apiUser.profileImage || apiUser.image || mergedProfile.profileImage;

        const updatedUser = {
          ...currentUser,
          ...apiUser,
          firstName: apiUser.firstName ?? mergedProfile.firstName.trim(),
          lastName: apiUser.lastName ?? mergedProfile.lastName.trim(),
          name: apiUser.name ?? `${mergedProfile.firstName} ${mergedProfile.lastName}`.trim(),
          email: apiUser.email ?? mergedProfile.email.trim().toLowerCase(),
          contactNo: apiUser.contactNo ?? mergedProfile.contactNumber.trim(),
          profileImage: finalProfileImage,
          image: finalProfileImage
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

  const handleSaveProfile = async () => {
    await saveProfile();
  };

  const handleAutoSaveProfileImage = async (imageData) => {
    await saveProfile({ profileImage: imageData, image: imageData });
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


      <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>manage your account settings and preferences</p>

      {isOwner() && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md ${activeTab === 'personal'
              ? `text-[#AD7F65] border-b-4 border-[#AD7F65] ${theme === 'dark' ? 'bg-[#2A2724]' : 'bg-white'}`
              : `${theme === 'dark' ? 'bg-[#2A2724] text-gray-300 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'}`
              }`}
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('archives')}
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md ${activeTab === 'archives'
              ? `text-[#AD7F65] border-b-4 border-[#AD7F65] ${theme === 'dark' ? 'bg-[#2A2724]' : 'bg-white'}`
              : `${theme === 'dark' ? 'bg-[#2A2724] text-gray-300 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'}`
              }`}
          >
            Archives
          </button>
        </div>
      )}

      <div className={`rounded-2xl shadow-lg p-8 ${theme === 'dark' ? 'bg-[#2A2724]' : 'bg-white'}`}>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'archives' ? (
          <div className={`rounded-2xl shadow-md overflow-hidden ${theme === 'dark' ? 'bg-[#2A2724]' : 'bg-white'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={theme === 'dark' ? 'bg-[#1E1B18]' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Archive Number</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Item Image</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>SKU</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Item Name</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Category</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Quantity</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Price</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Reason</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Date & Time</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Archived By</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'bg-[#2A2724] divide-gray-700' : 'bg-white divide-gray-200'}`}>
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
                  className="w-40 h-40 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-[#AD7F65] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change photo"
                />
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{computedName}</h2>
                  <p className="text-[#AD7F65] mb-2">{role}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
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
                      className={`px-3 py-1 text-xs font-medium border rounded-lg hover:border-[#AD7F65] hover:text-[#AD7F65] transition-colors ${theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'
                        }`}
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
                <div className={`relative border rounded-[30px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${theme === 'dark' ? 'bg-[#2A2724] border-[#4A4037]' : 'bg-white border-transparent'
                  }`}>




                  <div className="flex flex-col px-6 py-8">

                    <div className="flex items-center gap-2 mb-4">
                      <FaUser className="text-[#AD7F65] text-sm" />
                      <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-[#C2A68C]' : 'text-[#76462B]'}`}>Profile Information</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-4">

                      <div className="space-y-4">
                        <div className="relative">
                          <div className="flex items-center mb-0.5 pr-6">
                            <label className={`text-xs shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>First Name</label>
                            <div className="flex-1"></div>
                            <button
                              onClick={() => setIsEditingFirstName(!isEditingFirstName)}
                              className={`absolute right-0 hover:text-[#AD7F65] shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          </div>
                          {isEditingFirstName ? (
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#AD7F65] ${theme === 'dark'
                                ? 'bg-[#1E1B18] border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              onBlur={() => setIsEditingFirstName(false)}
                              autoFocus
                            />
                          ) : (
                            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{firstName}</p>
                          )}
                        </div>
                        <div className="relative">
                          <div className="flex items-center mb-0.5 pr-6">
                            <label className={`text-xs shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Last Name</label>
                            <div className="flex-1"></div>
                            <button
                              onClick={() => setIsEditingLastName(!isEditingLastName)}
                              className={`absolute right-0 hover:text-[#AD7F65] shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          </div>
                          {isEditingLastName ? (
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#AD7F65] ${theme === 'dark'
                                ? 'bg-[#1E1B18] border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              onBlur={() => setIsEditingLastName(false)}
                              autoFocus
                            />
                          ) : (
                            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{lastName}</p>
                          )}
                        </div>
                        <div>
                          <label className={`block text-xs mb-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Position</label>
                          <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{role}</p>
                        </div>
                      </div>


                      <div className="space-y-4">
                        <div className="relative">
                          <div className="flex items-center mb-0.5 pr-6">
                            <label className={`text-xs shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Email</label>
                            <div className="flex-1"></div>
                            <button
                              onClick={() => setIsEditingEmail(!isEditingEmail)}
                              className={`absolute right-0 hover:text-[#AD7F65] shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          </div>
                          {isEditingEmail ? (
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#AD7F65] ${theme === 'dark'
                                ? 'bg-[#1E1B18] border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              onBlur={() => setIsEditingEmail(false)}
                              autoFocus
                            />
                          ) : (
                            <p className={`text-xs font-medium break-all ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{email}</p>
                          )}
                        </div>
                        <div className="relative">
                          <div className="flex items-center mb-0.5 pr-6">
                            <label className={`text-xs shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Contact number</label>
                            <div className="flex-1"></div>
                            <button
                              onClick={() => setIsEditingContact(!isEditingContact)}
                              className={`absolute right-0 hover:text-[#AD7F65] shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                            >
                              <FaEdit className="text-xs" />
                            </button>
                          </div>
                          {isEditingContact ? (
                            <input
                              type="tel"
                              value={contactNumber}
                              onChange={(e) => setContactNumber(e.target.value)}
                              className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#AD7F65] ${theme === 'dark'
                                ? 'bg-[#1E1B18] border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              onBlur={() => setIsEditingContact(false)}
                              autoFocus
                            />
                          ) : (
                            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{contactNumber}</p>
                          )}
                        </div>
                        {role?.toLowerCase() !== 'owner' && (
                          <div>
                            <label className={`block text-xs mb-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Date Joined</label>
                            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{dateJoined}</p>
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

                <div className={`relative pt-4 m-2.5 border rounded-[30px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] w-130 h-80 ${theme === 'dark' ? 'bg-[#2A2724] border-[#4A4037]' : 'bg-white border-transparent'
                  }`}>




                  <div className="flex flex-col items-center justify-center h-full px-6 py-8">

                    <div className="flex items-center gap-2 mb-6 w-full relative">
                      <FaKey className="text-[#AD7F65] text-lg" />
                      <h3 className={`text-[17px] font-semibold ${theme === 'dark' ? 'text-[#C2A68C]' : 'text-[#76462B]'}`}>Change PIN</h3>
                      <span className={`text-xs absolute right-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Note</span>
                    </div>


                    <div className="space-y-5 w-full flex flex-col items-center">


                      <div className="flex items-center gap-6 justify-center">
                        <label className={`text-sm font-medium min-w-[80px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Old Pin</label>
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
                              className={`w-10 h-10 text-center text-base font-semibold rounded-lg border shadow-sm focus:border-[#AD7F65] focus:shadow-md transition-all outline-none disabled:opacity-50 ${theme === 'dark'
                                ? 'bg-[#1E1B18] border-gray-600 text-white focus:bg-[#352F2A]'
                                : 'bg-[#FAFAFA] border-gray-200 text-gray-900 focus:bg-white'
                                }`}
                            />
                          ))}
                        </div>
                      </div>


                      <div className="flex items-center gap-6 justify-center">
                        <label className={`text-sm font-medium min-w-[80px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>New Pin</label>
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
                              className={`w-10 h-10 text-center text-base font-semibold rounded-lg border shadow-sm focus:border-[#AD7F65] focus:shadow-md transition-all outline-none disabled:opacity-50 ${theme === 'dark'
                                ? 'bg-[#1E1B18] border-gray-600 text-white focus:bg-[#352F2A]'
                                : 'bg-[#FAFAFA] border-gray-200 text-gray-900 focus:bg-white'
                                }`}
                            />
                          ))}
                        </div>
                      </div>


                      <div className="flex items-center gap-6 justify-center">
                        <label className={`text-sm font-medium min-w-[80px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Confirm PIN</label>
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
                              className={`w-10 h-10 text-center text-base font-semibold rounded-lg border shadow-sm focus:border-[#AD7F65] focus:shadow-md transition-all outline-none disabled:opacity-50 ${theme === 'dark'
                                ? 'bg-[#1E1B18] border-gray-600 text-white focus:bg-[#352F2A]'
                                : 'bg-[#FAFAFA] border-gray-200 text-gray-900 focus:bg-white'
                                }`}
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
                        className={`px-6 py-2 text-sm rounded-xl font-medium shadow transition-all disabled:opacity-50 ${theme === 'dark'
                          ? 'bg-[#1E1B18] text-gray-300 hover:bg-[#352F2A]'
                          : 'bg-[#ECECEC] text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>



              <div className={`relative space-y-4 border mt-2.5 p-6 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] pl-20 pr-20 transition-all duration-300 ${theme === 'dark' ? 'bg-[#2A2724] border-[#4A4037]' : 'bg-white border-transparent'
                } ${isExpanded ? 'w-full max-w-[580px]' : 'w-full max-w-[700px]'
                }`}>



                <div className="mb-3 mt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FaPalette className="text-[#AD7F65] text-base" />
                    <h3 className={`text-[17px] font-semibold ${theme === 'dark' ? 'text-[#C2A68C]' : 'text-[#76462B]'}`}>Preferences</h3>
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Customize your experience</p>
                </div>

                <div className=" from-white to-[#F5E9E1] shadow-sm">
                  <label className={`block text-xs mb-2 font-medium ${theme === 'dark' ? 'text-[#C2A68C]' : 'text-[#76462B]'}`}>Theme</label>
                  <div className="grid grid-cols-2 gap-4">

                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                        ? 'border-[#AD7F65] shadow-md'
                        : 'border-[#D8B9A4] shadow-sm'
                        }`}
                    >
                      <div className="w-full h-14 rounded-lg bg-[#1E1B18] shadow-inner"></div>
                      <span className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Dark Mode</span>
                    </button>


                    <button
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light'
                        ? 'border-[#AD7F65] shadow-md'
                        : 'border-[#D8B9A4] shadow-sm'
                        }`}
                    >
                      <div className="w-full h-14 rounded-lg bg-white shadow-inner"></div>
                      <span className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Light Mode</span>
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

