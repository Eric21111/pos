import { useState } from 'react';
import Header from '../components/shared/header';
import { FaChevronLeft, FaChevronRight, FaSearch, FaFilter } from 'react-icons/fa';

const Transaction = () => {
  const [currentPage, setCurrentPage] = useState(1);

  
  const transactions = [
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'QR Pay', performedBy: 'Employee -Maria', remarks: 'Paid', refNo: '0005007439-1' },
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'Cash', performedBy: 'Owner - Erika', remarks: 'Paid', refNo: '0005007439-1' },
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'QR Pay', performedBy: 'Employee -Stef', remarks: 'Refunded', refNo: '0005007439-1' },
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'Cash', performedBy: 'Employee -Jade', remarks: 'Paid', refNo: '0005007439-1' },
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'QR Pay', performedBy: 'Employee -Maria', remarks: 'Paid', refNo: '0005007439-1' },
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'Cash', performedBy: 'Owner - Erika', remarks: 'Paid', refNo: '0005007439-1' },
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'QR Pay', performedBy: 'Employee -Stef', remarks: 'Refunded', refNo: '0005007439-1' },
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'Cash', performedBy: 'Employee -Jade', remarks: 'Paid', refNo: '0005007439-1' },
    { id: 'TRX-001', date: 'Oct 4, 2025', payment: 'QR Pay', performedBy: 'Employee -Maria', remarks: 'Paid', refNo: '0005007439-1' },
  ];

  return (
      <div className="p-8 min-h-screen">
        <Header 
          pageName="Transaction History"
          userName="PerosssssssSSS"
          userRole="Staff"
          profileBackground="bg-gray-100"
          showBorder={false}
        />

       
        <div className="flex gap-6 mt-10">
         
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-6">
         
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1" style={{ maxWidth: '400px' }}>
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-10 h-9 flex items-center justify-center text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}>
                  <FaSearch className="text-sm" />
                </div>
                <input
                  type="text"
                  placeholder="Search For..."
                  className="w-full h-11 pl-14 pr-4 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent rounded-xl"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <FaFilter className="text-gray-600 text-xl" />
              </button>
            </div>

           
            <div className="overflow-x-auto">
              
              <div className="rounded-xl mb-2 text-white px-4 py-3 flex items-center" style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}>
                <div className="w-1/6 text-sm font-semibold">Transaction ID</div>
                <div className="w-1/6 text-sm font-semibold">Date / Time</div>
                <div className="w-1/6 text-sm font-semibold">Mode of Payment</div>
                <div className="w-1/6 text-sm font-semibold">Performed By</div>
                <div className="w-1/6 text-sm font-semibold">Remarks</div>
                <div className="w-1/6 text-sm font-semibold">Reference No.</div>
              </div>

            
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="flex items-center px-4 py-3 border-b hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-1/6 text-sm text-gray-700">{transaction.id}</div>
                    <div className="w-1/6 text-sm text-gray-700">{transaction.date}</div>
                    <div className="w-1/6 text-sm text-gray-700">{transaction.payment}</div>
                    <div className="w-1/6 text-sm text-gray-700">{transaction.performedBy}</div>
                    <div className="w-1/6 text-sm">
                      <span className={`px-2 py-1 rounded ${
                        transaction.remarks === 'Paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.remarks}
                      </span>
                    </div>
                    <div className="w-1/6 text-sm text-gray-700">{transaction.refNo}</div>
                  </div>
                ))}
              </div>
            </div>

         
            <div className="flex justify-center items-center gap-2 mt-6 bg-gray-100 rounded-xl px-4 py-2">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                disabled={currentPage === 1}
              >
                <FaChevronLeft className="text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentPage === 1 
                    ? 'bg-[#AD7F65] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                1
              </button>
              <button
                onClick={() => setCurrentPage(2)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentPage === 2 
                    ? 'bg-[#AD7F65] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                2
              </button>
              <button
                onClick={() => setCurrentPage(3)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentPage === 3 
                    ? 'bg-[#AD7F65] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                3
              </button>
              <button
                onClick={() => setCurrentPage(4)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentPage === 4 
                    ? 'bg-[#AD7F65] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                4
              </button>
              <button
                onClick={() => setCurrentPage(5)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentPage === 5 
                    ? 'bg-[#AD7F65] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                5
              </button>
              <span className="px-2 text-gray-500">...</span>
              <button
                onClick={() => setCurrentPage(60)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentPage === 60 
                    ? 'bg-[#AD7F65] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                60
              </button>
              <button 
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                disabled={currentPage === 60}
              >
                <FaChevronRight className="text-gray-600" />
              </button>
            </div>
          </div>

       
          <div className="w-96 bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1" style={{ color: '#AD7F65' }}>
                Transaction Id: TRX-001
              </h2>
              <p className="text-sm text-gray-400">
                October 20, 2025
              </p>
            </div>

            <div className="mb-12 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Item One</span>
                <span className="text-sm text-gray-600">x1 P100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Item One</span>
                <span className="text-sm text-gray-600">x1 P100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Item One</span>
                <span className="text-sm text-gray-600">x1 P100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Item One</span>
                <span className="text-sm text-gray-600">x1 P100</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm text-gray-600">P400.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Discount</span>
                <span className="text-sm text-gray-600">P100.00</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-semibold text-gray-800">Total:</span>
                <span className="text-sm font-semibold text-gray-800">P300.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Transaction;

