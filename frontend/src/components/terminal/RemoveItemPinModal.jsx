import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationCircle } from 'react-icons/fa';

const RemoveItemPinModal = ({ isOpen, onClose, onConfirm, item }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  const handlePinChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(digitsOnly);
    setError('');
  };

  const handleConfirm = async () => {
    if (pin.length !== 6) {
      setError('Please enter a 6-digit PIN');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Get current user email from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      if (!currentUser.email) {
        setError('User information not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Verify PIN with backend
      const response = await fetch('http://localhost:5000/api/employees/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser.email,
          pin: pin
        })
      });

      const data = await response.json();

      if (data.success) {
        setLoading(false);
        onConfirm();
        setPin('');
      } else {
        setError(data.message || 'Invalid PIN. Please try again.');
        setPin('');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setError('Failed to connect to server. Please try again.');
      setPin('');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const itemTotal = item ? (item.itemPrice * item.quantity).toFixed(2) : '0.00';

  return (
    <div
      className="fixed inset-0 bg-transparent backdrop-blur-xl flex items-center justify-center z-50 font-poppins p-4"
    
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaExclamationCircle className="text-red-600 text-xl" />
            <h3 className="text-xl font-bold text-red-600">
              Remove Item
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 ml-8">
            This action requires manager authorization.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Remove:
            </label>
            <div 
              className="w-full px-4 py-3 rounded-lg text-lg font-semibold text-red-700"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              PHP {itemTotal}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager PIN <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={handlePinChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent text-center text-lg tracking-widest font-mono"
                placeholder="******"
                maxLength={6}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-600 text-xs mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-6 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || pin.length !== 6}
              className="flex-1 py-3 px-6 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Confirm Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveItemPinModal;

