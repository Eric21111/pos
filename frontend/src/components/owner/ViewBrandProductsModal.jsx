import { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaTrash } from 'react-icons/fa';

const ViewBrandProductsModal = ({ isOpen, onClose, brandPartner }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && brandPartner) {
      fetchBrandProducts();
    }
  }, [isOpen, brandPartner]);

  const fetchBrandProducts = async () => {
    if (!brandPartner?.brandName) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      
      if (data.success) {
        // Filter products by brand name (matching brandName or supplierName)
        const brandProducts = data.data.filter(product => 
          product.brandName === brandPartner.brandName || 
          product.supplierName === brandPartner.brandName
        );
        setProducts(brandProducts);
      }
    } catch (error) {
      console.error('Error fetching brand products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !brandPartner) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10002] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div 
          className="h-1"
          style={{ 
            background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)'
          }}
        />
        
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">View Products</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start gap-6 relative">
            <div className="w-32 h-32 shrink-0 flex items-center justify-center">
              <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center">
                {brandPartner.logo ? (
                  <img 
                    src={brandPartner.logo} 
                    alt={brandPartner.brandName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="text-gray-400 text-3xl font-bold">
                    {brandPartner.brandName.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {brandPartner.brandName}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Email:</span> {brandPartner.email}
                </div>
                <div>
                  <span className="font-medium">Contact Person:</span> {brandPartner.contactPerson}
                </div>
                <div>
                  <span className="font-medium">Contact Number:</span> {brandPartner.contactNumber}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {}}
                className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <FaEdit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {}}
                className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-12 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">No products found for this brand.</div>
            </div>
          ) : (
            <div className="overflow-x-auto flex justify-center">
              <table className="w-full max-w-4xl border-collapse mx-auto">
                <thead>
                  <tr 
                    className="text-white text-sm font-medium"
                    style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
                  >
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Item Image</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">SKU</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Item Name</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Category</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Variant</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Item Price</th>
                    <th className="px-4 py-3 text-center border border-white shadow-sm">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border border-gray-300 text-center shadow-sm">
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
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center shadow-sm">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center shadow-sm">{product.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center shadow-sm">{product.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center shadow-sm">{product.variant || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300 text-center shadow-sm">PHP {(product.itemPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 border border-gray-300 text-center shadow-sm">
                        <div className="flex justify-center">
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              product.currentStock === 0
                                ? 'bg-red-100 text-red-700'
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

export default ViewBrandProductsModal;

