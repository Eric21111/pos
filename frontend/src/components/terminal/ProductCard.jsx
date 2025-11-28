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

  const availableSizes = product.sizes && typeof product.sizes === 'object' 
    ? Object.keys(product.sizes)
        .filter((size) => product.sizes[size] > 0)
    : ['XS', 'S', 'M', 'L'];
  
 
  const getTotalStock = () => {
    if (typeof product.currentStock === 'number') {
      return product.currentStock;
    }

    if (product.sizes && typeof product.sizes === 'object') {
      return Object.values(product.sizes).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);
    }
    return product.currentStock || 0;
  };
  
  const getStockForSize = () => {
    if (product.sizes && typeof product.sizes === 'object' && selectedSize && product.sizes[selectedSize] !== undefined) {
      return product.sizes[selectedSize];
    }
    return product.currentStock || 0;
  };
  

  const displayStock = getTotalStock();
  
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
          {product.itemImage ? (
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
          <span className="text-sm text-gray-500">PHP {product.itemPrice.toFixed(2)}</span>
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
                          selectedSize === size ? 'bg-[#AD7F65] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                          {size}: {product.sizes[size] || 0}
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
              <div className="flex items-center gap-2 bg-[#AD7F65] rounded-full px-1 shadow-md">
                <button onClick={onDecrement} className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#8B5F45] rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95">
                  <FaMinus className="text-xs" />
                </button>
                <span className="text-white font-bold min-w-[20px] text-center text-sm">{productQuantity}</span>
                <button onClick={onIncrement} className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#8B5F45] rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95">
                  <FaPlus className="text-xs" />
                </button>
              </div>
              <button
                onClick={onAdd}
                className="flex-1 py-2 text-white rounded-full text-xs font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md border"
                style={{
                  background: 'rgba(173, 127, 101, 0.5)',
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
              background: 'rgba(173, 127, 101, 0.5)',
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


