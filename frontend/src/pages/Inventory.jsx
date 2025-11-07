import { useState, useEffect } from 'react';
import Header from '../components/shared/header';
import { 
  FaEllipsisV,
  FaPlus,
  FaSearch
} from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';


import allIcon from '../assets/inventory-icons/ALL.svg';
import topIcon from '../assets/inventory-icons/Top.svg';
import bottomsIcon from '../assets/inventory-icons/Bottoms.svg';
import dressesIcon from '../assets/inventory-icons/dresses.svg';
import makeupIcon from '../assets/inventory-icons/make up.svg';
import accessoriesIcon from '../assets/inventory-icons/accesories.svg';
import shoesIcon from '../assets/inventory-icons/shoe.svg';
import headWearIcon from '../assets/inventory-icons/head wear.svg';
import othersIcon from '../assets/inventory-icons/Others.svg';
import printIcon from '../assets/inventory-icons/print.png';
import exportIcon from '../assets/inventory-icons/Export.svg';
import sortIcon from '../assets/sort.svg';
import AddProductModal from '../components/inventory/AddProductModal';
import ConfirmAddProductModal from '../components/inventory/ConfirmAddProductModal';
import SuccessModal from '../components/inventory/SuccessModal';
import DeleteConfirmationModal from '../components/inventory/DeleteConfirmationModal';
import EditConfirmationModal from '../components/inventory/EditConfirmationModal';
import CategoryButtons from '../components/shared/CategoryButtons';
import ProductTable from '../components/inventory/ProductTable';
import ViewProductModal from '../components/inventory/ViewProductModal';
import Pagination from '../components/inventory/Pagination';
import StockInModal from '../components/inventory/StockInModal';
import StockOutModal from '../components/inventory/StockOutModal';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stockStats, setStockStats] = useState({ totalItems: 0, lowStockItems: 0, outOfStockItems: 0, inStockItems: 0 });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalType, setStockModalType] = useState('in'); 
  const [stockAmount, setStockAmount] = useState('');
  const [viewingProduct, setViewingProduct] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const itemsPerPage = 6;

  const [newProduct, setNewProduct] = useState({
    sku: '',
    itemName: '',
    category: 'Tops',
    brandName: '',
    variant: '',
    size: '',
    itemPrice: '',
    costPrice: '',
    currentStock: '',
    reorderNumber: '',
    supplierName: '',
    supplierContact: '',
    itemImage: '',
    selectedSizes: [], 
    sizeQuantities: {} 
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

  const categoryCodeMap = {
    'Tops': 'TOP',
    'Bottoms': 'BOT',
    'Dresses': 'DRS',
    'Makeup': 'MUA',
    'Accessories': 'MUA',
    'Shoes': 'SHO',
    'Head Wear': 'HDW',
    'Others': 'OTH'
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

 
  const getColorCode = (variant) => {
    if (!variant || variant.trim() === '') {
      return 'XXX';
    }
    
    const cleaned = variant.replace(/\s+/g, '').toUpperCase();
    return cleaned.substring(0, 3).padEnd(3, 'X');
  };


  const generateSKU = (category, variant) => {
    const categoryCode = categoryCodeMap[category] || 'OTH';
    const randomCode = generateRandomCode();
    
    if (!variant || variant.trim() === '') {
      return `${categoryCode}-${randomCode}`;
    }
    
    const colorCode = getColorCode(variant);
    return `${categoryCode}-${randomCode}-${colorCode}`;
  };

  
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
    setCurrentPage(1); 
  }, [selectedCategory, searchQuery, products]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.relative')) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        calculateStockStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to fetch products. Make sure the backend server is running.');
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

    const uniqueProducts = filtered.filter((product, index, self) =>
      index === self.findIndex((p) => p._id === product._id)
    );

    setFilteredProducts(uniqueProducts);
  };

  const calculateStockStats = (productList) => {
    const totalItems = productList.length;
    const outOfStockItems = productList.filter(p => p.currentStock === 0).length;
    const lowStockItems = productList.filter(p => {
      const reorderLevel = p.reorderNumber || 10;
      return p.currentStock > 0 && p.currentStock <= reorderLevel;
    }).length;
    
    const inStockItems = productList.filter(p => {
      const reorderLevel = p.reorderNumber || 10;
      return p.currentStock > reorderLevel;
    }).length;
    setStockStats({ totalItems, lowStockItems, outOfStockItems, inStockItems });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => {
      const updatedProduct = {
        ...prev,
        [name]: value
      };
      

      if (!editingProduct && (name === 'category' || name === 'variant')) {
        const category = name === 'category' ? value : prev.category;
        const variant = name === 'variant' ? value : prev.variant;
        updatedProduct.sku = generateSKU(category, variant);
      }
      
      return updatedProduct;
    });
  };

  const handleSizeToggle = (size) => {
    setNewProduct(prev => {
      const isSelected = prev.selectedSizes.includes(size);
      const newSelectedSizes = isSelected
        ? prev.selectedSizes.filter(s => s !== size)
        : [...prev.selectedSizes, size];
      
      const newSizeQuantities = { ...prev.sizeQuantities };
      if (isSelected) {
        delete newSizeQuantities[size];
      } else {
        newSizeQuantities[size] = 0;
      }
      
      return {
        ...prev,
        selectedSizes: newSelectedSizes,
        sizeQuantities: newSizeQuantities
      };
    });
  };

  const handleSizeQuantityChange = (size, quantity) => {
    setNewProduct(prev => ({
      ...prev,
      sizeQuantities: {
        ...prev.sizeQuantities,
        [size]: parseInt(quantity) || 0
      }
    }));
  };

  const resetProductForm = () => {
    const defaultCategory = 'Tops';
    const defaultVariant = '';
    setNewProduct({
      sku: generateSKU(defaultCategory, defaultVariant),
      itemName: '',
      category: defaultCategory,
      brandName: '',
      variant: defaultVariant,
      size: '',
      itemPrice: '',
      costPrice: '',
      currentStock: '',
      reorderNumber: '',
      supplierName: '',
      supplierContact: '',
      itemImage: '',
      selectedSizes: [],
      sizeQuantities: {}
    });
    setEditingProduct(null);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
 
    const hasSizeQuantities = newProduct.selectedSizes?.length > 0 && 
      Object.values(newProduct.sizeQuantities || {}).some(qty => qty > 0);
    const hasStock = parseInt(newProduct.currentStock) > 0;
    
    if (!hasSizeQuantities && !hasStock) {
      alert('Please either select sizes with quantities or provide a stock value.');
      return;
    }
    
    if (!editingProduct) {
      setShowConfirmModal(true);
    } else {
      setProductToEdit(editingProduct);
      setShowEditModal(true);
    }
  };

  const confirmAddProduct = async () => {
    setShowConfirmModal(false);
    
    const totalStock = newProduct.selectedSizes?.length > 0
      ? Object.values(newProduct.sizeQuantities || {}).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0)
      : parseInt(newProduct.currentStock) || 0;
    
    try {
      setLoading(true);
      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct._id}`
        : 'http://localhost:5000/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newProduct,
          itemPrice: parseFloat(newProduct.itemPrice) || 0,
          costPrice: parseFloat(newProduct.costPrice) || 0,
          currentStock: totalStock,
          reorderNumber: parseInt(newProduct.reorderNumber) || 0,
          sizes: newProduct.selectedSizes.length > 0 ? newProduct.sizeQuantities : null
        })
      });

     
      if (!response.ok) {
        if (response.status === 413) {
          alert('Image file is too large. Please use a smaller image or compress it before uploading.');
          return;
        }
        const errorText = await response.text();
        let errorMessage = `Failed to ${editingProduct ? 'update' : 'add'} product`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
        }
        alert(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setShowAddModal(false);
        resetProductForm();
        fetchProducts();
        setSuccessMessage('The item was added successfully!');
        setShowSuccessModal(true);
      } else {
        alert(data.message || `Failed to ${editingProduct ? 'update' : 'add'} product`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setOpenDropdown(null);
    
    setEditingProduct(product);
    
    const existingSizes = product.sizes ? Object.keys(product.sizes) : [];
    const existingSizeQuantities = product.sizes || {};
    
    setNewProduct({
      sku: product.sku || '',
      itemName: product.itemName || '',
      category: product.category || 'Tops',
      brandName: product.brandName || '',
      variant: product.variant || '',
      size: product.size || '',
      itemPrice: product.itemPrice || '',
      costPrice: product.costPrice || '',
      currentStock: product.currentStock || '',
      reorderNumber: product.reorderNumber || '',
      supplierName: product.supplierName || '',
      supplierContact: product.supplierContact || '',
      itemImage: product.itemImage || '',
      selectedSizes: existingSizes,
      sizeQuantities: existingSizeQuantities
    });
    
    setShowAddModal(true);
  };

  const confirmEditProduct = async () => {
    setShowEditModal(false);
    
    if (!editingProduct) return;
    
    const totalStock = newProduct.selectedSizes?.length > 0
      ? Object.values(newProduct.sizeQuantities || {}).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0)
      : parseInt(newProduct.currentStock) || 0;
    
    try {
      setLoading(true);
      const url = `http://localhost:5000/api/products/${editingProduct._id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newProduct,
          itemPrice: parseFloat(newProduct.itemPrice) || 0,
          costPrice: parseFloat(newProduct.costPrice) || 0,
          currentStock: totalStock,
          reorderNumber: parseInt(newProduct.reorderNumber) || 0,
          sizes: newProduct.selectedSizes.length > 0 ? newProduct.sizeQuantities : null
        })
      });

      if (!response.ok) {
        if (response.status === 413) {
          alert('Image file is too large. Please use a smaller image or compress it before uploading.');
          return;
        }
        const errorText = await response.text();
        let errorMessage = 'Failed to update product';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
        }
        alert(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setShowAddModal(false);
        resetProductForm();
        fetchProducts();
        setSuccessMessage('The item was edited successfully!');
        setShowSuccessModal(true);
        setProductToEdit(null);
      } else {
        alert(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (product) => {
    setViewingProduct(product);
    setShowViewModal(true);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product._id);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setShowDeleteModal(false);
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/products/${productToDelete}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccessModal(true);
        setSuccessMessage('The item was deleted successfully!');
        fetchProducts();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
      setProductToDelete(null);
    }
  };

  const handleStockUpdate = async (product, type) => {
    setEditingProduct(product);
    setStockModalType(type);
    setStockAmount('');
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    
    if (!stockAmount || parseInt(stockAmount) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      const amount = parseInt(stockAmount);
      const newStock = stockModalType === 'in' 
        ? editingProduct.currentStock + amount
        : Math.max(0, editingProduct.currentStock - amount);

      const response = await fetch(`http://localhost:5000/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentStock: newStock
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Stock ${stockModalType === 'in' ? 'added' : 'removed'} successfully!`);
        setShowStockModal(false);
        setEditingProduct(null);
        setStockAmount('');
        fetchProducts();
      } else {
        alert(data.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockInConfirm = async (stockData) => {
    if (!editingProduct) return;

    try {
      setLoading(true);
      
      const updatedSizes = { ...(editingProduct.sizes || {}) };
      
      stockData.selectedSizes.forEach(size => {
        const currentQty = updatedSizes[size] || 0;
        const addQty = stockData.sizes[size] || 0;
        updatedSizes[size] = currentQty + addQty;
      });
      
      const totalStock = Object.values(updatedSizes).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);

      const response = await fetch(`http://localhost:5000/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentStock: totalStock,
          sizes: updatedSizes
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowStockModal(false);
        setEditingProduct(null);
        setStockAmount('');
        setSuccessMessage('Stock added successfully!');
        setShowSuccessModal(true);
        fetchProducts();
      } else {
        alert(data.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockOutConfirm = async (stockData) => {
    if (!editingProduct) return;

    try {
      setLoading(true);
      
      const updatedSizes = { ...(editingProduct.sizes || {}) };
      
      stockData.selectedSizes.forEach(size => {
        const currentQty = updatedSizes[size] || 0;
        const removeQty = stockData.sizes[size] || 0;
        updatedSizes[size] = Math.max(0, currentQty - removeQty);
      });
      
      const totalStock = Object.values(updatedSizes).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);

      const response = await fetch(`http://localhost:5000/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentStock: totalStock,
          sizes: updatedSizes
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowStockModal(false);
        setEditingProduct(null);
        setStockAmount('');
        setSuccessMessage('Stock removed successfully!');
        setShowSuccessModal(true);
        fetchProducts();
      } else {
        alert(data.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStockStatus = (currentStock, reorderNumber = 10) => {
    if (currentStock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    } else if (currentStock <= reorderNumber) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
    }
  };

  return (
      <div className="p-8 min-h-screen">
        <Header pageName="Inventory Management" showBorder={false} />

        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Category</h2>
          <div className="flex gap-4 flex-wrap">
            <CategoryButtons
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
              size="md"
            />
            
            <div className="w-[100px] h-[100px] bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-3 shrink-0">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stockStats.totalItems.toLocaleString()}</div>
              <div className="text-xs text-gray-600 text-center leading-tight">Total items</div>
            </div>

            <div className="w-[100px] h-[100px] bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-3 shrink-0">
              <div className="text-2xl font-bold text-green-600 mb-1">{stockStats.inStockItems.toLocaleString()}</div>
              <div className="text-xs text-gray-600 text-center leading-tight">In Stock</div>
            </div>

            <div className="w-[100px] h-[100px] bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-3 shrink-0">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stockStats.lowStockItems}</div>
              <div className="text-xs text-gray-600 text-center leading-tight">Low Stock</div>
            </div>

            <div className="w-[100px] h-[100px] bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-3 shrink-0">
              <div className="text-2xl font-bold text-red-600 mb-1">{stockStats.outOfStockItems}</div>
              <div className="text-xs text-gray-600 text-center leading-tight">Out of Stock</div>
            </div>
          </div>
        </div>

     
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Product List</h2>
           
            <div className="relative" style={{ width: '620px' }}>
              <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-15 h-9 flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)', borderRadius: '13px' }}>
                <FaSearch className="text-sm" />
              </div>
              <input
                type="text"
                placeholder="Search For..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-20 pr-4 py-3 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                style={{ borderRadius: '15px' }}
              />
            </div>
            <button className="ml-2 w-12 h-10 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_22px_rgba(0,0,0,0.16)]">
              <img src={sortIcon} alt="Sort" className="w-5 h-5 opacity-90" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border-transparent rounded-lg hover:bg-gray-50 flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_22px_rgba(0,0,0,0.16)]">
              <img src={printIcon} alt="Print" className="w-7 h-7 object-contain" />
            </button>
            <button className="px-4 py-2 bg-white border-transparent rounded-lg hover:bg-gray-50 flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_22px_rgba(0,0,0,0.16)]">
              <img src={exportIcon} alt="Export" className="w-7 h-7 object-contain" />
            </button>
            <button 
              onClick={() => {
                resetProductForm();
                setShowAddModal(true);
              }}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-medium transition-all"
              style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
            >
              <FaPlus /> Add New Item
            </button>
          </div>
        </div>

        <ProductTable
          loading={loading}
          filteredProducts={filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          handleEditProduct={handleEditClick}
          handleDeleteProduct={handleDeleteClick}
          handleViewProduct={handleViewProduct}
          handleStockUpdate={handleStockUpdate}
          formatDate={formatDate}
        />

        {filteredProducts.length >= itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        )}


        <AddProductModal
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          handleAddProduct={handleAddProduct}
          handleInputChange={handleInputChange}
          handleSizeToggle={handleSizeToggle}
          handleSizeQuantityChange={handleSizeQuantityChange}
          resetProductForm={resetProductForm}
          loading={loading}
        />

        <ConfirmAddProductModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmAddProduct}
          productName={newProduct.itemName}
        />

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message={successMessage || "The item was added successfully!"}
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setProductToDelete(null);
          }}
          onConfirm={confirmDeleteProduct}
          itemName={productToDelete ? filteredProducts.find(p => p._id === productToDelete)?.itemName : ''}
        />

        <EditConfirmationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setProductToEdit(null);
          }}
          onConfirm={confirmEditProduct}
          itemName={productToEdit?.itemName || editingProduct?.itemName || ''}
        />

        <ViewProductModal
          showViewModal={showViewModal}
          setShowViewModal={setShowViewModal}
          viewingProduct={viewingProduct}
          formatDate={formatDate}
        />

        {showStockModal && stockModalType === 'in' && (
          <StockInModal
            isOpen={showStockModal}
            onClose={() => {
              setShowStockModal(false);
              setEditingProduct(null);
              setStockAmount('');
            }}
            product={editingProduct}
            onConfirm={handleStockInConfirm}
            loading={loading}
          />
        )}

        {showStockModal && stockModalType === 'out' && (
          <StockOutModal
            isOpen={showStockModal}
            onClose={() => {
              setShowStockModal(false);
              setEditingProduct(null);
              setStockAmount('');
            }}
            product={editingProduct}
            onConfirm={handleStockOutConfirm}
            loading={loading}
          />
        )}
      </div>
  );
};

export default Inventory;

