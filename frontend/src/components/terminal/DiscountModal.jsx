import { useState } from 'react';
import { FaTimes, FaSearch, FaTag, FaCalendar, FaBox, FaUsers } from 'react-icons/fa';
import sortIcon from '../../assets/sort.svg';

const icon20Percent = new URL('../../assets/owner/20.png', import.meta.url).href;
const icon50Percent = new URL('../../assets/owner/50.png', import.meta.url).href;
const iconSenior = new URL('../../assets/owner/Senior&ani.png', import.meta.url).href;

const DiscountModal = ({ isOpen, onClose, onSelectDiscount }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const discounts = [
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
      icon: icon20Percent
    },
    {
      id: 2,
      title: 'P50 OFF',
      discountValue: 'P50 OFF',
      validFrom: '2025-04-01',
      validTo: '2025-12-31',
      description: '',
      status: 'active',
      appliesTo: 'All Products',
      usage: null,
      iconColor: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      icon: icon50Percent
    }
  ];

  const filteredDiscounts = discounts.filter(discount =>
    discount.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discount.discountValue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10004] p-4">
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
              <img src={sortIcon} alt="Filter" className="w-5 h-5 opacity-90" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="space-y-4">
            {filteredDiscounts.map((discount) => (
              <div
                key={discount.id}
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
        </div>
      </div>
    </div>
  );
};

export default DiscountModal;

