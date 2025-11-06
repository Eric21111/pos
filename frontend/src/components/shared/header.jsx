import { FaBell, FaSearch } from 'react-icons/fa';
import sortIcon from '../../assets/sort.svg';
import { useContext } from 'react';
import { SidebarContext } from '../../context/SidebarContext';

const Header = ({ 
  pageName, 
  showSearch = false, 
  showFilter = false,
  searchValue = '',
  onSearchChange = null,
  userName = 'Barbie Dela Cruz',
  userRole = 'Staff',
  profileBackground = 'bg-white',
  showBorder = true,
  className = '',
  hidePageName = false,
  centerProfile = false,
  filterNextToSearch = false
}) => {
  const { isExpanded: sidebarExpanded } = useContext(SidebarContext) || { isExpanded: false };
  return (
    <div className={`relative flex items-center justify-between ${showBorder ? 'mb-6 pb-4 border-b' : ''} ${className}`}>
   
      <div className="flex items-center gap-4">
        {showSearch ? (
          <>
            {!hidePageName && <h1 className="text-3xl font-bold">{pageName}</h1>}
            <div className={`relative transition-all duration-300 ease-in-out ${sidebarExpanded ? 'w-[472px]' : 'w-178'}`}>
              <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-10 h-9 flex items-center justify-center text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}>
                <FaSearch className="text-sm" />
              </div>
              <input
                type="text"
                placeholder="Search For..."
                value={searchValue}
                onChange={onSearchChange || (() => {})}
                className={`w-full h-11 pl-14 pr-4 border border-gray-300 bg-white rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent`}
              />
            </div>
            {filterNextToSearch && showFilter && (
              <button className="ml-2 w-12 h-10 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_22px_rgba(0,0,0,0.16)]">
                <img src={sortIcon} alt="Sort" className="w-5 h-5 opacity-90" />
              </button>
            )}
          </>
        ) : (
          !hidePageName && <h1 className="text-3xl font-bold">{pageName}</h1>
        )}
      </div>

    
      {centerProfile && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_26px_rgba(0,0,0,0.16)]">
              <FaBell className="text-gray-800 text-2xl" />
            </button>
            <div className={`flex items-center gap-4 ${profileBackground} px-7 py-2.5 rounded-full border border-gray-200 shadow-[0_6px_14px_rgba(0,0,0,0.15)] min-w-[300px]`}>
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=AD7F65&color=fff`}
              alt="User" 
              className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm object-cover"
            />
            <div>
              <div className="text-sm font-semibold">{userName}</div>
              <div className="text-xs text-gray-500">{userRole}</div>
            </div>
            </div>
          </div>
        </div>
      )}

   
      <div className="flex items-center gap-5">
        {!centerProfile && showFilter && !filterNextToSearch && (
          <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-[0_10px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_26px_rgba(0,0,0,0.16)]">
            <img src={sortIcon} alt="Sort" className="w-5 h-5 opacity-90" />
          </button>
        )}
        {!centerProfile && (
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_26px_rgba(0,0,0,0.16)] relative">
            <FaBell className="text-gray-800 text-2xl" />
          </button>
        )}
        {!centerProfile && (
          <div className={`flex items-center gap-4 ${profileBackground} px-7 py-2.5 rounded-full border border-gray-200 shadow-[0_6px_14px_rgba(0,0,0,0.15)] min-w-[300px]`}>
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=AD7F65&color=fff`}
              alt="User" 
              className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm object-cover"
            />
            <div>
              <div className="text-sm font-semibold">{userName}</div>
              <div className="text-xs text-gray-500">{userRole}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;

