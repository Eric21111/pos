import { useState } from 'react';
import Header from '../../components/shared/header';
import sortIcon from '../../assets/sort.svg';
import printIcon from '../../assets/inventory-icons/print.png';
import exportIcon from '../../assets/inventory-icons/Export.svg';
import analyticsImage from '../../assets/owner/Analytics.png';
import inventoryProductImage from '../../assets/owner/Inventory and Product.png';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="p-8 min-h-screen">
      <Header 
        pageName="Reports / Analytics"
        profileBackground="bg-gray-100"
        showBorder={false}
      />
      
      <div className="flex items-center justify-between mb-6 mt-6 w-full">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md ${
              activeTab === 'sales'
                ? 'text-white'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}
            style={
              activeTab === 'sales'
                ? { background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }
                : {}
            }
          >
            Sales Performance
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-md ${
              activeTab === 'inventory'
                ? 'text-white'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}
            style={
              activeTab === 'inventory'
                ? { background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }
                : {}
            }
          >
            Inventory & Product
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src={sortIcon} alt="Filter" className="w-5 h-5 opacity-90" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src={printIcon} alt="Print" className="w-5 h-5 object-contain" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src={exportIcon} alt="Export" className="w-5 h-5 object-contain" />
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        {activeTab === 'sales' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <img 
              src={analyticsImage} 
              alt="Sales Performance Analytics" 
              className="w-full h-auto object-contain"
            />
          </div>
        )}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <img 
              src={inventoryProductImage} 
              alt="Inventory and Product Analytics" 
              className="w-full h-auto object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

