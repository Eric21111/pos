import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ViewProductModal = ({ showViewModal, setShowViewModal, viewingProduct, formatDate }) => {
  const { theme } = useTheme();

  if (!showViewModal || !viewingProduct) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm  bg-opacity-30"
      onClick={() => setShowViewModal(false)}
    >
      <div
        className={`rounded-2xl w-full max-w-5xl relative overflow-hidden ${theme === 'dark' ? 'bg-[#1E1B18]' : 'bg-white'}`}
        style={{ maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-7 bg-gradient-to-r from-[#AD7F65] to-[#C99B7F]"></div>
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Product Details</h2>
          <button
            onClick={() => setShowViewModal(false)}
            className={`text-2xl ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <div className="grid grid-cols-2 gap-8">

            <div className="space-y-6">

              <div>
                <h3 className={`text-base font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Basic Info</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Product Name:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{viewingProduct.itemName}</p>
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Brand Name:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{viewingProduct.brandName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Category:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{viewingProduct.category}</p>
                    </div>
                  </div>
                </div>
              </div>


              <div>
                <h3 className={`text-base font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Stock Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>SKU/Item Code:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{viewingProduct.sku}</p>
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Size:</span>
                      {viewingProduct.sizes && typeof viewingProduct.sizes === 'object' && Object.keys(viewingProduct.sizes).length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {Object.entries(viewingProduct.sizes).map(([size, sizeData]) => {
                            // Handle both formats: number or object with quantity
                            const stock = typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined
                              ? sizeData.quantity
                              : (typeof sizeData === 'number' ? sizeData : 0);
                            const price = typeof sizeData === 'object' && sizeData !== null && sizeData.price !== undefined
                              ? sizeData.price
                              : null;
                            return (
                              <div key={size} className={`flex justify-between items-center py-1 px-3 rounded-lg ${theme === 'dark' ? 'bg-[#2A2724]' : 'bg-gray-50'}`}>
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{size}:</span>
                                <div className="flex flex-col items-end">
                                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{stock || 0} pcs</span>
                                  {price !== null && (
                                    <span className="text-xs text-gray-500">PHP {parseFloat(price).toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{viewingProduct.size || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Variant:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{viewingProduct.variant || 'N/A'}</p>
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Stock:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {viewingProduct.sizes && typeof viewingProduct.sizes === 'object' && Object.keys(viewingProduct.sizes).length > 0
                          ? Object.values(viewingProduct.sizes).reduce((sum, sizeData) => {
                            const qty = typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined
                              ? sizeData.quantity
                              : (typeof sizeData === 'number' ? sizeData : 0);
                            return sum + qty;
                          }, 0)
                          : (viewingProduct.currentStock || 0)
                        } pcs
                      </p>
                    </div>
                  </div>
                </div>
              </div>


              <div>
                <h3 className={`text-base font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pricing</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Selling Price:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {(() => {
                          // Helper to get price from size data
                          const getSizePrice = (sizeData) => {
                            if (typeof sizeData === 'object' && sizeData !== null && sizeData.price !== undefined) {
                              return sizeData.price;
                            }
                            return null;
                          };

                          // Check if product has sizes with different prices
                          if (viewingProduct.sizes && typeof viewingProduct.sizes === 'object') {
                            const prices = [];
                            Object.values(viewingProduct.sizes).forEach(sizeData => {
                              const price = getSizePrice(sizeData);
                              if (price !== null) {
                                prices.push(price);
                              }
                            });

                            if (prices.length > 0) {
                              const minPrice = Math.min(...prices);
                              const maxPrice = Math.max(...prices);

                              if (minPrice !== maxPrice) {
                                return `PHP ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
                              }
                              return `PHP ${minPrice.toFixed(2)}`;
                            }
                          }

                          return `PHP ${viewingProduct.itemPrice?.toFixed(2) || '0.00'}`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Cost Price:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>PHP {viewingProduct.costPrice?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>
              </div>


              <div>
                <h3 className={`text-base font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Supplier Info</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Supplier Name:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{viewingProduct.supplierName || 'not applicable'}</p>
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Supplier Contact:</span>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{viewingProduct.supplierContact || 'not applicable'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div className="flex items-center justify-center">
              <div className={`w-full h-full flex items-center justify-center rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#2A2724]' : 'bg-gray-50'}`} style={{ minHeight: '500px' }}>
                {viewingProduct.itemImage && viewingProduct.itemImage.trim() !== '' ? (
                  <img
                    src={viewingProduct.itemImage}
                    alt={viewingProduct.itemName}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductModal;
