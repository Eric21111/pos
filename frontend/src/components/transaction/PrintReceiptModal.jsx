import React, { useRef } from 'react';
import { FaTimes, FaPrint } from 'react-icons/fa';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(value);

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const PrintReceiptModal = ({ isOpen, onClose, transaction }) => {
  const printRef = useRef(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${transaction.referenceNo || 'Transaction'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Use requestAnimationFrame for immediate printing - no delay needed
    requestAnimationFrame(() => {
      printWindow.print();
      // Close window after a brief moment to allow print dialog to appear
      setTimeout(() => {
        printWindow.close();
      }, 100);
    });
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[10000] backdrop-blur-sm bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="h-2"
          style={{
            background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)'
          }}
        />
        
        <div className="p-8 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Print Receipt
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

          {/* Receipt Preview */}
          <div ref={printRef} className="bg-white p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Create Your Style</h3>
              <p className="text-xs text-gray-600">Pasonanca, Zamboanga City</p>
            </div>

            <div className="border-t border-b border-gray-300 py-3 my-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Receipt</p>
                {transaction.receiptNo && (
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    #{transaction.receiptNo}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-800">{formatDateTime(transaction.checkedOutAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cashier:</span>
                <span className="text-gray-800">{transaction.performedByName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className="text-gray-800 capitalize">{transaction.paymentMethod || 'N/A'}</span>
              </div>
            </div>

            <div className="border-t border-b border-gray-300 py-3 my-3">
              <div className="space-y-2">
                {transaction.items && transaction.items.length > 0 ? (
                  transaction.items.map((item, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.itemName}</p>
                        {item.selectedSize && (
                          <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No items</p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-semibold text-base">
                <span>Total:</span>
                <span>{formatCurrency(transaction.totalAmount)}</span>
              </div>
              {transaction.amountReceived && (
                <div className="flex justify-between">
                  <span>Amount Received:</span>
                  <span>{formatCurrency(transaction.amountReceived)}</span>
                </div>
              )}
              {transaction.changeGiven !== undefined && transaction.changeGiven !== null && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>{formatCurrency(transaction.changeGiven)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-300 mt-4 pt-4 text-center">
              <p className="text-xs text-gray-500">Thank you for your purchase!</p>
              <p className="text-xs text-gray-400 mt-1">This is not an official receipt</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-6 py-3 rounded-xl bg-[#AD7F65] hover:bg-[#76462B] text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            <FaPrint className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintReceiptModal;

