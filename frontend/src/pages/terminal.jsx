import { useState, useEffect } from 'react';
import Header from '../components/shared/header';
import { FaPlus, FaMinus, FaEdit } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import CategoryButtons from '../components/shared/CategoryButtons';
import OrderSummary from '../components/terminal/OrderSummary';
import ProductCard from '../components/terminal/ProductCard';
import Pagination from '../components/inventory/Pagination';
import CheckoutConfirmationModal from '../components/terminal/CheckoutConfirmationModal';


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
  const itemsPerPage = 10; 

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
    const existingItem = cart.find(item => item._id === product._id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item._id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
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
    // Process checkout here
    alert('Proceeding to checkout...');
    // You can add your checkout logic here, such as:
    // - Save transaction to database
    // - Clear cart
    // - Navigate to receipt page
    // setCart([]);
  };

  return (
    <>
      <div className="relative flex flex-col h-screen">
       
        <div className="absolute top-0 left-0 right-[420px] bg-white px-6 py-4 z-20">
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
          
         
          <div className="w-[420px] bg-gray-50 border-l-0 p-4">
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
            />
          </div>
        </div>
      </div>

      <CheckoutConfirmationModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onConfirm={confirmCheckout}
      />
    </>
  );
};

export default Terminal;

