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
  handleSizePriceChange,
  resetProductForm,
  loading,
  categories = [],
  brandPartners = []
}) => {
  // Built-in categories that have specific size options
  const builtInCategories = ['Tops', 'Bottoms', 'Dresses', 'Makeup', 'Accessories', 'Shoes', 'Head Wear', 'Foods'];
  if (!showAddModal) return null;

  const partnerNames = Array.from(
    new Set(
      brandPartners
        .map((partner) => partner.brandName)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const legacyBrandSelected =
    newProduct.brandName &&
    newProduct.brandName !== 'Brandless' &&
    !partnerNames.includes(newProduct.brandName);

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
                          onChange={(e) => {
                            handleInputChange(e);
                            // Reset foodSubtype when category changes
                            if (e.target.value !== 'Foods') {
                              setNewProduct(prev => ({ ...prev, foodSubtype: '' }));
                            }
                          }}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                        >
                          {categories.filter(cat => cat.name !== 'All' && cat.name !== 'Others').map(category => (
                            <option key={category.name} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Brand</label>
                        <select
                          name="brandName"
                          value={newProduct.brandName || 'Brandless'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                        >
                          <option value="Brandless">Brandless</option>
                          {partnerNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                          {legacyBrandSelected && (
                            <option value={newProduct.brandName}>{newProduct.brandName} (Inactive)</option>
                          )}
                        </select>
                      </div>
                    </div>
                    {newProduct.category === 'Foods' && (
                      <div className="mt-3">
                        <label className="block text-xs text-gray-600 mb-1">Food Type</label>
                        <select
                          name="foodSubtype"
                          value={newProduct.foodSubtype || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                        >
                          <option value="">Select Food Type</option>
                          <option value="Beverages">Beverages</option>
                          <option value="Snacks">Snacks</option>
                          <option value="Meals">Meals</option>
                          <option value="Desserts">Desserts</option>
                          <option value="Ingredients">Ingredients</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
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
                
                    {!editingProduct && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">
                            Sizes <span className="text-gray-400">Optional - Select multiple sizes</span>
                          </label>
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {(() => {
                              const category = newProduct.category;
                              const foodSubtype = newProduct.foodSubtype || '';
                              let sizes = [];
                              
                              // Check if category is built-in
                              const isBuiltIn = builtInCategories.includes(category);
                              
                              if (!isBuiltIn) {
                                // All custom/added categories should have Free Size only
                                sizes = ['Free Size'];
                              }
                              // Foods - size depends on subtype
                              else if (category === 'Foods') {
                                switch (foodSubtype) {
                                  case 'Beverages':
                                    sizes = ['Small', 'Medium', 'Large', 'Extra Large', 'Free Size'];
                                    break;
                                  case 'Snacks':
                                    sizes = ['Small', 'Medium', 'Large', 'Family Size', 'Free Size'];
                                    break;
                                  case 'Meals':
                                    sizes = ['Regular', 'Large', 'Family Size', 'Free Size'];
                                    break;
                                  case 'Desserts':
                                    sizes = ['Small', 'Medium', 'Large', 'Free Size'];
                                    break;
                                  case 'Ingredients':
                                    sizes = ['100g', '250g', '500g', '1kg', 'Free Size'];
                                    break;
                                  case 'Other':
                                    sizes = ['Small', 'Medium', 'Large', 'Free Size'];
                                    break;
                                  default:
                                    // Default sizes when no subtype selected
                                    sizes = ['Small', 'Medium', 'Large', 'Free Size'];
                                }
                              }
                              // Clothing categories (Tops, Bottoms, Dresses)
                              else if (['Tops', 'Bottoms', 'Dresses'].includes(category)) {
                                sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];
                              }
                              // Shoes
                              else if (category === 'Shoes') {
                                sizes = ['5', '6', '7', '8', '9', '10', '11', '12'];
                              }
                              // Accessories, Head Wear, Makeup
                              else if (['Accessories', 'Head Wear', 'Makeup'].includes(category)) {
                                sizes = ['Free Size'];
                              }
                              
                              return sizes.map((size) => (
                                <label key={size} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newProduct.selectedSizes?.includes(size) || false}
                                    onChange={() => handleSizeToggle(size)}
                                    className="w-4 h-4 text-[#AD7F65] border-gray-300 rounded focus:ring-[#AD7F65]"
                                  />
                                  <span className="text-sm text-gray-700">{size}</span>
                                </label>
                              ));
                            })()}
                          </div>
                        
                          {newProduct.selectedSizes?.length > 0 && (
                            <>
                              <div className="mt-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newProduct.differentPricesPerSize || false}
                                    onChange={(e) => {
                                      setNewProduct(prev => {
                                        const newSizePrices = {};
                                        if (e.target.checked) {
                                          // Initialize prices for all selected sizes with default price
                                          prev.selectedSizes.forEach(size => {
                                            newSizePrices[size] = prev.itemPrice || '';
                                          });
                                        }
                                        return {
                                          ...prev,
                                          differentPricesPerSize: e.target.checked,
                                          sizePrices: e.target.checked ? newSizePrices : {}
                                        };
                                      });
                                    }}
                                    className="w-4 h-4 text-[#AD7F65] border-gray-300 rounded focus:ring-[#AD7F65]"
                                  />
                                  <span className="text-sm text-gray-700">Different prices each size?</span>
                                </label>
                              </div>
                              
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
                                      value={newProduct.sizeQuantities?.[size] || ''}
                                      onChange={(e) => handleSizeQuantityChange(size, e.target.value)}
                                      placeholder="Enter quantity"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                              {newProduct.differentPricesPerSize && (
                                <div className="space-y-2 mt-3 p-3 bg-gray-50 rounded-lg">
                                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Price per Size:
                                  </label>
                                  <div className="grid grid-cols-2 gap-3">
                                    {newProduct.selectedSizes.map((size) => (
                                      <div key={size}>
                                        <label className="block text-xs text-gray-600 mb-1">{size} Price</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={newProduct.sizePrices?.[size] || ''}
                                          onChange={(e) => handleSizePriceChange(size, e.target.value)}
                                          placeholder="Enter price"
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
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
                      </>
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
                    {!newProduct.differentPricesPerSize && (
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
                    )}
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

                <div>
                  <h3 className="text-base font-semibold mb-3">Display Settings</h3>
                  <div className="space-y-3">
                    {(() => {
                      // Check if product has zero stock
                      // When editing, use the actual product's current stock and sizes
                      const hasZeroStock = () => {
                        if (editingProduct) {
                          // When editing, check the actual product's stock
                          if (editingProduct.sizes && typeof editingProduct.sizes === 'object' && Object.keys(editingProduct.sizes).length > 0) {
                            // For products with sizes, check if all sizes have 0 stock
                            const allSizesZero = Object.values(editingProduct.sizes).every(sizeData => {
                              if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
                                return (sizeData.quantity || 0) === 0;
                              }
                              return (typeof sizeData === 'number' ? sizeData : 0) === 0;
                            });
                            return allSizesZero;
                          }
                          // For products without sizes, check currentStock
                          return (editingProduct.currentStock || 0) === 0;
                        } else {
                          // When adding new product, check newProduct
                          if (newProduct.selectedSizes && newProduct.selectedSizes.length > 0 && newProduct.sizeQuantities) {
                            // For products with sizes, check if all sizes have 0 stock
                            const allSizesZero = newProduct.selectedSizes.every(size => {
                              const qty = newProduct.sizeQuantities[size] || 0;
                              return parseInt(qty) === 0;
                            });
                            return allSizesZero;
                          }
                          // For products without sizes, check currentStock
                          return parseInt(newProduct.currentStock || 0) === 0;
                        }
                      };
                      
                      const isStockZero = hasZeroStock();
                      const isDisabled = editingProduct && isStockZero;
                      
                      return (
                        <label className={`flex items-center gap-3 ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                          <div className="relative">
                            <input
                              type="checkbox"
                              name="displayInTerminal"
                              checked={newProduct.displayInTerminal !== false}
                              onChange={handleInputChange}
                              disabled={isDisabled}
                              className="sr-only"
                            />
                            <div className={`w-14 h-7 rounded-full transition-colors duration-200 ${
                              newProduct.displayInTerminal !== false ? 'bg-[#AD7F65]' : 'bg-gray-300'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                                newProduct.displayInTerminal !== false ? 'translate-x-7' : 'translate-x-1'
                              } mt-0.5`}></div>
                            </div>
                          </div>
                          <div>
                            <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                              Display in Terminal
                            </span>
                            <p className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                              {isDisabled 
                                ? 'Add stock to enable this option' 
                                : 'Show this product in POS/terminal'}
                            </p>
                          </div>
                        </label>
                      );
                    })()}
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
                    {newProduct.itemImage && newProduct.itemImage.trim() !== '' ? (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img 
                          src={newProduct.itemImage} 
                          alt="Product Preview" 
                          className="max-w-full max-h-full object-contain rounded-lg"
                          style={{ display: 'block' }}
                        />
                      </div>
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


