import { useState } from 'react';
import Header from '../../components/shared/header';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus } from 'react-icons/fa';
import sortIcon from '../../assets/sort.svg';
import ViewBrandProductsModal from '../../components/owner/ViewBrandProductsModal';

const BrandPartners = () => {
  const { currentUser, isOwner } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  

  const [brandPartners, setBrandPartners] = useState([
    {
      id: 1,
      brandName: 'Brand A',
      email: 'branda@example.com',
      contactPerson: 'John Doe',
      contactNumber: '+63 123456789',
      logo: null
    },
    {
      id: 2,
      brandName: 'Brand B',
      email: 'brandb@example.com',
      contactPerson: 'Jane Smith',
      contactNumber: '+63 987654321',
      logo: null
    },
    {
      id: 3,
      brandName: 'Brand C',
      email: 'brandc@example.com',
      contactPerson: 'Mike Johnson',
      contactNumber: '+63 555555555',
      logo: null
    },
    {
      id: 4,
      brandName: 'Brand D',
      email: 'brandd@example.com',
      contactPerson: 'Sarah Williams',
      contactNumber: '+63 444444444',
      logo: null
    }
  ]);

  const filteredBrandPartners = brandPartners.filter(brand =>
    brand.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen">
      <Header pageName="Brand Partners" showBorder={false} />

      {isOwner() && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-3 font-medium transition-all bg-white text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg"
          >
            Personal Information
          </button>
          <button
            onClick={() => navigate('/discount-management')}
            className="px-6 py-3 font-medium transition-all bg-white text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg"
          >
            Discount Management
          </button>
          <button
            className="px-6 py-3 font-medium transition-all text-white shadow-md rounded-xl"
            style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
          >
            Brand Partners
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative" style={{ width: '400px' }}>
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-12 h-9 flex items-center justify-center text-white rounded-lg" style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}>
              <FaSearch className="text-sm" />
            </div>
            <input
              type="text"
              placeholder="Search For..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-16 pr-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
            />
          </div>
          <button className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src={sortIcon} alt="Filter" className="w-5 h-5 opacity-90" />
          </button>
        </div>

        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
        >
          <FaPlus className="w-4 h-4" />
          Add Brand Partner
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filteredBrandPartners.map((brand) => (
          <div
            key={brand.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden border-t-2"
            style={{ borderTopColor: '#AD7F65' }}
          >
            <div className="flex p-6 items-center">
              <div className="w-32 h-32 shrink-0 flex items-center justify-center mr-6">
                <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center">
                  {brand.logo ? (
                    <img 
                      src={brand.logo} 
                      alt={brand.brandName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-gray-400 text-2xl font-bold">
                      {brand.brandName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {brand.brandName}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Email:</span> {brand.email}
                    </div>
                    <div>
                      <span className="font-medium">Contact Person:</span> {brand.contactPerson}
                    </div>
                    <div>
                      <span className="font-medium">Contact Number:</span> {brand.contactNumber}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => {
                      setSelectedBrand(brand);
                      setShowViewModal(true);
                    }}
                    className="px-4 py-2 text-white rounded-lg font-medium text-sm shadow-sm hover:shadow-md transition-all"
                    style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
                  >
                    View Products
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ViewBrandProductsModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedBrand(null);
        }}
        brandPartner={selectedBrand}
      />
    </div>
  );
};

export default BrandPartners;

