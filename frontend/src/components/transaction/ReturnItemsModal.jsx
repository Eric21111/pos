import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(value);

const returnReasons = [
  'Did not like',
  'Wrongly bought',
  'Damaged',
  'Defective',
  'Size issue',
  'Other'
];

const ReturnItemsModal = ({ isOpen, onClose, transaction, onConfirm }) => {
  const [selectedItems, setSelectedItems] = useState({});
  const [reasons, setReasons] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && transaction) {
      // Initialize selected items and reasons
      const initialSelected = {};
      const initialReasons = {};
      if (transaction.items) {
        transaction.items.forEach((item, idx) => {
          initialSelected[idx] = false;
          initialReasons[idx] = '';
        });
      }
      setSelectedItems(initialSelected);
      setReasons(initialReasons);
      setError('');
    }
  }, [isOpen, transaction]);

  const handleItemToggle = (index) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
    if (!selectedItems[index]) {
      setReasons(prev => ({
        ...prev,
        [index]: ''
      }));
    }
  };

  const handleReasonChange = (index, reason) => {
    setReasons(prev => ({
      ...prev,
      [index]: reason
    }));
  };

  const handleSubmit = async () => {
    // Validate that at least one item is selected
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    if (selectedCount === 0) {
      setError('Please select at least one item to return');
      return;
    }

    // Validate that all selected items have reasons
    const itemsWithoutReason = Object.keys(selectedItems).filter(
      idx => selectedItems[idx] && !reasons[idx]
    );
    if (itemsWithoutReason.length > 0) {
      setError('Please provide a reason for all selected items');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Prepare return data with original index
      const itemsToReturn = transaction.items
        .map((item, idx) => {
          if (selectedItems[idx]) {
            return {
              productId: item.productId || item._id,
              itemName: item.itemName,
              sku: item.sku,
              variant: item.variant,
              selectedSize: item.selectedSize,
              quantity: item.quantity,
              price: item.price || item.itemPrice,
              reason: reasons[idx],
              originalIndex: idx
            };
          }
          return null;
        })
        .filter(Boolean);

      // Call the onConfirm callback with return data
      await onConfirm(itemsToReturn, transaction);
      
      onClose();
    } catch (err) {
      console.error('Error processing return:', err);
      setError('Failed to process return. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[10000] backdrop-blur-sm bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="h-2"
          style={{
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
          }}
        />
        
        <div className="p-8 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Return Items
              </h2>
              <p className="text-sm text-gray-600">
                Transaction #{transaction.referenceNo || transaction._id?.substring(0, 12)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <FaExclamationTriangle />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {transaction.items && transaction.items.length > 0 ? (
              transaction.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    selectedItems[idx]
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems[idx] || false}
                      onChange={() => handleItemToggle(idx)}
                      className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">{item.itemName}</p>
                          <div className="mt-1 space-y-1">
                            {item.sku && (
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                            )}
                            {item.selectedSize && (
                              <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Quantity: {item.quantity} x {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(item.quantity * item.price)}
                          </p>
                        </div>
                      </div>
                      
                      {selectedItems[idx] && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Return Reason *
                          </label>
                          <select
                            value={reasons[idx] || ''}
                            onChange={(e) => handleReasonChange(idx, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Select a reason</option>
                            {returnReasons.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No items found</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Process Return'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnItemsModal;

