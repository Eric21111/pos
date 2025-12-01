import React, { useEffect, useMemo, useState, memo, useCallback, useRef } from 'react';
import Header from '../components/shared/header';
import {
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaChevronDown,
  FaEye,
  FaPrint,
  FaMoneyBillWave,
  FaCheckCircle,
  FaUndoAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataCache } from '../context/DataCacheContext';
import ViewTransactionModal from '../components/transaction/ViewTransactionModal';
import PrintReceiptModal from '../components/transaction/PrintReceiptModal';
import ReturnItemsModal from '../components/transaction/ReturnItemsModal';

const STATUS_STYLES = {
  Completed: 'bg-green-100 text-green-700 border border-green-200',
  Returned: 'bg-orange-100 text-orange-700 border border-orange-200',
  'Partially Returned': 'bg-amber-100 text-amber-700 border border-amber-200',
  Voided: 'bg-red-100 text-red-600 border border-red-200'
};

const paymentOptions = ['All', 'cash', 'gcash', 'void'];
const statusOptions = ['All', 'Completed', 'Returned', 'Partially Returned']; // Removed 'Voided' - voided transactions are shown in void logs
const userOptions = ['All'];
const dateOptions = ['All', 'Today', 'Last 7 days', 'Last 30 days'];

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(value);

// Transaction numbers are now stored in the database and immutable
// This function is no longer needed but kept for backward compatibility
const generateTransactionNumber = (transaction) => {
  if (!transaction) return '---';
  // Use stored transactionNumber if available
  if (transaction.transactionNumber) {
    return transaction.transactionNumber.toString();
  }
  return '---';
};

const statusIcon = {
  Completed: <FaCheckCircle className="text-green-500" />,
  Returned: <FaUndoAlt className="text-orange-500" />,
  'Partially Returned': <FaUndoAlt className="text-amber-500" />,
  Voided: <FaExclamationTriangle className="text-red-500" />
};

const Dropdown = ({
  label,
  options,
  selected,
  onSelect,
  isOpen,
  setIsOpen
}) => {
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isOpen ? 'border-[#AD7F65] shadow-lg bg-white' : 'border-gray-200 bg-white hover:border-[#AD7F65]'
          }`}
      >
        <span className="text-sm font-medium text-gray-700">{selected}</span>
        <FaChevronDown
          className={`text-xs text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-20 mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <li
                key={option}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${option === selected ? 'bg-[#F6EEE7] text-[#76462B] font-semibold' : 'hover:bg-gray-50'
                  }`}
              >
                {option}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

const Transaction = () => {
  const { getCachedData, setCachedData, isCacheValid, invalidateCache } = useDataCache();
  // Initialize transactions state - use empty array initially to avoid hook issues
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTransactionNumber, setSelectedTransactionNumber] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState({
    date: false,
    method: false,
    status: false,
    user: false
  });
  const [filters, setFilters] = useState({
    date: 'All',
    method: 'All',
    status: 'All',
    user: 'All'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [transactionToView, setTransactionToView] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [transactionToPrint, setTransactionToPrint] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [transactionToReturn, setTransactionToReturn] = useState(null);
  const rowsPerPage = 8;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const isInitialMount = useRef(true);
  const hasLoaded = useRef(false);
  const isInitialLoading = useRef(true);
  const setCachedDataRef = useRef(setCachedData);

  // Keep ref updated
  useEffect(() => {
    setCachedDataRef.current = setCachedData;
  }, [setCachedData]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filters.method !== 'All') params.append('paymentMethod', filters.method);
      if (filters.status !== 'All') params.append('status', filters.status);
      if (filters.user !== 'All') params.append('userId', filters.user);

      // Add limit to prevent loading too much data
      params.append('limit', '500');
      const qs = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`http://localhost:5000/api/transactions${qs}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const allTransactions = data.data;

        // Separate return transactions and voided transactions from regular transactions
        const returnTransactions = allTransactions.filter(t =>
          t.paymentMethod === 'return' && t.originalTransactionId
        );
        // Filter out voided transactions - they should only appear in void logs
        const regularTransactions = allTransactions.filter(t =>
          (t.paymentMethod !== 'return' || !t.originalTransactionId) &&
          t.status !== 'Voided'
        );

        // Group return transactions by original transaction ID
        const returnTransactionsMap = new Map();
        returnTransactions.forEach(returnTrx => {
          const originalId = returnTrx.originalTransactionId?.toString();
          if (originalId) {
            if (!returnTransactionsMap.has(originalId)) {
              returnTransactionsMap.set(originalId, []);
            }
            returnTransactionsMap.get(originalId).push(returnTrx);
          }
        });

        // Attach return transactions to their original transactions
        const transactionsWithReturns = regularTransactions.map(trx => ({
          ...trx,
          returnTransactions: returnTransactionsMap.get(trx._id?.toString()) || []
        }));

        // Sort by date and time (most recent first)
        // Use checkedOutAt if available, otherwise use createdAt or updatedAt
        transactionsWithReturns.sort((a, b) => {
          const dateA = new Date(a.checkedOutAt || a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.checkedOutAt || b.createdAt || b.updatedAt || 0);
          return dateB - dateA; // Descending order (newest first)
        });

        const payload = transactionsWithReturns.length ? transactionsWithReturns : [];
        setTransactions(payload);
        setCachedDataRef.current('transactions', payload);
        if (payload.length > 0) {
          setSelectedTransaction(payload[0]);
          setSelectedTransactionNumber(payload[0].transactionNumber || null);
        }
      } else {
        setTransactions([]);
        setCachedDataRef.current('transactions', []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
      setCachedDataRef.current('transactions', []);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.method, filters.status, filters.user]);

  // Initial load - check cache first (only once)
  useEffect(() => {
    if (hasLoaded.current) return;

    hasLoaded.current = true;

    const loadInitialData = async () => {
      try {
        const cachedTransactions = getCachedData('transactions');
        if (cachedTransactions && isCacheValid('transactions') && cachedTransactions.length > 0) {
          // Ensure cached transactions are sorted by date/time (most recent first)
          const sortedCached = [...cachedTransactions].sort((a, b) => {
            const dateA = new Date(a.checkedOutAt || a.createdAt || a.updatedAt || 0);
            const dateB = new Date(b.checkedOutAt || b.createdAt || b.updatedAt || 0);
            return dateB - dateA; // Descending order (newest first)
          });
          setTransactions(sortedCached);
          if (sortedCached.length > 0) {
            setSelectedTransaction(sortedCached[0]);
            setSelectedTransactionNumber(sortedCached[0].transactionNumber || null);
          }
          isInitialMount.current = false;
          isInitialLoading.current = false;
        } else {
          await fetchTransactions();
          isInitialMount.current = false;
          isInitialLoading.current = false;
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
        // Fallback: try to fetch anyway
        try {
          await fetchTransactions();
        } catch (fetchError) {
          console.error('Failed to fetch transactions:', fetchError);
          // Set empty state to prevent white screen
          setTransactions([]);
          setLoading(false);
        }
        isInitialMount.current = false;
        isInitialLoading.current = false;
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch only when filters change (not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }
    fetchTransactions();
  }, [debouncedSearch, filters.method, filters.status, filters.user, fetchTransactions]);

  const generateSampleTransactions = () => [];

  // Get all regular transactions (excluding returns) for numbering reference
  const allRegularTransactions = useMemo(() => {
    return transactions.filter((trx) =>
      !(trx.paymentMethod === 'return' && trx.originalTransactionId)
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    // Filter out return transactions and voided transactions from the main list
    // Voided transactions should only appear in void logs, not in transactions page
    const filtered = transactions.filter((trx) => {
      // Skip return transactions in the main list
      if (trx.paymentMethod === 'return' && trx.originalTransactionId) {
        return false;
      }

      // Skip voided transactions - they should only appear in void logs
      if (trx.status === 'Voided') {
        return false;
      }

      const matchesSearch =
        !search ||
        trx.referenceNo?.toLowerCase().includes(search.toLowerCase()) ||
        trx.performedByName?.toLowerCase().includes(search.toLowerCase());

      const matchesMethod =
        filters.method === 'All' || trx.paymentMethod?.toLowerCase() === filters.method.toLowerCase();

      const matchesStatus = filters.status === 'All' || trx.status === filters.status;

      const matchesUser = filters.user === 'All' || trx.performedByName === filters.user;

      return matchesSearch && matchesMethod && matchesStatus && matchesUser;
    });

    // Sort by date and time (most recent first) after filtering
    // Use checkedOutAt if available, otherwise use createdAt or updatedAt
    return filtered.sort((a, b) => {
      const dateA = new Date(a.checkedOutAt || a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.checkedOutAt || b.createdAt || b.updatedAt || 0);
      return dateB - dateA; // Descending order (newest first)
    });
  }, [transactions, search, filters]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredTransactions, currentPage]);

  const stats = useMemo(() => {
    // Exclude voided transactions from stats - they're shown in void logs
    const nonVoidedTransactions = transactions.filter(trx => trx.status !== 'Voided');
    const totals = {
      total: nonVoidedTransactions.length,
      Completed: 0,
      Returned: 0,
      'Partially Returned': 0,
      Voided: 0 // Voided count is 0 since we don't show them here
    };

    nonVoidedTransactions.forEach((trx) => {
      totals[trx.status] = (totals[trx.status] || 0) + 1;
    });

    return totals;
  }, [transactions]);

  // Memoize user options to avoid conditional hook usage
  const userDropdownOptions = useMemo(() => [
    ...userOptions,
    ...new Set(transactions.map((t) => t.performedById || t.performedByName).filter(Boolean))
  ], [transactions]);

  const handleRowClick = (trx) => {
    setSelectedTransaction(trx);
    setSelectedTransactionNumber(trx.transactionNumber || null);
  };

  const renderStatusPill = (status = 'Completed') => (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-transform ${STATUS_STYLES[status]}`}
    >
      {statusIcon[status]}
      {status}
    </span>
  );


  const isTransactionReturnable = (transaction) => {
    if (!transaction || !transaction.checkedOutAt) return false;
    const transactionDate = new Date(transaction.checkedOutAt);
    const now = new Date();
    const diffTime = Math.abs(now - transactionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 2; // Less than 2 days old
  };

  const handleViewClick = (transaction) => {
    setTransactionToView(transaction);
    setShowViewModal(true);
  };

  const handlePrintClick = (transaction) => {
    setTransactionToPrint(transaction);
    setShowPrintModal(true);
  };

  const handleReturnClick = (transaction) => {
    if (!isTransactionReturnable(transaction)) {
      alert('This transaction is more than 2 days old and cannot be returned.');
      return;
    }
    if (transaction.status === 'Returned' || transaction.status === 'Voided') {
      alert('This transaction has already been returned or voided.');
      return;
    }
    setTransactionToReturn(transaction);
    setShowReturnModal(true);
  };

  const handleReturnConfirm = async (itemsToReturn, transaction) => {
    try {
      setLoading(true);

      // Get indices of returned items in original transaction
      const returnedIndices = itemsToReturn.map(item => item.originalIndex);

      // Separate items by reason
      const damagedItems = itemsToReturn.filter(item =>
        item.reason === 'Damaged' || item.reason === 'Defective'
      );
      const returnableItems = itemsToReturn.filter(item =>
        item.reason !== 'Damaged' && item.reason !== 'Defective'
      );

      // Process damaged items - archive them (DO NOT pull from inventory)
      if (damagedItems.length > 0) {
        for (const item of damagedItems) {
          // Get product details for archiving
          let productDetails = null;
          try {
            const productResponse = await fetch(`http://localhost:5000/api/products/${item.productId}`);
            const productData = await productResponse.json();
            if (productData.success) {
              productDetails = productData.data;
            }
          } catch (error) {
            console.warn('Failed to fetch product details for archiving:', error);
          }

          // Create return transaction for damaged item
          const damagedReturnTransaction = {
            userId: transaction.userId,
            items: [{
              productId: item.productId,
              itemName: item.itemName,
              sku: item.sku,
              variant: item.variant,
              selectedSize: item.selectedSize,
              quantity: item.quantity,
              price: item.price,
              returnReason: item.reason
            }],
            paymentMethod: 'return',
            amountReceived: 0,
            changeGiven: 0,
            referenceNo: `RET-${transaction.referenceNo || transaction._id?.substring(0, 12)}-${Date.now()}-${damagedItems.indexOf(item)}`,
            receiptNo: null,
            totalAmount: item.quantity * item.price,
            performedById: transaction.performedById,
            performedByName: transaction.performedByName,
            status: 'Returned',
            originalTransactionId: transaction._id,
            checkedOutAt: new Date()
          };

          const returnTrxResponse = await fetch('http://localhost:5000/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(damagedReturnTransaction)
          });
          const returnTrxData = await returnTrxResponse.json();

          // Archive the damaged item (NO inventory pull-out, just archive)
          if (returnTrxData.success && returnTrxData.data) {
            await fetch('http://localhost:5000/api/archive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: item.productId,
                itemName: item.itemName,
                sku: item.sku,
                variant: item.variant || '',
                selectedSize: item.selectedSize || '',
                category: productDetails?.category || 'Foods',
                brandName: productDetails?.brandName || '',
                itemPrice: item.price,
                costPrice: productDetails?.costPrice || 0,
                quantity: item.quantity,
                itemImage: productDetails?.itemImage || '',
                reason: item.reason === 'Damaged' ? 'Damaged' : 'Defective',
                returnReason: item.reason,
                originalTransactionId: transaction._id,
                returnTransactionId: returnTrxData.data._id,
                archivedBy: transaction.performedByName || 'System',
                archivedById: transaction.performedById || '',
                notes: `Returned due to: ${item.reason}`
              })
            });
          }
        }
      }

      // Process returnable items - restore stock and create return transactions
      if (returnableItems.length > 0) {
        // Restore stock for all returnable items
        await fetch('http://localhost:5000/api/products/update-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: returnableItems.map(item => ({
              _id: item.productId,
              sku: item.sku,
              size: item.selectedSize,
              quantity: item.quantity
            })),
            performedByName: transaction.performedByName || 'System',
            performedById: transaction.performedById || '',
            reason: 'Returned Item',
            type: 'Stock-In' // Return items go back to inventory
          })
        });

        // Create a separate return transaction for each returned item
        for (const item of returnableItems) {
          const returnTransaction = {
            userId: transaction.userId,
            items: [{
              productId: item.productId,
              itemName: item.itemName,
              sku: item.sku,
              variant: item.variant,
              selectedSize: item.selectedSize,
              quantity: item.quantity,
              price: item.price,
              returnReason: item.reason
            }],
            paymentMethod: 'return',
            amountReceived: 0,
            changeGiven: 0,
            referenceNo: `RET-${transaction.referenceNo || transaction._id?.substring(0, 12)}-${Date.now()}-${returnableItems.indexOf(item)}`,
            receiptNo: null,
            totalAmount: item.quantity * item.price,
            performedById: transaction.performedById,
            performedByName: transaction.performedByName,
            status: 'Returned',
            originalTransactionId: transaction._id,
            checkedOutAt: new Date()
          };

          await fetch('http://localhost:5000/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(returnTransaction)
          });
        }
      }

      // Update original transaction - remove returned items and update status
      const remainingItems = transaction.items.filter((item, idx) =>
        !returnedIndices.includes(idx)
      );

      const allItemsReturned = remainingItems.length === 0;
      const newStatus = allItemsReturned ? 'Returned' : 'Partially Returned';
      const newTotalAmount = remainingItems.reduce((sum, item) =>
        sum + (item.quantity * (item.price || item.itemPrice || 0)), 0
      );

      // Update original transaction with remaining items
      await fetch(`http://localhost:5000/api/transactions/${transaction._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          items: remainingItems,
          totalAmount: newTotalAmount
        })
      });

      alert('Return processed successfully!');
      // Refresh transactions
      window.location.reload();
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Failed to process return. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage) || 1;

  // Show loading only on initial load when there's no data yet
  if (isInitialLoading.current && transactions.length === 0) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center" style={{ background: '#F8F6F3' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen" style={{ background: '#F8F6F3' }}>
      <>
        <Header pageName="POS Transactions" showBorder={false} profileBackground="bg-[#F1ECE5]" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 mt-4">
          {[
            { label: 'Total Transactions', count: stats.total, gradient: ['#5A8DEE', '#3A6BCB'], icon: <FaMoneyBillWave /> },
            { label: 'Completed', count: stats.Completed || 0, gradient: ['#49C178', '#2F8C54'], icon: <FaCheckCircle /> },
            { label: 'Returned', count: stats.Returned || 0, gradient: ['#FFB347', '#F97316'], icon: <FaUndoAlt /> }
          ].map((card) => (
            <motion.button
              key={card.label}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-2xl text-left text-white shadow-lg relative overflow-hidden"
              style={{ backgroundImage: `linear-gradient(135deg, ${card.gradient[0]}, ${card.gradient[1]})` }}
            >
              <div className="absolute inset-0 opacity-20 bg-white pointer-events-none" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                  {card.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">{card.label}</p>
                  <motion.p
                    key={card.count}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold"
                  >
                    {card.count}
                  </motion.p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6 border border-white/80">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4 mb-4">
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AD7F65]" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by reference, user or note..."
                  className="w-full bg-white border border-gray-200 rounded-2xl h-12 pl-12 pr-4 shadow-inner focus:outline-none focus:border-[#AD7F65] focus:ring focus:ring-[#AD7F65]/20 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Dropdown
                  label="By Date"
                  options={dateOptions}
                  selected={filters.date}
                  onSelect={(value) => setFilters((prev) => ({ ...prev, date: value }))}
                  isOpen={dropdownOpen.date}
                  setIsOpen={(value) => setDropdownOpen((prev) => ({ ...prev, date: value }))}
                />
                <Dropdown
                  label="By Pay Method"
                  options={paymentOptions}
                  selected={filters.method}
                  onSelect={(value) => setFilters((prev) => ({ ...prev, method: value }))}
                  isOpen={dropdownOpen.method}
                  setIsOpen={(value) => setDropdownOpen((prev) => ({ ...prev, method: value }))}
                />
                <Dropdown
                  label="By status"
                  options={statusOptions}
                  selected={filters.status}
                  onSelect={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                  isOpen={dropdownOpen.status}
                  setIsOpen={(value) => setDropdownOpen((prev) => ({ ...prev, status: value }))}
                />
                <Dropdown
                  label="By user"
                  options={userDropdownOptions}
                  selected={filters.user}
                  onSelect={(value) => setFilters((prev) => ({ ...prev, user: value }))}
                  isOpen={dropdownOpen.user}
                  setIsOpen={(value) => setDropdownOpen((prev) => ({ ...prev, user: value }))}
                />
              </div>
            </div>

            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0">
                  <tr className="bg-[#F6EEE7] text-[#4A3B2F] text-xs uppercase tracking-wider">
                    {['Transaction No.', 'Receipt No.', 'Transaction ID', 'Date', 'Performed By', 'Payment Method', 'Total', 'Status', 'Quick Action'].map((col) => (
                      <th key={col} className="px-4 py-3 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-500">
                        Loading transactions...
                      </td>
                    </tr>
                  )}
                  {!loading && paginatedTransactions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-400 italic">
                        No transactions found
                      </td>
                    </tr>
                  )}
                  {paginatedTransactions.map((trx, index) => {
                    const isActive = selectedTransaction?._id === trx._id;
                    // Use stored transactionNumber from database (immutable, set at creation)
                    // If not available (old transactions or return transactions), show '---'
                    const transactionNumber = trx.transactionNumber || null;
                    return (
                      <tr
                        key={trx._id}
                        onClick={() => handleRowClick(trx)}
                        className={`cursor-pointer border-b border-gray-100 transition-all ${isActive ? 'bg-[#FDF7F1] shadow-inner' : 'hover:bg-[#F9F2EC]'
                          }`}
                      >
                        <td className="px-4 py-3 font-bold text-[#AD7F65]">
                          {transactionNumber ? `#${transactionNumber}` : '---'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {trx.receiptNo ? `#${trx.receiptNo}` : '---'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700 text-xs">
                          {trx.referenceNo || trx._id?.substring(0, 12) || '---'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(trx.checkedOutAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-gray-700 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-[#F0E5DB] flex items-center justify-center text-xs font-bold text-[#8B6B55]">
                            {getInitials(trx.performedByName || 'Staff')}
                          </span>
                          {trx.performedByName || 'Staff'}
                        </td>
                        <td className="px-4 py-3 capitalize">{trx.paymentMethod}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(trx.totalAmount)}</td>
                        <td className="px-4 py-3">{renderStatusPill(trx.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              title="View"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClick(trx);
                              }}
                              className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-green-500 transition-all text-gray-500 hover:text-green-600"
                            >
                              <FaEye />
                            </button>
                            <button
                              title="Print"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintClick(trx);
                              }}
                              className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-500 transition-all text-gray-500 hover:text-blue-600"
                            >
                              <FaPrint />
                            </button>
                            {isTransactionReturnable(trx) && trx.status !== 'Returned' && trx.status !== 'Voided' && (
                              <button
                                title="Return"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReturnClick(trx);
                                }}
                                className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-orange-500 transition-all text-gray-500 hover:text-orange-600"
                              >
                                <FaUndoAlt />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-5">
              <div className="text-xs text-gray-500">
                Showing {(currentPage - 1) * rowsPerPage + 1}-
                {Math.min(currentPage * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
              </div>
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
                      className={`w-8 h-8 rounded-full text-sm font-semibold ${currentPage === pageNumber
                          ? 'bg-[#AD7F65] text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <span className="text-gray-400 px-2">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 rounded-full text-sm font-semibold ${currentPage === totalPages
                      ? 'bg-[#AD7F65] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {totalPages}
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-full ${currentPage === totalPages ? 'text-gray-300' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[380px] xl:w-[420px]">
            <div className="bg-white rounded-2xl border border-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] p-6 sticky top-8">
              <div className="mb-4">
                <p className="text-sm text-gray-400">Create Your Style</p>
                <p className="text-xs text-gray-400">Pasonanca, Zamboanga City</p>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 mb-4 text-center">
                <p className="text-xs tracking-[0.4em] text-gray-500 uppercase">Transaction No</p>
                <p className="text-2xl font-bold tracking-widest mt-1 text-[#333]">
                  {selectedTransactionNumber ? `#${selectedTransactionNumber}` : '---'}
                </p>
              </div>
              <div className="font-mono text-xs space-y-2">
                <div className="flex justify-between text-gray-500">
                  <span>Receipt No:</span>
                  <span className="font-bold text-[#AD7F65]">
                    {selectedTransaction?.status === 'Completed' && selectedTransaction?.receiptNo
                      ? `#${selectedTransaction.receiptNo}`
                      : '---'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Date:</span>
                  <span>
                    {selectedTransaction
                      ? new Date(selectedTransaction.checkedOutAt).toLocaleString()
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Cashier:</span>
                  <span>{selectedTransaction?.performedByName || '---'}</span>
                </div>
              </div>
              <div className="border-t border-b border-gray-200 my-4 py-3 font-mono text-sm">
                <div className="flex justify-between font-semibold">
                  <span>Item</span>
                  <span>Qty x Price</span>
                </div>
                <div className="mt-2 space-y-1 text-gray-600">
                  {selectedTransaction?.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.itemName}</span>
                      <span>
                        {item.quantity} x {formatCurrency(item.price)}
                      </span>
                    </div>
                  )) || <p className="text-center text-gray-400">No items</p>}
                </div>
              </div>
              <div className="font-mono text-xs space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="uppercase">{selectedTransaction?.paymentMethod}</span>
                </div>
                <div className="flex justify-between font-semibold text-base text-gray-800 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(selectedTransaction?.totalAmount || 0)}</span>
                </div>
              </div>
              <button
                className="w-full mt-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:brightness-105 active:scale-98"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)',
                  boxShadow: '0 12px 20px rgba(118,70,43,0.25)'
                }}
              >
                Print Receipt
              </button>
              <p className="text-center text-[11px] text-gray-400 mt-4 tracking-wide">
                This is not an official receipt
              </p>
            </div>
          </div>
        </div>

        <ViewTransactionModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setTransactionToView(null);
          }}
          transaction={transactionToView}
        />

        <PrintReceiptModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setTransactionToPrint(null);
          }}
          transaction={transactionToPrint}
        />

        <ReturnItemsModal
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setTransactionToReturn(null);
          }}
          transaction={transactionToReturn}
          onConfirm={handleReturnConfirm}
        />
      </>
    </div>
  );
};

export default memo(Transaction);

