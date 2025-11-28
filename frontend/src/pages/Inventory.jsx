import { useState, useEffect } from 'react';
import Header from '../components/shared/header';
import { 
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
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [showImportResultModal, setShowImportResultModal] = useState(false);
  const [importResult, setImportResult] = useState({ successCount: 0, errorCount: 0, errors: [] });
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

  const getNextIncrementalCode = () => {
    // Extract all numeric codes from existing SKUs
    const numericCodes = products
      .map(p => {
        const match = p.sku?.match(/-(\d{5})-?/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    // Get the highest number, or start from 0
    const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 0;
    
    // Increment and pad with zeros to 5 digits
    return String(maxCode + 1).padStart(5, '0');
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
    const incrementalCode = getNextIncrementalCode();
    
    if (!variant || variant.trim() === '') {
      return `${categoryCode}-${incrementalCode}`;
    }
    
    const colorCode = getColorCode(variant);
    return `${categoryCode}-${incrementalCode}-${colorCode}`;
  };

  
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
    setCurrentPage(1); 
  }, [filterCategory, filterBrand, filterStatus, searchQuery, sortBy, products]);

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

    // Filter by category
    if (filterCategory !== 'All') {
      filtered = filtered.filter(product => product.category === filterCategory);
    }

    // Filter by brand
    if (filterBrand !== 'All') {
      filtered = filtered.filter(product => product.brandName === filterBrand);
    }

    // Filter by status
    if (filterStatus !== 'All') {
      filtered = filtered.filter(product => {
        const reorderLevel = product.reorderNumber || 10;
        if (filterStatus === 'In Stock') {
          return product.currentStock > reorderLevel;
        } else if (filterStatus === 'Low Stock') {
          return product.currentStock > 0 && product.currentStock <= reorderLevel;
        } else if (filterStatus === 'Out of Stock') {
          return product.currentStock === 0;
        }
        return true;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brandName && product.brandName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort products
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.itemName.localeCompare(b.itemName);
        case 'price-low':
          return a.itemPrice - b.itemPrice;
        case 'price-high':
          return b.itemPrice - a.itemPrice;
        case 'stock-low':
          return a.currentStock - b.currentStock;
        case 'stock-high':
          return b.currentStock - a.currentStock;
        case 'date-new':
          return new Date(b.dateAdded) - new Date(a.dateAdded);
        case 'date-old':
          return new Date(a.dateAdded) - new Date(b.dateAdded);
        default:
          return 0;
      }
    });

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
        newSizeQuantities[size] = '';
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
    
    // Only validate stock/sizes when adding new product
    if (!editingProduct) {
      const hasSizeQuantities = newProduct.selectedSizes?.length > 0 && 
        Object.values(newProduct.sizeQuantities || {}).some(qty => qty > 0);
      const hasStock = parseInt(newProduct.currentStock) > 0;
      
      if (!hasSizeQuantities && !hasStock) {
        alert('Please either select sizes with quantities or provide a stock value.');
        return;
      }
      
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
      
      // Prepare payload - exclude sizes and stock when editing
      const payload = {
        ...newProduct,
        itemPrice: parseFloat(newProduct.itemPrice) || 0,
        costPrice: parseFloat(newProduct.costPrice) || 0,
        reorderNumber: parseInt(newProduct.reorderNumber) || 0
      };
      
      // Only include stock and sizes when adding new product
      if (!editingProduct) {
        payload.currentStock = totalStock;
        payload.sizes = newProduct.selectedSizes.length > 0 ? newProduct.sizeQuantities : null;
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
    
    try {
      setLoading(true);
      const url = `http://localhost:5000/api/products/${editingProduct._id}`;
      
      // Prepare payload - exclude sizes and stock when editing
      const payload = {
        ...newProduct,
        itemPrice: parseFloat(newProduct.itemPrice) || 0,
        costPrice: parseFloat(newProduct.costPrice) || 0,
        reorderNumber: parseInt(newProduct.reorderNumber) || 0
      };
      
      // Remove stock and size-related fields from payload
      delete payload.currentStock;
      delete payload.sizes;
      delete payload.selectedSizes;
      delete payload.sizeQuantities;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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

  const handleExportToCSV = () => {
    try {
      // Prepare CSV headers
      const headers = [
        'SKU',
        'Item Name',
        'Category',
        'Brand',
        'Variant',
        'Item Price',
        'Cost Price',
        'Current Stock',
        'Reorder Level',
        'Status',
        'Sizes',
        'Date Added',
        'Last Updated',
        'Supplier Name',
        'Supplier Contact',
        'Image URL'
      ];

      // Prepare CSV rows
      const rows = filteredProducts.map(product => {
        const status = getStockStatus(product.currentStock, product.reorderNumber);
        // Convert sizes object to JSON string for CSV
        const sizesJson = product.sizes && typeof product.sizes === 'object' && Object.keys(product.sizes).length > 0
          ? JSON.stringify(product.sizes)
          : '';
        
        return [
          product.sku || '',
          product.itemName || '',
          product.category || '',
          product.brandName || '',
          product.variant || '',
          product.itemPrice || 0,
          product.costPrice || 0,
          product.currentStock || 0,
          product.reorderNumber || 10,
          status.label,
          sizesJson,
          formatDate(product.dateAdded),
          formatDate(product.lastUpdated),
          product.supplierName || '',
          product.supplierContact || '',
          product.itemImage || ''
        ];
      });

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            // Escape cells that contain commas, quotes, or newlines
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Inventory exported successfully!');
    } catch (error) {
      console.error('Error exporting inventory:', error);
      alert('Failed to export inventory. Please try again.');
    }
  };

  const handleImportFromCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file is empty or invalid');
        return;
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1);
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          // Parse CSV row (handle quoted values)
          const values = [];
          let currentValue = '';
          let insideQuotes = false;
          
          for (let char of rows[i]) {
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              values.push(currentValue.trim().replace(/^"|"$/g, ''));
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim().replace(/^"|"$/g, ''));

          // Map values to product object
          const sizesValue = values[headers.indexOf('Sizes')] || '';
          let parsedSizes = null;
          
          // Try to parse sizes JSON
          if (sizesValue && sizesValue.trim() !== '') {
            try {
              parsedSizes = JSON.parse(sizesValue);
            } catch (e) {
              console.warn('Failed to parse sizes JSON:', e);
            }
          }
          
          const product = {
            sku: values[headers.indexOf('SKU')] || generateSKU('Others', ''),
            itemName: values[headers.indexOf('Item Name')] || '',
            category: values[headers.indexOf('Category')] || 'Others',
            brandName: values[headers.indexOf('Brand')] || '',
            variant: values[headers.indexOf('Variant')] || '',
            itemPrice: parseFloat(values[headers.indexOf('Item Price')]) || 0,
            costPrice: parseFloat(values[headers.indexOf('Cost Price')]) || 0,
            currentStock: parseInt(values[headers.indexOf('Current Stock')]) || 0,
            reorderNumber: parseInt(values[headers.indexOf('Reorder Level')]) || 10,
            supplierName: values[headers.indexOf('Supplier Name')] || '',
            supplierContact: values[headers.indexOf('Supplier Contact')] || '',
            itemImage: values[headers.indexOf('Image URL')] || '',
            sizes: parsedSizes
          };

          // Validate required fields
          if (!product.itemName || !product.itemPrice) {
            errors.push(`Row ${i + 2}: Missing required fields (Item Name or Price)`);
            errorCount++;
            continue;
          }

          // Send to backend
          const response = await fetch('http://localhost:5000/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
          });

          const data = await response.json();
          
          if (data.success) {
            successCount++;
          } else {
            errors.push(`Row ${i + 2}: ${data.message}`);
            errorCount++;
          }
        } catch (rowError) {
          errors.push(`Row ${i + 2}: ${rowError.message}`);
          errorCount++;
        }
      }

      // Show results in modal
      setImportResult({ successCount, errorCount, errors });
      setShowImportResultModal(true);
      
      // Refresh products list
      if (successCount > 0) {
        fetchProducts();
      }
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Failed to import CSV file. Please check the file format and try again.');
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="p-8 min-h-screen">
        <Header pageName="Product & Stocks" showBorder={false} />

        
        <div className="mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="bg-white rounded-2xl shadow-md flex items-center justify-between px-5 py-4 relative overflow-hidden" style={{ minWidth: '200px' }}>
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500"></div>
              <div className="ml-2">
                <div className="text-3xl font-bold text-blue-500">{stockStats.totalItems.toLocaleString()}</div>
                <div className="text-xs text-blue-400 mt-0.5">Total Items</div>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md flex items-center justify-between px-5 py-4 relative overflow-hidden" style={{ minWidth: '200px' }}>
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-green-500"></div>
              <div className="ml-2">
                <div className="text-3xl font-bold text-green-500">{stockStats.inStockItems.toLocaleString()}</div>
                <div className="text-xs text-green-400 mt-0.5">In Stock</div>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md flex items-center justify-between px-5 py-4 relative overflow-hidden" style={{ minWidth: '200px' }}>
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-orange-500"></div>
              <div className="ml-2">
                <div className="text-3xl font-bold text-orange-500">{stockStats.lowStockItems}</div>
                <div className="text-xs text-orange-400 mt-0.5">Low Stock</div>
              </div>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md flex items-center justify-between px-5 py-4 relative overflow-hidden" style={{ minWidth: '200px' }}>
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500"></div>
              <div className="ml-2">
                <div className="text-3xl font-bold text-red-500">{stockStats.outOfStockItems}</div>
                <div className="text-xs text-red-400 mt-0.5">Out-of-Stock</div>
              </div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <button className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center px-5 py-4 hover:bg-gray-50 transition-colors" style={{ minWidth: '100px' }}>
              <svg className="w-8 h-8 text-gray-700 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <div className="text-xs font-medium text-gray-700">Print</div>
            </button>

            <button 
              onClick={handleExportToCSV}
              className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center px-5 py-4 hover:bg-gray-50 transition-colors" 
              style={{ minWidth: '100px' }}
            >
              <svg className="w-8 h-8 text-gray-700 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-xs font-medium text-gray-700">Export</div>
            </button>

            <button 
              onClick={() => document.getElementById('csv-file-input').click()}
              className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center px-5 py-4 hover:bg-gray-50 transition-colors" 
              style={{ minWidth: '100px' }}
            >
              <svg className="w-8 h-8 text-gray-700 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-xs font-medium text-gray-700">Import</div>
            </button>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleImportFromCSV}
              style={{ display: 'none' }}
            />
          </div>
        </div>

     
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="relative" style={{ width: '300px' }}>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search For..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
              />
            </div>
            
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
            >
              <option value="All">By Category</option>
              {categories.filter(c => c.name !== 'All').map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            
            <select 
              value={filterBrand} 
              onChange={(e) => setFilterBrand(e.target.value)}
              className="h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
            >
              <option value="All">By Brand</option>
              {[...new Set(products.map(p => p.brandName).filter(Boolean))].sort().map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
            >
              <option value="All">By Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
            >
              <option value="name">Sort By Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock-low">Stock: Low to High</option>
              <option value="stock-high">Stock: High to Low</option>
              <option value="date-new">Date: Newest First</option>
              <option value="date-old">Date: Oldest First</option>
            </select>
          </div>
          <div className="flex gap-3">
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
          handleEditProduct={handleEditClick}
          handleDeleteProduct={handleDeleteClick}
          handleViewProduct={handleViewProduct}
          handleStockUpdate={handleStockUpdate}
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

        {showImportResultModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#2D2D2D] rounded-2xl w-full max-w-2xl p-8 text-white shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">localhost:5173 says</h2>
              <div className="space-y-4 mb-6">
                <p className="text-lg">Import completed!</p>
                <div className="space-y-2">
                  <p>Successful: {importResult.successCount}</p>
                  <p>Failed: {importResult.errorCount}</p>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2">Showing first 5 errors:</p>
                    <div className="bg-black/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                      {importResult.errors.slice(0, 5).map((error, idx) => (
                        <p key={idx} className="text-sm mb-1">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowImportResultModal(false)}
                  className="px-8 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Inventory;

