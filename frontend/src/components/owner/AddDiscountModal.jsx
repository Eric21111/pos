import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const AddDiscountModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    discountName: '',
    discountCode: '',
    discountType: 'percentage',
    discountValue: '',
    appliesTo: 'all',
    validFrom: '',
    validUntil: '',
    noExpiration: false,
    minPurchaseAmount: '500.00',
    maxPurchaseAmount: '1000.00',
    usageLimit: '0',
    description: ''
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        discountName: '',
        discountCode: '',
        discountType: 'percentage',
        discountValue: '',
        appliesTo: 'all',
        validFrom: '',
        validUntil: '',
        noExpiration: false,
        minPurchaseAmount: '500.00',
        maxPurchaseAmount: '1000.00',
        usageLimit: '0',
        description: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10002] p-4 backdrop-blur-sm">
      <div         className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div
          className="h-6"
          style={{ 
            background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)'
          }}
        />
        
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">Create New Discount</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-black mb-4">Basic Info</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Name
                    </label>
                    <input
                      type="text"
                      name="discountName"
                      value={formData.discountName}
                      onChange={handleChange}
                      placeholder="e.g ANNIVERSARY SALE"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span>Discount Code</span>
                      <span className="ml-2 text-xs text-gray-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      name="discountCode"
                      value={formData.discountCode}
                      onChange={handleChange}
                      placeholder="e.g DRESS10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discountType"
                          value="percentage"
                          checked={formData.discountType === 'percentage'}
                          onChange={handleChange}
                          className="w-4 h-4 text-[#AD7F65] focus:ring-[#AD7F65]"
                        />
                        <span className="text-sm text-gray-700">Percentage</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discountType"
                          value="fixed"
                          checked={formData.discountType === 'fixed'}
                          onChange={handleChange}
                          className="w-4 h-4 text-[#AD7F65] focus:ring-[#AD7F65]"
                        />
                        <span className="text-sm text-gray-700">Fixed Amount</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleChange}
                        placeholder="e.g 15"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                        required
                      />
                      <span className="text-sm font-medium text-black">
                        {formData.discountType === 'percentage' ? '% OFF' : '₱ OFF'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Applies to
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="appliesTo"
                          value="all"
                          checked={formData.appliesTo === 'all'}
                          onChange={handleChange}
                          className="w-4 h-4 text-[#AD7F65] focus:ring-[#AD7F65]"
                        />
                        <span className="text-sm text-gray-700">All Products</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="appliesTo"
                          value="category"
                          checked={formData.appliesTo === 'category'}
                          onChange={handleChange}
                          className="w-4 h-4 text-[#AD7F65] focus:ring-[#AD7F65]"
                        />
                        <span className="text-sm text-gray-700">Specific Category</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="appliesTo"
                          value="products"
                          checked={formData.appliesTo === 'products'}
                          onChange={handleChange}
                          className="w-4 h-4 text-[#AD7F65] focus:ring-[#AD7F65]"
                        />
                        <span className="text-sm text-gray-700">Specific Products</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validity Period
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Valid from</label>
                        <input
                          type="date"
                          name="validFrom"
                          value={formData.validFrom}
                          onChange={handleChange}
                          disabled={formData.noExpiration}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Valid until</label>
                        <input
                          type="date"
                          name="validUntil"
                          value={formData.validUntil}
                          onChange={handleChange}
                          disabled={formData.noExpiration}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="noExpiration"
                        checked={formData.noExpiration}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#AD7F65] rounded focus:ring-[#AD7F65]"
                      />
                      <span className="text-sm text-gray-700">No expiration date</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-black mb-4">Advanced Option</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span>Minimum Purchase Amount</span>
                      <span className="ml-2 text-xs text-gray-400 font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">₱</span>
                      <input
                        type="number"
                        name="minPurchaseAmount"
                        value={formData.minPurchaseAmount}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Customer must spend at least this amount</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span>Maximum Purchase Amount</span>
                      <span className="ml-2 text-xs text-gray-400 font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">₱</span>
                      <input
                        type="number"
                        name="maxPurchaseAmount"
                        value={formData.maxPurchaseAmount}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Maximum discount amount for percentage-based discounts</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span>Usage Limit</span>
                      <span className="ml-2 text-xs text-gray-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Total number of times this discount can be used</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description / Notes
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Notes about this discount..."
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 text-white rounded-lg font-bold text-lg shadow-md hover:shadow-lg transition-all"
              style={{ 
                background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)'
              }}
            >
              Add New Discount
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDiscountModal;

