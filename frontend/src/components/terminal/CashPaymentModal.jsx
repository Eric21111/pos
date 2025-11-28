import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import CheckoutConfirmationModal from './CheckoutConfirmationModal';
import SuccessModal from './SuccessModal';
import ReceiptModal from './ReceiptModal';
import PrintingModal from './PrintingModal';
import { sendReceiptToPrinter } from '../../utils/printBridge';

const CashPaymentModal = ({ isOpen, onClose, totalAmount, onProceed, cartItems = [] }) => {
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isAutoPrinting, setIsAutoPrinting] = useState(false);
  const [printError, setPrintError] = useState(null);

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
      setShowConfirmation(false);
      setShowSuccess(false);
      setShowReceipt(false);
      setReceiptData(null);
      setIsAutoPrinting(false);
      setPrintError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateReceiptNumber = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleProceed = () => {
    const received = parseFloat(amountReceived);
    if (!amountReceived || isNaN(received) || received < totalAmount) {
      alert('Please enter an amount equal to or greater than the total amount.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmCheckout = () => {
    const received = parseFloat(amountReceived);
    setShowConfirmation(false);
    
    // Generate receipt data
    const receipt = {
      receiptNo: generateReceiptNumber(),
      items: cartItems.map(item => ({
        name: item.itemName || item.name || 'Item',
        qty: item.quantity || 1,
        price: item.itemPrice || item.price || 0,
        total: (item.itemPrice || item.price || 0) * (item.quantity || 1)
      })),
      paymentMethod: 'CASH',
      subtotal: totalAmount,
      discount: 0.00,
      total: totalAmount,
      cash: received,
      change: change,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };
    
    setReceiptData(receipt);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      attemptAutoPrint(receipt);
    }, 800);
  };

  const handleNewTransaction = () => {
    setShowReceipt(false);
    onProceed(parseFloat(amountReceived), change);
  };

  const attemptAutoPrint = async (receipt) => {
    setIsAutoPrinting(true);
    setPrintError(null);
    try {
      await sendReceiptToPrinter(receipt);
      setIsAutoPrinting(false);
      handleNewTransaction();
    } catch (error) {
      setIsAutoPrinting(false);
      setPrintError(error.message || 'Unable to reach the printer.');
      setShowReceipt(true);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmountReceived(value);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 font-poppins p-4"
      >
        <div 
          className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-gray-200 relative">
            <h2 className="text-xl font-semibold text-gray-900">Cash Payment</h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Total:
                </label>
              </div>
              <div className="text-4xl font-bold text-orange-500">
                ₱{totalAmount.toFixed(2)}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Received:
              </label>
              <input
                type="text"
                value={amountReceived}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change:
              </label>
              <div className="bg-green-100 rounded-lg p-4 text-center">
                <span className="text-2xl font-bold text-green-700">
                  PHP {change.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="flex-1 py-3 px-6 rounded-lg font-semibold text-white bg-[#8B7355] hover:bg-[#6d5a43] transition-all"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      <CheckoutConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmCheckout}
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
        }}
      />

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receiptData={receiptData}
        onNewTransaction={handleNewTransaction}
        initialPrintError={printError}
        onPrintSuccess={handleNewTransaction}
        disableAutoPrint={true}
      />

      <PrintingModal isOpen={isAutoPrinting} />
    </>
  );
};

export default CashPaymentModal;

