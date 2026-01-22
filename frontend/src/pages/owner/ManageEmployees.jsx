import { useState, useEffect, memo } from 'react';
import Header from '../../components/shared/header';
import { FaSearch, FaPlus, FaEllipsisV } from 'react-icons/fa';
import Pagination from '../../components/inventory/Pagination';
import ViewEmployeeModal from '../../components/owner/ViewEmployeeModal';
import EditEmployeeModal from '../../components/owner/EditEmployeeModal';
import DeleteEmployeeModal from '../../components/owner/DeleteEmployeeModal';
import AddEmployeeModal from '../../components/owner/AddEmployeeModal';
import DisableAccountModal from '../../components/owner/DisableAccountModal';
import SuccessModal from '../../components/inventory/SuccessModal';
import ResetPinConfirmModal from '../../components/owner/ResetPinConfirmModal';
import TemporaryPinModal from '../../components/owner/TemporaryPinModal';
import defaultAvatar from '../../assets/default.jpeg';
import filterIcon from '../../assets/filter.svg';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [togglingEmployee, setTogglingEmployee] = useState(null);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [toggleAction, setToggleAction] = useState('disable');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [resettingEmployee, setResettingEmployee] = useState(null);
  const [showTempPinModal, setShowTempPinModal] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeePin, setNewEmployeePin] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const itemsPerPage = 12;

  // Fetch employees from database
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/employees');
      const data = await response.json();
      
      if (data.success) {
        // Add image property to each employee (using default avatar as default)
        const employeesWithImages = data.data.map(emp => ({
          ...emp,
          image: emp.profileImage || defaultAvatar,
          id: emp._id
        }));
        setEmployees(employeesWithImages);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Failed to fetch employees. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(employee => {
    // Search filter
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === 'All' || employee.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'All' || employee.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get unique roles from employees for filter options
  const availableRoles = ['All', ...new Set(employees.map(emp => emp.role).filter(Boolean))];

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle employee action dropdown
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
      
      // Handle filter dropdown
      if (showFilterDropdown) {
        const filterButton = event.target.closest('[data-filter-button]');
        const filterDropdown = event.target.closest('[data-filter-dropdown]');
        
        if (!filterButton && !filterDropdown) {
          setShowFilterDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown, showFilterDropdown]);

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

  const generateRandomPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleResetPin = (employee) => {
    setOpenDropdown(null);
    setResettingEmployee(employee);
    setShowResetPinModal(true);
  };

  const confirmResetPin = async () => {
    if (!resettingEmployee) return;

    setShowResetPinModal(false);

    try {
      // Use the send-temporary-pin endpoint which generates PIN and sends email
      const response = await fetch(`http://localhost:5000/api/employees/${resettingEmployee._id || resettingEmployee.id}/send-temporary-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setResettingEmployee(null);
        if (data.emailSent) {
          setSuccessMessage(`A new temporary PIN has been emailed to ${resettingEmployee.email}.`);
        } else {
          setSuccessMessage(`Temporary PIN generated: ${data.tempPin}. Email could not be sent - please share this PIN manually.`);
        }
        setShowSuccessModal(true);
        // Refresh employees to reflect any changes
        fetchEmployees();
      } else {
        alert(data.message || 'Failed to reset PIN');
      }
    } catch (error) {
      console.error('Error resetting PIN:', error);
      alert('Failed to reset PIN. Please try again.');
    }
  };

  const handleToggleStatus = (employee) => {
    setOpenDropdown(null);
    setTogglingEmployee(employee);
    const action = employee.status === 'Active' ? 'disable' : 'enable';
    setToggleAction(action);
    setShowDisableModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!togglingEmployee) return;

    const newStatus = togglingEmployee.status === 'Active' ? 'Inactive' : 'Active';
    const employeeName = togglingEmployee.name;

    try {
      const response = await fetch(`http://localhost:5000/api/employees/${togglingEmployee._id || togglingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setShowDisableModal(false);
        setTogglingEmployee(null);
        
        // Show success modal
        const actionPastTense = toggleAction === 'disable' ? 'disabled' : 'enabled';
        setSuccessMessage(`${employeeName}'s account has been ${actionPastTense} successfully!`);
        setShowSuccessModal(true);
        
        fetchEmployees();
      } else {
        alert(data.message || `Failed to ${toggleAction} account`);
      }
    } catch (error) {
      console.error(`Error ${toggleAction}ing account:`, error);
      alert(`Failed to ${toggleAction} account. Please try again.`);
    }
  };

  const handleDeleteEmployee = (employee) => {
    setDeletingEmployee(employee);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const confirmDeleteEmployee = async () => {
    if (!deletingEmployee) return;

    try {
      const response = await fetch(`http://localhost:5000/api/employees/${deletingEmployee._id || deletingEmployee.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        // Refresh employee list
        fetchEmployees();
        setShowDeleteModal(false);
        setDeletingEmployee(null);
      } else {
        alert(data.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  };

  return (
    <div className="p-8 min-h-screen">
      <Header 
        pageName="Manage Employees"
        profileBackground="bg-gray-100"
        showBorder={false}
      />
      
      <div className="mt-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center shadow-md overflow-hidden" style={{ maxWidth: '400px', width: '100%', borderRadius: '15px' }}>
              <button
                type="button"
                className="px-4 py-3 flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(173, 127, 101, 1) 0%, rgba(118, 70, 43, 1) 100%)',
                  borderTopLeftRadius: '15px',
                  borderBottomLeftRadius: '15px'
                }}
              >
                <FaSearch className="text-white text-sm" />
              </button>
              
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-white focus:outline-none text-gray-700 placeholder-gray-400"
                style={{
                  borderTopRightRadius: '15px',
                  borderBottomRightRadius: '15px'
                }}
              />
            </div>
            <div className="relative">
              <button 
                data-filter-button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`p-2 border rounded-lg hover:bg-gray-50 transition-colors ${
                  (roleFilter !== 'All' || statusFilter !== 'All') 
                    ? 'border-[#AD7F65] bg-[#AD7F65]/10' 
                    : 'border-gray-300'
                }`}
              >
                <img src={filterIcon} alt="Filter" className="w-5 h-5 opacity-90" />
              </button>
              
              {showFilterDropdown && (
                <div data-filter-dropdown className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-700">Filters</h4>
                    <button
                      onClick={() => {
                        setRoleFilter('All');
                        setStatusFilter('All');
                      }}
                      className="text-xs text-[#AD7F65] hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {/* Role Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Role</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Status Filter */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent"
                    >
                      <option value="All">All</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full py-2 text-white rounded-lg text-sm font-medium"
                    style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-md"
            style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
          >
            <FaPlus className="inline mr-2" />
            Add Employee
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Loading employees...</div>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-inner border border-dashed border-gray-300">
            <p className="text-2xl font-semibold text-gray-700 mb-3">No accounts yet</p>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              You haven&apos;t added any employees. Click below to create the first account and assign access.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-md"
              style={{ background: 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)' }}
            >
              + Add Your First Employee
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6 mb-4">
            {paginatedEmployees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="overflow-hidden rounded-t-lg">
                <div
                  className="h-2 w-full"
                  style={{
                    background: 'radial-gradient(circle at center, #C2A68C 0%, #AD7F65 50%, #76462B 100%)'
                  }}
                />
              </div>
              
              {/* Hide 3-dot menu for Owner */}
              {employee.role !== 'Owner' && (
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
                    className="fixed w-48 bg-white rounded-lg border border-gray-200 shadow-lg"
                    style={{
                      zIndex: 9999,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      top: `${(document.getElementById(`dropdown-btn-${employee.id}`)?.getBoundingClientRect().top || 0) + 30}px`,
                      left: `${(document.getElementById(`dropdown-btn-${employee.id}`)?.getBoundingClientRect().left || 0) - 170}px`
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
                      Update
                    </button>
                    <button
                      onClick={() => handleResetPin(employee)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 border-b text-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Reset PIN
                    </button>
                    <button
                      onClick={() => handleToggleStatus(employee)}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 rounded-b-lg ${
                        employee.status === 'Active' ? 'text-orange-600' : 'text-green-600'
                      }`}
                    >
                      {employee.status === 'Active' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Disable
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Enable
                        </>
                      )}
                    </button>
                  </div>
                  )}
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-30 h-30 rounded-full overflow-hidden shrink-0">
                    <img
                      src={employee.image}
                      alt={employee.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

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
        )}

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
        onEmployeeUpdated={fetchEmployees}
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

      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
        }}
        onEmployeeAdded={fetchEmployees}
        onEmployeeCreated={(name, pin) => {
          setNewEmployeeName(name);
          setNewEmployeePin(pin);
          setShowTempPinModal(true);
        }}
      />

      <DisableAccountModal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setTogglingEmployee(null);
        }}
        onConfirm={confirmToggleStatus}
        employee={togglingEmployee}
        action={toggleAction}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      <ResetPinConfirmModal
        isOpen={showResetPinModal}
        onClose={() => {
          setShowResetPinModal(false);
          setResettingEmployee(null);
        }}
        onConfirm={confirmResetPin}
        employeeName={resettingEmployee?.name || ''}
      />

      <TemporaryPinModal
        isOpen={showTempPinModal}
        onClose={() => {
          setShowTempPinModal(false);
          setNewEmployeeName('');
          setNewEmployeePin('');
        }}
        employeeName={newEmployeeName}
        temporaryPin={newEmployeePin}
      />
    </div>
  );
};

export default memo(ManageEmployees);

