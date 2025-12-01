import React from 'react';
import { MdCategory } from 'react-icons/md';
import { FaMinus, FaPlus } from 'react-icons/fa';

export default function ProductCard({
  product,
  isExpanded,
  onToggleExpand,
  productQuantity,
  onDecrement,
  onIncrement,
  onAdd,
  selectedSize,
  onSelectSize
}) {

  // Helper function to get quantity from size data (handles both number and object formats)
  const getSizeQuantity = (sizeData) => {
    if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
      return sizeData.quantity;
    }
    return typeof sizeData === 'number' ? sizeData : 0;
  };

  // Helper function to get price from size data
  const getSizePrice = (sizeData) => {
    if (typeof sizeData === 'object' && sizeData !== null && sizeData.price !== undefined) {
      return sizeData.price;
    }
    return null;
  };

  // Function to get price range for products with sizes
  const getPriceRange = () => {
    // If product has sizes with different prices, calculate range
    if (product.sizes && typeof product.sizes === 'object') {
      const prices = [];
      
      Object.values(product.sizes).forEach(sizeData => {
        const price = getSizePrice(sizeData);
        if (price !== null) {
          prices.push(price);
        }
      });
      
      // If we have size-specific prices
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        // If prices are different, return range
        if (minPrice !== maxPrice) {
          return { min: minPrice, max: maxPrice, isRange: true };
        }
        // If all prices are same, return single price
        return { min: minPrice, max: maxPrice, isRange: false };
      }
    }
    
    // Default: use product's itemPrice
    return { min: product.itemPrice || 0, max: product.itemPrice || 0, isRange: false };
  };

  // Function to get the display price (size-specific if selected, otherwise range)
  const getDisplayPrice = () => {
    // If a size is selected and has a specific price, show that price
    if (selectedSize && product.sizes && typeof product.sizes === 'object' && product.sizes[selectedSize]) {
      const sizeData = product.sizes[selectedSize];
      const sizePrice = getSizePrice(sizeData);
      
      if (sizePrice !== null) {
        return { price: sizePrice, isSpecific: true };
      }
    }
    
    // Otherwise, show the price range or default price
    const priceRange = getPriceRange();
    return { 
      price: priceRange.min, 
      maxPrice: priceRange.max, 
      isRange: priceRange.isRange, 
      isSpecific: false 
    };
  };

  const availableSizes = product.sizes && typeof product.sizes === 'object' 
    ? Object.keys(product.sizes)
        .filter((size) => getSizeQuantity(product.sizes[size]) > 0)
    : ['XS', 'S', 'M', 'L'];
  
 
  const getTotalStock = () => {
    if (typeof product.currentStock === 'number') {
      return product.currentStock;
    }

    if (product.sizes && typeof product.sizes === 'object') {
      return Object.values(product.sizes).reduce((sum, sizeData) => sum + getSizeQuantity(sizeData), 0);
    }
    return product.currentStock || 0;
  };
  
  const getStockForSize = () => {
    if (product.sizes && typeof product.sizes === 'object' && selectedSize && product.sizes[selectedSize] !== undefined) {
      return getSizeQuantity(product.sizes[selectedSize]);
    }
    return product.currentStock || 0;
  };
  
  // Get available stock for current selection
  const getAvailableStock = () => {
    if (product.sizes && typeof product.sizes === 'object' && selectedSize) {
      return getSizeQuantity(product.sizes[selectedSize]);
    }
    return product.currentStock || 0;
  };

  // Check if Add button should be disabled
  const isAddButtonDisabled = () => {
    // Disable if no size is selected (for products with sizes)
    if (product.sizes && typeof product.sizes === 'object' && Object.keys(product.sizes).length > 0) {
      if (!selectedSize) {
        return true;
      }
      // Disable if selected size has no stock or quantity exceeds available stock
      const sizeStock = getSizeQuantity(product.sizes[selectedSize]);
      if (sizeStock <= 0 || productQuantity > sizeStock) {
        return true;
      }
    } else {
      // For products without sizes, check total stock
      const totalStock = product.currentStock || 0;
      if (totalStock <= 0 || productQuantity > totalStock) {
        return true;
      }
    }
    return false;
  };

  // Check if increment button should be disabled
  const isIncrementDisabled = () => {
    const availableStock = getAvailableStock();
    return productQuantity >= availableStock;
  };

  const displayStock = getTotalStock();
  const displayPrice = getDisplayPrice();
  
  return (
    <div
      className={`mb-4 bg-white rounded-2xl transition-all duration-500 ease-out overflow-hidden border-4 ${
        isExpanded 
          ? 'border-[#AD7F65] shadow-2xl' 
          : 'border-gray-200 shadow hover:shadow-xl'
      }`}
    >
      <div onClick={onToggleExpand} className="cursor-pointer">
        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {product.itemImage && product.itemImage.trim() !== '' ? (
            <img src={product.itemImage} alt={product.itemName} className="w-full h-full object-cover" />
          ) : (
            <MdCategory className="text-4xl text-gray-400" />
          )}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm mb-1 truncate">
          {product.itemName}{product.variant ? ` (${product.variant})` : ''}
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {displayPrice.isSpecific
              ? `PHP ${displayPrice.price.toFixed(2)}`
              : displayPrice.isRange
              ? `PHP ${displayPrice.price.toFixed(2)} - ${displayPrice.maxPrice.toFixed(2)}`
              : `PHP ${displayPrice.price.toFixed(2)}`
            }
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">{displayStock} stocks left</span>
        </div>

        {isExpanded && (
          <div
            className="mt-3 space-y-3 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeInSlide 0.4s ease-out' }}
          >
            <style>{`
              @keyframes fadeInSlide {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>

            <div>
              <label className="block text-xs font-semibold mb-1">Size</label>
              {availableSizes.length > 0 ? (
                <>
                  <div className="flex gap-1">
                    {availableSizes.map((size, index) => (
                      <button
                        key={size}
                        onClick={() => onSelectSize(size)}
                        className={`flex-1 py-1 rounded text-xs font-medium transition-all duration-300 ease-out transform hover:scale-110 ${
                          selectedSize === size ? 'bg-[#a17a62] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
               
                  {product.sizes && typeof product.sizes === 'object' && (
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      {Object.keys(product.sizes).map((size) => (
                        <div key={size} className="text-gray-600 text-center">
                          {size}: {getSizeQuantity(product.sizes[size])}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-500">No sizes available</p>
              )}
            </div>

            <div className="flex gap-2 items-center">
              
              <button
                onClick={onAdd}
                disabled={isAddButtonDisabled()}
                className={`flex-1 py-2 text-white rounded-full text-xs font-semibold transition-all duration-300 transform shadow-md border ${
                  isAddButtonDisabled() 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:opacity-90 hover:scale-105 active:scale-95'
                }`}
                style={{
                  background: isAddButtonDisabled() 
                    ? 'rgba(173, 127, 101, 0.3)' 
                    : 'rgba(173, 127, 101, 1)',
                  borderColor: 'rgba(173, 127, 101, 1)',
                  boxShadow: '0 2px 2px rgba(0, 0, 0, 0.25)'
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {!isExpanded && (
          <button
            onClick={onToggleExpand}
            className="w-full mt-2 py-2 text-xs text-white rounded-lg border hover:opacity-90 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            style={{
              background: 'rgba(173, 127, 101, 1)',
              borderColor: 'rgba(173, 127, 101, 1)',
              boxShadow: '0 2px 2px rgba(0, 0, 0, 0.25)',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}


