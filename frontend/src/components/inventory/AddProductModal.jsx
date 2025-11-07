import React from 'react';

const AddProductModal = ({
  showAddModal,
  setShowAddModal,
  editingProduct,
  setEditingProduct,
  newProduct,
  setNewProduct,
  handleAddProduct,
  handleInputChange,
  handleSizeToggle,
  handleSizeQuantityChange,
  resetProductForm,
  loading
}) => {
  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm pointer-events-none">
      <div className="bg-white rounded-2xl w-full max-w-5xl relative pointer-events-auto" style={{ maxHeight: '95vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)' }}>
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product Details' : 'Add Product Details'}</h2>
          <button
            onClick={() => {
              setShowAddModal(false);
              resetProductForm();
            }}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleAddProduct}>
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 80px)' }}>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-3">Basic Info</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Product Name</label>
                      <input
                        type="text"
                        name="itemName"
                        value={newProduct.itemName}
                        onChange={handleInputChange}
                        required
                        placeholder="Product name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Choose a Category</label>
                        <select
                          name="category"
                          value={newProduct.category}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                        >
                          <option value="Tops">Tops</option>
                          <option value="Bottoms">Bottoms</option>
                          <option value="Dresses">Dresses</option>
                          <option value="Makeup">Makeup</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Shoes">Shoes</option>
                          <option value="Head Wear">Head Wear</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Brand Name</label>
                        <input
                          type="text"
                          name="brandName"
                          value={newProduct.brandName}
                          onChange={handleInputChange}
                          placeholder="Brand Name"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Stock Details</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Variant <span className="text-gray-400">Optional</span>
                        </label>
                        <input
                          type="text"
                          name="variant"
                          value={newProduct.variant}
                          onChange={handleInputChange}
                          placeholder="Add Variant"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                        />
                      </div>
                    </div>
                
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">
                        Sizes <span className="text-gray-400">Optional - Select multiple sizes</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'].map((size) => (
                          <label key={size} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newProduct.selectedSizes?.includes(size) || false}
                              onChange={() => handleSizeToggle(size)}
                              className="w-4 h-4 text-[#AD7F65] border-gray-300 rounded focus:ring-[#AD7F65]"
                            />
                            <span className="text-sm text-gray-700">{size}</span>
                          </label>
                        ))}
                      </div>
                    
                      {newProduct.selectedSizes?.length > 0 && (
                        <div className="space-y-2 mt-3 p-3 bg-gray-50 rounded-lg">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Quantity per Size:
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {newProduct.selectedSizes.map((size) => (
                              <div key={size}>
                                <label className="block text-xs text-gray-600 mb-1">{size}</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={newProduct.sizeQuantities?.[size] || 0}
                                  onChange={(e) => handleSizeQuantityChange(size, e.target.value)}
                                  placeholder="0"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                 
                    {(!newProduct.selectedSizes || newProduct.selectedSizes.length === 0) && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Stock</label>
                        <input
                          type="number"
                          name="currentStock"
                          value={newProduct.currentStock}
                          onChange={handleInputChange}
                          placeholder="Add Stock"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Pricing</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Cost Price</label>
                      <input
                        type="number"
                        step="0.01"
                        name="costPrice"
                        value={newProduct.costPrice}
                        onChange={handleInputChange}
                        placeholder="Enter cost price"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Selling Price</label>
                      <input
                        type="number"
                        step="0.01"
                        name="itemPrice"
                        value={newProduct.itemPrice}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter selling price"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Supplier Info</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Supplier Name</label>
                      <input
                        type="text"
                        name="supplierName"
                        value={newProduct.supplierName}
                        onChange={handleInputChange}
                        placeholder="Supplier"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                      />
                    </div>
                    {/* <div>
                      <label className="block text-xs text-gray-600 mb-1">Supplier Contact</label>
                      <input
                        type="text"
                        name="supplierContact"
                        value={newProduct.supplierContact}
                        onChange={handleInputChange}
                        placeholder="Supplier Contact"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                      />
                    </div> */}
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div>
                  <div 
                    onClick={() => document.getElementById('fileInput').click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50 p-6 cursor-pointer hover:border-[#AD7F65] hover:bg-gray-100 transition-all"
                    style={{ height: '320px' }}
                  >
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewProduct(prev => ({
                              ...prev,
                              itemImage: reader.result
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    {newProduct.itemImage ? (
                      <img 
                        src={newProduct.itemImage} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm mb-3">Upload an Image</p>
                        <p className="text-gray-400 text-xs">Click to browse or paste URL below</p>
                      </>
                    )}
                  </div>
                  {!newProduct.itemImage && (
                    <div className="mt-3">
                      <input
                        type="text"
                        name="itemImage"
                        value={newProduct.itemImage}
                        onChange={handleInputChange}
                        placeholder="Or paste image URL"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-12 py-3 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
                  >
                    {loading ? (editingProduct ? 'Updating...' : 'Adding...') : (editingProduct ? 'Update Product' : 'Add New Item')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;


