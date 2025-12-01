import React, { useState, useEffect } from 'react';

const StockInModal = ({
  isOpen,
  onClose,
  product,
  onConfirm,
  loading
}) => {
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [sizeQuantities, setSizeQuantities] = useState({});
  const [reason, setReason] = useState('Restock');

  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];
  const reasons = ['Restock', 'Returned Item', 'Exchange', 'Other'];

  // Always show all sizes - user can add any size to the product
  const hasSizes = product.sizes && typeof product.sizes === 'object' && Object.keys(product.sizes).length > 0;
  
  // Helper function to get quantity from size data (handles both number and object formats)
  const getSizeQuantity = (sizeData) => {
    if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
      return sizeData.quantity;
    }
    return typeof sizeData === 'number' ? sizeData : 0;
  };
  const availableSizes = allSizes; // Always show all sizes

  useEffect(() => {
    if (isOpen && product) {
      setSelectedSizes([]);
      setSizeQuantities({});
      setReason('Restock');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product?._id]);

  if (!isOpen || !product) return null;

  const handleClose = () => {
    setSelectedSizes([]);
    setSizeQuantities({});
    setReason('Restock');
    onClose();
  };

  const handleSizeToggle = (size) => {
    const isSelected = selectedSizes.includes(size);
    if (isSelected) {
      setSelectedSizes(prev => prev.filter(s => s !== size));
      setSizeQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[size];
        return newQuantities;
      });
    } else {
      setSelectedSizes(prev => [...prev, size]);
      setSizeQuantities(prev => ({
        ...prev,
        [size]: ''
      }));
    }
  };

  const handleSizeQuantityChange = (size, qty) => {
    setSizeQuantities(prev => ({
      ...prev,
      [size]: parseInt(qty) || 0
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedSizes.length === 0) {
      alert('Please select at least one size');
      return;
    }

    const hasValidQuantities = selectedSizes.some(size => {
      const qty = sizeQuantities[size] || 0;
      return qty > 0;
    });

    if (!hasValidQuantities) {
      alert('Please enter quantities for at least one selected size');
      return;
    }

    onConfirm({
      sizes: sizeQuantities,
      selectedSizes: selectedSizes,
      reason: reason
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm pointer-events-none">
      <div className="bg-white rounded-2xl w-full max-w-5xl relative pointer-events-auto overflow-hidden" 
           style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)' }}>
        
        <div className="h-2 bg-gradient-to-r from-[#AD7F65] to-[#C99B7F]"></div>

        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-[8px] font-bold leading-none">+</span>
              </span>
            </div>
            <h2 className="text-xl font-bold">Stock In</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex">
            <div className="w-1/2 p-6 bg-gray-50 flex items-center justify-center" style={{ minHeight: '500px' }}>
              {product.itemImage && product.itemImage.trim() !== '' ? (
                <img 
                  src={product.itemImage} 
                  alt={product.itemName} 
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No Image Available</p>
                </div>
              )}
            </div>

            <div className="w-1/2 p-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {product.itemName}
                    {product.size && !product.sizes && ` (${product.size})`}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">SKU/Item Code</label>
                    <p className="text-sm font-medium text-gray-900">{product.sku || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Brand Partner <span className="text-gray-400">(optional)</span></label>
                    <p className="text-sm font-medium text-gray-900">{product.supplierName || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    Sizes Optional - Select multiple sizes
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {availableSizes.map((size) => {
                      const currentQty = hasSizes && product.sizes[size] ? getSizeQuantity(product.sizes[size]) : 0;
                      return (
                        <label key={size} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSizes.includes(size)}
                            onChange={() => handleSizeToggle(size)}
                            className="w-4 h-4 border-gray-300 rounded focus:ring-[#AD7F65] cursor-pointer"
                            style={{
                              accentColor: '#AD7F65'
                            }}
                          />
                          <span className="text-sm text-gray-900">
                            {size} <span className="text-xs text-gray-500">({currentQty})</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-2 mt-3 p-3 bg-gray-50 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Quantity per Size:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedSizes.length > 0 ? (
                        selectedSizes.map((size) => {
                          const currentQty = hasSizes && product.sizes[size] ? getSizeQuantity(product.sizes[size]) : 0;
                          return (
                            <div key={size}>
                              <label className="block text-xs text-gray-600 mb-1">
                                {size} <span className="text-gray-500">(Current: {currentQty})</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={sizeQuantities[size] || ''}
                                onChange={(e) => handleSizeQuantityChange(size, e.target.value)}
                                placeholder="Enter quantity"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-xs text-gray-400 italic">
                          Select sizes above to add quantities
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <div className="relative">
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent appearance-none cursor-pointer"
                    >
                      {reasons.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
                >
                  {loading ? 'Adding...' : 'Add Stocks'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockInModal;

