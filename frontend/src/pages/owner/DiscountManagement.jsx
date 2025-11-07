import { useState } from 'react';
import Header from '../../components/shared/header';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaBox, FaUsers, FaTag, FaCalendar } from 'react-icons/fa';
import sortIcon from '../../assets/sort.svg';
import AddDiscountModal from '../../components/owner/AddDiscountModal';

const icon20Percent = new URL('../../assets/owner/20.png', import.meta.url).href;
const icon50Percent = new URL('../../assets/owner/50.png', import.meta.url).href;
const iconSenior = new URL('../../assets/owner/Senior&ani.png', import.meta.url).href;

const DiscountManagement = () => {
  const { currentUser, isOwner } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [discounts, setDiscounts] = useState([
    {
      id: 1,
      title: '20% OFF',
      discountValue: '20% OFF',
      validFrom: '2025-04-01',
      validTo: '2025-12-31',
      description: 'Fixed 20% off for purchases above P500',
      status: 'active',
      appliesTo: 'All Products',
      usage: { used: 12, total: 50 },
      iconColor: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
      titleColor: '#FF8E53',
      icon: icon20Percent
    },
    {
      id: 2,
      title: 'SENIOR CITIZEN',
      discountValue: '30% OFF',
      validFrom: 'Permanent',
      validTo: null,
      description: 'Senior citizen discount',
      status: 'active',
      appliesTo: 'All Products',
      usage: null,
      iconColor: 'linear-gradient(135deg, #9B59B6 0%, #E91E63 100%)',
      titleColor: '#AD7F65',
      icon: iconSenior
    },
    {
      id: 3,
      title: 'P50 OFF',
      discountValue: 'P50 OFF',
      validFrom: '2025-04-01',
      validTo: '2025-12-31',
      description: '',
      status: 'active',
      appliesTo: 'All Products',
      usage: null,
      iconColor: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      titleColor: '#10B981',
      icon: icon50Percent
    },
    {
      id: 4,
      title: 'ANNIVERSARY SALE',
      discountValue: '50% OFF',
      validFrom: '2025-04-01',
      validTo: '2025-12-31',
      description: '',
      status: 'inactive',
      appliesTo: 'All Products',
      usage: { used: 100, total: 100 },
      iconColor: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      titleColor: '#6B7280',
      icon: iconSenior
    }
  ]);

  const handleToggleStatus = (id) => {
    setDiscounts(discounts.map(discount => 
      discount.id === id 
        ? { ...discount, status: discount.status === 'active' ? 'inactive' : 'active' }
        : discount
    ));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      setDiscounts(discounts.filter(discount => discount.id !== id));
    }
  };

  const handleAddDiscount = (formData) => {
    const newId = Math.max(...discounts.map(d => d.id), 0) + 1;
    
    let icon = icon20Percent;
    let iconColor = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)';
    let titleColor = '#FF8E53';
    
    if (formData.discountValue) {
      const value = parseInt(formData.discountValue);
      if (value >= 50) {
        icon = icon50Percent;
        iconColor = 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)';
        titleColor = '#6B7280';
      } else if (formData.discountName.toLowerCase().includes('senior')) {
        icon = iconSenior;
        iconColor = 'linear-gradient(135deg, #9B59B6 0%, #E91E63 100%)';
        titleColor = '#AD7F65';
      }
    }

    const discountValue = formData.discountType === 'percentage' 
      ? `${formData.discountValue}% OFF`
      : `₱${formData.discountValue} OFF`;

    const appliesToText = formData.appliesTo === 'all' 
      ? 'All Products'
      : formData.appliesTo === 'category'
      ? 'Specific Category'
      : 'Specific Products';

    const newDiscount = {
      id: newId,
      title: formData.discountName.toUpperCase(),
      discountValue: discountValue,
      validFrom: formData.noExpiration ? 'Permanent' : formData.validFrom,
      validTo: formData.noExpiration ? null : formData.validUntil,
      description: formData.description || '',
      status: 'active',
      appliesTo: appliesToText,
      usage: formData.usageLimit && formData.usageLimit !== '0' 
        ? { used: 0, total: parseInt(formData.usageLimit) }
        : null,
      iconColor: iconColor,
      titleColor: titleColor,
      icon: icon
    };

    setDiscounts([...discounts, newDiscount]);
  };

  const filteredDiscounts = discounts.filter(discount =>
    discount.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen">
      <Header 
        pageName="Discount Management"
        profileBackground="bg-gray-100"
        showBorder={false}
        userName={currentUser?.name || 'Owner'}
        userRole="Owner"
      />

      {isOwner() && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-3 font-medium transition-all bg-white text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg"
          >
            Personal Information
          </button>
          <button
            className="px-6 py-3 font-medium transition-all text-white shadow-md rounded-xl"
            style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
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

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1" style={{ maxWidth: '400px' }}>
          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-10 h-9 flex items-center justify-center text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}>
            <FaSearch className="text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search For..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-14 pr-4 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent rounded-xl"
          />
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <img src={sortIcon} alt="Filter" className="w-5 h-5 opacity-90" />
        </button>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
        >
          <FaPlus className="w-4 h-4" />
          Add New Discount
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredDiscounts.map((discount) => (
          <div
            key={discount.id}
            className="rounded-xl overflow-hidden border-2 border-blue-200 shadow-lg flex bg-white"
          >
            <div
              className="w-20 flex items-center justify-center shrink-0"
              style={{ background: discount.iconColor }}
            >
              <img 
                src={discount.icon} 
                alt={discount.title}
                className="w-full h-full object-contain p-2"
              />
            </div>

            <div className="flex-1 bg-white p-4 relative">
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    className="w-7 h-7 flex items-center justify-center bg-amber-100 hover:bg-amber-200 text-amber-700 rounded transition-colors"
                    onClick={() => {}}
                  >
                    <FaEdit className="w-3 h-3" />
                  </button>
                  <button
                    className="w-7 h-7 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                    onClick={() => handleDelete(discount.id)}
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={discount.status === 'active'}
                      onChange={() => handleToggleStatus(discount.id)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      discount.status === 'active'
                        ? 'bg-[#AD7F65] after:border-[#AD7F65]'
                        : 'bg-gray-200 after:border-gray-300'
                    }`}></div>
                  </label>
                </div>

                <div className="flex items-center gap-2 mb-2 pr-32">
                  <h3 
                    className="text-xl font-bold"
                    style={{ color: discount.status === 'inactive' ? '#6B7280' : '#AD7F65' }}
                  >
                    {discount.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      discount.status === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {discount.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FaTag className="text-yellow-500 text-sm" />
                      <span>
                        Discount Value: <span className="font-bold">{discount.discountValue}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FaCalendar className="text-purple-500 text-sm" />
                      <span>
                        Valid only from: {discount.validFrom === 'Permanent' 
                          ? 'Permanent' 
                          : `${discount.validFrom} to ${discount.validTo}`}
                      </span>
                    </div>

                    {discount.description && (
                      <div className="text-xs text-gray-600 italic">
                        {discount.description}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs text-gray-600">
                      <span>
                        Applies to: <span className="font-bold">{discount.appliesTo}</span>
                      </span>
                      <FaBox className="text-blue-400 text-sm" />
                    </div>

                    {discount.usage && (
                      <div className="flex items-center justify-end gap-1.5 text-xs text-gray-600">
                        <span>
                          Used: <span className="font-bold">{discount.usage.used}/{discount.usage.total}</span> times
                        </span>
                        <FaUsers className="text-green-500 text-sm" />
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      <AddDiscountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDiscount}
      />
    </div>
  );
};

export default DiscountManagement;

