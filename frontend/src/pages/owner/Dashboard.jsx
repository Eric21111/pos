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
  
  const [salesTimeframe, setSalesTimeframe] = useState('Daily');
  const [skusTimeframe, setSkusTimeframe] = useState('Daily');
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

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/transactions/dashboard/stats');
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
      // Keep default values on error
    } finally {
      setLoading(false);
    }
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

  // Sales over time data
  const salesData = useMemo(() => ([
    { month: 'January', totalSales: 12000, growthRate: 5 },
    { month: 'February', totalSales: 15000, growthRate: 8 },
    { month: 'March', totalSales: 18000, growthRate: 12 },
    { month: 'April', totalSales: 14000, growthRate: -5 },
    { month: 'May', totalSales: 22000, growthRate: 15 },
    { month: 'June', totalSales: 25000, growthRate: 18 },
    { month: 'July', totalSales: 28000, growthRate: 20 },
    { month: 'August', totalSales: 24000, growthRate: -3 },
    { month: 'September', totalSales: 30000, growthRate: 25 },
    { month: 'October', totalSales: 32000, growthRate: 28 }
  ]), []);

  // Brand partners data - SKU counts per brand
  const brandData = useMemo(() => ([
    { brand: 'Brand A', skuCount: 45, sales: 13000 },
    { brand: 'Brand B', skuCount: 38, sales: 11000 },
    { brand: 'Brand C', skuCount: 32, sales: 8000 },
    { brand: 'Brand D', skuCount: 40, sales: 9500 }
  ]), []);

  // Recent transactions
  const recentTransactions = useMemo(() => ([
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'Cash', performedBy: 'Employee -Stef', remarks: 'Paid', refNo: '0005007439-1' },
    { id: 'TRX-002', date: 'Oct 4, 2025', payment: 'QR Pay', performedBy: 'Employee -Maria', remarks: 'Paid', refNo: '0005007439-2' },
    { id: 'TRX-003', date: 'Oct 4, 2025', payment: 'Cash', performedBy: 'Owner - Erika', remarks: 'Paid', refNo: '0005007439-3' },
    { id: 'TRX-004', date: 'Oct 4, 2025', payment: 'Cash', performedBy: 'Employee -Jade', remarks: 'Paid', refNo: '0005007439-4' },
    { id: 'TRX-005', date: 'Oct 4, 2025', payment: 'QR Pay', performedBy: 'Employee -Stef', remarks: 'Paid', refNo: '0005007439-5' }
  ]), []);

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })}`;
  };

  const salesChart = useMemo(() => (
    isMounted ? (
      <ResponsiveContainer width={salesChartWidth ?? '100%'} height={227}>
        <LineChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e0e0e0',
              borderRadius: '8px'
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
            dataKey="growthRate" 
            stroke="#34D399" 
            strokeWidth={2}
            dot={{ fill: '#34D399', r: 4 }}
            name="Growth Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="w-full h-[250px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    )
  ), [isMounted, salesData, salesChartWidth]);

  const skuChart = useMemo(() => (
    isMounted ? (
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
            domain={[0, 50]}
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
                  Welcome Back, Miss {userName}
                </h1>
                <p className="text-lg sm:text-xl text-white/90">
                  Here's your overview for today.
                </p>
              </div>
            </section>

          {/* Metrics / KPI Cards Row - Four Cards Horizontal */}
          <section 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-2"
          aria-label="Key Performance Indicators"
        >
          {/* Total Sales Today */}
          <article 
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-4 lg:p-5 text-gray-800 focus-within:ring-2 focus-within:ring-blue-200 focus-within:ring-offset-2 transition-shadow"
            aria-label={`Total Sales Today: ${formatCurrency(metrics.totalSalesToday)}`}
            tabIndex={0}
          >
            <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-b from-blue-600 to-sky-400" aria-hidden="true" />
            {/* Icon in top-right corner */}
            <div className="absolute translate-y-[-10px] translate-x-[-10px] right-4 pt-2">
              <div className="bg-blue-50 rounded-full p-5 shadow-inner">
                <FaShoppingBag className="text-lg lg:text-xl text-blue-500 w-8 h-8" aria-hidden="true" />
              </div>
            </div>
            
            <div className="pt-8">
              <div className="text-2xl lg:text-3xl font-bold mb-1 pr-20 text-blue-600" aria-label={formatCurrency(metrics.totalSalesToday)}>
                {loading ? '...' : formatCurrency(metrics.totalSalesToday)}
              </div>
              <div className="text-xs lg:text-sm font-semibold mb-0.5 text-gray-700">
                Total Sales Today
              </div>
              <div className="text-xs text-gray-500">
                Total revenue from all transactions today.
              </div>
            </div>
          </article>

          {/* Total Transactions */}
          <article 
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-4 lg:p-5 text-gray-800 focus-within:ring-2 focus-within:ring-purple-200 focus-within:ring-offset-2 transition-shadow"
            aria-label={`Total Transactions: ${metrics.totalTransactions}`}
            tabIndex={0}
          >
            <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-b from-purple-600 to-fuchsia-400" aria-hidden="true" />
            {/* Icon in top-right corner */}
            <div className="absolute translate-y-[-10px] translate-x-[-10px] right-4 pt-2">
              <div className="bg-purple-50 rounded-full p-5 shadow-inner">
                <FaHandshake className="text-lg lg:text-xl text-purple-500 w-8 h-8" aria-hidden="true" />
              </div>
            </div>
            
            <div className="pt-8">
              <div className="text-2xl lg:text-3xl font-bold mb-1 pr-20 text-purple-600" aria-label={metrics.totalTransactions.toString()}>
                {loading ? '...' : metrics.totalTransactions}
              </div>
              <div className="text-xs lg:text-sm font-semibold mb-0.5 text-gray-700">
                Total Transactions
              </div>
              <div className="text-xs text-gray-500">
                Number of sales made today.
              </div>
            </div>
          </article>

          {/* Profit */}
          <article 
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-4 lg:p-5 text-gray-800 focus-within:ring-2 focus-within:ring-green-200 focus-within:ring-offset-2 transition-shadow"
            aria-label={`Profit: ${formatCurrency(metrics.profit)}`}
            tabIndex={0}
          >
            <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-b from-green-600 to-emerald-400" aria-hidden="true" />
            {/* Icon in top-right corner */}
            <div className="absolute translate-y-[-10px] translate-x-[-10px] right-4 pt-2">
              <div className="bg-green-50 rounded-full p-5 shadow-inner">
                <FaChartLine className="text-lg lg:text-xl text-green-600 w-8 h-8" aria-hidden="true" />
              </div>
            </div>

            <div className="pt-8">
              <div className="text-2xl lg:text-3xl font-bold mb-1 pr-20 text-green-600" aria-label={formatCurrency(metrics.profit)}>
                {loading ? '...' : formatCurrency(metrics.profit)}
              </div>
              <div className="text-xs lg:text-sm font-semibold mb-0.5 text-gray-700">
                Profit
              </div>
              <div className="text-xs text-gray-500">
                Total profit from sales today (revenue minus cost).
              </div>
            </div>
          </article>

          {/* Low Stock Items */}
          <article 
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-4 lg:p-5 text-gray-800 focus-within:ring-2 focus-within:ring-rose-200 focus-within:ring-offset-2 transition-shadow"
            aria-label={`Low Stock Items: ${metrics.lowStockItems} products below stock threshold`}
            tabIndex={0}
          >
            <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-b from-rose-600 to-red-400" aria-hidden="true" />
            {/* Icon in top-right corner */}
            <div className="absolute translate-y-[-10px] translate-x-[-10px] right-4 pt-2">
              <div className="bg-rose-50 rounded-full p-5 shadow-inner">
                <FaExclamationTriangle className="text-lg lg:text-xl text-rose-600 w-8 h-8" aria-hidden="true" />
              </div>
            </div>
            
            <div className="pt-8">
              <div className="text-2xl lg:text-3xl font-bold mb-1 pr-20 text-rose-600" aria-label={metrics.lowStockItems.toString()}>
                {loading ? '...' : metrics.lowStockItems}
              </div>
              <div className="text-xs lg:text-sm font-semibold mb-0.5 text-gray-700">
                Low Stock Items
              </div>
              <div className="text-xs text-gray-500">
                Number of products below stock threshold.
              </div>
            </div>
          </article>
        </section>
          </div>

          {/* Right Column: Sales Over Time Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 flex flex-col w-full">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Sales Over Time and Growth</h2>
              <p className="text-sm text-gray-500">Total income and growth from all sales during a specific period.</p>
            </div>
            
            {/* Timeframe Filter Buttons */}
            <div 
              className="flex gap-2 mb-4 justify-end"
              role="tablist"
              aria-label="Time period filter"
            >
              <button
                onClick={() => setSalesTimeframe('Daily')}
                role="tab"
                aria-selected={salesTimeframe === 'Daily'}
                aria-controls="sales-chart"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:ring-offset-2 ${
                  salesTimeframe === 'Daily'
                    ? 'bg-[#AD7F65] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSalesTimeframe('Weekly')}
                role="tab"
                aria-selected={salesTimeframe === 'Weekly'}
                aria-controls="sales-chart"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:ring-offset-2 ${
                  salesTimeframe === 'Weekly'
                    ? 'bg-[#AD7F65] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSalesTimeframe('Monthly')}
                role="tab"
                aria-selected={salesTimeframe === 'Monthly'}
                aria-controls="sales-chart"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:ring-offset-2 ${
                  salesTimeframe === 'Monthly'
                    ? 'bg-[#AD7F65] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Chart Container - Reduced size */}
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
            
            {/* Timeframe Filter Buttons */}
            <div 
              className="flex gap-2 mb-4"
              role="tablist"
              aria-label="Time period filter"
            >
              <button
                onClick={() => setSkusTimeframe('Daily')}
                role="tab"
                aria-selected={skusTimeframe === 'Daily'}
                aria-controls="skus-chart"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:ring-offset-2 ${
                  skusTimeframe === 'Daily'
                    ? 'bg-[#AD7F65] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSkusTimeframe('Weekly')}
                role="tab"
                aria-selected={skusTimeframe === 'Weekly'}
                aria-controls="skus-chart"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:ring-offset-2 ${
                  skusTimeframe === 'Weekly'
                    ? 'bg-[#AD7F65] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSkusTimeframe('Monthly')}
                role="tab"
                aria-selected={skusTimeframe === 'Monthly'}
                aria-controls="skus-chart"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:ring-offset-2 ${
                  skusTimeframe === 'Monthly'
                    ? 'bg-[#AD7F65] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
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
       <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
            <button 
              className="text-[#AD7F65] text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:ring-offset-2 rounded px-2 py-1"
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
                  <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Transaction ID</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Date / Time</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Mode of Payment</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Performed By</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Remarks</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Reference No.</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction, index) => (
                  <tr 
                    key={index}
                    className="border-b hover:bg-gray-50 transition-colors focus-within:bg-gray-50"
                    tabIndex={0}
                  >
 
                    <td className="px-3 lg:px-4 py-2 text-xs sm:text-sm text-gray-700">{transaction.id}</td>
                    <td className="px-3 lg:px-4 py-2 text-xs sm:text-sm text-gray-700">{transaction.date}</td>        
                    <td className="px-3 lg:px-4 py-2 text-xs sm:text-sm text-gray-700">{transaction.payment}</td>                  
                    <td className="px-3 lg:px-4 py-2 text-xs sm:text-sm text-gray-700">{transaction.performedBy}</td>                    
                    <td className="px-3 lg:px-4 py-2 text-xs sm:text-sm">
                      <span 
                        className={`px-2 py-1 rounded ${
                          transaction.remarks === 'Paid' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}
                        aria-label={`Transaction status: ${transaction.remarks}`}
                      >
                        {transaction.remarks}
                      </span>
                    </td>
                   
                    <td className="px-3 lg:px-4 py-2 text-xs sm:text-sm text-gray-700">{transaction.refNo}</td>
                  </tr>
                ))}
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
