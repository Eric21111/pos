import { MdCategory } from 'react-icons/md';

export default function ProductCard({
  product,
  onToggleExpand
}) {
  // Helper function to get quantity from size data (handles both number and object formats)
  const getSizeQuantity = (sizeData) => {
    if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
      return sizeData.quantity;
    }
    return typeof sizeData === 'number' ? sizeData : 0;
  };

  // Helper function to get price from size data
  const getSizePrice = (sizeData) => {
    if (typeof sizeData === 'object' && sizeData !== null && sizeData.price !== undefined) {
      return sizeData.price;
    }
    return null;
  };

  // Function to get price range for products with sizes
  const getPriceRange = () => {
    if (product.sizes && typeof product.sizes === 'object') {
      const prices = [];
      
      Object.values(product.sizes).forEach(sizeData => {
        const price = getSizePrice(sizeData);
        if (price !== null) {
          prices.push(price);
        }
      });
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice !== maxPrice) {
          return { min: minPrice, max: maxPrice, isRange: true };
        }
        return { min: minPrice, max: maxPrice, isRange: false };
      }
    }
    
    return { min: product.itemPrice || 0, max: product.itemPrice || 0, isRange: false };
  };

  const getTotalStock = () => {
    if (typeof product.currentStock === 'number') {
      return product.currentStock;
    }

    if (product.sizes && typeof product.sizes === 'object') {
      return Object.values(product.sizes).reduce((sum, sizeData) => sum + getSizeQuantity(sizeData), 0);
    }
    return product.currentStock || 0;
  };

  const displayStock = getTotalStock();
  const priceRange = getPriceRange();
  
  return (
    <div
      className="mb-4 bg-white rounded-2xl transition-all duration-300 ease-out overflow-hidden border-4 border-gray-200 shadow hover:shadow-xl hover:border-[#AD7F65] cursor-pointer"
      onClick={onToggleExpand}
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.itemImage && product.itemImage.trim() !== '' ? (
          <img src={product.itemImage} alt={product.itemName} className="w-full h-full object-cover" />
        ) : (
          <MdCategory className="text-4xl text-gray-400" />
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm mb-1 truncate">
          {product.itemName}{product.variant ? ` (${product.variant})` : ''}
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {priceRange.isRange
              ? `PHP ${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)}`
              : `PHP ${priceRange.min.toFixed(2)}`
            }
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">{displayStock} stocks left</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="w-full mt-2 py-2 text-xs text-white rounded-lg border hover:opacity-90 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          style={{
            background: 'rgba(9, 160, 70, 1)',
            borderColor: 'rgba(9, 160, 70, 1)',
            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.25)'
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}


