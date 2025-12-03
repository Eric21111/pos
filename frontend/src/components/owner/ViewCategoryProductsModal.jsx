import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const ViewCategoryProductsModal = ({ isOpen, onClose, categoryName }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && categoryName) {
      fetchCategoryProducts();
    }
  }, [isOpen, categoryName]);

  const fetchCategoryProducts = async () => {
    if (!categoryName) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      
      if (data.success) {
        const categoryProducts = data.data.filter(product => 
          product.category === categoryName
        );
        setProducts(categoryProducts);
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !categoryName) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10002] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div 
          className="h-1"
          style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
        />
        
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">Products in {categoryName}</h2>
            <p className="text-sm text-gray-500 mt-1">{products.length} product(s) found</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">No products found in this category.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr 
                    className="text-white text-sm font-medium"
                    style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
                  >
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Image</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">SKU</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Item Name</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Brand</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Variant</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Price</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border border-gray-300 text-center">
                        <div className="flex justify-center">
                          {product.itemImage ? (
                            <img 
                              src={product.itemImage} 
                              alt={product.itemName}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                              No img
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center">{product.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center">{product.brandName || 'Brandless'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center">{product.variant || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center">PHP {(product.itemPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 border border-gray-300 text-center">
                        <div className="flex justify-center">
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              product.currentStock === 0
                                ? 'bg-red-100 text-red-700'
                                : product.currentStock <= (product.reorderNumber || 10)
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {product.currentStock || 0}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewCategoryProductsModal;
