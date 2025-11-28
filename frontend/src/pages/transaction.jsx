import { useEffect, useMemo, useState } from 'react';
import Header from '../components/shared/header';
import {
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaChevronDown,
  FaEye,
  FaBan,
  FaPrint,
  FaMoneyBillWave,
  FaCheckCircle,
  FaUndoAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STYLES = {
  Completed: 'bg-green-100 text-green-700 border border-green-200',
  Returned: 'bg-orange-100 text-orange-700 border border-orange-200',
  'Partially Returned': 'bg-amber-100 text-amber-700 border border-amber-200',
  Voided: 'bg-red-100 text-red-600 border border-red-200'
};

const paymentOptions = ['All', 'cash', 'gcash', 'void'];
const statusOptions = ['All', 'Completed', 'Returned', 'Partially Returned', 'Voided'];
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

const generateTransactionNumber = (transaction) => {
  if (!transaction) return '---';
  // Generate a consistent 6-digit number based on transaction ID
  const id = transaction._id || transaction.referenceNo || '';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  const number = Math.abs(hash) % 900000 + 100000;
  return number.toString();
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
}) => (
  <div className="relative">
    <button
      onClick={() => setIsOpen((prev) => !prev)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
        isOpen ? 'border-[#AD7F65] shadow-lg bg-white' : 'border-gray-200 bg-white hover:border-[#AD7F65]'
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
        >
          {options.map((option) => (
            <li
              key={option}
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                option === selected ? 'bg-[#F6EEE7] text-[#76462B] font-semibold' : 'hover:bg-gray-50'
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

const Transaction = () => {
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
  const rowsPerPage = 8;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (filters.method !== 'All') params.append('paymentMethod', filters.method);
        if (filters.status !== 'All') params.append('status', filters.status);
        if (filters.user !== 'All') params.append('userId', filters.user);

        const qs = params.toString() ? `?${params.toString()}` : '';

        const response = await fetch(`http://localhost:5000/api/transactions${qs}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const payload = data.data.length ? data.data : generateSampleTransactions();
          setTransactions(payload);
          setSelectedTransaction(payload[0]);
          setSelectedTransactionNumber(payload.length);
        } else {
          const sample = generateSampleTransactions();
          setTransactions(sample);
          setSelectedTransaction(sample[0]);
          setSelectedTransactionNumber(sample.length || 1);
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
        const sample = generateSampleTransactions();
        setTransactions(sample);
        setSelectedTransaction(sample[0]);
        setSelectedTransactionNumber(sample.length || 1);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [debouncedSearch, filters.method, filters.status, filters.user]);

  const generateSampleTransactions = () => [];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
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
  }, [transactions, search, filters]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredTransactions, currentPage]);

  const stats = useMemo(() => {
    const totals = {
      total: transactions.length,
      Completed: 0,
      Returned: 0,
      'Partially Returned': 0,
      Voided: 0
    };

    transactions.forEach((trx) => {
      totals[trx.status] = (totals[trx.status] || 0) + 1;
    });

    return totals;
  }, [transactions]);

  const handleRowClick = (trx, transactionNumber) => {
    setSelectedTransaction(trx);
    setSelectedTransactionNumber(transactionNumber);
  };

  const renderStatusPill = (status = 'Completed') => (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-transform ${STATUS_STYLES[status]}`}
    >
      {statusIcon[status]}
      {status}
    </span>
  );

  const renderActionButton = (icon, label) => (
    <button
      title={label}
      className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#AD7F65] transition-all text-gray-500 hover:text-[#76462B]"
    >
      {icon}
    </button>
  );

  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage) || 1;

  return (
    <div className="p-6 min-h-screen" style={{ background: '#F8F6F3' }}>
      <Header pageName="POS Transactions" showBorder={false} profileBackground="bg-[#F1ECE5]" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 mt-4">
        {[
          { label: 'Total Transactions', count: stats.total, gradient: ['#5A8DEE', '#3A6BCB'], icon: <FaMoneyBillWave /> },
          { label: 'Completed', count: stats.Completed || 0, gradient: ['#49C178', '#2F8C54'], icon: <FaCheckCircle /> },
          { label: 'Returned', count: stats.Returned || 0, gradient: ['#FFB347', '#F97316'], icon: <FaUndoAlt /> },
          { label: 'Voided', count: stats.Voided || 0, gradient: ['#F66A6A', '#E24343'], icon: <FaExclamationTriangle /> }
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
                options={[
                  ...userOptions,
                  ...new Set(transactions.map((t) => t.performedById || t.performedByName).filter(Boolean))
                ]}
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
                  {['Transaction No.', 'Transaction ID', 'Date', 'Performed By', 'Payment Method', 'Total', 'Status', 'Quick Action'].map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                )}
                {!loading && paginatedTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-400 italic">
                      No transactions found
                    </td>
                  </tr>
                )}
                {paginatedTransactions.map((trx, index) => {
                  const isActive = selectedTransaction?._id === trx._id;
                  const transactionNumber = filteredTransactions.length - ((currentPage - 1) * rowsPerPage + index);
                  return (
                    <tr
                      key={trx._id}
                      onClick={() => handleRowClick(trx, transactionNumber)}
                      className={`cursor-pointer border-b border-gray-100 transition-all ${
                        isActive ? 'bg-[#FDF7F1] shadow-inner' : 'hover:bg-[#F9F2EC]'
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-[#AD7F65]">#{transactionNumber}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {trx.receiptNo ? `#${trx.receiptNo}` : (trx.referenceNo || trx._id)}
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
                          {renderActionButton(<FaEye />, 'View')}
                          {renderActionButton(<FaBan />, 'Void')}
                          {renderActionButton(<FaPrint />, 'Print')}
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
              <span className="text-gray-400 px-2">...</span>
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
                #{selectedTransactionNumber || '---'}
              </p>
            </div>
            <div className="font-mono text-xs space-y-2">
              <div className="flex justify-between text-gray-500">
                <span>Receipt No:</span>
                <span className="font-bold text-[#AD7F65]">#{selectedTransaction?.receiptNo || '---'}</span>
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
    </div>
  );
};

export default Transaction;

