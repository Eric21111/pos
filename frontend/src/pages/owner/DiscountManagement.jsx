import { useState, useEffect, memo } from 'react';
import Header from '../../components/shared/header';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaBox, FaUsers, FaTag, FaCalendar } from 'react-icons/fa';
import filterIcon from '../../assets/filter.svg';
import AddDiscountModal from '../../components/owner/AddDiscountModal';

const icon20Percent = new URL('../../assets/owner/20.png', import.meta.url).href;
const icon50Percent = new URL('../../assets/owner/50.png', import.meta.url).href;
const iconSenior = new URL('../../assets/owner/Senior&ani.png', import.meta.url).href;

const DiscountManagement = () => {
  const { currentUser, isOwner } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Helper function to determine icon and colors based on discount data
  const getDiscountIcon = (discount) => {
    const title = discount.title?.toLowerCase() || '';
    const discountValue = discount.discountValue || '';
    
    if (title.includes('senior')) {
      return {
        icon: iconSenior,
        iconColor: 'linear-gradient(135deg, #9B59B6 0%, #E91E63 100%)',
        titleColor: '#AD7F65'
      };
    }
    
    // Extract numeric value from discountValue
    const match = discountValue.match(/(\d+)/);
    if (match) {
      const value = parseInt(match[1]);
      if (value >= 50) {
        return {
          icon: icon50Percent,
          iconColor: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
          titleColor: '#6B7280'
        };
      }
    }
    
    return {
      icon: icon20Percent,
      iconColor: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
      titleColor: '#FF8E53'
    };
  };

  // Fetch discounts from API
  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/discounts');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Format discounts with icons and colors
        const formattedDiscounts = data.data.map(discount => {
          const iconData = getDiscountIcon(discount);
          return {
            ...discount,
            ...iconData
          };
        });
        setDiscounts(formattedDiscounts);
      } else {
        console.warn('Invalid response format:', data);
        setDiscounts([]);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      setDiscounts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const discount = discounts.find(d => d._id === id);
      if (!discount) return;
      
      const newStatus = discount.status === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`http://localhost:5000/api/discounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh discounts from API
        fetchDiscounts();
      } else {
        alert('Failed to update discount status');
      }
    } catch (error) {
      console.error('Error updating discount status:', error);
      alert('Error updating discount status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/discounts/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh discounts from API
        fetchDiscounts();
      } else {
        alert('Failed to delete discount');
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Error deleting discount');
    }
  };

  const handleAddDiscount = async (formData) => {
    try {
      const discountData = {
      title: formData.discountName.toUpperCase(),
        discountCode: formData.discountCode || '',
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        appliesTo: formData.appliesTo,
        category: formData.appliesTo === 'category' ? formData.category : null,
        validFrom: formData.noExpiration ? null : formData.validFrom,
        validUntil: formData.noExpiration ? null : formData.validUntil,
        noExpiration: formData.noExpiration,
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : 0,
        maxPurchaseAmount: formData.maxPurchaseAmount ? parseFloat(formData.maxPurchaseAmount) : null,
        usageLimit: formData.usageLimit && formData.usageLimit !== '0' ? parseInt(formData.usageLimit) : null,
      description: formData.description || '',
        status: 'active'
      };
      
      const response = await fetch('http://localhost:5000/api/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(discountData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh discounts from API
        fetchDiscounts();
      } else {
        alert('Failed to create discount: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating discount:', error);
      alert('Error creating discount');
    }
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

      

      <div className="flex items-center gap-4 mb-6 justify-between mt-5">
        <div className="flex items-center gap-2">
          <div className="relative" style={{ maxWidth: '400px' }}>
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-10 h-9 flex items-center justify-center text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}>
              <FaSearch className="text-sm" />
            </div>
            <input
              type="text"
              placeholder="Search For..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[500px] h-11 pl-14 pr-4 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent rounded-xl"
            />
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg ml-23">
            <img src={filterIcon} alt="Filter" className="w-5 h-5 opacity-90" />
          </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
        >
          <FaPlus className="w-4 h-4" />
          Add New Discount
        </button>
      </div>

     

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading discounts...</div>
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">No discounts found. Create your first discount!</div>
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-6">
        {filteredDiscounts.map((discount) => (
          <div
              key={discount._id}
            className="rounded-xl overflow-hidden border-2 border-blue-200 shadow-lg flex bg-white"
          >
            <div
              className="w-15 flex items-center justify-center shrink-0"
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
                    onClick={() => handleDelete(discount._id)}
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={discount.status === 'active'}
                      onChange={() => handleToggleStatus(discount._id)}
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
      )}

      <AddDiscountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDiscount}
      />
    </div>
  );
};

export default memo(DiscountManagement);

