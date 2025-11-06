import React from 'react';
import { FaEllipsisV } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';

const ProductTable = ({
  loading,
  filteredProducts,
  openDropdown,
  setOpenDropdown,
  handleEditProduct,
  handleDeleteProduct,
  handleViewProduct,
  formatDate
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
                <th className="pb-3 px-4">Date Added</th>
                <th className="pb-3 px-4 text-center">Current Stock</th>
                <th className="pb-3 px-4">Expiration Date</th>
                <th className="pb-3 px-4">Last Updated</th>
                <th className="pb-3 pl-4">Actions</th>
              </tr>
            </thead>
            <tbody className="relative">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="border-b hover:bg-gray-50">
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
                  <td className="py-3 px-4">{formatDate(product.dateAdded)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded ${product.currentStock === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {product.currentStock}
                    </span>
                  </td>
                  <td className="py-3 px-4">{formatDate(product.expirationDate)}</td>
                  <td className="py-3 px-4">{formatDate(product.lastUpdated)}</td>
                  <td className="py-3 pl-4">
                    <div className="relative">
                      <button
                        id={`dropdown-btn-${product._id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === product._id ? null : product._id);
                        }}
                        className="text-gray-600 hover:text-gray-900 p-2"
                      >
                        <FaEllipsisV />
                      </button>
                      {openDropdown === product._id && (
                        <div
                          className="fixed w-48 bg-white rounded-lg border border-gray-200"
                          style={{
                            zIndex: 1000,
                            boxShadow:
                              '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            top: `${(document.getElementById(`dropdown-btn-${product._id}`)?.getBoundingClientRect().top || 0) - 45}px`,
                            left: `${(document.getElementById(`dropdown-btn-${product._id}`)?.getBoundingClientRect().left || 0) - 192}px`
                          }}
                        >
                          <button
                            onClick={() => {
                              handleViewProduct(product);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 border-b rounded-t-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => {
                              handleEditProduct(product);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 border-b"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteProduct(product);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600 rounded-b-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
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


