import React, { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import gcashHeader from '../../assets/gcashHeader.png';
import CheckoutConfirmationModal from './CheckoutConfirmationModal';
import SuccessModal from './SuccessModal';
import ReceiptModal from './ReceiptModal';
import PrintingModal from './PrintingModal';
import { sendReceiptToPrinter } from '../../utils/printBridge';

const QRCodePaymentModal = ({ isOpen, onClose, totalAmount, onProceed, cartItems = [] }) => {
  const [activeTab, setActiveTab] = useState('qr');
  const [referenceNo, setReferenceNo] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isAutoPrinting, setIsAutoPrinting] = useState(false);
  const [printError, setPrintError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setReferenceNo('');
      setScreenshot(null);
      setScreenshotFileName('');
      setActiveTab('qr');
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setScreenshotFileName(file.name);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setScreenshotFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProceed = () => {
    if (activeTab === 'reference' && !referenceNo.trim()) {
      alert('Please enter a reference number.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmCheckout = () => {
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
      paymentMethod: 'GCASH',
      subtotal: totalAmount,
      discount: 0.00,
      total: totalAmount,
      cash: totalAmount,
      change: 0.00,
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
    onProceed(referenceNo || 'QR-PAYMENT', screenshot);
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

  const gcashPaymentData = `gcash://pay?amount=${totalAmount}&merchantName=CYSPOS`;

  return (
    <>
      <div
        className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 font-poppins p-4"
      >
        <div className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
          
          <div className="flex justify-center mb-4 mt-2">
            <div className="bg-gray-100 p-1 rounded-full flex gap-1">
              <button
                onClick={() => setActiveTab('qr')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'qr'
                    ? 'bg-[#C8A882] text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                QR
              </button>
              <button
                onClick={() => setActiveTab('reference')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'reference'
                    ? 'bg-[#C8A882] text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Reference
              </button>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 text-center">
            GCash Payment
          </h2>
        </div>

        <div className="p-6">
          {activeTab === 'qr' ? (
            <>
              <div className="mb-6 text-center">
                <img 
                  src={gcashHeader} 
                  alt="GCash - Scan to Pay" 
                  className="mx-auto h-16 object-contain"
                />
              </div>

              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 border-2 border-gray-300 rounded-lg">
                  <QRCodeSVG
                    value={gcashPaymentData}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="text-center mt-2">
                    <span className="text-red-500 font-bold text-sm">InstaPay</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-1">Total:</p>
                <p className="text-3xl font-bold text-orange-500">
                  ₱{totalAmount.toFixed(2)}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number:
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Amount Received</p>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <span className="text-2xl font-bold text-green-700">
                    PHP {totalAmount.toFixed(2)}
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
                  Payment Confirmed
                </button>
              </div>
            </>
          )}

          {activeTab === 'qr' && (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 text-center mb-2">Amount to Pay</p>
                <p className="text-4xl font-bold text-orange-500 text-center">
                  ₱{totalAmount.toFixed(2)}
                </p>
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
                  Payment Confirmed
                </button>
              </div>
            </>
          )}
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

export default QRCodePaymentModal;

