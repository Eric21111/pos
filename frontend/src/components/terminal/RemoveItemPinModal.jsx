import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaChevronDown } from 'react-icons/fa';

const voidReasons = [
  'Customer cancellation',
  'Wrong transaction',
  'System error',
  'Payment issue',
  'Other'
];

const RemoveItemPinModal = ({ isOpen, onClose, onConfirm, item }) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const reasonDropdownRef = useRef(null);
  const isConfirmingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setReason('');
      setError('');
      setIsReasonDropdownOpen(false);
      isConfirmingRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reasonDropdownRef.current && !reasonDropdownRef.current.contains(event.target)) {
        setIsReasonDropdownOpen(false);
      }
    };

    if (isReasonDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isReasonDropdownOpen]);

  const handlePinChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(digitsOnly);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleReasonSelect = (selectedReason) => {
    setReason(selectedReason);
    setIsReasonDropdownOpen(false);
    setError('');
  };

  const handleConfirm = async (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('[RemoveItemPinModal] handleConfirm called, reason:', reason, 'pin length:', pin.length);
    
    if (!reason) {
      setError('Please select a reason for void');
      return;
    }

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

      // Trim and ensure PIN is exactly 6 digits
      const trimmedPin = pin.trim();
      if (trimmedPin.length !== 6 || !/^\d{6}$/.test(trimmedPin)) {
        setError('PIN must be exactly 6 digits');
        setLoading(false);
        return;
      }

      // Store reason in a variable to ensure it's preserved
      const voidReason = reason;

      // Verify PIN with backend
      const response = await fetch('http://localhost:5000/api/employees/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser.email,
          pin: trimmedPin
        })
      });

      const data = await response.json();

      if (data.success) {
        // PIN verified successfully - proceed with void transaction
        console.log('[RemoveItemPinModal] PIN verified successfully, calling onConfirm with reason:', voidReason);
        
        // Mark that we're in a successful confirmation flow - prevent double calls
        if (isConfirmingRef.current) {
          console.log('[RemoveItemPinModal] Already confirming, skipping duplicate call');
          return;
        }
        isConfirmingRef.current = true;
        
        // Extract approver info from the verified employee
        const approverInfo = {
          approvedBy: data.data?.name || data.data?.firstName || 'Unknown',
          approvedById: data.data?._id || data.data?.id || '',
          approvedByRole: data.data?.role || null
        };
        
        // Store reason in variable to ensure it's passed correctly
        // Call onConfirm with the reason and approver info - it will handle the void transaction and close the modal
        if (voidReason && onConfirm) {
          try {
            // Set loading to false before calling onConfirm
            setLoading(false);
            // Call onConfirm - parent will handle closing the modal
            await onConfirm(voidReason, approverInfo);
            console.log('[RemoveItemPinModal] onConfirm called successfully with approver:', approverInfo);
          } catch (error) {
            console.error('[RemoveItemPinModal] Error calling onConfirm:', error);
            setError('Failed to void item. Please try again.');
            setLoading(false);
            isConfirmingRef.current = false;
            return;
          }
        } else {
          console.error('[RemoveItemPinModal] Missing voidReason or onConfirm:', { voidReason, onConfirm: !!onConfirm });
          setError('Failed to void item. Missing reason or callback.');
          setLoading(false);
          isConfirmingRef.current = false;
          return;
        }
      } else {
        // PIN verification failed
        setError(data.message || 'Invalid PIN. Please try again.');
        // Don't clear PIN on first failure - allow user to retry
        setLoading(false);
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setError('Failed to connect to server. Please try again.');
      // Don't clear PIN on network error - allow user to retry
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // For single item void (minus button), show price for 1 quantity only
  // For bulk void, the item is already set with quantity=1 and itemPrice=totalAmount
  const itemTotal = item ? item.itemPrice.toFixed(2) : '0.00';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[10000] backdrop-blur-sm bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">!</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-600">
                  Void Transaction
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  This action requires manager authorization.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount to Void:
            </label>
            <div className="bg-red-50 rounded-lg p-4">
              <span className="text-2xl font-bold text-red-600">
                PHP {itemTotal}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Void <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={reasonDropdownRef}>
              <button
                type="button"
                onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
              >
                <span className={reason ? 'text-gray-700' : 'text-gray-400'}>
                  {reason || 'Select a reason...'}
                </span>
                <FaChevronDown 
                  className={`text-gray-500 transition-transform ${isReasonDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isReasonDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {voidReasons.map((voidReason) => (
                    <button
                      key={voidReason}
                      type="button"
                      onClick={() => handleReasonSelect(voidReason)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                        reason === voidReason ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {voidReason}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Manager PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={handlePinChange}
              onBlur={(e) => {
                // Ensure PIN is properly formatted on blur
                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                if (digitsOnly !== pin) {
                  setPin(digitsOnly);
                }
              }}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
              placeholder="Enter 6-digit PIN"
              maxLength={6}
              autoFocus
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConfirm();
              }}
              disabled={loading || pin.length !== 6 || !reason}
              className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Confirm Void'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveItemPinModal;

