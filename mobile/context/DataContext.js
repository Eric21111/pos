import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { brandPartnerAPI, categoryAPI, productAPI, transactionAPI } from '../services/api';

const DataContext = createContext(null);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export function DataProvider({ children }) {
  // Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const productsLastFetch = useRef(null);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const transactionsLastFetch = useRef(null);

  // Brands state
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const brandsLastFetch = useRef(null);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const categoriesLastFetch = useRef(null);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalSalesToday: 0,
    totalTransactions: 0,
    averageTransactionValue: 0,
    lowStockItems: 0,
  });
  const dashboardLastFetch = useRef(null);

  // Check if cache is valid
  const isCacheValid = (lastFetch) => {
    if (!lastFetch) return false;
    return Date.now() - lastFetch < CACHE_DURATION;
  };

  // Fetch products with caching
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid(productsLastFetch.current) && products.length > 0) {
      return products;
    }

    try {
      setProductsLoading(true);
      const response = await productAPI.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
        productsLastFetch.current = Date.now();
        return response.data;
      }
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return products;
    } finally {
      setProductsLoading(false);
    }
  }, [products]);

  // Fetch transactions with caching
  const fetchTransactions = useCallback(async (forceRefresh = false, params = {}) => {
    if (!forceRefresh && isCacheValid(transactionsLastFetch.current) && transactions.length > 0) {
      return transactions;
    }

    try {
      setTransactionsLoading(true);
      const response = await transactionAPI.getAll({ limit: '1000', ...params });
      if (response.success && response.data) {
        setTransactions(response.data);
        transactionsLastFetch.current = Date.now();
        return response.data;
      }
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return transactions;
    } finally {
      setTransactionsLoading(false);
    }
  }, [transactions]);

  // Fetch brands with caching
  const fetchBrands = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid(brandsLastFetch.current) && brands.length > 0) {
      return brands;
    }

    try {
      setBrandsLoading(true);
      const response = await brandPartnerAPI.getAll();
      if (response.success && response.data) {
        setBrands(response.data);
        brandsLastFetch.current = Date.now();
        return response.data;
      }
      return brands;
    } catch (error) {
      console.error('Error fetching brands:', error);
      return brands;
    } finally {
      setBrandsLoading(false);
    }
  }, [brands]);

  // Fetch categories with caching
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid(categoriesLastFetch.current) && categories.length > 0) {
      return categories;
    }

    try {
      setCategoriesLoading(true);
      const response = await categoryAPI.getAll();
      if (response.success && response.data) {
        setCategories(response.data);
        categoriesLastFetch.current = Date.now();
        return response.data;
      }
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return categories;
    } finally {
      setCategoriesLoading(false);
    }
  }, [categories]);

  // Calculate dashboard stats from cached data
  const calculateDashboardStats = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid(dashboardLastFetch.current)) {
      return dashboardStats;
    }

    try {
      const [txns, prods] = await Promise.all([
        fetchTransactions(forceRefresh),
        fetchProducts(forceRefresh)
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = txns.filter(t => {
        const transactionDate = new Date(t.createdAt || t.date);
        transactionDate.setHours(0, 0, 0, 0);
        return transactionDate.getTime() === today.getTime() &&
          t.status !== 'Voided' &&
          t.paymentMethod !== 'return';
      });

      const totalSalesToday = todayTransactions.reduce((sum, t) => {
        return sum + (t.totalAmount || t.total || 0);
      }, 0);

      const averageTransactionValue = todayTransactions.length > 0
        ? totalSalesToday / todayTransactions.length
        : 0;

      const lowStockItems = prods.filter(p => {
        const stock = p.stock || p.quantity || p.currentStock || 0;
        return stock > 0 && stock < 5;
      }).length;

      const newStats = {
        totalSalesToday,
        totalTransactions: todayTransactions.length,
        averageTransactionValue,
        lowStockItems,
      };

      setDashboardStats(newStats);
      dashboardLastFetch.current = Date.now();
      return newStats;
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      return dashboardStats;
    }
  }, [fetchTransactions, fetchProducts, dashboardStats]);

  // Invalidate specific cache
  const invalidateCache = useCallback((type) => {
    switch (type) {
      case 'products':
        productsLastFetch.current = null;
        break;
      case 'transactions':
        transactionsLastFetch.current = null;
        break;
      case 'brands':
        brandsLastFetch.current = null;
        break;
      case 'categories':
        categoriesLastFetch.current = null;
        break;
      case 'dashboard':
        dashboardLastFetch.current = null;
        break;
      case 'all':
        productsLastFetch.current = null;
        transactionsLastFetch.current = null;
        brandsLastFetch.current = null;
        categoriesLastFetch.current = null;
        dashboardLastFetch.current = null;
        break;
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    invalidateCache('all');
    await Promise.all([
      fetchProducts(true),
      fetchTransactions(true),
      fetchBrands(true),
      fetchCategories(true),
    ]);
  }, [invalidateCache, fetchProducts, fetchTransactions, fetchBrands, fetchCategories]);

  // Memoized context value
  const value = useMemo(() => ({
    // Products
    products,
    productsLoading,
    fetchProducts,
    setProducts,

    // Transactions
    transactions,
    transactionsLoading,
    fetchTransactions,
    setTransactions,

    // Brands
    brands,
    brandsLoading,
    fetchBrands,

    // Categories
    categories,
    categoriesLoading,
    fetchCategories,

    // Dashboard
    dashboardStats,
    calculateDashboardStats,

    // Cache management
    invalidateCache,
    refreshAll,
  }), [
    products, productsLoading, fetchProducts,
    transactions, transactionsLoading, fetchTransactions,
    brands, brandsLoading, fetchBrands,
    categories, categoriesLoading, fetchCategories,
    dashboardStats, calculateDashboardStats,
    invalidateCache, refreshAll
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
