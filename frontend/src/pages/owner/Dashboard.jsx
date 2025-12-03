import { useState, useEffect, useMemo, useContext, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/shared/header';
import { useAuth } from '../../context/AuthContext';
import { SidebarContext } from '../../context/SidebarContext';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  FaShoppingBag, 
  FaHandshake, 
  FaChartLine, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import bgImage from '../../assets/bg.png';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { isExpanded } = useContext(SidebarContext);
  const navigate = useNavigate();
  const userName = currentUser?.name || 'Erika';
  const userRole = 'Owner';
  
  const [dashboardTimeframe, setDashboardTimeframe] = useState('Daily');
  const [isMounted, setIsMounted] = useState(false);
  const salesChartRef = useRef(null);
  const skuChartRef = useRef(null);
  const [salesChartWidth, setSalesChartWidth] = useState(null);
  const [skuChartWidth, setSkuChartWidth] = useState(null);
  const [metrics, setMetrics] = useState({
    totalSalesToday: 0,
    totalTransactions: 0,
    profit: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [rawTransactions, setRawTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const hasFetchedTransactions = useRef(false);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [topSellingFilter, setTopSellingFilter] = useState('Most');
  const [lowStockFilter, setLowStockFilter] = useState('Out-of-Stock');
  const [salesOverTimeData, setSalesOverTimeData] = useState([]);
  const [skuStatsData, setSkuStatsData] = useState([]);
  const timeframeDescriptor = dashboardTimeframe.toLowerCase();

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardStats(dashboardTimeframe);
    fetchTopSellingProducts(topSellingFilter);
    fetchLowStockProducts();
    fetchSalesOverTime(dashboardTimeframe);
    fetchSkuStats();
    if (!hasFetchedTransactions.current) {
      fetchRecentTransactions();
      hasFetchedTransactions.current = true;
    }
  }, []);

  // Refetch top selling products when filter changes
  useEffect(() => {
    fetchTopSellingProducts(topSellingFilter);
  }, [topSellingFilter]);

  // Refetch sales data when timeframe changes
  useEffect(() => {
    fetchSalesOverTime(dashboardTimeframe);
    fetchDashboardStats(dashboardTimeframe);
  }, [dashboardTimeframe]);

  const fetchDashboardStats = async (timeframe = 'Daily') => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/transactions/dashboard/stats?timeframe=${timeframe.toLowerCase()}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics({
          totalSalesToday: data.data.totalSalesToday || 0,
          totalTransactions: data.data.totalTransactions || 0,
          profit: data.data.profit || 0,
          lowStockItems: data.data.lowStockItems || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      setTransactionsLoading(true);
      // Fetch 15 transactions (enough to get 5 after filtering), backend already sorts by date
      const response = await fetch('http://localhost:5000/api/transactions?limit=15');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setRawTransactions(data.data);
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchTopSellingProducts = async (filter = 'Most') => {
    try {
      const sortParam = filter === 'Most' ? 'most' : 'least';
      const response = await fetch(`http://localhost:5000/api/transactions/top-selling?sort=${sortParam}&limit=5`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setTopSellingProducts(data.data);
      } else {
        setTopSellingProducts([]);
      }
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      setTopSellingProducts([]);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Calculate total stock for each product
        const productsWithStock = data.data.map(product => {
          let totalStock = 0;
          if (product.sizes && typeof product.sizes === 'object') {
            totalStock = Object.values(product.sizes).reduce((sum, sizeData) => {
              if (typeof sizeData === 'object' && sizeData !== null && sizeData.quantity !== undefined) {
                return sum + sizeData.quantity;
              }
              return sum + (typeof sizeData === 'number' ? sizeData : 0);
            }, 0);
          } else {
            totalStock = product.currentStock || 0;
          }
          return { ...product, calculatedStock: totalStock };
        });
        
        // Filter low stock (below reorder level) and out of stock items
        const lowStock = productsWithStock.filter(p => {
          const reorderLevel = p.reorderLevel || 10;
          return p.calculatedStock <= reorderLevel;
        }).slice(0, 5);
        
        setLowStockProducts(lowStock);
      }
    } catch (error) {
      console.error('Error fetching low stock products:', error);
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

  const fetchSkuStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/sku-stats');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setSkuStatsData(data.data);
      } else {
        setSkuStatsData([]);
      }
    } catch (error) {
      console.error('Error fetching SKU stats:', error);
      setSkuStatsData([]);
    }
  };

  const formatTransactionDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPaymentMethod = (method) => {
    if (!method) return '-';
    const methods = {
      'cash': 'Cash',
      'gcash': 'GCash',
      'qr': 'QR Pay',
      'card': 'Card'
    };
    return methods[method.toLowerCase()] || method;
  };

  useEffect(() => {
    const measureWidths = () => {
      if (isExpanded) return;
      if (salesChartRef.current) {
        setSalesChartWidth(salesChartRef.current.offsetWidth);
      }
      if (skuChartRef.current) {
        setSkuChartWidth(skuChartRef.current.offsetWidth);
      }
    };

    measureWidths();

    if (isExpanded) {
      return;
    }

    window.addEventListener('resize', measureWidths);
    return () => window.removeEventListener('resize', measureWidths);
  }, [isExpanded]);

  // Memoized recent transactions - filter, sort, and format only when raw data changes
  const recentTransactions = useMemo(() => {
    return rawTransactions
      .filter(t => t.paymentMethod !== 'return' && t.status !== 'Voided')
      .slice(0, 5)
      .map(t => ({
        transactionNumber: t.transactionNumber ? `#${t.transactionNumber}` : '-',
        date: formatTransactionDate(t.checkedOutAt || t.createdAt),
        payment: formatPaymentMethod(t.paymentMethod),
        performedBy: t.performedByName || 'Unknown',
        remarks: t.status || 'Completed',
        transactionId: t.referenceNo || t._id?.substring(0, 6) || '-'
      }));
  }, [rawTransactions]);

  // Sales over time data - use real data from API
  const salesData = useMemo(() => {
    if (salesOverTimeData.length === 0) {
      return [];
    }
    return salesOverTimeData.map(item => ({
      period: item.period,
      totalSales: item.totalSales,
      growth: item.growth
    }));
  }, [salesOverTimeData]);

  // SKU counts per brand - use real data from API
  const brandData = useMemo(() => {
    if (skuStatsData.length === 0) {
      return [];
    }
    return skuStatsData.map(item => ({
      brand: item.brand,
      skuCount: item.skuCount,
      totalStock: item.totalStock
    }));
  }, [skuStatsData]);



  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })}`;
  };

  const salesChart = useMemo(() => (
    isMounted ? (
      salesData.length === 0 ? (
        <div className="w-full h-[227px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-gray-400">No sales data available for this period</div>
        </div>
      ) : (
        <ResponsiveContainer width={salesChartWidth ?? '100%'} height={227}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
              tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e0e0e0',
                borderRadius: '8px'
              }}
              formatter={(value, name) => {
                if (name === 'Total Sales') return [`₱${value.toLocaleString()}`, name];
                return [`₱${value.toLocaleString()}`, name];
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalSales" 
              stroke="#60A5FA" 
              strokeWidth={2}
              dot={{ fill: '#60A5FA', r: 4 }}
              name="Total Sales"
            />
            <Line 
              type="monotone" 
              dataKey="growth" 
              stroke="#34D399" 
              strokeWidth={2}
              dot={{ fill: '#34D399', r: 4 }}
              name="Growth"
            />
          </LineChart>
        </ResponsiveContainer>
      )
    ) : (
      <div className="w-full h-[250px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    )
  ), [isMounted, salesData, salesChartWidth]);

  const skuChart = useMemo(() => (
    isMounted ? (
      brandData.length === 0 ? (
        <div className="w-full h-[260px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-gray-400">No product data available</div>
        </div>
      ) : (
        <ResponsiveContainer width={skuChartWidth ?? '100%'} height={260}>
          <BarChart data={brandData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="brand" 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e0e0e0',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="skuCount" fill="#FB923C" name="SKU Count" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    ) : (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    )
  ), [isMounted, brandData, skuChartWidth]);

  return (
    <div>
      {/* Header Component */}
      <div className="mb-6">
        <Header 
          pageName="Dashboard"
          profileBackground="bg-gray-100"
          showBorder={false}
          userName={userName}
          userRole={userRole}
          showTimeframeFilter={true}
          timeframeValue={dashboardTimeframe}
          onTimeframeChange={setDashboardTimeframe}
        />
      </div>

      {/* Root Container - Full width, no margins */}
      <div className="w-full p-0">
        {/* Main Two-Column Layout: Left (Welcome + KPIs) | Right (Sales Chart) */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-stretch">
          
          {/* Left Column: Welcome Banner + KPI Cards */}
          <div className="space-y-6 flex flex-col">
            {/* Hero / Welcome Section */}
            <section 
              className="relative rounded-2xl overflow-hidden shadow-lg"
              aria-labelledby="welcome-heading"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${bgImage})`,
                }}
                aria-hidden="true"
              />
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to right, rgba(194, 166, 140, 0.85), rgba(118, 70, 43, 0.75))',
                }}
                aria-hidden="true"
              />
              <div className="relative px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
                <h1 
                  id="welcome-heading"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2"
                >
                  Welcome Back, {userName}
                </h1>
                <p className="text-lg sm:text-xl text-white/90">
                  Here's your overview for this {timeframeDescriptor} period.
                </p>
              </div>
            </section>

          {/* Metrics / KPI Cards Row - Four Cards Horizontal */}
          <section 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-2"
          aria-label="Key Performance Indicators"
        >
          {/* Total Sales */}
          <article 
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-4 lg:p-5 text-gray-800 focus-within:ring-2 focus-within:ring-blue-200 focus-within:ring-offset-2 transition-shadow"
            aria-label={`Total Sales (${dashboardTimeframe}): ${formatCurrency(metrics.totalSalesToday)}`}
            tabIndex={0}
          >
            <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-b from-blue-600 to-sky-400" aria-hidden="true" />
            {/* Icon in top-right corner */}
            <div className="absolute translate-y-[-20px] translate-x-[5px] right-4 pt-2">
              <div className="bg-blue-50 rounded-full p-5 shadow-inner">
                <FaShoppingBag className="text-lg lg:text-xl text-blue-500 w-8 h-8" aria-hidden="true" />
              </div>
            </div>
            
            <div className="pt-8">
              <div className="text-xl lg:text-2xl font-bold mb-1 pr-20 text-blue-600" aria-label={formatCurrency(metrics.totalSalesToday)}>
                {loading ? '...' : formatCurrency(metrics.totalSalesToday)}
              </div>
              <div className="text-[10px] lg:text-xs font-semibold mb-0.5 text-gray-700">
                Total Sales ({dashboardTimeframe})
              </div>
              <div className="text-[10px] text-gray-500">
                Total revenue from all transactions this {timeframeDescriptor} period.
              </div>
            </div>
          </article>

          {/* Total Transactions */}
          <article 
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-4 lg:p-5 text-gray-800 focus-within:ring-2 focus-within:ring-purple-200 focus-within:ring-offset-2 transition-shadow"
            aria-label={`Total Transactions (${dashboardTimeframe}): ${metrics.totalTransactions}`}
            tabIndex={0}
          >
            <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-b from-purple-600 to-fuchsia-400" aria-hidden="true" />
            {/* Icon in top-right corner */}
            <div className="absolute translate-y-[-20px] translate-x-[5px] right-4 pt-2">
              <div className="bg-purple-50 rounded-full p-5 shadow-inner">
                <FaHandshake className="text-lg lg:text-xl text-purple-500 w-8 h-8" aria-hidden="true" />
              </div>
            </div>
            
            <div className="pt-8">
              <div className="text-xl lg:text-2xl font-bold mb-1 pr-20 text-purple-600" aria-label={metrics.totalTransactions.toString()}>
                {loading ? '...' : metrics.totalTransactions}
              </div>
              <div className="text-[10px] lg:text-xs font-semibold mb-0.5 text-gray-700">
                Total Transactions ({dashboardTimeframe})
              </div>
              <div className="text-[10px] text-gray-500">
                Number of sales made this {timeframeDescriptor}.
              </div>
            </div>
          </article>

          {/* Profit */}
          <article 
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-4 lg:p-5 text-gray-800 focus-within:ring-2 focus-within:ring-green-200 focus-within:ring-offset-2 transition-shadow"
            aria-label={`Profit (${dashboardTimeframe}): ${formatCurrency(metrics.profit)}`}
            tabIndex={0}
          >
            <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-b from-green-600 to-emerald-400" aria-hidden="true" />
            {/* Icon in top-right corner */}
            <div className="absolute translate-y-[-20px] translate-x-[5px] right-4 pt-2">
              <div className="bg-green-50 rounded-full p-5 shadow-inner">
                <FaChartLine className="text-lg lg:text-xl text-green-600 w-8 h-8" aria-hidden="true" />
              </div>
            </div>

            <div className="pt-8">
              <div className="text-xl lg:text-2xl font-bold mb-1 pr-20 text-green-600" aria-label={formatCurrency(metrics.profit)}>
                {loading ? '...' : formatCurrency(metrics.profit)}
              </div>
              <div className="text-[10px] lg:text-xs font-semibold mb-0.5 text-gray-700">
                Profit ({dashboardTimeframe})
              </div>
              <div className="text-[10px] text-gray-500">
                Total profit from sales this {timeframeDescriptor} (revenue minus cost).
              </div>
            </div>
          </article>

          {/* Low Stock Items */}
          <article 
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-4 lg:p-5 text-gray-800 focus-within:ring-2 focus-within:ring-orange-200 focus-within:ring-offset-2 transition-shadow"
            aria-label={`Low Stock Items: ${metrics.lowStockItems} products below stock threshold`}
            tabIndex={0}
          >
            <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-b from-orange-500 to-orange-400" aria-hidden="true" />
            {/* Icon in top-right corner */}
            <div className="absolute translate-y-[-20px] translate-x-[5px] right-4 pt-2">
              <div className="bg-orange-100 rounded-full p-5 shadow-inner">
                <FaExclamationTriangle className="text-lg lg:text-xl text-orange-500 w-8 h-8" aria-hidden="true" />
              </div>
            </div>
            
            <div className="pt-8">
              <div className="text-xl lg:text-2xl font-bold mb-1 pr-20 text-orange-500" aria-label={metrics.lowStockItems.toString()}>
                {loading ? '...' : metrics.lowStockItems}
              </div>
              <div className="text-[10px] lg:text-xs font-semibold mb-0.5 text-gray-700">
                Low Stock Items
              </div>
              <div className="text-[10px] text-gray-500">
                Number of products below stock threshold.
              </div>
            </div>
          </article>
        </section>
          </div>

          {/* Right Column: Sales Over Time Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 flex flex-col w-full">
            <div className="mb-15">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Sales Over Time and Growth</h2>
              <p className="text-sm text-gray-500">Total income and growth from all sales during a specific period.</p>
            </div>

            {/* Chart Container */}
            <div
              id="sales-chart"
              role="img"
              aria-label="Line chart showing sales over time and growth rate"
              className="w-full max-w-full"
              ref={salesChartRef}
            >
              {salesChart}
            </div>
          </div>
        </section>

        {/* Bottom Section: Additional Charts and Tables */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" aria-label="Additional Analytics">
          {/* Bar Chart: Different SKUs for Brand Partners */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Different SKUs for Brand Partners</h2>
            </div>
            
            {/* Chart Container */}
            <div
              id="skus-chart"
              role="img"
              aria-label="Bar chart showing SKU counts for different brand partners"
              ref={skuChartRef}
            >
              {skuChart}
            </div>
          </div>

       
       {/* Recent Transactions Table */}
       <div className="bg-white rounded-xl shadow-lg p-3 lg:p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-800">Recent Transactions</h2>
            <button 
              className="text-[#AD7F65] text-xs font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:ring-offset-2 rounded px-2 py-0.5"
              onClick={() => navigate('/transactions')}
              aria-label="View all transactions"
            >
              View More
            </button>
          </div>
          <div className="overflow-x-auto">
            <table 
              className="w-full"
              aria-label="Recent transactions table"
            >
              <thead>
                <tr className="bg-linear-to-r from-[#AD7F65] to-[#76462B] text-white">
                  <th className="px-2 lg:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold">Transaction Number</th>
                  <th className="px-2 lg:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold">Date / Time</th>
                  <th className="px-2 lg:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold">Mode of Payment</th>
                  <th className="px-2 lg:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold">Performed By</th>
                  <th className="px-2 lg:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold">Remarks</th>
                  <th className="px-2 lg:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {transactionsLoading && rawTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-xs text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-xs text-gray-400 italic">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((transaction, index) => (
                    <tr 
                      key={index}
                      className="border-b hover:bg-gray-50 transition-colors focus-within:bg-gray-50"
                      tabIndex={0}
                    >
                      <td className="px-2 lg:px-3 py-1.5 text-[10px] sm:text-xs text-gray-700">{transaction.transactionNumber}</td>
                      <td className="px-2 lg:px-3 py-1.5 text-[10px] sm:text-xs text-gray-700">{transaction.date}</td>        
                      <td className="px-2 lg:px-3 py-1.5 text-[10px] sm:text-xs text-gray-700">{transaction.payment}</td>                  
                      <td className="px-2 lg:px-3 py-1.5 text-[10px] sm:text-xs text-gray-700">{transaction.performedBy}</td>                    
                      <td className="px-2 lg:px-3 py-1.5 text-[10px] sm:text-xs">
                        <span 
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            transaction.remarks === 'Completed' 
                              ? 'bg-green-100 text-green-700' 
                              : transaction.remarks === 'Returned' || transaction.remarks === 'Partially Returned'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                          aria-label={`Transaction status: ${transaction.remarks}`}
                        >
                          {transaction.remarks}
                        </span>
                      </td>
                      <td className="px-2 lg:px-3 py-1.5 text-[10px] sm:text-xs text-gray-700">{transaction.transactionId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </section>

        {/* Bottom Section: Top Selling Products and Low Stock Items */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" aria-label="Product Analytics">
          {/* Which Sells the Most */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Which Sells the Most</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTopSellingFilter('Most')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    topSellingFilter === 'Most'
                      ? 'bg-[#AD7F65] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Most
                </button>
                <button
                  onClick={() => setTopSellingFilter('Least')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    topSellingFilter === 'Least'
                      ? 'bg-[#AD7F65] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Least
                </button>
                <button 
                  className="text-[#AD7F65] text-sm font-medium hover:underline ml-2"
                  onClick={() => navigate('/inventory')}
                >
                  View More
                </button>
              </div>
            </div>
            
            {/* Product Cards */}
            <div className="flex gap-4 overflow-x-auto pb-2 pl-2 pt-2">
              {topSellingProducts.length === 0 ? (
                <div className="w-full text-center py-8 text-gray-400">
                  No sales data available
                </div>
              ) : (
                topSellingProducts.map((product, index) => (
                  <div key={product.productId || index} className="flex-shrink-0 w-28">
                    <div className="relative">
                      <div className="w-28 h-28 bg-gray-100 rounded-lg overflow-hidden">
                        {product.itemImage ? (
                          <img 
                            src={product.itemImage} 
                            alt={product.itemName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-[#AD7F65] text-white text-xs font-bold flex items-center justify-center z-10">
                        {index + 1}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-800 truncate">{product.itemName}</p>
                      <p className="text-xs text-gray-500">₱{(product.totalRevenue || 0).toLocaleString()}</p>
                      <p className="text-xs text-[#AD7F65]">{product.totalQuantitySold || 0} Sold</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low & Out-of-Stock Items */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Low & Out-of-Stock Items</h2>
                <p className="text-xs text-gray-500">Low and out-of-stock products overview</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLowStockFilter('Out-of-Stock')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    lowStockFilter === 'Out-of-Stock'
                      ? 'bg-[#AD7F65] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Out-of-Stock
                </button>
                <button
                  onClick={() => setLowStockFilter('Low on Stock')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    lowStockFilter === 'Low on Stock'
                      ? 'bg-[#AD7F65] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Low on Stock
                </button>
                <button 
                  className="text-[#AD7F65] text-sm font-medium hover:underline ml-2"
                  onClick={() => navigate('/inventory')}
                >
                  View More
                </button>
              </div>
            </div>
            
            {/* Stock Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Product Name</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">Stocks</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">Reorder Level</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredProducts = lowStockProducts.filter(product => {
                      if (lowStockFilter === 'Out-of-Stock') {
                        return product.calculatedStock === 0;
                      }
                      return product.calculatedStock > 0 && product.calculatedStock <= (product.reorderLevel || 10);
                    });
                    
                    if (filteredProducts.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                            {lowStockFilter === 'Out-of-Stock' 
                              ? 'No out-of-stock items' 
                              : 'No low stock items'}
                          </td>
                        </tr>
                      );
                    }
                    
                    return filteredProducts.map((product) => {
                      const isOutOfStock = product.calculatedStock === 0;
                      return (
                        <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-700">{product.itemName}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-center">{product.calculatedStock}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-center">{product.reorderLevel || 10}</td>
                          <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-orange-100 text-orange-600'
                              }`}>
                                {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default memo(Dashboard);
