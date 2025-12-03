import { useState, useEffect, useMemo } from 'react';
import Header from '../../components/shared/header';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { FaShoppingBag, FaChartLine, FaChevronRight, FaChevronLeft, FaHandHoldingUsd, FaMoneyBillWave, FaBox, FaExclamationTriangle, FaTimesCircle, FaClipboardList } from 'react-icons/fa';
import filterIcon from '../../assets/filter.svg';
import printIcon from '../../assets/inventory-icons/print.png';
import exportIcon from '../../assets/inventory-icons/Export.svg';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [metrics, setMetrics] = useState({
    totalSalesToday: 0,
    totalTransactions: 0,
    averageTransactionValue: 0
  });
  const [salesOverTimeData, setSalesOverTimeData] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [topSellingFilter, setTopSellingFilter] = useState('Most');
  const [salesTimeframe, setSalesTimeframe] = useState('Monthly');
  const [loading, setLoading] = useState(true);
  const [productScrollIndex, setProductScrollIndex] = useState(0);
  const [inventoryMetrics, setInventoryMetrics] = useState({
    inventoryValue: 0,
    costOfGoodsSold: 0,
    grossProfitMargin: 0,
    totalItems: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [lowStockFilter, setLowStockFilter] = useState('all');
  const [stockInData, setStockInData] = useState([]);
  const [damagedData, setDamagedData] = useState([]);
  const [brandPartnersStats, setBrandPartnersStats] = useState([]);

  useEffect(() => {
    fetchMetrics();
    fetchInventoryMetrics();
    fetchSalesOverTime(salesTimeframe);
    fetchTopSellingProducts(topSellingFilter);
  }, []);

  useEffect(() => {
    fetchSalesOverTime(salesTimeframe);
  }, [salesTimeframe]);

  useEffect(() => {
    fetchTopSellingProducts(topSellingFilter);
  }, [topSellingFilter]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/transactions/dashboard/stats');
      const data = await response.json();
      
      if (data.success) {
        const avgValue = data.data.totalTransactions > 0 
          ? data.data.totalSalesToday / data.data.totalTransactions 
          : 0;
        setMetrics({
          totalSalesToday: data.data.totalSalesToday || 0,
          totalTransactions: data.data.totalTransactions || 0,
          averageTransactionValue: avgValue
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesOverTime = async (timeframe) => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/sales-over-time?timeframe=${timeframe.toLowerCase()}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setSalesOverTimeData(data.data);
      } else {
        setSalesOverTimeData([]);
      }
    } catch (error) {
      console.error('Error fetching sales over time:', error);
      setSalesOverTimeData([]);
    }
  };

  const fetchTopSellingProducts = async (filter) => {
    try {
      const sortParam = filter === 'Most' ? 'most' : 'least';
      const response = await fetch(`http://localhost:5000/api/transactions/top-selling?sort=${sortParam}&limit=10`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Map backend field names to frontend expected names
        const mappedProducts = data.data.map(product => ({
          _id: product.productId,
          name: product.itemName || 'Unknown Product',
          image: product.itemImage || '',
          price: product.totalQuantitySold > 0 ? (product.totalRevenue / product.totalQuantitySold) : 0,
          totalSold: product.totalQuantitySold || 0,
          totalRevenue: product.totalRevenue || 0,
          sku: product.sku || '-',
          category: product.category || '-',
          currentStock: product.currentStock || 0
        }));
        setTopSellingProducts(mappedProducts);
      } else {
        setTopSellingProducts([]);
      }
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      setTopSellingProducts([]);
    }
  };

  const salesData = useMemo(() => {
    if (salesOverTimeData.length === 0) return [];
    return salesOverTimeData.map(item => ({
      period: item.period,
      totalSales: item.totalSales,
      growth: item.growth
    }));
  }, [salesOverTimeData]);

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const visibleProducts = useMemo(() => {
    const itemsPerView = 7;
    return topSellingProducts.slice(productScrollIndex, productScrollIndex + itemsPerView);
  }, [topSellingProducts, productScrollIndex]);

  const canScrollLeft = productScrollIndex > 0;
  const canScrollRight = productScrollIndex + 7 < topSellingProducts.length;

  const scrollProducts = (direction) => {
    if (direction === 'left' && canScrollLeft) {
      setProductScrollIndex(prev => Math.max(0, prev - 1));
    } else if (direction === 'right' && canScrollRight) {
      setProductScrollIndex(prev => prev + 1);
    }
  };

  const fetchInventoryMetrics = async () => {
    try {
      // Fetch products for inventory metrics
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const products = data.data;
        const totalItems = products.length;
        // Use currentStock and reorderNumber fields from product model
        const inStock = products.filter(p => (p.currentStock || 0) > (p.reorderNumber || 10)).length;
        const lowStock = products.filter(p => (p.currentStock || 0) > 0 && (p.currentStock || 0) <= (p.reorderNumber || 10)).length;
        const outOfStock = products.filter(p => (p.currentStock || 0) === 0).length;
        // Use itemPrice field from product model (not sellingPrice)
        const inventoryValue = products.reduce((sum, p) => sum + ((p.itemPrice || 0) * (p.currentStock || 0)), 0);
        const costOfGoodsSold = products.reduce((sum, p) => sum + ((p.costPrice || (p.itemPrice || 0) * 0.6) * (p.currentStock || 0)), 0);
        
        setInventoryMetrics({
          inventoryValue,
          costOfGoodsSold,
          grossProfitMargin: inventoryValue > 0 ? ((inventoryValue - costOfGoodsSold) / inventoryValue * 100).toFixed(0) : 0,
          totalItems,
          inStock,
          lowStock,
          outOfStock
        });

        // Get low stock and out of stock items - use itemName and reorderNumber fields
        const lowStockProducts = products
          .filter(p => (p.currentStock || 0) <= (p.reorderNumber || 10))
          .slice(0, 5)
          .map(p => ({
            name: p.itemName || p.name || 'Unknown',
            stock: p.currentStock || 0,
            reorderLevel: p.reorderNumber || 10,
            status: (p.currentStock || 0) === 0 ? 'Out of Stock' : 'Low Stock'
          }));
        setLowStockItems(lowStockProducts);
      }

      // Fetch stock movements
      const movementsResponse = await fetch('http://localhost:5000/api/stock-movements?limit=50');
      const movementsData = await movementsResponse.json();
      if (movementsData.success && Array.isArray(movementsData.data)) {
        setStockMovements(movementsData.data.slice(0, 5));
        
        // Process stock movements for charts
        const movements = movementsData.data;
        
        // Group by week for Stock-In/Restock chart
        const stockInByWeek = {};
        const damagedByWeek = {};
        
        movements.forEach(m => {
          const date = new Date(m.createdAt);
          const weekNum = Math.ceil((date.getDate()) / 7);
          const weekKey = `Week ${weekNum}`;
          
          if (m.type === 'Stock-In' || m.reason === 'Restock') {
            stockInByWeek[weekKey] = (stockInByWeek[weekKey] || 0) + Math.abs(m.quantity);
          }
          if (m.type === 'Pull-Out' || m.reason === 'Damaged') {
            damagedByWeek[weekKey] = (damagedByWeek[weekKey] || 0) + Math.abs(m.quantity);
          }
        });
        
        setStockInData(Object.entries(stockInByWeek).map(([name, value]) => ({ name, value })).slice(0, 4));
        setDamagedData(Object.entries(damagedByWeek).map(([name, value]) => ({ name, value })).slice(0, 4));
      }

      // Fetch brand partners data from products
      const brandStats = {};
      if (data.success && Array.isArray(data.data)) {
        data.data.forEach(product => {
          const brand = product.brandName || 'Unknown';
          if (!brandStats[brand]) {
            brandStats[brand] = { name: brand, skuCount: 0, sales: 0 };
          }
          brandStats[brand].skuCount += 1;
          // Use itemPrice field
          brandStats[brand].sales += ((product.itemPrice || 0) * (product.totalSold || 0));
        });
        setBrandPartnersStats(Object.values(brandStats).slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching inventory metrics:', error);
    }
  };

  // Use real data for charts or show empty state
  const stockInRestockData = stockInData.length > 0 ? stockInData : [
    { name: 'Week 1', value: 0 },
    { name: 'Week 2', value: 0 },
    { name: 'Week 3', value: 0 },
    { name: 'Week 4', value: 0 }
  ];

  const damagedStocksData = damagedData.length > 0 ? damagedData : [
    { name: 'Week 1', value: 0 },
    { name: 'Week 2', value: 0 },
    { name: 'Week 3', value: 0 },
    { name: 'Week 4', value: 0 }
  ];

  const brandPartnersData = brandPartnersStats.length > 0 ? brandPartnersStats : [
    { name: 'No Data', skuCount: 0, sales: 0 }
  ];

  const filteredLowStockItems = useMemo(() => {
    if (lowStockFilter === 'all') return lowStockItems;
    if (lowStockFilter === 'outOfStock') return lowStockItems.filter(item => item.status === 'Out of Stock');
    if (lowStockFilter === 'lowStock') return lowStockItems.filter(item => item.status === 'Low Stock');
    return lowStockItems;
  }, [lowStockItems, lowStockFilter]);

  return (
    <div className="p-8 min-h-screen" style={{ background: '#F5F5F5' }}>
      <Header 
        pageName="Reports / Analytics"
        profileBackground=""
        showBorder={false}
      />
      
      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-6 mt-6 w-full">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md ${
              activeTab === 'sales'
                ? 'text-[#AD7F65] bg-white border-b-4 border-[#AD7F65]'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}
          >
            Sales Performance
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md ${
              activeTab === 'inventory'
                ? 'text-[#AD7F65] bg-white border-b-4 border-[#AD7F65]'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}
          >
            Inventory & Product
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src={filterIcon} alt="Filter" className="w-5 h-5 opacity-90" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src={printIcon} alt="Print" className="w-5 h-5 object-contain" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src={exportIcon} alt="Export" className="w-5 h-5 object-contain" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Section Title */}
            <h2 className="text-2xl font-bold text-gray-800">Sales Performance Section</h2>
            
            {/* Top Row: KPI Cards + Chart */}
            <div className="flex gap-6">
              {/* Left Column: KPI Cards - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3" style={{ width: '530px' }}>
                {/* Total Sales Today */}
                <div className="bg-white rounded-xl shadow-md px-4 relative overflow-hidden" style={{ height: '150px' }}>
                  <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-xl" style={{ background: 'linear-gradient(to bottom, #60A5FA, #3B82F6, #1D4ED8)' }}></div>
                  <div className="flex items-center justify-between pl-2 h-full">
                    <div>
                      <p className="text-2xl font-bold text-blue-500">
                        {loading ? '...' : formatCurrency(metrics.totalSalesToday)}
                      </p>
                      <p className="text-sm font-bold text-blue-500">Total Sales Today</p>
                      <p className="text-xs text-gray-500">Total revenue from all transactions</p>
                      <p className="text-xs text-green-500">+12% vs last period</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <FaShoppingBag className="text-blue-500 w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Total Transactions */}
                <div className="bg-white rounded-xl shadow-md px-4 relative overflow-hidden" style={{ height: '150px' }}>
                  <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-xl" style={{ background: 'linear-gradient(to bottom, #A78BFA, #8B5CF6, #7C3AED)' }}></div>
                  <div className="flex items-center justify-between pl-2 h-full">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {loading ? '...' : metrics.totalTransactions}
                      </p>
                      <p className="text-sm font-bold text-purple-600">Total Transactions</p>
                      <p className="text-xs text-gray-500">Number of sales made today</p>
                      <p className="text-xs text-green-500">+8% vs last period</p>
                    </div>
                    <div className="bg-purple-100 rounded-full p-3">
                      <FaHandHoldingUsd className="text-purple-600 w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Average Transaction Value */}
                <div className="bg-white rounded-xl shadow-md px-4 relative overflow-hidden" style={{ height: '150px' }}>
                  <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-xl" style={{ background: 'linear-gradient(to bottom, #34D399, #10B981, #059669)' }}></div>
                  <div className="flex items-center justify-between pl-2 h-full">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {loading ? '...' : formatCurrency(metrics.averageTransactionValue)}
                      </p>
                      <p className="text-sm font-bold text-green-600">Average Transaction Value</p>
                      <p className="text-xs text-gray-500">Average amount per transaction</p>
                      <p className="text-xs text-green-500">+5% vs last period</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <FaChartLine className="text-green-600 w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Profit */}
                <div className="bg-white rounded-xl shadow-md px-4 relative overflow-hidden" style={{ height: '150px' }}>
                  <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-xl" style={{ background: 'linear-gradient(to bottom, #FBBF24, #F59E0B, #D97706)' }}></div>
                  <div className="flex items-center justify-between pl-2 h-full">
                    <div>
                      <p className="text-2xl font-bold text-amber-500">
                        {loading ? '...' : formatCurrency(metrics.totalSalesToday * 0.3)}
                      </p>
                      <p className="text-sm font-bold text-amber-500">Profit</p>
                      <p className="text-xs text-gray-500">Estimated profit from sales</p>
                      <p className="text-xs text-green-500">+15% vs last period</p>
                    </div>
                    <div className="bg-amber-100 rounded-full p-3">
                      <FaMoneyBillWave className="text-amber-500 w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sales Chart */}
              <div className="flex-1 bg-white rounded-2xl shadow-md p-4" style={{ height: '311px' }}>
                <div className="flex items-start justify-between mb-10">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Sales Over Time and Growth</h3>
                    <p className="text-xs text-gray-500">Total income and growth from all sales during a specific period.</p>
                    {/* Timeframe Filter */}
                    <div className="mt-2">
                      <select
                        value={salesTimeframe}
                        onChange={(e) => setSalesTimeframe(e.target.value)}
                        className="px-3 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#AD7F65]"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      <span className="text-gray-600">Total Sales</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      <span className="text-gray-600">Growth</span>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[150px]">
                  {salesData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-400">No sales data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#666" />
                        <YAxis 
                          tick={{ fontSize: 11 }} 
                          stroke="#666"
                          tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                          formatter={(value, name) => {
                            return [`₱${value.toLocaleString()}`, name];
                          }}
                        />
                        <Line type="monotone" dataKey="totalSales" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA', r: 4 }} name="Total Sales" />
                        <Line type="monotone" dataKey="growth" stroke="#34D399" strokeWidth={2} dot={{ fill: '#34D399', r: 4 }} name="Growth" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>


            {/* Which Sells the Most Section */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#AD7F65]">Which Sells the Most</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTopSellingFilter('Most')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      topSellingFilter === 'Most'
                        ? 'bg-[#AD7F65] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Most
                  </button>
                  <button
                    onClick={() => setTopSellingFilter('Least')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      topSellingFilter === 'Least'
                        ? 'bg-[#AD7F65] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Least
                  </button>
                </div>
              </div>

              {/* Products Carousel */}
              <div className="relative">
                {/* Left Arrow */}
                {canScrollLeft && (
                  <button
                    onClick={() => scrollProducts('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <FaChevronLeft className="text-gray-600" />
                  </button>
                )}

                {/* Products Grid */}
                <div className="flex gap-4 overflow-hidden px-2">
                  {visibleProducts.length === 0 ? (
                    <div className="w-full py-12 text-center text-gray-400">
                      No product data available
                    </div>
                  ) : (
                    visibleProducts.map((product, index) => (
                      <div
                        key={product._id || index}
                        className="flex-shrink-0 w-[140px]"
                      >
                        {/* Product Image */}
                        <div className="relative w-full h-[140px] rounded-xl overflow-hidden bg-gray-100 mb-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                              <FaShoppingBag className="text-gray-400 w-8 h-8" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex items-start gap-2">
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            productScrollIndex + index < 3 ? 'bg-[#AD7F65]' : 'bg-gray-400'
                          }`}>
                            {productScrollIndex + index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{formatCurrency(product.price || 0)}</p>
                            <p className="text-xs text-[#AD7F65] font-medium">{product.totalSold || 0} Sold</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right Arrow */}
                {canScrollRight && (
                  <button
                    onClick={() => scrollProducts('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#AD7F65] rounded-full shadow-lg flex items-center justify-center hover:bg-[#9a7058] transition-colors"
                  >
                    <FaChevronRight className="text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Section Title */}
            <h2 className="text-2xl font-bold text-gray-800">Inventory & Product</h2>

            {/* Top Row: Inventory Summary + Low Stock Table */}
            <div className="flex gap-4">
              {/* Left: Inventory Summary Card */}
              <div className="bg-white rounded-2xl shadow-md p-5 flex gap-4" style={{ width: '820px', height: '280px' }}>
                {/* Brown Card - Inventory Value */}
                <div className="rounded-xl p-5 text-white flex flex-col justify-center items-center" style={{ background: 'linear-gradient(135deg, rgba(173, 127, 101, 1), rgba(118, 70, 43, 1))', width: '350px', height: '240px' }}>
                  <div className="text-center mb-auto mt-10">
                    <p className="text-3xl font-bold">{formatCurrency(inventoryMetrics.inventoryValue)}</p>
                    <p className="text-l opacity-90">Inventory Value</p>
                  </div>
                  <div className="flex justify-between text-xs w-full mt-auto">
                    <div>
                      <p className="font-bold text-2xl mb-2">{formatCurrency(inventoryMetrics.costOfGoodsSold)}</p>
                      <p className="opacity-75 text-[14px]">Cost of Goods Sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl mb-2 mr-5">{inventoryMetrics.grossProfitMargin}%</p>
                      <p className="opacity-75 text-[14px]">Gross Profit Margin</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {/* Total Items */}
                  <div className="bg-white rounded-xl shadow-sm relative overflow-hidden flex items-center justify-between p-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                    <div className="pl-2">
                      <p className="text-3xl font-bold text-blue-500">{inventoryMetrics.totalItems}</p>
                      <p className="text-sm text-blue-500 font-medium">Total Items</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <FaClipboardList className="text-blue-500 w-6 h-6" />
                    </div>
                  </div>

                  {/* In Stock */}
                  <div className="bg-white rounded-xl shadow-sm relative overflow-hidden flex items-center justify-between p-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>
                    <div className="pl-2">
                      <p className="text-3xl font-bold text-green-500">{inventoryMetrics.inStock}</p>
                      <p className="text-sm text-green-500 font-medium">In Stock</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <FaBox className="text-green-500 w-6 h-6" />
                    </div>
                  </div>

                  {/* Low Stock */}
                  <div className="bg-white rounded-xl shadow-sm relative overflow-hidden flex items-center justify-between p-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
                    <div className="pl-2">
                      <p className="text-3xl font-bold text-amber-500">{inventoryMetrics.lowStock}</p>
                      <p className="text-sm text-amber-500 font-medium">Low Stock</p>
                    </div>
                    <div className="bg-amber-100 rounded-full p-3">
                      <FaExclamationTriangle className="text-amber-500 w-6 h-6" />
                    </div>
                  </div>

                  {/* Out of Stock */}
                  <div className="bg-white rounded-xl shadow-sm relative overflow-hidden flex items-center justify-between p-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600"></div>
                    <div className="pl-2">
                      <p className="text-3xl font-bold text-red-600">{inventoryMetrics.outOfStock}</p>
                      <p className="text-sm text-red-600 font-medium">Out-of-Stock</p>
                    </div>
                    <div className="bg-red-100 rounded-full p-3">
                      <FaTimesCircle className="text-red-600 w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Low & Out-of-Stock Items Table */}
              <div className="bg-white rounded-2xl shadow-md p-5" style={{ height: '280px', width: '725px' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#AD7F65]">Low & Out-of-Stock Items</h3>
                    <p className="text-[10px] text-gray-500">Low and out-of-stock products overview</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLowStockFilter('outOfStock')}
                      className={`px-2 py-1 rounded text-[10px] ${lowStockFilter === 'outOfStock' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Out-of-Stock
                    </button>
                    <button
                      onClick={() => setLowStockFilter('lowStock')}
                      className={`px-2 py-1 rounded text-[10px] ${lowStockFilter === 'lowStock' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Low on Stock
                    </button>
                    <button className="text-[10px] text-[#AD7F65] hover:underline">View More</button>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="text-left py-2 font-medium">Product Name</th>
                      <th className="text-center py-2 font-medium">Stocks</th>
                      <th className="text-center py-2 font-medium">Reorder Level</th>
                      <th className="text-right py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLowStockItems.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-4 text-gray-400">No items found</td></tr>
                    ) : (
                      filteredLowStockItems.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">{item.name}</td>
                          <td className="py-2 text-center text-gray-700">{item.stock}</td>
                          <td className="py-2 text-center text-gray-700">{item.reorderLevel}</td>
                          <td className="py-2 text-right">
                            <span className={`px-2 py-1 rounded text-[10px] ${item.status === 'Out of Stock' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Middle Row: Stock-Ins/Restock + Pull-out Charts */}
            <div className="grid grid-cols-2 gap-4">
              {/* Stock-Ins / Restock Chart */}
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Stock-Ins / Restock</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockInRestockData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#666" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#666" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pull-out of Damaged Stocks Chart */}
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Pull-out of Damaged Stocks</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={damagedStocksData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#666" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#666" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Row: Stock Movements + Brand Partners */}
            <div className="grid grid-cols-2 gap-4">
              {/* Stock Movements Table */}
              <div className="bg-white rounded-2xl shadow-md p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Stock Movements</h3>
                  <button className="text-xs text-[#AD7F65] hover:underline">View More</button>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="text-left py-2 font-medium">Product Name</th>
                      <th className="text-center py-2 font-medium">Date</th>
                      <th className="text-center py-2 font-medium">Reason</th>
                      <th className="text-right py-2 font-medium">Stock-in/Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovements.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-4 text-gray-400">No movements found</td></tr>
                    ) : (
                      stockMovements.map((movement, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">{movement.productId?.name || 'Unknown'}</td>
                          <td className="py-2 text-center text-gray-700">{new Date(movement.createdAt).toLocaleDateString()}</td>
                          <td className="py-2 text-center text-gray-700">{movement.reason || movement.type}</td>
                          <td className="py-2 text-right">
                            <span className={`px-2 py-1 rounded text-[10px] ${movement.quantity > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Different SKUs for Brand Partners Chart */}
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Different SKUs for Brand Partners</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brandPartnersData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#666" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#666" />
                      <Tooltip />
                      <Bar dataKey="skuCount" fill="#10B981" name="SKU Count" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sales" fill="#F59E0B" name="Sales ($)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="w-3 h-3 rounded bg-green-500"></span>
                    <span className="text-gray-600">SKU Count</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="w-3 h-3 rounded bg-amber-500"></span>
                    <span className="text-gray-600">Sales ($)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
