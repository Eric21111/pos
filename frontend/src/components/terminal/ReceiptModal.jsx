import React, { useState, useEffect, useCallback } from 'react';
import { FaPrint } from 'react-icons/fa';
import { MdRefresh } from 'react-icons/md';
import PrintingModal from './PrintingModal';
import PrintCompleteModal from './PrintCompleteModal';
import '../../styles/print.css';
import { sendReceiptToPrinter } from '../../utils/printBridge';

const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  receiptData, 
  onNewTransaction,
  initialPrintError = null,
  onPrintSuccess = null,
  disableAutoPrint = false
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintComplete, setShowPrintComplete] = useState(false);
  const [printAttempts, setPrintAttempts] = useState(0);
  const [printError, setPrintError] = useState(null);
  
  const receipt = receiptData || {
    receiptNo: '000000',
    items: [],
    reference: '',
    paymentMethod: '',
    subtotal: 0.00,
    discount: 0.00,
    total: 0.00,
    cash: 0.00,
    change: 0.00,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString()
  };

  const handlePrint = useCallback(async () => {
    setIsPrinting(true);
    setPrintAttempts((prev) => prev + 1);
    setPrintError(null);

    try {
      await sendReceiptToPrinter(receipt);
      if (onPrintSuccess) {
        onPrintSuccess();
      }
    } catch (error) {
      setPrintError(error.message || 'Unable to reach Bluetooth printer');
      setShowPrintComplete(true);
    } finally {
      setIsPrinting(false);
    }
  }, [receipt]);

  useEffect(() => {
    if (!isOpen) {
      setIsPrinting(false);
      setShowPrintComplete(false);
      setPrintAttempts(0);
      setPrintError(null);
      return;
    }

    setPrintError(initialPrintError);

    // Auto-print only when explicitly allowed. When this modal is
    // opened from payment flows that already attempted to print,
    // we skip the extra automatic print and let the user decide.
    if (disableAutoPrint) return;

    // Start printing immediately with minimal delay for UI rendering
    const autoPrintTimer = setTimeout(() => {
      handlePrint();
    }, 100);

    return () => clearTimeout(autoPrintTimer);
  }, [isOpen, disableAutoPrint, handlePrint]);

  useEffect(() => {
    if (printError && showPrintComplete) {
      const timer = setTimeout(() => {
        setShowPrintComplete(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [printError, showPrintComplete]);

  if (!isOpen) return null;

  const handlePrintSuccess = () => {
    setShowPrintComplete(false);
    setPrintError(null);
    if (onPrintSuccess) {
      onPrintSuccess();
    }
  };

  const handlePrintRetry = () => {
    setShowPrintComplete(false);
    setPrintError(null);
    handlePrint();
  };


  return (
    <>
     
      <div 
        className="receipt-print-content" 
        id="receipt-to-print" 
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: '0',
          width: '58mm',
          background: 'white',
          padding: '10px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold' }}>Create Your Style</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '5px 0' }}>
            <span>{receipt.time || '12:00PM'}</span>
            <span>{receipt.contactNumber || '+631112224444'}</span>
          </div>
          <p style={{ fontSize: '10px', margin: '2px 0' }}>Pasonanca, Zamboanga City</p>
        </div>
        
        <div style={{ textAlign: 'center', margin: '10px 0', border: '1px dashed #000', padding: '8px 5px' }}>
          <p style={{ fontSize: '10px', margin: '2px 0' }}>Receipt No:</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0' }}>#{receipt.receiptNo}</p>
        </div>
        
        <table style={{ width: '100%', fontSize: '10px', marginBottom: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '2px' }}>Item</th>
              <th style={{ textAlign: 'center', padding: '2px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '2px' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '2px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items && receipt.items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '2px', fontSize: '9px' }}>{item.name}</td>
                <td style={{ textAlign: 'center', padding: '2px' }}>{item.qty}</td>
                <td style={{ textAlign: 'right', padding: '2px' }}>₱{item.price.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '2px' }}>₱{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <span>Transaction/Reference:</span>
            <span>{receipt.referenceNo || receipt.reference || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <span>Payment Method:</span>
            <span>{receipt.paymentMethod || 'CASH'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <span>Subtotal:</span>
            <span>PHP {receipt.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '5px 0', paddingTop: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>Discount:</span>
              <span>PHP {receipt.discount.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontWeight: 'bold', fontSize: '12px' }}>
            <span>Total:</span>
            <span>PHP {receipt.total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <span>Cash:</span>
            <span>PHP {receipt.cash.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <span>Change:</span>
            <span>PHP {receipt.change.toFixed(2)}</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '10px', fontWeight: 'bold' }}>
          <p>This is not an official receipt</p>
        </div>
      </div>

      {/* Regular modal view */}
      <div
        className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 font-poppins p-4 no-print"
      >
        <div className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">Create Your Style</h2>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>{receipt.time || '12:00PM'}</span>
              <span>{receipt.contactNumber || '+631112224444'}</span>
            </div>
            <p className="text-xs text-gray-600">Pasonanca, Zamboanga City</p>
          </div>

          {/* Receipt Number */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 mb-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Receipt No:</p>
            <p className="text-2xl font-bold">#{receipt.receiptNo}</p>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            {receipt.items && receipt.items.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 text-left">{item.name}</td>
                      <td className="py-2 text-center">{item.qty}</td>
                      <td className="py-2 text-right">PHP {item.price.toFixed(2)}</td>
                      <td className="py-2 text-right">PHP {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-4">No items in this transaction</p>
            )}
          </div>

          {/* Transaction Details */}
          <div className="border-t border-dashed pt-3 mb-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction/Reference</span>
              <span>{receipt.referenceNo || receipt.reference || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span>{receipt.paymentMethod || 'CASH'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>PHP {receipt.subtotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span>PHP {receipt.discount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Total</span>
              <span>PHP {receipt.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cash</span>
              <span>PHP {receipt.cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Change</span>
              <span>PHP {receipt.change.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer Message */}
          <div className="text-center py-4 mb-4">
            <p className="text-sm font-bold">This is not an official receipt</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {printError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {printError}
              </div>
            )}
            <button
              onClick={handlePrint}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <FaPrint />
              {printError ? 'Print Again' : 'Print Receipt'}
            </button>
            <button
              onClick={onNewTransaction}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
            >
              <MdRefresh />
              New Transaction
            </button>
          </div>
        </div>
      </div>

        {/* Printing Animation Modal */}
        <PrintingModal isOpen={isPrinting} />
        
        {/* Print Completion Confirmation */}
        <PrintCompleteModal 
          isOpen={showPrintComplete}
          onConfirm={handlePrintSuccess}
          onRetry={handlePrintRetry}
          error={printError}
        />
      </div>
    </>
  );
};

export default ReceiptModal;
