import { useState, useEffect, useMemo, memo } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataCacheContext';
import Header from '../components/shared/header';
import { FaPlus, FaMinus, FaEdit } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import CategoryButtons from '../components/shared/CategoryButtons';
import OrderSummary from '../components/terminal/OrderSummary';
import ProductCard from '../components/terminal/ProductCard';
import ProductDetailsModal from '../components/terminal/ProductDetailsModal';
import Pagination from '../components/inventory/Pagination';
import CheckoutConfirmationModal from '../components/terminal/CheckoutConfirmationModal';
import CashPaymentModal from '../components/terminal/CashPaymentModal';
import QRCodePaymentModal from '../components/terminal/QRCodePaymentModal';
import DiscountModal from '../components/terminal/DiscountModal';
import RemoveItemPinModal from '../components/terminal/RemoveItemPinModal';
import DuplicateItemModal from '../components/terminal/DuplicateItemModal';


import allIcon from '../assets/inventory-icons/ALL.svg';
import topIcon from '../assets/inventory-icons/Top.svg';
import bottomsIcon from '../assets/inventory-icons/Bottoms.svg';
import dressesIcon from '../assets/inventory-icons/dresses.svg';
import makeupIcon from '../assets/inventory-icons/make up.svg';
import accessoriesIcon from '../assets/inventory-icons/accesories.svg';
import shoesIcon from '../assets/inventory-icons/shoe.svg';
import headWearIcon from '../assets/inventory-icons/head wear.svg';

const Terminal = () => {
  const { currentUser } = useAuth();
  const { getCachedData, setCachedData, isCacheValid, invalidateCache } = useDataCache();
  // Get userId from currentUser for transaction recording
  const userId = currentUser?._id || currentUser?.id || currentUser?.email || 'guest';
  // Use a shared cart ID so cart persists across all users - cart is tied to the POS terminal, not individual users
  const cartId = 'pos-shared-cart';
  const [products, setProducts] = useState(() => getCachedData('products') || []);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState('');
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingDuplicateItem, setPendingDuplicateItem] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOption, setSortOption] = useState('newest');
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
    itemPrice: item.itemPrice || item.price || 0,
    quantity: item.quantity || 1,
    selectedSize: resolveItemSize(item),
    sizes: item.sizes || productSizes[item._id || item.productId] || productSizes[item.productId || item._id] || {}
  });

  const [categories, setCategories] = useState([
    { name: 'All', icon: allIcon }
  ]);

  // Icon mapping for categories
  const categoryIconMap = {
    'Tops': topIcon,
    'Bottoms': bottomsIcon,
    'Dresses': dressesIcon,
    'Makeup': makeupIcon,
    'Accessories': accessoriesIcon,
    'Shoes': shoesIcon,
    'Head Wear': headWearIcon
  };

  // Fetch active categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Filter only active categories and map with icons
        const activeCategories = data.data
          .filter(cat => cat.status === 'active')
          .map(cat => ({
            name: cat.name,
            icon: categoryIconMap[cat.name] || allIcon
          }));
        
        // Add 'All' at the beginning
        setCategories([
          { name: 'All', icon: allIcon },
          ...activeCategories
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories if API fails
      setCategories([
        { name: 'All', icon: allIcon },
        { name: 'Tops', icon: topIcon },
        { name: 'Bottoms', icon: bottomsIcon },
        { name: 'Dresses', icon: dressesIcon },
        { name: 'Makeup', icon: makeupIcon },
        { name: 'Accessories', icon: accessoriesIcon },
        { name: 'Shoes', icon: shoesIcon },
        { name: 'Head Wear', icon: headWearIcon }
      ]);
    }
  };

  // Only fetch if cache is empty or invalid
  useEffect(() => {
    const cachedProducts = getCachedData('products');
    if (!cachedProducts || !isCacheValid('products')) {
      fetchProducts();
    } else {
      setProducts(cachedProducts);
    }
    fetchCategories();
  }, []);

  // Load cart from server first (database is source of truth), fallback to localStorage
  // Cart is shared across all users - tied to POS terminal, not individual users
  useEffect(() => {
    let isMounted = true;

    const loadCart = async () => {
      try {
        // First, try to load from server (database) using shared cart ID
        const response = await fetch(`http://localhost:5000/api/cart/${encodeURIComponent(cartId)}`);
        const data = await response.json();

        if (isMounted && data.success) {
          // If server has cart items, use them (database is source of truth)
          if (data.data?.items?.length) {
            setCart(data.data.items.map(normalizeCartItem));
          } else {
            // Server has no items - check localStorage as fallback
            try {
              const savedCart = localStorage.getItem('pos_cart');
              if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                  setCart(parsedCart.map((item) => normalizeCartItem({
                    ...item,
                    sizes: item.sizes || productSizes[item._id || item.productId] || {}
                  })));
                }
              }
            } catch (localError) {
              console.warn('Unable to load saved cart from localStorage', localError);
            }
          }
        }
      } catch (error) {
        console.warn('Unable to load cart from server, trying localStorage', error);
        // Fallback to localStorage if server fails
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
        } catch (localError) {
          console.warn('Unable to load saved cart from localStorage', localError);
        }
      } finally {
        if (isMounted) {
          setCartReadyForSync(true);
        }
      }
    };

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [cartId]);

  useEffect(() => {
    if (!cartReadyForSync) return;

    const saveCartToServer = async () => {
      try {
        await fetch(`http://localhost:5000/api/cart/${encodeURIComponent(cartId)}`, {
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
  }, [cart, cartId, cartReadyForSync]);

  // Save cart to localStorage (shared across all users)
  useEffect(() => {
    if (!cartReadyForSync) return;
    try {
      localStorage.setItem('pos_cart', JSON.stringify(cart));
    } catch (error) {
      console.warn('Unable to persist cart', error);
    }
  }, [cart, cartReadyForSync]);

 
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter out products that should not be displayed in terminal
    // Show products where displayInTerminal is true or undefined (for backward compatibility)
    filtered = filtered.filter(product => product.displayInTerminal !== false);
    
    // Automatically hide products with 0 stock (regardless of displayInTerminal setting)
    filtered = filtered.filter(product => {
      // Check if product has sizes
      if (product.sizes && typeof product.sizes === 'object' && Object.keys(product.sizes).length > 0) {
        // For products with sizes, check if any size has stock > 0
        const hasStock = Object.values(product.sizes).some(sizeData => {
          if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
            return sizeData.quantity > 0;
          }
          return (typeof sizeData === 'number' ? sizeData : 0) > 0;
        });
        return hasStock;
      }
      // For products without sizes, check currentStock
      return (product.currentStock || 0) > 0;
    });

    
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

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'a-z':
          return (a.itemName || '').localeCompare(b.itemName || '');
        case 'z-a':
          return (b.itemName || '').localeCompare(a.itemName || '');
        case 'oldest':
          return new Date(a.dateAdded || a.createdAt || 0) - new Date(b.dateAdded || b.createdAt || 0);
        case 'newest':
        default:
          return new Date(b.dateAdded || b.createdAt || 0) - new Date(a.dateAdded || a.createdAt || 0);
      }
    });

    return filtered;
  }, [products, selectedCategory, searchQuery, sortOption]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        setCachedData('products', data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    // Open modal instead of expanding
    setSelectedProduct(product);
    setShowProductModal(true);
    
    // Initialize quantity and size if not set
    if (!productQuantities[product._id]) {
      setProductQuantities({ ...productQuantities, [product._id]: 1 });
    }
    if (!productSizes[product._id]) {
      const availableSizes = product.sizes && typeof product.sizes === 'object' 
        ? Object.keys(product.sizes) 
        : [];
      const defaultSize = availableSizes.length > 0 ? availableSizes[0] : '';
      setProductSizes({ ...productSizes, [product._id]: defaultSize });
    }
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const updateProductQuantity = (productId, delta) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    const currentQuantity = productQuantities[productId] || 1;
    const newQuantity = currentQuantity + delta;
    
    // Get available stock for the selected size
    const selectedSize = productSizes[productId];
    let availableStock = 0;
    
    if (product.sizes && typeof product.sizes === 'object' && selectedSize) {
      const sizeData = product.sizes[selectedSize];
      // Handle both formats: number or object with quantity
      availableStock = typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined
        ? sizeData.quantity
        : (typeof sizeData === 'number' ? sizeData : 0);
    } else {
      availableStock = product.currentStock || 0;
    }
    
    // Clamp quantity between 1 and available stock
    const clampedQuantity = Math.max(1, Math.min(newQuantity, availableStock));
    
    setProductQuantities({
      ...productQuantities,
      [productId]: clampedQuantity
    });
  };

  const handleSizeSelection = (productId, size) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    // Update selected size
    setProductSizes({ ...productSizes, [productId]: size });
    
    // Get available stock for the new size
    let availableStock = 0;
    if (product.sizes && typeof product.sizes === 'object' && size) {
      const sizeData = product.sizes[size];
      // Handle both formats: number or object with quantity
      availableStock = typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined
        ? sizeData.quantity
        : (typeof sizeData === 'number' ? sizeData : 0);
    } else {
      availableStock = product.currentStock || 0;
    }
    
    // Adjust quantity if it exceeds available stock for the new size
    const currentQuantity = productQuantities[productId] || 1;
    if (currentQuantity > availableStock && availableStock > 0) {
      setProductQuantities({
        ...productQuantities,
        [productId]: availableStock
      });
    } else if (availableStock === 0) {
      // If new size has no stock, set quantity to 1 (will be disabled by button)
      setProductQuantities({
        ...productQuantities,
        [productId]: 1
      });
    }
  };

  const addToCartFromExpanded = (product) => {
    const quantity = productQuantities[product._id] || 1;
    const size = productSizes[product._id] || '';

    // Validate size selection for products with sizes
    if (product.sizes && typeof product.sizes === 'object' && Object.keys(product.sizes).length > 0) {
      if (!size) {
        alert('Please select a size before adding to cart');
        return;
      }
    }

    // Get available stock and price (handle both formats: number or object with quantity/price)
    let availableStock = 0;
    let itemPrice = product.itemPrice || 0;
    
    if (product.sizes && typeof product.sizes === 'object' && size) {
      const sizeData = product.sizes[size];
      if (typeof sizeData === 'object' && sizeData !== null) {
        availableStock = sizeData.quantity || 0;
        // Use size-specific price if available, otherwise use default price
        itemPrice = sizeData.price !== undefined ? sizeData.price : product.itemPrice || 0;
      } else {
        availableStock = typeof sizeData === 'number' ? sizeData : 0;
      }
    } else {
      availableStock = product.currentStock || 0;
    }

    // Check if there's enough stock
    if (availableStock <= 0) {
      alert('This item is out of stock');
      return;
    }

    const existingItem = cart.find(item => 
      item._id === product._id && 
      item.selectedSize === size
    );
    
    // Calculate total quantity that would be in cart after adding
    const totalQuantityAfterAdd = existingItem 
      ? existingItem.quantity + quantity 
      : quantity;

    // Validate total quantity doesn't exceed available stock
    if (totalQuantityAfterAdd > availableStock) {
      alert(`Only ${availableStock} item(s) available in stock. You already have ${existingItem?.quantity || 0} in cart.`);
      return;
    }

    const productToAdd = {
      ...product,
      productId: product._id,
      selectedSize: size,
      quantity: quantity,
      itemPrice: itemPrice // Use size-specific price if available
    };
    
    // If item already exists in cart, show confirmation modal
    if (existingItem) {
      setPendingDuplicateItem({ product: productToAdd, existingQuantity: existingItem.quantity });
      setShowDuplicateModal(true);
      return;
    }
    
    // Add new item to cart
    setCart([...cart, productToAdd]);
    setExpandedProductId(null);
    // Close the product modal
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  // Handle confirming duplicate item addition
  const handleConfirmDuplicateAdd = () => {
    if (!pendingDuplicateItem) return;
    
    const { product } = pendingDuplicateItem;
    
    setCart(cart.map(item => 
      item._id === product._id && 
      item.selectedSize === product.selectedSize
        ? { ...item, quantity: item.quantity + product.quantity }
        : item
    ));
    
    setShowDuplicateModal(false);
    setPendingDuplicateItem(null);
    setExpandedProductId(null);
    // Close the product modal
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  // Handle canceling duplicate item addition
  const handleCancelDuplicateAdd = () => {
    setShowDuplicateModal(false);
    setPendingDuplicateItem(null);
  };

  const addToCart = (product) => {
    const defaultSize = product.sizes && typeof product.sizes === 'object'
      ? Object.keys(product.sizes)[0] || ''
      : (product.size || '');
    
    // Get size-specific price if available
    let itemPrice = product.itemPrice || 0;
    if (product.sizes && typeof product.sizes === 'object' && defaultSize) {
      const sizeData = product.sizes[defaultSize];
      if (typeof sizeData === 'object' && sizeData !== null && sizeData.price !== undefined) {
        itemPrice = sizeData.price;
      }
    }
    
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
      setCart([...cart, { ...product, productId: product._id, selectedSize: defaultSize, quantity: 1, itemPrice: itemPrice }]);
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

  const recordVoidedItem = async (item, voidReason) => {
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
              price: item.itemPrice || 0,
              itemImage: item.itemImage || '',
              voidReason: voidReason || null
            }
          ],
          paymentMethod: 'void',
          amountReceived: 0,
          changeGiven: 0,
          referenceNo: `VOID-${Date.now()}`,
          totalAmount: (item.itemPrice || 0) * (item.quantity || 1),
          status: 'Voided',
          voidReason: voidReason || null
        })
      });
    } catch (error) {
      console.warn('Failed to record void transaction', error);
    }
  };

  const confirmRemoveItem = async (voidReason) => {
    console.log('[confirmRemoveItem] Called with reason:', voidReason, 'itemToRemove:', itemToRemove);
    
    if (!itemToRemove) {
      console.warn('[confirmRemoveItem] No item to remove');
      setShowRemoveItemModal(false);
      setItemToRemove(null);
      return;
    }
    
    if (!voidReason) {
      console.warn('[confirmRemoveItem] No void reason provided');
      return;
    }
    
    // Store itemToRemove in a variable to avoid closure issues
    // Deep clone to ensure we have all properties
    const itemToVoid = JSON.parse(JSON.stringify(itemToRemove));
    
    try {
      let itemWasRemoved = false;
      let removedItemDetails = null;
      
      // Log the item to void for debugging
      console.log('[confirmRemoveItem] Item to void details:', {
        _id: itemToVoid._id,
        productId: itemToVoid.productId,
        id: itemToVoid.id,
        selectedSize: itemToVoid.selectedSize,
        size: itemToVoid.size,
        sizes: itemToVoid.sizes,
        resolvedSize: resolveItemSize(itemToVoid),
        fullItem: itemToVoid
      });
      
      // Remove item from cart and verify it was actually removed
      flushSync(() => {
        setCart(prevCart => {
          console.log('[confirmRemoveItem] Current cart before removal (length:', prevCart.length, '):', prevCart.map(item => ({
            _id: item._id,
            productId: item.productId,
            id: item.id,
            selectedSize: item.selectedSize,
            size: item.size,
            resolvedSize: resolveItemSize(item),
            quantity: item.quantity
          })));
          
          const initialLength = prevCart.length;
          const newCart = [];
          let foundMatch = false;
          
          // Use a more explicit loop to find and remove the item
          for (const item of prevCart) {
            // Normalize IDs for comparison (convert to string for comparison)
            const itemId = String(item._id || item.productId || item.id || '').trim();
            const voidId = String(itemToVoid._id || itemToVoid.productId || itemToVoid.id || '').trim();
            const sameProduct = itemId !== '' && voidId !== '' && itemId === voidId;
            
            // Compare sizes - use selectedSize first, then resolveItemSize as fallback
            const itemSize = String(item.selectedSize || item.size || resolveItemSize(item) || '').toLowerCase().trim();
            const voidSize = String(itemToVoid.selectedSize || itemToVoid.size || resolveItemSize(itemToVoid) || '').toLowerCase().trim();
            const sameSize = itemSize === voidSize || (itemSize === '' && voidSize === '');
            
            // Item should be removed if both product and size match
            const shouldRemove = sameProduct && sameSize;
            
            if (shouldRemove) {
              console.log('[confirmRemoveItem] ✓ MATCH FOUND - Removing item:', {
                itemId,
                voidId,
                itemSelectedSize: item.selectedSize,
                voidSelectedSize: itemToVoid.selectedSize,
                itemSize,
                voidSize,
                sameProduct,
                sameSize
              });
              foundMatch = true;
              removedItemDetails = { ...item };
              // Don't add this item to newCart (effectively removing it)
              continue;
            }
            
            // Keep this item in the cart
            newCart.push(item);
          }
          
          const finalLength = newCart.length;
          itemWasRemoved = foundMatch && initialLength > finalLength;
          
          // Double-check: verify the item is actually not in the new cart
          const itemStillInCart = newCart.some(item => {
            const itemId = String(item._id || item.productId || item.id || '').trim();
            const voidId = String(itemToVoid._id || itemToVoid.productId || itemToVoid.id || '').trim();
            const sameProduct = itemId !== '' && voidId !== '' && itemId === voidId;
            
            const itemSize = String(item.selectedSize || item.size || resolveItemSize(item) || '').toLowerCase().trim();
            const voidSize = String(itemToVoid.selectedSize || itemToVoid.size || resolveItemSize(itemToVoid) || '').toLowerCase().trim();
            const sameSize = itemSize === voidSize || (itemSize === '' && voidSize === '');
            
            return sameProduct && sameSize;
          });
          
          // Item was removed if we found a match, length decreased, AND item is not in new cart
          itemWasRemoved = foundMatch && (initialLength > finalLength) && !itemStillInCart;
          
          console.log('[confirmRemoveItem] Cart update result:', {
            foundMatch,
            oldLength: initialLength,
            newLength: finalLength,
            lengthDecreased: initialLength > finalLength,
            itemStillInCart,
            itemWasRemoved,
            removedItem: removedItemDetails,
            newCartItems: newCart.map(item => ({
              _id: item._id,
              productId: item.productId,
              selectedSize: item.selectedSize,
              resolvedSize: resolveItemSize(item),
              quantity: item.quantity
            }))
          });
          
          // Force a re-render by returning the new cart
          // This ensures OrderSummary receives the updated cart
          return newCart;
        });
      });
      
      // Verify the cart was actually updated by checking the current cart state
      // Use a small delay to ensure state has updated
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Double-check the cart state after update
      const verifyCartUpdate = () => {
        return new Promise((resolve) => {
          // Use a callback to get the latest cart state
          setCart(currentCart => {
            const itemStillExists = currentCart.some(item => {
              const itemId = String(item._id || item.productId || item.id || '').trim();
              const voidId = String(itemToVoid._id || itemToVoid.productId || itemToVoid.id || '').trim();
              const sameProduct = itemId !== '' && voidId !== '' && itemId === voidId;
              
              const itemSize = String(item.selectedSize || item.size || resolveItemSize(item) || '').toLowerCase().trim();
              const voidSize = String(itemToVoid.selectedSize || itemToVoid.size || resolveItemSize(itemToVoid) || '').toLowerCase().trim();
              const sameSize = itemSize === voidSize || (itemSize === '' && voidSize === '');
              
              return sameProduct && sameSize;
            });
            
            resolve(!itemStillExists);
            return currentCart; // Don't modify, just check
          });
        });
      };
      
      const verifiedRemoved = await verifyCartUpdate();
      
      if (!verifiedRemoved) {
        itemWasRemoved = false;
        console.error('[confirmRemoveItem] ❌ Verification failed: Item still exists in cart after update!');
      }
      
      // Only proceed if item was actually removed from cart
      if (!itemWasRemoved || !verifiedRemoved) {
        console.error('[confirmRemoveItem] ❌ Item was NOT removed from cart! Aborting void transaction.');
        console.error('[confirmRemoveItem] Debug info:', {
          itemToVoid: {
            _id: itemToVoid._id,
            productId: itemToVoid.productId,
            id: itemToVoid.id,
            selectedSize: itemToVoid.selectedSize,
            size: itemToVoid.size,
            resolvedSize: resolveItemSize(itemToVoid)
          },
          currentCart: cart.map(item => ({
            _id: item._id,
            productId: item.productId,
            id: item.id,
            selectedSize: item.selectedSize,
            size: item.size,
            resolvedSize: resolveItemSize(item)
          }))
        });
        alert('Failed to remove item from cart. The item may have already been removed or the IDs do not match. Please check the console for details.');
        // CRITICAL: Don't record void transaction if item wasn't removed
        // This ensures void transactions are only logged when items are actually removed
        return;
      }
      
      // CRITICAL CHECK: Verify itemWasRemoved is true before proceeding
      if (itemWasRemoved !== true) {
        console.error('[confirmRemoveItem] ❌ Safety check failed: itemWasRemoved is not true! Aborting.');
        return;
      }
      
      // Item was successfully removed - now record the void transaction
      console.log('[confirmRemoveItem] ✅ Item removed successfully, recording void transaction...');
      recordVoidedItem(itemToVoid, voidReason)
        .then(() => {
          console.log('[confirmRemoveItem] Void transaction recorded successfully');
          // Close modal and clear item only after void is recorded
          setShowRemoveItemModal(false);
          setItemToRemove(null);
          console.log('[confirmRemoveItem] Modal closed and item cleared');
        })
        .catch(error => {
          console.error('[confirmRemoveItem] Error recording void transaction:', error);
          // Even if recording fails, item is already removed from cart
          // So we should still close the modal
          setShowRemoveItemModal(false);
          setItemToRemove(null);
          alert('Item removed from cart, but failed to record void transaction. Please check logs.');
        });
      
    } catch (error) {
      console.error('[confirmRemoveItem] Error:', error);
      alert('Failed to void item. Please try again.');
      // Make sure modal stays open on error so user can retry
    }
  };

  const removeFromCart = (item) => {
    // This function is called from OrderSummary
    // Show PIN verification modal first
    handleRemoveItemClick(item);
  };

  // Direct remove function that doesn't trigger PIN modal
  // Used by OrderSummary for bulk void operations where PIN is already verified
  const removeFromCartDirect = (item) => {
    setCart(prevCart => {
      const itemId = String(item._id || item.productId || item.id || '').trim();
      const itemSize = String(item.selectedSize || item.size || '').toLowerCase().trim();
      
      return prevCart.filter(cartItem => {
        const cartItemId = String(cartItem._id || cartItem.productId || cartItem.id || '').trim();
        const cartItemSize = String(cartItem.selectedSize || cartItem.size || '').toLowerCase().trim();
        
        // Keep items that don't match
        const sameProduct = cartItemId === itemId;
        const sameSize = cartItemSize === itemSize || (cartItemSize === '' && itemSize === '');
        
        return !(sameProduct && sameSize);
      });
    });
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  }, [cart]);

  // Validate discount function - must be defined before useMemo hooks
  const validateDiscountForCart = (discountItem, cartItems) => {
    if (!discountItem || !cartItems || cartItems.length === 0) {
      return { valid: false, message: 'Cart is empty' };
    }

    // Use appliesToType for logic checks (original value: 'all', 'category', 'products')
    const appliesToType = discountItem.appliesToType || discountItem.appliesTo;

    // If discount applies to all products, it's always valid
    if (appliesToType === 'all') {
      return { valid: true };
    }

    // If discount applies to a specific category
    if (appliesToType === 'category' && discountItem.category) {
      const allItemsMatchCategory = cartItems.every(item => {
        // First check if item has category field
        let itemCategory = item.category;
        
        // If not, try to find it from products array
        if (!itemCategory) {
          const productId = item._id || item.productId || item.id;
          const product = products.find(p => {
            const pId = p._id || p.id;
            return (pId && productId && (pId.toString() === productId.toString()));
          });
          itemCategory = product?.category;
        }
        
        // Check if item's category matches the discount category
        return itemCategory === discountItem.category;
      });

      if (!allItemsMatchCategory) {
        // Find which categories are in the cart
        const cartCategories = cartItems.map(item => {
          let itemCategory = item.category;
          if (!itemCategory) {
            const productId = item._id || item.productId || item.id;
            const product = products.find(p => {
              const pId = p._id || p.id;
              return (pId && productId && (pId.toString() === productId.toString()));
            });
            itemCategory = product?.category;
          }
          return itemCategory;
        }).filter(Boolean);
        const uniqueCategories = [...new Set(cartCategories)];
        
        return { 
          valid: false, 
          message: `This discount only applies to "${discountItem.category}" category. Your cart contains items from: ${uniqueCategories.join(', ')}.` 
        };
      }
      return { valid: true };
    }

    // If discount applies to specific products
    if (appliesToType === 'products' && discountItem.productIds && discountItem.productIds.length > 0) {
      const allItemsInDiscount = cartItems.every(item => {
        const itemId = item._id || item.productId || item.id;
        return discountItem.productIds.some(pid => {
          const pidStr = pid.toString ? pid.toString() : pid;
          const itemIdStr = itemId.toString ? itemId.toString() : itemId;
          return pidStr === itemIdStr;
        });
      });

      if (!allItemsInDiscount) {
        return { 
          valid: false, 
          message: 'This discount only applies to specific products. Your cart contains items not eligible for this discount.' 
        };
      }
      return { valid: true };
    }

    return { valid: false, message: 'Discount configuration is invalid' };
  };

  // Auto-validate and remove invalid discounts when cart changes
  useEffect(() => {
    if (selectedDiscounts.length > 0 && cart.length > 0) {
      const validDiscounts = selectedDiscounts.filter(discount => {
        const validation = validateDiscountForCart(discount, cart);
        return validation.valid;
      });
      
      if (validDiscounts.length !== selectedDiscounts.length) {
        setSelectedDiscounts(validDiscounts);
        if (validDiscounts.length === 0) {
          setDiscountAmount('');
        }
      }
    }
  }, [cart, selectedDiscounts, products]);

  // Calculate total discount from all selected discounts
  const discount = useMemo(() => {
    if (selectedDiscounts.length === 0) {
      return parseFloat(discountAmount) || 0;
    }

    let totalDiscount = 0;
    
    for (const selectedDiscount of selectedDiscounts) {
      // Validate discount against current cart - if invalid, skip
      const validation = validateDiscountForCart(selectedDiscount, cart);
      if (!validation.valid) {
        continue;
      }
      
      // Safely check discountValue
      const discountValueStr = selectedDiscount.discountValue || '';
      
      try {
        // Recalculate discount based on selected discount and current subtotal
        if (typeof discountValueStr === 'string' && discountValueStr.includes('%')) {
          const percentage = parseFloat(discountValueStr.replace('% OFF', '').replace(/\s/g, ''));
          if (!isNaN(percentage)) {
            totalDiscount += (subtotal * percentage) / 100;
          }
        } else if (typeof discountValueStr === 'string' && (discountValueStr.includes('P') || discountValueStr.includes('₱'))) {
          const amount = parseFloat(discountValueStr.replace(/[P₱\sOFF]/g, ''));
          if (!isNaN(amount)) {
            totalDiscount += amount;
          }
        }
      } catch (error) {
        console.error('Error calculating discount:', error);
      }
    }
    
    return totalDiscount || parseFloat(discountAmount) || 0;
  }, [discountAmount, selectedDiscounts, subtotal, cart, products]);

  const total = useMemo(() => {
    return subtotal - discount;
  }, [subtotal, discount]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

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
      sku: item.sku || null,
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
      price: item.itemPrice || 0,
      itemImage: item.itemImage || ''
    }));

  const finalizeTransaction = async (meta = {}) => {
    if (!cart.length) return null;

    // Store cart snapshot for restoration on error
    const cartSnapshot = [...cart];
    
    try {
      // Step 1: Record the transaction FIRST (before updating stock)
      const transactionResponse = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          items: mapCartItemsForTransaction(),
          paymentMethod: meta.paymentMethod || 'cash',
          amountReceived: meta.amountReceived,
          changeGiven: meta.change,
          referenceNo: meta.referenceNo,
          receiptNo: meta.receiptNo,
          totalAmount: total,
          performedById: currentUser?._id || currentUser?.id,
          performedByName: currentUser?.name,
          status: 'Completed'
        })
      });

      // Check transaction result FIRST
      if (!transactionResponse.ok) {
        const errorData = await transactionResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Transaction recording failed: ${transactionResponse.status} ${transactionResponse.statusText}`);
      }

      const transactionData = await transactionResponse.json();
      if (!transactionData.success) {
        throw new Error(transactionData.message || transactionData.error || 'Failed to record transaction');
      }

      // Step 2: Transaction succeeded - NOW update stock
      // Clear cart after successful transaction
      setCart([]);
      
      // Invalidate cache so next fetch gets fresh data
      invalidateCache('products');
      invalidateCache('transactions');

      const stockUpdateResponse = await fetch('http://localhost:5000/api/products/update-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          items: mapCartItemsForStockUpdate(),
          performedByName: currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'System',
          performedById: currentUser?._id || currentUser?.id || ''
        })
      });

      // Check stock update result
      if (!stockUpdateResponse.ok) {
        const errorData = await stockUpdateResponse.json().catch(() => ({}));
        console.error('Stock update failed after transaction:', errorData);
        // Don't restore cart - transaction already succeeded
        // Just log the error and continue
      } else {
        const stockData = await stockUpdateResponse.json();
        if (!stockData.success) {
          console.error('Stock update failed after transaction:', stockData);
          // Don't restore cart - transaction already succeeded
        }
      }

      // Success - products will refresh on next view automatically due to cache invalidation
      fetchProducts().catch(err => console.warn('Background product refresh failed:', err));
      
      // Return the transaction data including the receipt number
      return transactionData.data;
    } catch (error) {
      console.error('Error finalizing transaction:', error);
      // Restore cart on error (transaction failed, stock was NOT updated)
      setCart(cartSnapshot);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Transaction failed: ${errorMessage}\n\nYour cart has been restored. Please try again.`);
      throw error;
    }
  };

  const handleCashProceed = async (amountReceived, change, receiptNo) => {
    console.log('handleCashProceed received receiptNo:', receiptNo);
    setShowCashPaymentModal(false);
    return await finalizeTransaction({ paymentMethod: 'cash', amountReceived, change, receiptNo });
  };

  const handleQRPayment = () => {
    setShowQRPaymentModal(true);
  };

  const handleQRProceed = async (referenceNo, screenshot, receiptNo) => {
    console.log('handleQRProceed received receiptNo:', receiptNo);
    try {
      const result = await finalizeTransaction({ paymentMethod: 'gcash', referenceNo, screenshot, receiptNo });
      setShowQRPaymentModal(false);
      return result;
    } catch (error) {
      // Don't close modal on error - let user retry
      throw error;
    }
  };

  const handleSelectDiscount = (discountItem) => {
    try {
      // Validate discount item exists
      if (!discountItem) {
        console.error('No discount item provided');
        alert('Invalid discount selected. Please try again.');
        return;
      }

      // Check if discount is already selected
      const alreadySelected = selectedDiscounts.some(d => d._id === discountItem._id);
      if (alreadySelected) {
        alert('This discount is already applied.');
        return;
      }

      // Validate discount against current cart
      const validation = validateDiscountForCart(discountItem, cart);
      
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      // Add to selected discounts array
      setSelectedDiscounts(prev => [...prev, discountItem]);
      
      // Update discount amount (will be recalculated by useMemo)
      setDiscountAmount('');
    } catch (error) {
      console.error('Error selecting discount:', error);
      alert('An error occurred while applying the discount. Please try again.');
    }
  };

  const handleRemoveDiscount = (discountId) => {
    if (discountId) {
      // Remove specific discount by ID
      setSelectedDiscounts(prev => prev.filter(d => d._id !== discountId));
    } else {
      // Clear all discounts (backward compatibility)
      setSelectedDiscounts([]);
    }
    setDiscountAmount('');
  };

  return (
    <>
      <div className="relative flex flex-col h-screen">
       
        <div className="absolute top-0 left-0 right-[420px] px-6 py-4 z-40" style={{ paddingRight: '24px', backgroundColor: '#F5F5F5' }}>
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
            sortOption={sortOption}
            onSortChange={setSortOption}
          />
        </div>
        
       
        <div className="flex flex-1 overflow-hidden">

          
          <div className="flex-1 overflow-auto p-6 pt-24">
        
          <div className="mb-6 relative z-10">
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
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onToggleExpand={() => handleProductClick(product)}
                  />
                ))}
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
          
         
          <div className="w-[420px] bg-gray-50 border-l-0 p-4 relative">
            <OrderSummary
              cart={cart}
              removeFromCart={removeFromCart}
              removeFromCartDirect={removeFromCartDirect}
              updateQuantity={updateQuantity}
              discountAmount={discountAmount}
              setDiscountAmount={setDiscountAmount}
              selectedDiscounts={selectedDiscounts}
              onRemoveDiscount={handleRemoveDiscount}
              calculateSubtotal={() => subtotal}
              calculateDiscount={() => discount}
              calculateTotal={() => total}
              handleCheckout={handleCheckout}
              onCashPayment={handleCashPayment}
              onQRPayment={handleQRPayment}
              onOpenDiscountModal={() => setShowDiscountModal(true)}
              onSelectDiscount={handleSelectDiscount}
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
        totalAmount={total}
        subtotalAmount={subtotal}
        discountAmount={discount}
        selectedDiscounts={selectedDiscounts}
        onProceed={handleCashProceed}
        cartItems={cart}
      />

      <QRCodePaymentModal
        isOpen={showQRPaymentModal}
        onClose={() => setShowQRPaymentModal(false)}
        totalAmount={total}
        onProceed={handleQRProceed}
        cartItems={cart}
      />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSelectDiscount={handleSelectDiscount}
        cart={cart}
        products={products}
        selectedDiscounts={selectedDiscounts}
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

      <DuplicateItemModal
        isOpen={showDuplicateModal}
        onClose={handleCancelDuplicateAdd}
        onConfirm={handleConfirmDuplicateAdd}
        item={pendingDuplicateItem?.product}
        existingQuantity={pendingDuplicateItem?.existingQuantity || 0}
      />

      <ProductDetailsModal
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        product={selectedProduct}
        productQuantity={selectedProduct ? (productQuantities[selectedProduct._id] || 1) : 1}
        onDecrement={() => selectedProduct && updateProductQuantity(selectedProduct._id, -1)}
        onIncrement={() => selectedProduct && updateProductQuantity(selectedProduct._id, 1)}
        onAdd={() => selectedProduct && addToCartFromExpanded(selectedProduct)}
        selectedSize={selectedProduct ? productSizes[selectedProduct._id] : ''}
        onSelectSize={(size) => selectedProduct && handleSizeSelection(selectedProduct._id, size)}
      />
    </>
  );
};

export default memo(Terminal);

