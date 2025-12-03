import { useState, useEffect, memo } from 'react';
import Header from '../../components/shared/header';
import { useAuth } from '../../context/AuthContext';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaUndo } from 'react-icons/fa';
import ViewCategoryProductsModal from '../../components/owner/ViewCategoryProductsModal';

const Categories = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All, Active, Archived
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewProductsModal, setShowViewProductsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');

  // Built-in categories that should always exist
  const builtInCategories = ['Tops', 'Bottoms', 'Dresses', 'Makeup', 'Accessories', 'Shoes', 'Head Wear', 'Foods'];

  // Fetch categories from API
  useEffect(() => {
    initializeBuiltInCategories();
  }, []);

  const initializeBuiltInCategories = async () => {
    try {
      setLoading(true);
      
      // First, fetch existing categories
      const response = await fetch('http://localhost:5000/api/categories');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const existingCategories = data.success && Array.isArray(data.data) ? data.data : [];
      const existingCategoryNames = existingCategories.map(cat => cat.name);
      
      // Archive any existing "Others" categories
      const othersCategories = existingCategories.filter(cat => cat.name === 'Others');
      if (othersCategories.length > 0) {
        const archivePromises = othersCategories.map(cat =>
          fetch(`http://localhost:5000/api/categories/${cat._id}/archive`, {
            method: 'PATCH'
          }).catch(error => {
            console.warn(`Error archiving Others category:`, error);
            return null;
          })
        );
        await Promise.all(archivePromises);
      }
      
      // Create missing built-in categories
      const missingCategories = builtInCategories.filter(
        categoryName => !existingCategoryNames.includes(categoryName)
      );
      
      // Create all missing categories
      const createPromises = missingCategories.map(categoryName =>
        fetch('http://localhost:5000/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: categoryName,
            status: 'active'
          })
        }).catch(error => {
          console.warn(`Error creating category ${categoryName}:`, error);
          return null;
        })
      );
      
      await Promise.all(createPromises);
      
      // Fetch all categories again after creating missing ones
      await fetchCategories();
    } catch (error) {
      console.error('Error initializing categories:', error);
      // Still try to fetch categories even if initialization fails
      await fetchCategories();
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/categories');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        console.warn('Invalid response format:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setError('');
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          status: 'active'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCategoryName('');
        setShowAddModal(false);
        fetchCategories();
      } else {
        setError(data.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      setError('Error creating category');
    }
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setError('');
      const response = await fetch(`http://localhost:5000/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: categoryName.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCategoryName('');
        setEditingCategory(null);
        setShowEditModal(false);
        fetchCategories();
      } else {
        setError(data.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Error updating category');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}/archive`, {
        method: 'PATCH'
      });

      const data = await response.json();
      
      if (data.success) {
        fetchCategories();
      } else {
        alert('Failed to update category status');
      }
    } catch (error) {
      console.error('Error updating category status:', error);
      alert('Error updating category status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to archive this category? It will be hidden from POS/Terminal and Inventory filters.')) {
      return;
    }
    
    try {
      // Archive the category (set status to inactive) instead of deleting
      const response = await fetch(`http://localhost:5000/api/categories/${id}/archive`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.message || 'Failed to archive category');
      }
    } catch (error) {
      console.error('Error archiving category:', error);
      alert('Error archiving category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setError('');
    setShowEditModal(true);
  };

  const handleViewProducts = (category) => {
    setSelectedCategory(category);
    setShowViewProductsModal(true);
  };

  const filteredCategories = categories.filter(category => {
    // Exclude "Others" category from display
    if (category.name === 'Others') {
      return false;
    }
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || 
      (filterStatus === 'Active' && category.status === 'active') ||
      (filterStatus === 'Archived' && category.status === 'inactive');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <Header 
        pageName="Categories"
        profileBackground="bg-gray-100"
        showBorder={false}
        userName={currentUser?.name || 'Owner'}
        userRole="Owner"
      />

      {/* Search and Filter Section */}
      <div className="flex items-center gap-4 mb-6 justify-between mt-5">
        <div className="flex items-center gap-30">
          <div className="relative" style={{ maxWidth: '400px' }}>
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-10 h-9 flex items-center justify-center text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}>
              <FaSearch className="text-sm" />
            </div>
            <input
              type="text"
              placeholder="Search For..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[500px] h-11 pl-14 pr-4 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent rounded-xl"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterStatus('All')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'All'
                  ? 'text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={filterStatus === 'All' ? { background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' } : {}}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('Active')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'Active'
                  ? 'text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={filterStatus === 'Active' ? { background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' } : {}}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('Archived')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'Archived'
                  ? 'text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={filterStatus === 'Archived' ? { background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' } : {}}
            >
              Archived
            </button>
          </div>
        </div>

        {/* Add Category Button */}
        <button
          onClick={() => {
            setCategoryName('');
            setError('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
        >
          <FaPlus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading categories...</div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">No categories found. Create your first category!</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="flex">
                {/* Left Side - Category Name */}
                <div className="flex-1 p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {category.name}
                  </h3>
                </div>

                {/* Vertical Separator */}
                <div className="w-1 bg-[#AD7F65]"></div>

                {/* Right Side - Details */}
                <div className="flex-1 p-4">
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-gray-800">{category.productCount || 0}</p>
                    <p className="text-xs text-gray-600">Products in category</p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        category.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    ></div>
                    <span className={`text-xs font-medium ${
                      category.status === 'active' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {category.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleViewProducts(category)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      View Products
                    </button>
                    {!builtInCategories.includes(category.name) && (
                      <button
                        onClick={() => handleEdit(category)}
                        className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                    )}
                    {category.status === 'active' ? (
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="w-9 h-9 flex items-center justify-center bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(category._id)}
                        className="w-9 h-9 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <FaUndo className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Category</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
                placeholder="Enter category name"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCategoryName('');
                  setError('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 text-white rounded-lg hover:shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Edit Category</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
                placeholder="Enter category name"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  setCategoryName('');
                  setError('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                className="px-4 py-2 text-white rounded-lg hover:shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Products Modal */}
      <ViewCategoryProductsModal
        isOpen={showViewProductsModal}
        onClose={() => {
          setShowViewProductsModal(false);
          setSelectedCategory(null);
        }}
        categoryName={selectedCategory?.name}
      />
    </div>
  );
};

export default memo(Categories);

