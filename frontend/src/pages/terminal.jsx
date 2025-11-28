import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/shared/header';
import { FaPlus, FaMinus, FaEdit } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import CategoryButtons from '../components/shared/CategoryButtons';
import OrderSummary from '../components/terminal/OrderSummary';
import ProductCard from '../components/terminal/ProductCard';
import Pagination from '../components/inventory/Pagination';
import CheckoutConfirmationModal from '../components/terminal/CheckoutConfirmationModal';
import CashPaymentModal from '../components/terminal/CashPaymentModal';
import QRCodePaymentModal from '../components/terminal/QRCodePaymentModal';
import DiscountModal from '../components/terminal/DiscountModal';
import RemoveItemPinModal from '../components/terminal/RemoveItemPinModal';


import allIcon from '../assets/inventory-icons/ALL.svg';
import topIcon from '../assets/inventory-icons/Top.svg';
import bottomsIcon from '../assets/inventory-icons/Bottoms.svg';
import dressesIcon from '../assets/inventory-icons/dresses.svg';
import makeupIcon from '../assets/inventory-icons/make up.svg';
import accessoriesIcon from '../assets/inventory-icons/accesories.svg';
import shoesIcon from '../assets/inventory-icons/shoe.svg';
import headWearIcon from '../assets/inventory-icons/head wear.svg';
import othersIcon from '../assets/inventory-icons/Others.svg';

const Terminal = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?._id || currentUser?.id || currentUser?.email || 'guest';
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [productQuantities, setProductQuantities] = useState({});
  const [productSizes, setProductSizes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showQRPaymentModal, setShowQRPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [cartReadyForSync, setCartReadyForSync] = useState(false);
  const [showRemoveItemModal, setShowRemoveItemModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const itemsPerPage = 10; 

  const resolveItemSize = (item = {}) => {
    if (item.selectedSize) return item.selectedSize;
    if (item.sizes && typeof item.sizes === 'object') {
      return Object.keys(item.sizes)[0] || '';
    }
    if (item.size) return item.size;
    return '';
  };

  const normalizeCartItem = (item = {}) => ({
    ...item,
    _id: item._id || item.productId || item.id,
    productId: item.productId || item._id || item.id,
    itemPrice: item.itemPrice || 0,
    quantity: item.quantity || 1,
    selectedSize: resolveItemSize(item),
    sizes: item.sizes || productSizes[item._id || item.productId] || productSizes[item.productId || item._id] || {}
  });

  const categories = [
    { name: 'All', icon: allIcon },
    { name: 'Tops', icon: topIcon },
    { name: 'Bottoms', icon: bottomsIcon },
    { name: 'Dresses', icon: dressesIcon },
    { name: 'Makeup', icon: makeupIcon },
    { name: 'Accessories', icon: accessoriesIcon },
    { name: 'Shoes', icon: shoesIcon },
    { name: 'Head Wear', icon: headWearIcon },
    { name: 'Others', icon: othersIcon }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('pos_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart.map((item) => normalizeCartItem({
            ...item,
            sizes: item.sizes || productSizes[item._id || item.productId] || {}
          })));
        }
      }
    } catch (error) {
      console.warn('Unable to load saved cart', error);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const fetchCartFromServer = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/cart/${encodeURIComponent(userId)}`);
        const data = await response.json();

        if (isMounted && data.success && data.data?.items?.length) {
          setCart(data.data.items.map(normalizeCartItem));
        }
      } catch (error) {
        console.warn('Unable to load cart from server', error);
      } finally {
        if (isMounted) {
          setCartReadyForSync(true);
        }
      }
    };

    fetchCartFromServer();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !cartReadyForSync) return;

    const saveCartToServer = async () => {
      try {
        await fetch(`http://localhost:5000/api/cart/${encodeURIComponent(userId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ items: cart })
        });
      } catch (error) {
        console.warn('Unable to save cart to server', error);
      }
    };

    saveCartToServer();
  }, [cart, userId, cartReadyForSync]);

  useEffect(() => {
    try {
      localStorage.setItem('pos_cart', JSON.stringify(cart));
    } catch (error) {
      console.warn('Unable to persist cart', error);
    }
  }, [cart]);

 
  useEffect(() => {
    filterProducts();
    setCurrentPage(1); 
  }, [selectedCategory, searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
       
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleProductClick = (product) => {
    if (expandedProductId === product._id) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(product._id);
      if (!productQuantities[product._id]) {
        setProductQuantities({ ...productQuantities, [product._id]: 1 });
      }
      if (!productSizes[product._id]) {
     
        const availableSizes = product.sizes && typeof product.sizes === 'object' 
          ? Object.keys(product.sizes) 
          : ['XS', 'S', 'M', 'L'];
        const defaultSize = availableSizes.length > 0 ? availableSizes[0] : 'XS';
        setProductSizes({ ...productSizes, [product._id]: defaultSize });
      }
     
    }
  };

  const updateProductQuantity = (productId, delta) => {
    setProductQuantities({
      ...productQuantities,
      [productId]: Math.max(1, (productQuantities[productId] || 1) + delta)
    });
  };

  const addToCartFromExpanded = (product) => {
    const quantity = productQuantities[product._id] || 1;
    const size = productSizes[product._id] || '';

    const productToAdd = {
      ...product,
      productId: product._id,
      selectedSize: size,
      quantity: quantity
    };

    const existingItem = cart.find(item => 
      item._id === product._id && 
      item.selectedSize === size
    );
    
    if (existingItem) {
      setCart(cart.map(item => 
        item._id === product._id && 
        item.selectedSize === size
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, productToAdd]);
    }

    setExpandedProductId(null);
  };

  const addToCart = (product) => {
    const defaultSize = product.sizes && typeof product.sizes === 'object'
      ? Object.keys(product.sizes)[0] || ''
      : (product.size || '');
    
    const existingItem = cart.find(item => 
      item._id === product._id && (item.selectedSize || '') === (defaultSize || '')
    );
    
    if (existingItem) {
      setCart(cart.map(item => 
        item._id === product._id && (item.selectedSize || '') === (defaultSize || '')
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, productId: product._id, selectedSize: defaultSize, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemOrId, newQuantity) => {
    // Handle both item object and productId for backward compatibility
    const item = typeof itemOrId === 'object' ? itemOrId : cart.find(i => i._id === itemOrId);
    const productId = typeof itemOrId === 'object' ? itemOrId._id : itemOrId;
    
    if (newQuantity <= 0) {
      // Show PIN modal before removing
      if (item) {
        handleRemoveItemClick(item);
      } else {
        removeFromCart(productId);
      }
    } else {
      setCart(cart.map(item => 
        item._id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const handleRemoveItemClick = (item) => {
    setItemToRemove(item);
    setShowRemoveItemModal(true);
  };

  const recordVoidedItem = async (item) => {
    try {
      await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          performedById: currentUser?._id || currentUser?.id,
          performedByName: currentUser?.name,
          items: [
            {
              productId: item.productId || item._id,
              itemName: item.itemName,
              sku: item.sku,
              variant: item.variant,
              selectedSize: resolveItemSize(item) || null,
              quantity: item.quantity || 1,
              price: item.itemPrice || 0
            }
          ],
          paymentMethod: 'void',
          amountReceived: 0,
          changeGiven: 0,
          referenceNo: `VOID-${Date.now()}`,
          totalAmount: (item.itemPrice || 0) * (item.quantity || 1),
          status: 'Voided'
        })
      });
    } catch (error) {
      console.warn('Failed to record void transaction', error);
    }
  };

  const confirmRemoveItem = () => {
    if (itemToRemove) {
      setCart(cart.filter(item => {
        const sameProduct = (item._id || item.productId) === (itemToRemove._id || itemToRemove.productId);
        const sameSize = (resolveItemSize(item) || '') === (resolveItemSize(itemToRemove) || '');
        return !(sameProduct && sameSize);
      }));
      recordVoidedItem(itemToRemove);
      setItemToRemove(null);
      setShowRemoveItemModal(false);
    }
  };

  const removeFromCart = (item) => {
    // This function is called from OrderSummary
    // Show PIN verification modal first
    handleRemoveItemClick(item);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  };

  const calculateDiscount = () => {
    return parseFloat(discountAmount) || 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    
    setShowCheckoutModal(true);
  };

  const confirmCheckout = () => {
    setShowCheckoutModal(false);
    alert('Proceeding to checkout...');
  };

  const handleCashPayment = () => {
    setShowCashPaymentModal(true);
  };

  const mapCartItemsForStockUpdate = () =>
    cart.map(item => ({
      _id: item.productId || item._id,
      size: resolveItemSize(item) || null,
      quantity: item.quantity || 1
    }));

  const mapCartItemsForTransaction = () =>
    cart.map(item => ({
      productId: item.productId || item._id,
      itemName: item.itemName,
      sku: item.sku,
      variant: item.variant,
      selectedSize: resolveItemSize(item) || null,
      quantity: item.quantity || 1,
      price: item.itemPrice || 0
    }));

  const finalizeTransaction = async (meta = {}) => {
    if (!cart.length) return;

    try {
      const response = await fetch('http://localhost:5000/api/products/update-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: mapCartItemsForStockUpdate() })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update stock');
      }

      await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          items: mapCartItemsForTransaction(),
          paymentMethod: meta.paymentMethod || 'unknown',
          amountReceived: meta.amountReceived,
          changeGiven: meta.change,
          referenceNo: meta.referenceNo,
          receiptNo: meta.receiptNo,
          totalAmount: calculateTotal(),
          performedById: currentUser?._id || currentUser?.id,
          performedByName: currentUser?.name,
          status: 'Completed'
        })
      });

      await fetchProducts();
      setCart([]);
    } catch (error) {
      console.error('Error finalizing transaction:', error);
      alert('Transaction completed but stock update failed. Please refresh and verify inventory.');
    }
  };

  const handleCashProceed = async (amountReceived, change, receiptNo) => {
    console.log('handleCashProceed received receiptNo:', receiptNo);
    setShowCashPaymentModal(false);
    await finalizeTransaction({ paymentMethod: 'cash', amountReceived, change, receiptNo });
  };

  const handleQRPayment = () => {
    setShowQRPaymentModal(true);
  };

  const handleQRProceed = async (referenceNo, screenshot, receiptNo) => {
    console.log('handleQRProceed received receiptNo:', receiptNo);
    setShowQRPaymentModal(false);
    await finalizeTransaction({ paymentMethod: 'qr', referenceNo, screenshot, receiptNo });
  };

  const handleSelectDiscount = (discount) => {
    if (discount.discountValue.includes('%')) {
      const percentage = parseFloat(discount.discountValue.replace('% OFF', ''));
      const discountValue = (calculateSubtotal() * percentage) / 100;
      setDiscountAmount(discountValue.toString());
    } else if (discount.discountValue.includes('P') || discount.discountValue.includes('₱')) {
      const amount = parseFloat(discount.discountValue.replace(/[P₱\sOFF]/g, ''));
      setDiscountAmount(amount.toString());
    }
  };

  return (
    <>
      <div className="relative flex flex-col h-screen">
       
        <div className="absolute top-0 left-0 right-[420px] bg-white px-6 py-4 z-10 overflow-hidden" style={{ paddingRight: '24px' }}>
          <Header 
            pageName="Terminal"
            showSearch={true}
            showFilter={true}
            searchValue={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            profileBackground=""
            showBorder={false}
            hidePageName={true}
            centerProfile={false}
            profileMinWidth="220px"
            profilePadding="px-4"
            profileGap="gap-3"
          />
        </div>
        
       
        <div className="flex flex-1 overflow-hidden">

          
          <div className="flex-1 overflow-auto p-6 pt-24">
        
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Category</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
              <CategoryButtons
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
                size="md"
              />
            </div>
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>

         
          <div>
            <h2 className="text-lg font-semibold mb-3">Products</h2>
            {loading ? (
              <div className="text-center py-10">Loading...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No products found
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-4 items-start">
                {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product) => {
                  const isExpanded = expandedProductId === product._id;
                  return (
                    <div key={product._id} className="relative">
                     
                      <div className={isExpanded ? 'invisible' : 'visible'}>
                        <ProductCard
                          product={product}
                          isExpanded={false}
                          onToggleExpand={() => handleProductClick(product)}
                          productQuantity={productQuantities[product._id] || 1}
                          onDecrement={() => updateProductQuantity(product._id, -1)}
                          onIncrement={() => updateProductQuantity(product._id, 1)}
                          onAdd={() => addToCartFromExpanded(product)}
                          selectedSize={productSizes[product._id]}
                          onSelectSize={(size) => setProductSizes({ ...productSizes, [product._id]: size })}
                        />
                      </div>
                    
                      {isExpanded && (
                        <div className="absolute top-0 left-0 right-0 z-30">
                          <ProductCard
                            product={product}
                            isExpanded={true}
                            onToggleExpand={() => handleProductClick(product)}
                            productQuantity={productQuantities[product._id] || 1}
                            onDecrement={() => updateProductQuantity(product._id, -1)}
                            onIncrement={() => updateProductQuantity(product._id, 1)}
                            onAdd={() => addToCartFromExpanded(product)}
                            selectedSize={productSizes[product._id]}
                            onSelectSize={(size) => setProductSizes({ ...productSizes, [product._id]: size })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {filteredProducts.length >= itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          )}
          </div>
          
         
          <div className="w-[420px] bg-gray-50 border-l-0 p-4 relative z-30">
            <OrderSummary
              cart={cart}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              discountAmount={discountAmount}
              setDiscountAmount={setDiscountAmount}
              calculateSubtotal={calculateSubtotal}
              calculateDiscount={calculateDiscount}
              calculateTotal={calculateTotal}
              handleCheckout={handleCheckout}
              onCashPayment={handleCashPayment}
              onQRPayment={handleQRPayment}
              onOpenDiscountModal={() => setShowDiscountModal(true)}
            />
          </div>
        </div>
      </div>

      <CheckoutConfirmationModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onConfirm={confirmCheckout}
      />

      <CashPaymentModal
        isOpen={showCashPaymentModal}
        onClose={() => setShowCashPaymentModal(false)}
        totalAmount={calculateTotal()}
        onProceed={handleCashProceed}
        cartItems={cart}
      />

      <QRCodePaymentModal
        isOpen={showQRPaymentModal}
        onClose={() => setShowQRPaymentModal(false)}
        totalAmount={calculateTotal()}
        onProceed={handleQRProceed}
        cartItems={cart}
      />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSelectDiscount={handleSelectDiscount}
      />

      <RemoveItemPinModal
        isOpen={showRemoveItemModal}
        onClose={() => {
          setShowRemoveItemModal(false);
          setItemToRemove(null);
        }}
        onConfirm={confirmRemoveItem}
        item={itemToRemove}
      />
    </>
  );
};

export default Terminal;

