import React, { useState } from 'react';
import { FaEdit, FaMinus, FaPlus, FaTag } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import cashIcon from '../../assets/cash.svg';
import qrIcon from '../../assets/qr.png';

const OrderSummary = ({
  cart,
  removeFromCart,
  updateQuantity,
  discountAmount,
  setDiscountAmount,
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
  handleCheckout,
  onCashPayment,
  onQRPayment,
  onOpenDiscountModal
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  
  const handleProceed = () => {
    if (selectedPaymentMethod === 'cash' && onCashPayment) {
      onCashPayment();
    } else if (selectedPaymentMethod === 'qr' && onQRPayment) {
      onQRPayment();
    } else {
      handleCheckout();
    }
  };
  return (
    <div className="h-full bg-white rounded-[22px] border border-gray-200 flex flex-col" style={{ boxShadow: '5px 0 15px rgba(0,0,0,0.08), 0 7px 17px rgba(0,0,0,0.05)' }}>
      <div className="px-6 py-5 flex items-center">
        <h2 className="text-xl font-bold flex-1 text-center">Order Summary</h2>
        <button className="text-gray-400 hover:text-gray-600 ml-2">
          <FaEdit />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {cart.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <p>No items in cart</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item._id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 shadow-[0_3px_8px_rgba(0,0,0,0.04)] p-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                  {item.itemImage ? (
                    <img 
                      src={item.itemImage} 
                      alt={item.itemName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MdCategory className="text-2xl text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1">
                    {item.itemName}{item.variant ? ` (${item.variant})` : ''}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    SKU: {item.sku}<br />
                    Size: {item.selectedSize || item.size || 'N/A'}<br />
                    Color: {item.selectedVariation || item.variant || 'N/A'}
                  </p>
                  <p className="text-sm font-bold text-[#AD7F65]">
                    PHP {item.itemPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between gap-2">
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    ×
                  </button>
                  {/* <button
                    className="px-3 py-1.5 text-xs text-white rounded-full hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
                  >
                    Add Discount
                  </button> */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center bg-[#AD7F65] text-white rounded-full shadow-sm hover:bg-[#8B5F45] transition-all"
                    >
                      <FaMinus className="text-[10px]" />
                    </button>
                    <span className="text-gray-800 font-semibold min-w-[18px] text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center bg-[#AD7F65] text-white rounded-full shadow-sm hover:bg-[#8B5F45] transition-all"
                    >
                      <FaPlus className="text-[10px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-6  bg-white">
        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#8B7355] mb-2">Discount</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-[#d6c1b5] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
            />
            <button
              onClick={onOpenDiscountModal}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
            >
              <FaTag className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (discountCode) {
                  setDiscountAmount(discountCode);
                  setDiscountCode('');
                }
              }}
              className="px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-md"
              style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
            >
              Apply
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-6 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-800">PHP {calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Discount</span>
            <span className="font-medium text-gray-800">PHP {calculateDiscount().toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-300 my-3"></div>
          <div className="flex justify-between">
            <span className="text-sm font-bold text-black">Total</span>
            <span className="text-sm font-bold" style={{ color: 'rgba(255, 133, 88, 1)' }}>PHP {calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setSelectedPaymentMethod('cash')}
              className={`w-24 flex flex-col items-center justify-center py-2 rounded-lg border-2 transition-all ${
                selectedPaymentMethod === 'cash'
                  ? 'border-[#AD7F65] bg-[#f5f0ed]'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <img src={cashIcon} alt="Cash" className="w-7 h-7 mb-1" />
              <span className="text-xs font-medium text-gray-700">Cash</span>
            </button>
            <button
              onClick={() => setSelectedPaymentMethod('qr')}
              className={`w-24 flex flex-col items-center justify-center py-0 rounded-lg border-2 transition-all ${
                selectedPaymentMethod === 'qr'
                  ? 'border-[#AD7F65] bg-[#f5f0ed]'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <img src={qrIcon} alt="QR Code" className="w-12 h-12 mb-4 " />
              <span className=" absolute text-xs font-medium text-gray-700 translate-y-4">Gcash</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleProceed}
          disabled={cart.length === 0 || !selectedPaymentMethod}
          className="w-full py-3 text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;


