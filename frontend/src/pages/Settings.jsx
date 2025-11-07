import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/header';
import { FaBell, FaEdit, FaUser, FaKey, FaPalette } from 'react-icons/fa';
import { SidebarContext } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { isExpanded } = useContext(SidebarContext);
  const { isOwner } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [oldPin, setOldPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [name, setName] = useState('Barbie Dela Cruz');
  const [email, setEmail] = useState('yourname12345@gmail.com');
  const [contactNumber, setContactNumber] = useState('09123478999');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);

  const handlePinInput = (value, index, type) => {
    const updatedPin = [...(type === 'old' ? oldPin : type === 'new' ? newPin : confirmPin)];
    updatedPin[index] = value;
    
    if (type === 'old') {
      setOldPin(updatedPin);
    } else if (type === 'new') {
      setNewPin(updatedPin);
    } else {
      setConfirmPin(updatedPin);
    }

  
    if (value && index < 3) {
      const nextInput = document.getElementById(`${type}-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleSaveProfile = () => {

    setIsEditingName(false);
    setIsEditingEmail(false);
    setIsEditingContact(false);
    alert('Profile saved successfully!');
  };

  const handleUpdatePin = () => {
    if (newPin.join('') !== confirmPin.join('')) {
      alert('New PIN and Confirm PIN do not match!');
      return;
    }
    if (newPin.some(digit => !digit)) {
      alert('Please enter complete PIN');
      return;
    }
    
    alert('PIN updated successfully!');
    setOldPin(['', '', '', '']);
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
  };

  const handleCancelPin = () => {
    setOldPin(['', '', '', '']);
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
  };

  return (
      <div className="p-8 min-h-screen">
        <Header pageName="Account Settings" showBorder={false} />
        
  
        <p className="text-gray-600 mb-6">manage your account settings and preferences</p>

        {isOwner() && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'personal'
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
              onClick={() => navigate('/discount-management')}
              className="px-6 py-3 font-medium transition-all bg-white text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg"
            >
              Discount Management
            </button>
            <button
              onClick={() => navigate('/brand-partners')}
              className="px-6 py-3 font-medium transition-all bg-white text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg"
            >
              Brand Partners
            </button>
          </div>
        )}
    
        <div className="bg-white rounded-2xl shadow-lg p-8">
        
          <div className="grid grid-cols-2 gap-6 mb-8 items-start">
            <div className="flex items-center gap-6 mt-17 ml-40">
              <img 
                src="https://ui-avatars.com/api/?name=Barbie+Dela+Cruz&size=120&background=AD7F65&color=fff" 
                alt="Profile" 
                className="w-40 h-40 rounded-full object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold mb-1">Barbie Dela Cruz</h2>
                <p className="text-[#AD7F65] mb-2">Cashier</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className={`relative transition-all duration-300 ${
              isExpanded ? 'w-full max-w-[580px]' : 'w-full max-w-[700px]'
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
                          <label className="text-xs text-gray-600 shrink-0">Name</label>
                          <div className="flex-1"></div>
                          <button
                            onClick={() => setIsEditingName(!isEditingName)}
                            className="absolute right-0 text-gray-400 hover:text-[#AD7F65] shrink-0"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                        </div>
                        {isEditingName ? (
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
                            onBlur={() => setIsEditingName(false)}
                            autoFocus
                          />
                        ) : (
                          <p className="text-xs font-medium text-gray-800">{name}</p>
                        )}
                      </div>
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
                          <p className="text-xs font-medium text-gray-800">{email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-0.5">Position</label>
                        <p className="text-xs font-medium text-gray-800">Cashier</p>
                      </div>
                    </div>

                   
                    <div className="space-y-4">
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
                      <div>
                        <label className="block text-xs text-gray-600 mb-0.5">Date Joined</label>
                        <p className="text-xs font-medium text-gray-800">Oct. 04, 202</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-1.5 text-sm bg-[#AD7F65] text-white rounded-lg font-medium hover:opacity-90 transition-all"
                    >
                      Save
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
                        {[0,1,2,3].map((i)=>(
                          <input
                            key={i}
                            id={`old-pin-${i}`}
                            type="password"
                            maxLength={1}
                            value={oldPin[i]}
                            onChange={(e)=>handlePinInput(e.target.value, i, "old")}
                            className="w-10 h-10 text-center text-base font-semibold rounded-lg bg-[#FAFAFA] border border-gray-200 
                                       shadow-sm focus:border-[#AD7F65] focus:bg-white focus:shadow-md transition-all outline-none"
                          />
                        ))}
                      </div>
                    </div>

               
                    <div className="flex items-center gap-6 justify-center">
                      <label className="text-sm text-gray-800 font-medium min-w-[80px]">New Pin</label>
                      <div className="flex gap-2">
                        {[0,1,2,3].map((i)=>(
                          <input
                            key={i}
                            id={`new-pin-${i}`}
                            type="password"
                            maxLength={1}
                            value={newPin[i]}
                            onChange={(e)=>handlePinInput(e.target.value, i, "new")}
                            className="w-10 h-10 text-center text-base font-semibold rounded-lg bg-[#FAFAFA] border border-gray-200 
                                       shadow-sm focus:border-[#AD7F65] focus:bg-white focus:shadow-md transition-all outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    
                    <div className="flex items-center gap-6 justify-center">
                      <label className="text-sm text-gray-800 font-medium min-w-[80px]">Confirm PIN</label>
                      <div className="flex gap-2">
                        {[0,1,2,3].map((i)=>(
                          <input
                            key={i}
                            id={`confirm-pin-${i}`}
                            type="password"
                            maxLength={1}
                            value={confirmPin[i]}
                            onChange={(e)=>handlePinInput(e.target.value, i, "confirm")}
                            className="w-10 h-10 text-center text-base font-semibold rounded-lg bg-[#FAFAFA] border border-gray-200 
                                       shadow-sm focus:border-[#AD7F65] focus:bg-white focus:shadow-md transition-all outline-none"
                          />
                        ))}
                      </div>
                    </div>

                  </div>

           
                  <div className="flex justify-center gap-3 mt-8">
                    <button
                      onClick={handleUpdatePin}
                      className="px-6 py-2 bg-[#AD7F65] text-white text-sm rounded-xl font-medium shadow-md hover:opacity-90 transition-all"
                    >
                      Update PIN
                    </button>

                    <button
                      onClick={handleCancelPin}
                      className="px-6 py-2 bg-[#ECECEC] text-gray-700 text-sm rounded-xl font-medium shadow hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>



           <div className={`relative space-y-4 border-t-0 border-l-0 border-r-0 mt-2.5  border-b-0 border-2 p-6 bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] pl-20 pr-20 transition-all duration-300 ${
             isExpanded ? 'w-full max-w-[600px]' : 'w-full max-w-[800px]'
           }`}>
         
            <div className="absolute top-0 pt-4 left-0 right-0 h-1 bg-[radial-gradient(circle_at_center,_#C2A68C_0%,_#AD7F65_50%,_#76462B_100%)] rounded-t-[20px]" style={{ borderRadius: '20px 20px 0 0'           }}></div>
            
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
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    selectedTheme === 'dark'
                        ? 'border-[#76462B] shadow-md'
                        : 'border-[#D8B9A4] shadow-sm'
                    }`}
                >
                    <div className="w-full h-14 rounded-lg bg-[#1E1E1E] shadow-inner"></div>
                    <span className="text-xs text-gray-700 mt-2">Dark Mode</span>
                </button>

         
                <button
                    onClick={() => setSelectedTheme('light')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    selectedTheme === 'light'
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
        </div>
      </div>
  );
};

export default Settings;

