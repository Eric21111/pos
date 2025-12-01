import { useState, useEffect, useMemo, memo, useRef } from 'react';
import Header from '../components/shared/header';
import { FaSearch, FaEye, FaPrint, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataCacheContext';
import StockInIcon from '../assets/logs/Stock in.svg';
import StockOutIcon from '../assets/logs/Stock out.svg';
import PullOutIcon from '../assets/logs/Pull out.svg';

const Logs = () => {
  const { currentUser } = useAuth();
  const { getCachedData, setCachedData, isCacheValid, invalidateCache } = useDataCache();
  const [activeTab, setActiveTab] = useState('stock-movement');
  const [movements, setMovements] = useState(() => getCachedData('stockMovements') || []);
  const [voidLogs, setVoidLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(() => getCachedData('stats') || {
    stockIns: 0,
    stockOuts: 0,
    pullOuts: 0
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  const [filterReason, setFilterReason] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [voidCurrentPage, setVoidCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Makeup', 'Accessories', 'Shoes', 'Head Wear', 'Foods'];
  const types = ['All', 'Stock-In', 'Stock-Out', 'Pull-Out'];
  const reasons = ['All', 'Restock', 'Sold', 'Returned Item', 'Exchange', 'Damaged', 'Lost', 'Expired', 'Other'];
  const dateOptions = ['All', 'Today', 'This Week', 'This Month'];
  const sortOptions = [
    { value: 'date-desc', label: 'Date: Newest First' },
    { value: 'date-asc', label: 'Date: Oldest First' },
    { value: 'name-asc', label: 'Name: A-Z' },
    { value: 'name-desc', label: 'Name: Z-A' },
    { value: 'sku-asc', label: 'SKU: A-Z' },
    { value: 'sku-desc', label: 'SKU: Z-A' }
  ];

  // Only fetch if cache is empty or invalid
  useEffect(() => {
    const cachedMovements = getCachedData('stockMovements');
    const cachedStats = getCachedData('stats');
    
    if (!cachedMovements || !isCacheValid('stockMovements')) {
      fetchMovements();
    } else {
      setMovements(cachedMovements);
    }
    
    if (!cachedStats || !isCacheValid('stats')) {
      fetchStats();
    } else {
      setStats(cachedStats);
    }
  }, []);

  // Fetch void logs when void logs tab is active
  useEffect(() => {
    if (activeTab === 'void-logs') {
      fetchVoidLogs();
    }
  }, [activeTab]);

  // Refetch movements when filters change (but use cache for initial load)
  const isInitialMount = useRef(true);
  useEffect(() => {
    // Skip on initial mount (already handled by first useEffect)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Refetch when filters change (but not when page changes - we'll handle that client-side)
    setCurrentPage(1); // Reset to first page when filters change
    fetchMovements();
  }, [searchQuery, filterCategory, filterType, filterBrand, filterDate, filterReason, sortBy]);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stock-movements/stats/today');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        setCachedData('stats', data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        category: filterCategory,
        type: filterType,
        brand: filterBrand,
        date: filterDate,
        reason: filterReason,
        sortBy: sortBy,
        limit: '1000' // Fetch all movements, paginate client-side
      });

      const response = await fetch(`http://localhost:5000/api/stock-movements?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMovements(data.data || []);
        setCachedData('stockMovements', data.data || []);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoidLogs = async () => {
    try {
      setLoading(true);
      // Fetch voided transactions
      const response = await fetch('http://localhost:5000/api/transactions?status=Voided&limit=1000');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Sort voided transactions by date (most recent first)
        const sortedVoidLogs = data.data.sort((a, b) => {
          const dateA = new Date(a.checkedOutAt || a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.checkedOutAt || b.createdAt || b.updatedAt || 0);
          return dateB - dateA; // Descending order (newest first)
        });
        setVoidLogs(sortedVoidLogs);
      }
    } catch (error) {
      console.error('Error fetching void logs:', error);
      setVoidLogs([]);
    } finally {
      setLoading(false);
    }
  };


  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTypeBadge = (type) => {
    const styles = {
      'Stock-In': 'bg-green-100 text-green-700 border-green-200',
      'Stock-Out': 'bg-red-100 text-red-700 border-red-200',
      'Pull-Out': 'bg-orange-100 text-orange-700 border-orange-200'
    };

    const getIcon = () => {
      switch (type) {
        case 'Stock-In':
          return <img src={StockInIcon} alt="Stock In" className="w-4 h-4" />;
        case 'Stock-Out':
          return <img src={StockOutIcon} alt="Stock Out" className="w-4 h-4" />;
        case 'Pull-Out':
          return <img src={PullOutIcon} alt="Pull Out" className="w-4 h-4" />;
        default:
          return null;
      }
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
        {getIcon()}
        {type}
      </span>
    );
  };

  const getQuantityColor = (type, quantity) => {
    if (type === 'Stock-In') return 'text-green-600';
    if (type === 'Stock-Out') return 'text-red-600';
    if (type === 'Pull-Out') return 'text-orange-600';
    return 'text-gray-600';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleView = (movement) => {
    // You can implement a modal to view details
    console.log('View movement:', movement);
  };

  // Get unique brands from movements
  const uniqueBrands = useMemo(() => {
    const brands = new Set(movements.map(m => m.brandName).filter(Boolean));
    return ['All', ...Array.from(brands).sort()];
  }, [movements]);

  // Filter movements client-side (similar to transaction.jsx)
  const filteredMovements = useMemo(() => {
    let filtered = movements;

    // Filter by category
    if (filterCategory !== 'All') {
      filtered = filtered.filter(m => m.category === filterCategory);
    }

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter(m => m.type === filterType);
    }

    // Filter by brand
    if (filterBrand !== 'All') {
      filtered = filtered.filter(m => m.brandName === filterBrand);
    }

    // Filter by reason
    if (filterReason !== 'All') {
      filtered = filtered.filter(m => m.reason === filterReason);
    }

    // Filter by date
    if (filterDate !== 'All') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today);
      thisWeek.setDate(today.getDate() - 7);
      const thisMonth = new Date(today);
      thisMonth.setMonth(today.getMonth() - 1);

      filtered = filtered.filter(m => {
        const movementDate = new Date(m.createdAt || 0);
        switch (filterDate) {
          case 'Today':
            return movementDate >= today;
          case 'This Week':
            return movementDate >= thisWeek;
          case 'This Month':
            return movementDate >= thisMonth;
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.itemName?.toLowerCase().includes(query) ||
        m.sku?.toLowerCase().includes(query) ||
        m.handledBy?.toLowerCase().includes(query)
      );
    }

    // Sort movements
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'date-asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'name-asc':
          return (a.itemName || '').localeCompare(b.itemName || '');
        case 'name-desc':
          return (b.itemName || '').localeCompare(a.itemName || '');
        case 'sku-asc':
          return (a.sku || '').localeCompare(b.sku || '');
        case 'sku-desc':
          return (b.sku || '').localeCompare(a.sku || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [movements, filterCategory, filterType, filterBrand, filterReason, searchQuery, sortBy]);

  // Paginate movements client-side (similar to transaction.jsx)
  const paginatedMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredMovements.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMovements, currentPage, rowsPerPage]);

  // Paginate void logs client-side (similar to transaction.jsx)
  const paginatedVoidLogs = useMemo(() => {
    const startIndex = (voidCurrentPage - 1) * rowsPerPage;
    return voidLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [voidLogs, voidCurrentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredMovements.length / rowsPerPage) || 1;
  const voidTotalPages = Math.ceil(voidLogs.length / rowsPerPage) || 1;

  return (
    <div className="p-8 min-h-screen">
      <Header pageName={activeTab === 'stock-movement' ? 'Stock Movement Logs' : 'Void Logs'} showBorder={false} />

      {/* Tab Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('stock-movement')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'stock-movement'
              ? 'text-white shadow-md rounded-xl'
              : 'bg-white text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg'
          }`}
          style={
            activeTab === 'stock-movement'
              ? { background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }
              : {}
          }
        >
          Stock Movement
        </button>
        <button
          onClick={() => setActiveTab('void-logs')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'void-logs'
              ? 'text-white shadow-md rounded-xl'
              : 'bg-white text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg'
          }`}
          style={
            activeTab === 'void-logs'
              ? { background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }
              : {}
          }
        >
          Void Logs
        </button>
      </div>

      {/* Stock Movement Content */}
      {activeTab === 'stock-movement' && (
        <>
              {/* Summary Cards */}
          <div className="mb-6">
            <div className="flex gap-4 flex-wrap">
              <div className="bg-white rounded-2xl shadow-md flex items-center justify-between px-5 py-4 relative overflow-hidden" style={{ minWidth: '200px' }}>
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-green-500"></div>
                <div className="ml-2">
                  <div className="text-3xl font-bold text-green-500">{stats.stockIns}</div>
                  <div className="text-xs text-green-400 mt-0.5">Stock-ins Today</div>
                </div>
                <div className="w-20 h-20  rounded-full flex items-center justify-center">
                  <img src={StockInIcon} alt="Stock In" className="w-16 h-16" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md flex items-center justify-between px-5 py-4 relative overflow-hidden" style={{ minWidth: '200px' }}>
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500"></div>
                <div className="ml-2">
                  <div className="text-3xl font-bold text-red-500">{stats.stockOuts}</div>
                  <div className="text-xs text-red-400 mt-0.5">Stock-outs Today</div>
                </div>
                <div className="w-20 h-20  rounded-full flex items-center justify-center">
                  <img src={StockOutIcon} alt="Stock Out" className="w-16 h-16" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md flex items-center justify-between px-5 py-4 relative overflow-hidden" style={{ minWidth: '200px' }}>
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-orange-500"></div>
                <div className="ml-2">
                  <div className="text-3xl font-bold text-orange-500">{stats.pullOuts}</div>
                  <div className="text-xs text-orange-400 mt-0.5">Pull-Outs Today</div>
                </div>
                <div className="w-20 h-20 rounded-full flex items-center justify-center">
                  <img src={PullOutIcon} alt="Pull Out" className="w-16 h-16" />
                </div>
              </div>

              <button 
                onClick={handlePrint}
                className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center px-5 py-4 hover:bg-gray-50 transition-colors" 
                style={{ minWidth: '100px' }}
              >
                <FaPrint className="w-8 h-8 text-gray-700 mb-1" />
                <div className="text-xs font-medium text-gray-700">Print</div>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center shadow-md overflow-hidden rounded-[10px]" style={{ width: '400px' }}>
                <button
                  type="button"
                  className="px-4 py-3 flex items-center justify-center h-10"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(173, 127, 101, 1) 0%,  rgba(118, 70, 43, 1) 100%)'
                  }}
                >
                  <FaSearch className="text-white text-sm" />
                </button>
                
                <input
                  type="text"
                  placeholder="Search for product, SKU, Employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 h-10 bg-white focus:outline-none text-gray-700 placeholder-gray-400 border-0"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] text-sm"
                style={{ minWidth: '140px', maxWidth: '160px' }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>By Category {cat !== 'All' ? `(${cat})` : ''}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] text-sm"
                style={{ minWidth: '130px', maxWidth: '150px' }}
              >
                {types.map(type => (
                  <option key={type} value={type}>By Type {type !== 'All' ? `(${type})` : ''}</option>
                ))}
              </select>

              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] text-sm"
                style={{ minWidth: '130px', maxWidth: '150px' }}
              >
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>By Brand {brand !== 'All' ? `(${brand})` : ''}</option>
                ))}
              </select>

              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] text-sm"
                style={{ minWidth: '130px', maxWidth: '150px' }}
              >
                {dateOptions.map(date => (
                  <option key={date} value={date}>By Date {date !== 'All' ? `(${date})` : ''}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] text-sm"
                style={{ minWidth: '160px', maxWidth: '180px' }}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>Sort By {opt.label}</option>
                ))}
              </select>

              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] text-sm"
                style={{ minWidth: '140px', maxWidth: '160px' }}
              >
                {reasons.map(reason => (
                  <option key={reason} value={reason}>By Reason {reason !== 'All' ? `(${reason})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-1">
                    SKU
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-1">
                    Item Name
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size Breakdown</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Before</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">After</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handled by</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-1">
                    Date & Time
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && movements.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355] mb-2"></div>
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                    No stock movements found
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((movement) => (
                  <tr key={movement._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <img
                        src={movement.itemImage || 'https://via.placeholder.com/50'}
                        alt={movement.itemName}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50';
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{movement.sku}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{movement.itemName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getTypeBadge(movement.type)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${getQuantityColor(movement.type, movement.quantity)}`}>
                      {movement.type === 'Stock-In' ? '+' : '-'}{movement.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {movement.sizeQuantities && typeof movement.sizeQuantities === 'object' ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(movement.sizeQuantities).map(([size, qty]) => (
                            <span 
                              key={size} 
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                movement.type === 'Stock-In' 
                                  ? 'bg-green-100 text-green-700' 
                                  : movement.type === 'Pull-Out'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {size}: {movement.type === 'Stock-In' ? '+' : '-'}{qty}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{movement.stockBefore}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{movement.stockAfter}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{movement.reason}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{movement.handledBy}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDateTime(movement.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleView(movement)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FaEye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Same style as transaction.jsx */}
          {filteredMovements.length > 0 && (
            <div className="flex items-center justify-between mt-5">
              <div className="text-xs text-gray-500">
                Showing {(currentPage - 1) * rowsPerPage + 1}-
                {Math.min(currentPage * rowsPerPage, filteredMovements.length)} of {filteredMovements.length}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 px-3 py-1 shadow-inner">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                <FaChevronLeft />
              </button>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-full text-sm font-semibold ${
                      currentPage === pageNumber
                        ? 'bg-[#AD7F65] text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-gray-400 px-2">...</span>}
              {totalPages > 5 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 rounded-full text-sm font-semibold ${
                    currentPage === totalPages
                      ? 'bg-[#AD7F65] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              )}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-full ${
                  currentPage === totalPages ? 'text-gray-300' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <FaChevronRight />
              </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Void Logs Content */}
      {activeTab === 'void-logs' && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Void Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Void ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voided By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && voidLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355] mb-2"></div>
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : voidLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No void logs found
                    </td>
                  </tr>
                ) : (
                  paginatedVoidLogs.map((log, index) => {
                    const voidNumber = voidLogs.length - (voidCurrentPage - 1) * rowsPerPage - index; // Most recent void gets highest number
                    return (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                        #{voidNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                        {log.voidId || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDateTime(log.checkedOutAt || log.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.items && log.items.length > 0 ? (
                          <div className="space-y-3">
                            {log.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                <div className="shrink-0">
                                  {item.itemImage ? (
                                    <img 
                                      src={item.itemImage} 
                                      alt={item.itemName} 
                                      className="w-12 h-12 object-cover rounded"
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/50';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                      <span className="text-xs">No Image</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {item.itemName}
                                    {item.variant && <span className="text-gray-500"> ({item.variant})</span>}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.sku} {item.selectedSize && `• Size: ${item.selectedSize}`} • Qty: {item.quantity}
                                  </div>
                                  {item.voidReason && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                        Reason: {item.voidReason}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₱{parseFloat(log.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {log.voidedByName || log.performedByName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleView(log)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <FaEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination for Void Logs - Same style as transaction.jsx */}
          {voidLogs.length > 0 && (
            <div className="flex items-center justify-between mt-5">
              <div className="text-xs text-gray-500">
                Showing {(voidCurrentPage - 1) * rowsPerPage + 1}-
                {Math.min(voidCurrentPage * rowsPerPage, voidLogs.length)} of {voidLogs.length}
              </div>
              {voidTotalPages > 1 && (
                <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 px-3 py-1 shadow-inner">
                  <button
                    onClick={() => setVoidCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={voidCurrentPage === 1}
                    className={`p-2 rounded-full ${voidCurrentPage === 1 ? 'text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    <FaChevronLeft />
                  </button>
                  {Array.from({ length: voidTotalPages }).slice(0, 5).map((_, idx) => {
                    const pageNumber = idx + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setVoidCurrentPage(pageNumber)}
                        className={`w-8 h-8 rounded-full text-sm font-semibold ${
                          voidCurrentPage === pageNumber
                            ? 'bg-[#AD7F65] text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  {voidTotalPages > 5 && <span className="text-gray-400 px-2">...</span>}
                  {voidTotalPages > 5 && (
                    <button
                      onClick={() => setVoidCurrentPage(voidTotalPages)}
                      className={`w-8 h-8 rounded-full text-sm font-semibold ${
                        voidCurrentPage === voidTotalPages
                          ? 'bg-[#AD7F65] text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {voidTotalPages}
                    </button>
                  )}
                  <button
                    onClick={() => setVoidCurrentPage((prev) => Math.min(voidTotalPages, prev + 1))}
                    disabled={voidCurrentPage === voidTotalPages}
                    className={`p-2 rounded-full ${
                      voidCurrentPage === voidTotalPages ? 'text-gray-300' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(Logs);

