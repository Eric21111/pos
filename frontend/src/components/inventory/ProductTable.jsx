import React from 'react';
import { MdCategory } from 'react-icons/md';

const ProductTable = ({
  loading,
  filteredProducts,
  handleEditProduct,
  handleDeleteProduct,
  handleViewProduct,
  handleStockUpdate
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto p-6">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No products found. Click "Add New Item" to add your first product.
          </div>
        ) : (
          <table className="w-full relative border-separate" style={{ borderSpacing: '0' }}>
            <thead className="border-b">
              <tr className="text-left text-sm text-gray-600">
                <th className="pb-3 pr-4">Item Image</th>
                <th className="pb-3 px-4">SKU</th>
                <th className="pb-3 px-4">Item Name</th>
                <th className="pb-3 px-4">Category</th>
                <th className="pb-3 px-4">Variant</th>
                <th className="pb-3 px-4">Item Price</th>
                <th className="pb-3 px-4 text-center">Current Stock</th>
                <th className="pb-3 pl-4">Actions</th>
              </tr>
            </thead>
            <tbody className="relative">
              {filteredProducts.map((product) => (
                <tr 
                  key={product._id} 
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewProduct(product)}
                >
                  <td className="py-3 pr-4">
                    {product.itemImage ? (
                      <img src={product.itemImage} alt={product.itemName} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                        <MdCategory />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">{product.sku}</td>
                  <td className="py-3 px-4">{product.itemName}</td>
                  <td className="py-3 px-4">{product.category}</td>
                  <td className="py-3 px-4">{product.variant || '-'}</td>
                  <td className="py-3 px-4">PHP {product.itemPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded font-semibold ${
                      product.currentStock === 0 
                        ? 'bg-red-100 text-red-700' 
                        : product.currentStock <= (product.reorderNumber || 10)
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {product.currentStock}
                    </span>
                  </td>
                  <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {/* Stock In Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStockUpdate(product, 'in');
                        }}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors group relative"
                        title="Stock In"
                      >
                        <div className="relative w-6 h-6 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center border border-white">
                            <span className="text-white text-[8px] font-bold leading-none">+</span>
                          </span>
                        </div>
                      </button>

                      {/* Stock Out Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStockUpdate(product, 'out');
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group relative"
                        title="Stock Out"
                      >
                        <div className="relative w-6 h-6 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center border border-white">
                            <span className="text-white text-[8px] font-bold leading-none">-</span>
                          </span>
                        </div>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                        title="Edit"
                      >
                        <svg className="w-6 h-6 text-blue-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        title="Delete"
                      >
                        <svg className="w-6 h-6 text-red-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductTable;


