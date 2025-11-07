import React, { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

const QRCodePaymentModal = ({ isOpen, onClose, totalAmount, onProceed }) => {
  const [referenceNo, setReferenceNo] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setReferenceNo('');
      setScreenshot(null);
      setScreenshotFileName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    if (!referenceNo.trim()) {
      alert('Please enter a reference number.');
      return;
    }
    onProceed(referenceNo, screenshot);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10002] p-4 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
      >
        <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-white transition-colors z-10"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        <div 
          className="h-1 px-6 py-6"
          style={{ 
            background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)'
          }}
        >
        </div>

        <div className="px-6 py-4 relative">
          
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Reference No. :
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Enter reference number"
                className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Amount Paid:
              </label>
              <div className="flex-1 text-left">
                <span className="text-lg font-semibold text-gray-800">
                  ₱{formatAmount(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Screenshot(Optional):
              </label>
              <div className="flex-1 relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-upload"
                />
                {screenshotFileName ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {screenshotFileName}
                    </span>
                    <button
                      onClick={handleRemoveScreenshot}
                      className="text-red-500 hover:text-red-700 text-xs ml-2"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="screenshot-upload"
                    className="block px-4 py-3 text-sm border border-gray-300 rounded-lg cursor-pointer hover:border-[#AD7F65] transition-colors text-gray-600"
                  >
                    Click to upload image
                  </label>
                )}
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

export default QRCodePaymentModal;

