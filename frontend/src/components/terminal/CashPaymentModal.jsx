import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const CashPaymentModal = ({ isOpen, onClose, totalAmount, onProceed }) => {
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);

  useEffect(() => {
    if (amountReceived && !isNaN(parseFloat(amountReceived))) {
      const received = parseFloat(amountReceived);
      const changeAmount = received - totalAmount;
      setChange(changeAmount >= 0 ? changeAmount : 0);
    } else {
      setChange(0);
    }
  }, [amountReceived, totalAmount]);

  useEffect(() => {
    if (!isOpen) {
      setAmountReceived('');
      setChange(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProceed = () => {
    const received = parseFloat(amountReceived);
    if (!amountReceived || isNaN(received) || received < totalAmount) {
      alert('Please enter an amount equal to or greater than the total amount.');
      return;
    }
    onProceed(received, change);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmountReceived(value);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10002] p-4 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
      >
        <div 
          className="px-6 py-6 relative "
          style={{ 
            background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)'
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors z-10"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Amount Received:
              </label>
              <input
                type="text"
                value={amountReceived}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Change:
              </label>
              <div className="flex-1 text-right">
                <span className="text-xl font-bold" style={{ color: 'rgba(255, 133, 88, 1)' }}>
                  PHP {change.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              className="flex-1 py-3 px-6 rounded-lg font-bold text-white transition-all shadow-md hover:shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)'
              }}
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashPaymentModal;

