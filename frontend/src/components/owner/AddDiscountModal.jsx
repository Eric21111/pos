import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const AddDiscountModal = ({ isOpen, onClose, onAdd, onEdit, discountToEdit }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    discountName: '',
    discountCode: '',
    discountType: 'percentage',
    discountValue: '',
    appliesTo: 'all',
    category: '',
    validFrom: '',
    validUntil: '',
    noExpiration: false,
    minPurchaseAmount: '',
    usageLimit: '',
    description: ''
  });

  const categories = ['Tops', 'Bottoms', 'Dresses', 'Makeup', 'Accessories', 'Shoes', 'Head Wear', 'Foods'];

  useEffect(() => {
    if (isOpen) {
      if (discountToEdit) {
        setFormData({
          discountName: discountToEdit.title || '',
          discountCode: discountToEdit.discountCode || '',
          discountType: discountToEdit.discountType || 'percentage',
          discountValue: discountToEdit.discountValue || '',
          appliesTo: discountToEdit.appliesTo || 'all',
          category: discountToEdit.category || '',
          validFrom: discountToEdit.validFrom ? new Date(discountToEdit.validFrom).toISOString().split('T')[0] : '',
          validUntil: discountToEdit.validTo ? new Date(discountToEdit.validTo).toISOString().split('T')[0] : '',
          noExpiration: discountToEdit.noExpiration || false,
          minPurchaseAmount: discountToEdit.minPurchaseAmount || '',
          usageLimit: discountToEdit.usageLimit || '',
          description: discountToEdit.description || ''
        });
      } else {
        setFormData({
          discountName: '',
          discountCode: '',
          discountType: 'percentage',
          discountValue: '',
          appliesTo: 'all',
          category: '',
          validFrom: '',
          validUntil: '',
          noExpiration: false,
          minPurchaseAmount: '',
          usageLimit: '',
          description: ''
        });
      }
    }
  }, [isOpen, discountToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate category selection if appliesTo is 'category'
    if (formData.appliesTo === 'category' && !formData.category) {
      alert('Please select a category');
      return;
    }
    if (discountToEdit) {
      onEdit(discountToEdit._id, formData);
    } else {
      onAdd(formData);
    }
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
      <div className={`rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-[#2A2724]' : 'bg-white'}`}>
        <div
          className="h-6"
          style={{
            background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)'
          }}
        />

        <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            {discountToEdit ? 'Edit Discount' : 'Create New Discount'}
          </h2>
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
                <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Basic Info</h3>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Discount Name
                    </label>
                    <input
                      type="text"
                      name="discountName"
                      value={formData.discountName}
                      onChange={handleChange}
                      placeholder="e.g ANNIVERSARY SALE"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent ${theme === 'dark'
                        ? 'bg-[#1E1B18] border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span>Discount Code</span>
                      <span className="ml-2 text-xs text-gray-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      name="discountCode"
                      value={formData.discountCode}
                      onChange={handleChange}
                      placeholder="e.g DRESS10"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent ${theme === 'dark'
                        ? 'bg-[#1E1B18] border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Percentage</span>
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
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Fixed Amount</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Discount Value
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleChange}
                        placeholder="e.g 15"
                        className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent ${theme === 'dark'
                          ? 'bg-[#1E1B18] border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        required
                      />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
                        {formData.discountType === 'percentage' ? '% OFF' : '₱ OFF'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>All Products</span>
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
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Specific Category</span>
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
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Specific Products</span>
                      </label>
                    </div>
                    {formData.appliesTo === 'category' && (
                      <div className="mt-3">
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Select Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent ${theme === 'dark'
                            ? 'bg-[#1E1B18] border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          required={formData.appliesTo === 'category'}
                        >
                          <option value="">Select a category</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                            ? 'bg-[#1E1B18] border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'
                            }`}
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
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                            ? 'bg-[#1E1B18] border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'
                            }`}
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
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>No expiration date</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Advanced Option</h3>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span>Usage Limit</span>
                      <span className="ml-2 text-xs text-gray-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleChange}
                      min="0"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent ${theme === 'dark'
                        ? 'bg-[#1E1B18] border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    />
                    <p className="text-xs text-gray-400 mt-1">Total number of times this discount can be used</p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description / Notes
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Notes about this discount..."
                      rows="4"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent resize-none ${theme === 'dark'
                        ? 'bg-[#1E1B18] border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 border-t flex justify-end ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              type="submit"
              className="px-8 py-3 text-white rounded-lg font-bold text-lg shadow-md hover:shadow-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              }}
            >
              {discountToEdit ? 'Update Discount' : 'Add New Discount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDiscountModal;

