import React, { useState } from 'react';
import { FaEdit, FaMinus, FaPlus, FaTag, FaTimes } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import cashIcon from '../../assets/cash.svg';
import qrIcon from '../../assets/qr.png';
import RemoveItemPinModal from './RemoveItemPinModal';
import { useAuth } from '../../context/AuthContext';

const OrderSummary = ({
  cart,
  removeFromCart,
  updateQuantity,
  discountAmount,
  setDiscountAmount,
  selectedDiscount,
  onRemoveDiscount,
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
  handleCheckout,
  onCashPayment,
  onQRPayment,
  onOpenDiscountModal,
  onSelectDiscount
}) => {
  const { currentUser } = useAuth();
  const userId = currentUser?._id || currentUser?.id || currentUser?.email || 'guest';
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  
  const handleProceed = () => {
    if (selectedPaymentMethod === 'cash' && onCashPayment) {
      onCashPayment();
    } else if (selectedPaymentMethod === 'qr' && onQRPayment) {
      onQRPayment();
    } else {
      handleCheckout();
    }
  };

  const handleMinusClick = (item) => {
    setItemToRemove(item);
    setIsRemoveModalOpen(true);
  };

  const handleRemoveConfirm = async (reason) => {
    if (!itemToRemove) {
      setIsRemoveModalOpen(false);
      setItemToRemove(null);
      return;
    }

    try {
      // Calculate the quantity to void (always 1 when clicking minus)
      const voidQuantity = 1;
      const voidAmount = itemToRemove.itemPrice * voidQuantity;

      // Prepare the voided item with voidReason
      const voidedItem = {
        productId: itemToRemove.productId || itemToRemove._id || itemToRemove.id,
        itemName: itemToRemove.itemName,
        sku: itemToRemove.sku,
        variant: itemToRemove.variant || itemToRemove.selectedVariation,
        selectedSize: itemToRemove.selectedSize || itemToRemove.size,
        quantity: voidQuantity,
        price: itemToRemove.itemPrice,
        itemImage: itemToRemove.itemImage || '',
        voidReason: reason
      };

      // Record void transaction
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          items: [voidedItem],
          paymentMethod: 'void',
          totalAmount: voidAmount,
          performedById: currentUser?._id || currentUser?.id || '',
          performedByName: currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'System',
          status: 'Voided',
          voidReason: reason
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to record void transaction:', data.message);
        // Still proceed with removing the item even if logging fails
      }

      // Remove or decrease quantity after successful void logging
      if (itemToRemove.quantity === 1) {
        // If quantity is 1, remove the item completely
        removeFromCart(itemToRemove);
      } else {
        // If quantity > 1, decrease the quantity
        updateQuantity(itemToRemove, itemToRemove.quantity - 1);
      }
    } catch (error) {
      console.error('Error recording void transaction:', error);
      // Still proceed with removing the item even if logging fails
      if (itemToRemove.quantity === 1) {
        removeFromCart(itemToRemove);
      } else {
        updateQuantity(itemToRemove, itemToRemove.quantity - 1);
      }
    } finally {
      setIsRemoveModalOpen(false);
      setItemToRemove(null);
    }
  };

  const handleRemoveModalClose = () => {
    setIsRemoveModalOpen(false);
    setItemToRemove(null);
  };

  const applyDiscountCode = async () => {
    if (!discountCode || !discountCode.trim()) {
      alert('Please enter a discount code');
      return;
    }

    try {
      setApplyingDiscount(true);
      
      // Fetch all discounts
      const response = await fetch('http://localhost:5000/api/discounts');
      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.data)) {
        alert('Failed to fetch discounts. Please try again.');
        return;
      }

      // Find discount by code (case-insensitive)
      const codeToFind = discountCode.trim().toLowerCase();
      const matchingDiscount = data.data.find(discount => {
        const discountCodeStr = (discount.discountCode || '').trim().toLowerCase();
        return discountCodeStr === codeToFind && discount.status === 'active';
      });

      if (!matchingDiscount) {
        alert('Discount code not found or inactive. Please check the code and try again.');
        setDiscountCode('');
        return;
      }

      // Apply the discount using the onSelectDiscount function
      if (onSelectDiscount) {
        onSelectDiscount(matchingDiscount);
        setDiscountCode('');
      } else {
        alert('Unable to apply discount. Please try selecting from the discount list.');
      }
    } catch (error) {
      console.error('Error applying discount code:', error);
      alert('An error occurred while applying the discount code. Please try again.');
    } finally {
      setApplyingDiscount(false);
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
                  {item.itemImage && item.itemImage.trim() !== '' ? (
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
                    onClick={() => removeFromCart(item)}
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
                      onClick={() => handleMinusClick(item)}
                      className="w-6 h-6 flex items-center justify-center bg-[#AD7F65] text-white rounded-full shadow-sm hover:bg-[#8B5F45] transition-all"
                    >
                      <FaMinus className="text-[10px]" />
                    </button>
                    <span className="text-gray-800 font-semibold min-w-[18px] text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        let maxQty = item.currentStock;
                        if (item.selectedSize && item.sizes && item.sizes[item.selectedSize] !== undefined) {
                          const sizeData = item.sizes[item.selectedSize];
                          maxQty = typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined
                            ? sizeData.quantity
                            : (typeof sizeData === 'number' ? sizeData : 0);
                        }
                        if (!maxQty || item.quantity < maxQty) {
                          updateQuantity(item, item.quantity + 1);
                        }
                      }}
                      className={`w-6 h-6 flex items-center justify-center rounded-full shadow-sm transition-all ${
                        (() => {
                          if (item.selectedSize && item.sizes && item.sizes[item.selectedSize] !== undefined) {
                            const sizeData = item.sizes[item.selectedSize];
                            const maxQty = typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined
                              ? sizeData.quantity
                              : (typeof sizeData === 'number' ? sizeData : 0);
                            return item.quantity >= maxQty;
                          }
                          return false;
                        })()
                          ? 'bg-gray-300 text-white cursor-not-allowed'
                          : 'bg-[#AD7F65] text-white hover:bg-[#8B5F45]'
                      }`}
                      disabled={
                        (() => {
                          if (item.selectedSize && item.sizes && item.sizes[item.selectedSize] !== undefined) {
                            const sizeData = item.sizes[item.selectedSize];
                            const maxQty = typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined
                              ? sizeData.quantity
                              : (typeof sizeData === 'number' ? sizeData : 0);
                            return item.quantity >= maxQty;
                          }
                          return false;
                        })()
                      }
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
          {selectedDiscount ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-[#d6c1b5]">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FaTag className="text-[#AD7F65] text-sm" />
                  <span className="text-sm font-medium text-gray-800">{selectedDiscount.title}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {selectedDiscount.discountValue}
                </div>
              </div>
              <button
                onClick={onRemoveDiscount}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                title="Remove discount"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !applyingDiscount) {
                    applyDiscountCode();
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-[#d6c1b5] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
              />
              <button
                onClick={onOpenDiscountModal}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                title="Browse discounts"
              >
                <FaTag className="w-4 h-4" />
              </button>
              <button
                onClick={applyDiscountCode}
                disabled={applyingDiscount || !discountCode || !discountCode.trim()}
                className="px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
              >
                {applyingDiscount ? 'Applying...' : 'Apply'}
              </button>
            </div>
          )}
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
            {/* <button
              onClick={() => setSelectedPaymentMethod('qr')}
              className={`w-24 flex flex-col items-center justify-center py-0 rounded-lg border-2 transition-all ${
                selectedPaymentMethod === 'qr'
                  ? 'border-[#AD7F65] bg-[#f5f0ed]'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <img src={qrIcon} alt="QR Code" className="w-12 h-12 mb-4 " />
              <span className=" absolute text-xs font-medium text-gray-700 translate-y-4">Gcash</span>
            </button> */}
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

      <RemoveItemPinModal
        isOpen={isRemoveModalOpen}
        onClose={handleRemoveModalClose}
        onConfirm={handleRemoveConfirm}
        item={itemToRemove}
      />
    </div>
  );
};

export default OrderSummary;


