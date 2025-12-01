import React from 'react';
import { FaTimes, FaCalendar, FaUser, FaCreditCard, FaReceipt, FaUndoAlt } from 'react-icons/fa';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(value);

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const ViewTransactionModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[10000] backdrop-blur-sm bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
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
                Transaction Details
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

          <div className="space-y-6">
            {/* Transaction Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <FaReceipt className="text-[#AD7F65] mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Receipt No.</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {transaction.receiptNo ? `#${transaction.receiptNo}` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaCalendar className="text-[#AD7F65] mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Date & Time</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatDateTime(transaction.checkedOutAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaUser className="text-[#AD7F65] mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Cashier</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {transaction.performedByName || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaCreditCard className="text-[#AD7F65] mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">
                      {transaction.paymentMethod || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Items</h3>
              <div className="space-y-3">
                {transaction.items && transaction.items.length > 0 ? (
                  transaction.items.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{item.itemName}</p>
                          <div className="mt-1 space-y-1">
                            {item.sku && (
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                            )}
                            {item.selectedSize && (
                              <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                            )}
                            {item.variant && (
                              <p className="text-xs text-gray-500">Variant: {item.variant}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {item.quantity} x {formatCurrency(item.price)}
                          </p>
                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            {formatCurrency(item.quantity * item.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No items found</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(transaction.totalAmount)}</span>
                </div>
                {transaction.amountReceived && (
                  <div className="flex justify-between text-gray-600">
                    <span>Amount Received:</span>
                    <span>{formatCurrency(transaction.amountReceived)}</span>
                  </div>
                )}
                {transaction.changeGiven !== undefined && transaction.changeGiven !== null && (
                  <div className="flex justify-between text-gray-600">
                    <span>Change:</span>
                    <span>{formatCurrency(transaction.changeGiven)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Total:</span>
                    <span className="text-lg font-bold text-[#AD7F65]">
                      {formatCurrency(transaction.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Status</h3>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                transaction.status === 'Completed' 
                  ? 'bg-green-100 text-green-700'
                  : transaction.status === 'Returned'
                  ? 'bg-orange-100 text-orange-700'
                  : transaction.status === 'Partially Returned'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-600'
              }`}>
                {transaction.status}
              </span>
            </div>

            {/* Return Transactions */}
            {transaction.returnTransactions && transaction.returnTransactions.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                  <FaUndoAlt className="text-orange-600" />
                  Return Transactions ({transaction.returnTransactions.length})
                </h3>
                <div className="space-y-4">
                  {transaction.returnTransactions.map((returnTrx, idx) => (
                    <div key={returnTrx._id || idx} className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Return #{returnTrx.referenceNo || returnTrx._id?.substring(0, 12)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(returnTrx.checkedOutAt)}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                          Returned
                        </span>
                      </div>
                      <div className="space-y-2">
                        {returnTrx.items && returnTrx.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{item.itemName}</p>
                              <div className="mt-1 space-y-0.5">
                                {item.sku && (
                                  <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                )}
                                {item.selectedSize && (
                                  <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                                )}
                                {item.returnReason && (
                                  <p className="text-xs text-orange-600 font-medium">
                                    Reason: {item.returnReason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {item.quantity} x {formatCurrency(item.price)}
                              </p>
                              <p className="text-sm font-semibold text-gray-800 mt-1">
                                {formatCurrency(item.quantity * item.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Return Total:</span>
                          <span className="text-base font-bold text-orange-700">
                            {formatCurrency(returnTrx.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-xl bg-[#AD7F65] hover:bg-[#76462B] text-white font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTransactionModal;

