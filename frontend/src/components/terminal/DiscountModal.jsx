import { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaTag, FaCalendar, FaBox, FaUsers } from 'react-icons/fa';
import filterIcon from '../../assets/filter.svg';

const icon20Percent = new URL('../../assets/owner/20.png', import.meta.url).href;
const icon50Percent = new URL('../../assets/owner/50.png', import.meta.url).href;
const iconSenior = new URL('../../assets/owner/Senior&ani.png', import.meta.url).href;

const DiscountModal = ({ isOpen, onClose, onSelectDiscount, cart = [], products = [], selectedDiscounts = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper function to determine icon and colors based on discount data
  const getDiscountIcon = (discount) => {
    const title = discount.title?.toLowerCase() || '';
    const discountValue = discount.discountValue || '';
    
    if (title.includes('senior')) {
      return {
        icon: iconSenior,
        iconColor: 'linear-gradient(135deg, #9B59B6 0%, #E91E63 100%)'
      };
    }
    
    // Extract numeric value from discountValue
    const match = discountValue.match(/(\d+)/);
    if (match) {
      const value = parseInt(match[1]);
      if (value >= 50) {
        return {
          icon: icon50Percent,
          iconColor: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
        };
      }
    }
    
    return {
      icon: icon20Percent,
      iconColor: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
    };
  };

  // Fetch discounts from API
  useEffect(() => {
    if (isOpen) {
      fetchDiscounts();
    }
  }, [isOpen]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/discounts');
      const data = await response.json();
      
      if (data.success) {
        // Format discounts with icons and colors, filter only active ones
        const formattedDiscounts = data.data
          .filter(discount => discount.status === 'active')
          .map(discount => {
            const iconData = getDiscountIcon(discount);
            return {
              ...discount,
              ...iconData
            };
          });
        setDiscounts(formattedDiscounts);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if discount applies to cart items
  const discountAppliesToCart = (discount) => {
    // Use appliesToType for logic checks (original value: 'all', 'category', 'products')
    // Use appliesTo for display (formatted text: 'All Products', 'Category: Tops', etc.)
    const appliesToType = discount.appliesToType || discount.appliesTo;
    
    // If cart is empty, only show "all" discounts
    if (!cart || cart.length === 0) {
      return appliesToType === 'all';
    }

    // If discount applies to all products, it's always valid
    if (appliesToType === 'all') {
      return true;
    }

    // If discount applies to a specific category
    if (appliesToType === 'category' && discount.category) {
      // Check if all cart items are from the same category as the discount
      const allItemsMatchCategory = cart.every(item => {
        // First check if item has category field
        let itemCategory = item.category;
        
        // If not, try to find it from products array
        if (!itemCategory) {
          const productId = item._id || item.productId || item.id;
          const product = products.find(p => {
            const pId = p._id || p.id;
            return (pId && productId && (pId.toString() === productId.toString()));
          });
          itemCategory = product?.category;
        }
        
        // Check if item's category matches the discount category
        return itemCategory === discount.category;
      });

      return allItemsMatchCategory;
    }

    // If discount applies to specific products
    if (appliesToType === 'products' && discount.productIds && discount.productIds.length > 0) {
      // Check if all cart items are in the discount's product list
      const allItemsInDiscount = cart.every(item => {
        const itemId = item._id || item.productId || item.id;
        return discount.productIds.some(pid => {
          const pidStr = pid.toString ? pid.toString() : pid;
          const itemIdStr = itemId.toString ? itemId.toString() : itemId;
          return pidStr === itemIdStr;
        });
      });

      return allItemsInDiscount;
    }

    return false;
  };

  const filteredDiscounts = discounts.filter(discount => {
    // First filter by search query
    const matchesSearch = discount.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discount.discountValue.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filter out already selected discounts
    const alreadySelected = selectedDiscounts.some(d => d._id === discount._id);
    if (alreadySelected) return false;

    // Then filter by whether it applies to cart
    return discountAppliesToCart(discount);
  });

  if (!isOpen) return null;

  return (
  <div
        className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 font-poppins p-4"
      >
      <div className="bg-white rounded-2xl w-full max-w-md h-[95vh] flex flex-col shadow-2xl">
        <div className="h-5 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #C2A68C 0%, #AD7F65 50%, #76462B 100%)' }}></div>
        
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Discounts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-10 h-9 flex items-center justify-center text-white rounded-lg" style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}>
                <FaSearch className="text-sm" />
              </div>
              <input
                type="text"
                placeholder="Search For..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-14 pr-4 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
              />
            </div>
            <button className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <img src={filterIcon} alt="Filter" className="w-5 h-5 opacity-90" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">Loading discounts...</div>
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="text-gray-500 text-center">
                {cart.length === 0 
                  ? 'Add items to your cart to see applicable discounts'
                  : searchQuery 
                    ? 'No discounts match your search'
                    : 'No discounts available for items in your cart'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDiscounts.map((discount) => (
                <div
                  key={discount._id}
                  onClick={() => {
                    onSelectDiscount(discount);
                    onClose();
                  }}
                  className="rounded-xl overflow-hidden border border-gray-200 shadow-md flex items-stretch bg-white cursor-pointer hover:shadow-lg transition-shadow min-h-[85px]"
                >
                <div
                  className="w-16 flex items-center justify-center shrink-0 rounded-l-xl"
                  style={{ background: discount.iconColor }}
                >
                  <img 
                    src={discount.icon} 
                    alt={discount.title}
                    className="w-12 h-12 object-contain"
                  />
                </div>

                <div className="flex-1 bg-white p-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-bold" style={{ color: '#76462B' }}>
                        {discount.title}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                        {discount.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px]">
                          <FaTag className="text-yellow-500 text-xs" />
                          <span className="text-gray-600">
                            Discount Value: <span className="font-bold" style={{ color: '#76462B' }}>{discount.discountValue}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px]">
                          <FaCalendar className="text-purple-500 text-xs" />
                          <span className="text-gray-600">
                            Valid only from: <span className="font-bold" style={{ color: '#76462B' }}>
                              {discount.validFrom === 'Permanent' 
                                ? 'Permanent' 
                                : `${discount.validFrom} to ${discount.validTo}`}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px]">
                          <FaBox className="text-blue-400 text-xs" />
                          <span className="text-gray-600">
                            Applies to: <span className="font-bold" style={{ color: '#76462B' }}>{discount.appliesTo}</span>
                          </span>
                        </div>

                        {discount.usage && (
                          <div className="flex items-center gap-1 text-[10px]">
                            <FaUsers className="text-green-500 text-xs" />
                            <span className="text-gray-600">
                              Used: <span className="font-bold" style={{ color: '#76462B' }}>{discount.usage.used}/{discount.usage.total}</span> times
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {discount.description && (
                    <div className="text-[10px] italic" style={{ color: '#76462B' }}>
                      {discount.description}
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountModal;

