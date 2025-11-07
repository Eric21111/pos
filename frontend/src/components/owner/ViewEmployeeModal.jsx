import { FaTimes, FaEdit } from 'react-icons/fa';

const ViewEmployeeModal = ({ isOpen, onClose, employee }) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10002] p-4 backdrop-blur-sm bg-transparent">
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl relative shadow-2xl overflow-hidden"
        style={{ borderRadius: '16px' }}
      >
        <div className="relative overflow-hidden" style={{ borderTopLeftRadius: '30px', borderTopRightRadius: '30px' }}>
          <div
            className="h-[10px] w-full"
            style={{
              background: 'radial-gradient(circle at center, #C2A68C 0%, #AD7F65 50%, #76462B 100%)'
            }}
          />
          <div 
            className="px-6 py-4 flex items-center justify-between"
            style={{
              background: 'radial-gradient(circle at center, #C2A68C 0%, #AD7F65 50%, #76462B 100%)'
            }}
          >
            <h2 className="text-white font-bold text-lg">Employee Profile</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-white ml-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-40 h-40  rounded-full overflow-hidden shrink-0">
              <img
                src={employee.image}
                alt={employee.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-bold text-gray-800">{employee.name}</h3>
                <button className="text-gray-600 hover:text-gray-800">
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm mb-4" style={{ color: '#FF8C42' }}>{employee.role}</p>
              
              <div className="mb-3">
                <label className="text-sm text-gray-600 mb-2 block">Permissions:</label>
                <div className="flex gap-2 flex-wrap">
                  <button className="px-4 py-1 rounded-full border text-sm" style={{ borderColor: '#AD7F65', backgroundColor: '#F5F0ED', color: '#76462B' }}>
                    POS Terminal
                  </button>
                  <button className="px-4 py-1 rounded-full border text-sm" style={{ borderColor: '#AD7F65', backgroundColor: '#F5F0ED', color: '#76462B' }}>
                    View Transaction
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">Status:</label>
                <span
                  className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
                    employee.status === 'Active'
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {employee.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="text-gray-800 font-medium">{employee.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Contact number</p>
              <p className="text-gray-800 font-medium">09123478999</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="text-gray-800 font-medium">yourname12345@gmail.com</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Date Joined</p>
              <p className="text-gray-800 font-medium">Oct. 04, 2023</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Position</p>
              <p className="text-gray-800 font-medium">Employee - {employee.role}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: '#D9534F' }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployeeModal;

