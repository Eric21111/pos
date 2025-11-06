import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import terminalIcon from '../../assets/icons/terminal.svg';
import inventoryIcon from '../../assets/icons/invenory.svg';
import transactionIcon from '../../assets/icons/transaction.svg';
import settingsIcon from '../../assets/icons/Settings.svg';
import logoutIcon from '../../assets/icons/Logout.svg';
import dashboardIcon from '../../assets/owner/dashboard.svg';
import reportsIcon from '../../assets/owner/reports.svg';
import manageIcon from '../../assets/owner/manage.svg';
import LogoutConfirmationModal from './LogoutConfirmationModal';

import logo from '../../assets/logo.png';

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout, isOwner } = useAuth();

  // Define all menu items in the correct order
  const allMenuItems = [
    {
      name: 'Dashboard',
      icon: dashboardIcon,
      path: '/dashboard',
      gradient: 'linear-gradient(135deg, #C2A68C 0%, #AD7F65 50%, #76462B 100%)',
      ownerOnly: true
    },
    {
      name: 'POS / Terminal',
      icon: terminalIcon,
      path: '/terminal',
      gradient: 'linear-gradient(135deg, #C2A68C 0%, #AD7F65 50%, #76462B 100%)',
      ownerOnly: false
    },
    {
      name: 'Inventory',
      icon: inventoryIcon,
      path: '/inventory',
      gradient: 'linear-gradient(135deg, #C2A68C 0%, #AD7F65 50%, #76462B 100%)',
      ownerOnly: false
    },
    {
      name: 'Transactions',
      icon: transactionIcon,
      path: '/transactions',
      gradient: 'linear-gradient(135deg, #C2A68C 0%, #AD7F65 50%, #76462B 100%)',
      ownerOnly: false
    },
    {
      name: 'Reports / Analytics',
      icon: reportsIcon,
      path: '/reports',
      gradient: 'linear-gradient(135deg, #C2A68C 0%, #AD7F65 50%, #76462B 100%)',
      ownerOnly: true
    },
    {
      name: 'Manage Employees',
      icon: manageIcon,
      path: '/manage-employees',
      gradient: 'linear-gradient(135deg, #C2A68C 0%, #AD7F65 50%, #76462B 100%)',
      ownerOnly: true
    },
    {
      name: 'Settings',
      icon: settingsIcon,
      path: '/settings',
      gradient: 'linear-gradient(135deg, #C2A68C 0%, #AD7F65 50%, #76462B 100%)',
      ownerOnly: false
    }
  ];

  // Filter menu items based on user role
  const menuItems = isOwner() 
    ? allMenuItems
    : allMenuItems.filter(item => !item.ownerOnly);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    console.log('Logging out...');
    setShowLogoutModal(false);
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      
      <div
        className={`fixed left-0 top-0 h-screen bg-white transition-all duration-300 ease-in-out z-50 flex flex-col cursor-pointer ${
          isExpanded ? 'w-70' : 'w-20'
        }`}
        style={{
          borderRadius: '0 30px 30px 0',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
      
        <div 
          className="relative flex items-center justify-center border-b border-gray-100 px-6 py-6 h-[140px] overflow-hidden"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <div className="transition-all duration-300 flex items-center justify-center w-full">
            <img 
              src={logo} 
              alt="Create Your Style Logo" 
              className={`transition-all duration-300 object-contain ${
                isExpanded ? 'w-48 h-auto max-h-28' : 'w-10 h-10'
              }`}
              style={{ 
                display: 'block !important',
                maxWidth: '100%',
                visibility: 'visible',
                filter: 'invert(53%) sepia(23%) saturate(828%) hue-rotate(343deg) brightness(92%) contrast(91%)'
              }}
              onLoad={() => console.log('✅ Logo loaded successfully:', logo)}
              onError={(e) => {
                console.error('❌ Logo failed to load:', logo);
                e.target.style.display = 'block';
                e.target.alt = 'Logo loading error';
              }}
            />
          </div>
          {!isExpanded && (
            <div className="absolute right-2 top-2">
              <FaChevronRight className="text-gray-400 w-4 h-4" />
            </div>
          )}
          {isExpanded && (
            <div className="absolute right-2 top-2">
              <FaChevronLeft className="text-gray-400 w-4 h-4" />
            </div>
          )}
        </div>

        
        <nav className={`flex-1 overflow-hidden pb-8 px-2 ${
          isExpanded ? 'pt-15' : 'pt-15'
        }`}>
          <div className="space-y-3">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                  className={`w-full flex items-center rounded-2xl transition-all duration-300 group relative overflow-hidden py-3.5 ${
                    active 
                      ? 'shadow-lg' 
                      : 'hover:bg-gray-50'
                  }`}
                  style={active ? {
                    background: item.gradient,
                    boxShadow: '0 4px 12px rgba(118, 70, 43, 0.25)'
                  } : {}}
                >
              
                  <div className="shrink-0 w-7 h-7 flex items-center justify-center ml-4">
                    <img 
                      src={item.icon} 
                      alt={item.name}
                      className={`w-6 h-6 transition-all duration-300 ${
                        active ? 'brightness-0 invert' : 'opacity-80 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                  
                
                  {isExpanded && (
                    <span
                      className={`font-medium transition-all duration-300 whitespace-nowrap ml-4 ${
                        active ? 'text-white' : 'text-gray-800 group-hover:text-[#76462B]'
                      }`}
                      style={{
                        fontSize: '16px'
                      }}
                    >
                      {item.name}
                    </span>
                  )}

                 
                  {active && (
                    <div 
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.08) 100%)',
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

       
        <div className="border-t border-gray-100 py-6 px-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            className="w-full flex items-center rounded-2xl transition-all duration-300 hover:bg-gray-50 group py-3.5"
          >
            <div className="shrink-0 w-7 h-7 flex items-center justify-center ml-4">
              <img 
                src={logoutIcon} 
                alt="Log Out"
                className="w-6 h-6 opacity-80 group-hover:opacity-100 transition-all duration-300"
              />
            </div>
            {isExpanded && (
              <span
                className="font-medium text-gray-800 group-hover:text-[#76462B] transition-all duration-300 whitespace-nowrap ml-4"
                style={{
                  fontSize: '16px'
                }}
              >
                Log Out
              </span>
            )}
          </button>
        </div>
      </div>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
};

export default Sidebar;

