import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';

const DuplicateItemModal = ({ isOpen, onClose, onConfirm, item, existingQuantity }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <FaExclamationTriangle className="text-amber-500 text-lg" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Item Already in Cart</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Item Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
              {item.itemImage && item.itemImage.trim() !== '' ? (
                <img 
                  src={item.itemImage} 
                  alt={item.itemName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MdCategory className="text-2xl text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{item.itemName}</h3>
              <p className="text-sm text-gray-500">
                {item.selectedSize && `Size: ${item.selectedSize}`}
                {item.variant && ` • ${item.variant}`}
              </p>
              <p className="text-sm font-medium text-[#AD7F65] mt-1">
                PHP {(item.itemPrice || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-2">
            <p className="text-gray-600">
              This item is already in your cart with a quantity of{' '}
              <span className="font-bold text-[#AD7F65]">{existingQuantity}</span>.
            </p>
            <p className="text-gray-600 mt-2">
              Would you like to add more?
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-md"
            style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
          >
            Yes, Add More
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateItemModal;
