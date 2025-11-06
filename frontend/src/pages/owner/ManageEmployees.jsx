import { useState, useEffect } from 'react';
import Header from '../../components/shared/header';
import { FaSearch, FaPlus, FaEllipsisV } from 'react-icons/fa';
import Pagination from '../../components/inventory/Pagination';
import ViewEmployeeModal from '../../components/owner/ViewEmployeeModal';
import EditEmployeeModal from '../../components/owner/EditEmployeeModal';
import DeleteEmployeeModal from '../../components/owner/DeleteEmployeeModal';
import tempStaff from '../../assets/tempstaff.png';
import sortIcon from '../../assets/sort.svg';

const ManageEmployees = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const itemsPerPage = 12;

  // Static employee data
  const employees = [
    { id: 1, name: 'Maria Dela Cruz', role: 'Cashier', status: 'Active', image: tempStaff },
    { id: 2, name: 'John Smith', role: 'Manager', status: 'Active', image: tempStaff },
    { id: 3, name: 'Sarah Johnson', role: 'Cashier', status: 'Inactive', image: tempStaff },
    { id: 4, name: 'Michael Brown', role: 'Sales Associate', status: 'Active', image: tempStaff },
    { id: 5, name: 'Emily Davis', role: 'Cashier', status: 'Active', image: tempStaff },
    { id: 6, name: 'David Wilson', role: 'Sales Associate', status: 'Inactive', image: tempStaff },
    { id: 7, name: 'Lisa Anderson', role: 'Cashier', status: 'Inactive', image: tempStaff },
    { id: 8, name: 'Robert Taylor', role: 'Manager', status: 'Active', image: tempStaff },
    { id: 9, name: 'Jennifer Martinez', role: 'Cashier', status: 'Inactive', image: tempStaff },
    { id: 10, name: 'Christopher Lee', role: 'Sales Associate', status: 'Active', image: tempStaff },
    { id: 11, name: 'Amanda White', role: 'Cashier', status: 'Inactive', image: tempStaff },
    { id: 12, name: 'James Harris', role: 'Manager', status: 'Active', image: tempStaff },
  ];

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown !== null) {
        const buttonElement = document.getElementById(`dropdown-btn-${openDropdown}`);
        const dropdownElement = document.getElementById(`dropdown-menu-${openDropdown}`);
        
        if (
          buttonElement &&
          dropdownElement &&
          !buttonElement.contains(event.target) &&
          !dropdownElement.contains(event.target)
        ) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleViewEmployee = (employee) => {
    setViewingEmployee(employee);
    setShowViewModal(true);
    setOpenDropdown(null);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleDeleteEmployee = (employee) => {
    setDeletingEmployee(employee);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const confirmDeleteEmployee = () => {
    console.log('Deleting employee:', deletingEmployee);
    // Add actual delete logic here
    setShowDeleteModal(false);
    setDeletingEmployee(null);
  };

  return (
    <div className="p-8 min-h-screen">
      <Header 
        pageName="Manage Employees"
        profileBackground="bg-gray-100"
        showBorder={false}
      />
      
      <div className="mt-6">
        {/* Search and Add Employee Section */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative" style={{ maxWidth: '400px', width: '100%' }}>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <img src={sortIcon} alt="Filter" className="w-5 h-5 opacity-90" />
            </button>
          </div>
          
          {/* Add Employee Button - Right Aligned */}
          <button
            className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-md"
            style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
          >
            <FaPlus className="inline mr-2" />
            Add Employee
          </button>
        </div>

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-4 gap-6 mb-4">
          {paginatedEmployees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Gradient Border Top */}
              <div
                className="h-2 w-full"
                style={{
                  background: 'radial-gradient(circle at center, #C2A68C 0%, #AD7F65 50%, #76462B 100%)'
                }}
              />
              
              {/* Options Icon */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  id={`dropdown-btn-${employee.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === employee.id ? null : employee.id);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaEllipsisV />
                </button>
                
                {openDropdown === employee.id && (
                  <div
                    id={`dropdown-menu-${employee.id}`}
                    className="absolute right-0 mt-2 w-40 bg-white rounded-lg border border-gray-200 shadow-lg"
                    style={{
                      zIndex: 1000,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <button
                      onClick={() => handleViewEmployee(employee)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 border-b rounded-t-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <button
                      onClick={() => handleEditEmployee(employee)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 border-b"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600 rounded-b-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Profile Picture */}
                  <div className="w-30 h-30 rounded-full overflow-hidden shrink-0">
                    <img
                      src={employee.image}
                      alt={employee.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Employee Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-base mb-2 ">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">{employee.role}</p>
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                        employee.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {employee.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <ViewEmployeeModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingEmployee(null);
        }}
        employee={viewingEmployee}
      />

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEmployee(null);
        }}
        employee={editingEmployee}
      />

      <DeleteEmployeeModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingEmployee(null);
        }}
        onConfirm={confirmDeleteEmployee}
        employee={deletingEmployee}
      />
    </div>
  );
};

export default ManageEmployees;

