import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Mock data - replace with your actual data source
const initialEmployees = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    email: "juan.delacruz@example.com",
    position: "Manager",
    contactNumber: "09123456789",
    dateJoined: "2023-01-15",
    isActive: true,
    permissions: {
      pos: true,
      inventory: true,
      viewTransaction: true,
      generateReports: true
    }
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@example.com",
    position: "Cashier",
    contactNumber: "09123456788",
    dateJoined: "2023-03-10",
    isActive: true,
    permissions: {
      pos: true,
      inventory: false,
      viewTransaction: true,
      generateReports: false
    }
  },
  // Add more employees as needed
];

const RolesAndPermission = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState(initialEmployees);
  const [filteredEmployees, setFilteredEmployees] = useState(initialEmployees);
  const [archivedEmployees, setArchivedEmployees] = useState([]);
  const { restoreEmployee, archivedItems } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "Cashier",
    contactNumber: "",
    dateJoined: "",
    isActive: true,
    permissions: {
      pos: false,
      inventory: false,
      viewTransaction: false,
      generateReports: false
    }
  });

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      position: employee.position,
      contactNumber: employee.contactNumber,
      dateJoined: employee.dateJoined,
      isActive: employee.isActive,
      permissions: { ...employee.permissions }
    });
    setIsEditModalVisible(true);
  };

  const handleSave = () => {
    if (editingEmployee) {
      // Update existing employee
      setEmployees(employees.map(emp => {
        if (emp.id === editingEmployee.id) {
          return { ...emp, ...formData };
        }
        return emp;
      }));
    } else {
      // Add new employee
      const newEmployee = {
        id: employees.length + 1,
        ...formData
      };
      setEmployees([...employees, newEmployee]);
    }
    setIsEditModalVisible(false);
    setEditingEmployee(null);
  };

  const toggleEmployeeStatus = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setSelectedEmployee(employee);
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    if (selectedEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === selectedEmployee.id ? { ...emp, isActive: !emp.isActive } : emp
      ));
    }
    setShowStatusModal(false);
  };

  const archiveEmployee = (employeeId) => {
    Alert.alert(
      "Archive Employee",
      "Are you sure you want to archive this employee?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Archive", 
          onPress: () => {
            const employeeToArchive = employees.find(emp => emp.id === employeeId);
            if (employeeToArchive) {
              setArchivedEmployees(prev => [...prev, { ...employeeToArchive, archivedAt: new Date().toISOString() }]);
              setEmployees(employees.filter(emp => emp.id !== employeeId));
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const navigateToArchive = () => {
    router.push({
      pathname: '/Archive',
      params: { archivedItems: JSON.stringify(archivedEmployees) }
    });
  };

  const handlePermissionToggle = (permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: !formData.permissions[permission]
      }
    });
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee => 
        employee.name.toLowerCase().includes(query.toLowerCase()) ||
        employee.email.toLowerCase().includes(query.toLowerCase()) ||
        employee.position.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  };

  useEffect(() => {
    // Handle restored employee if coming back from archive
    if (restoreEmployee) {
      try {
        const restoredEmployee = JSON.parse(restoreEmployee);
        // Only add if not already in the employees list
        if (!employees.some(emp => emp.id === restoredEmployee.id)) {
          setEmployees(prevEmployees => [...prevEmployees, restoredEmployee]);
        }
        
        // Update archived employees list if it was passed back
        if (archivedItems) {
          setArchivedEmployees(JSON.parse(archivedItems));
        }
      } catch (error) {
        console.error('Error restoring employee:', error);
      }
    }
    
    // Only update filteredEmployees when searchQuery or employees change
    const filtered = searchQuery === '' 
      ? employees 
      : employees.filter(employee => 
          employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.position.toLowerCase().includes(searchQuery.toLowerCase())
        );
    
    setFilteredEmployees(filtered);
  }, [searchQuery, restoreEmployee, archivedItems, employees]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
        </View>
        
        <TouchableOpacity 
          onPress={navigateToArchive}
          style={styles.addButton}
        >
          <Ionicons name="archive" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setEditingEmployee(null);
            setFormData({
              name: "",
              email: "",
              position: "Cashier",
              contactNumber: "",
              dateJoined: new Date().toISOString().split('T')[0],
              isActive: true,
              permissions: {
                pos: false,
                inventory: false,
                viewTransaction: false,
                generateReports: false
              }
            });
            setIsEditModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredEmployees.map((employee) => (
          <View key={employee.id} style={[
            styles.employeeCard,
            !employee.isActive && styles.inactiveEmployee
          ]}>
            <View style={styles.employeeHeader}>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{employee.name}</Text>
                <Text style={styles.employeePosition}>{employee.position}</Text>
                <View style={[styles.statusBadge, employee.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={styles.statusText}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.employeeActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleEdit(employee)}
                >
                  <Ionicons name="pencil" size={20} color="#4A90E2" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => archiveEmployee(employee.id)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={20} color="#f44336" />
                </TouchableOpacity>
                <Switch
                  value={employee.isActive}
                  onValueChange={() => toggleEmployeeStatus(employee.id)}
                  trackColor={{ false: "#D3D3D3", true: "#AD7F65" }}
                  thumbColor={"#FFFFFF"}
                />
              </View>
            </View>
            
            <View style={styles.employeeDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="mail" size={16} color="#666" />
                <Text style={styles.detailText}>{employee.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="call" size={16} color="#666" />
                <Text style={styles.detailText}>{employee.contactNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.detailText}>Joined: {employee.dateJoined}</Text>
              </View>
            </View>

            <View style={styles.permissionsContainer}>
              <Text style={styles.permissionsTitle}>Permissions:</Text>
              <View style={styles.permissionsGrid}>
                {Object.entries(employee.permissions).map(([key, value]) => (
                  <View key={key} style={styles.permissionItem}>
                    <Text style={styles.permissionText}>
                      {key.split(/(?=[A-Z])/).join(' ').toUpperCase()}
                    </Text>
                    <View style={[
                      styles.permissionBadge,
                      value ? styles.permissionGranted : styles.permissionDenied
                    ]}>
                      <Text style={styles.permissionBadgeText}>
                        {value ? '✓' : '✗'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit/Add Employee Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Position</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.position}
                    onValueChange={(itemValue) => handleInputChange('position', itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Cashier" value="Cashier" />
                    <Picker.Item label="Manager" value="Manager" />
                    <Picker.Item label="Admin" value="Admin" />
                  </Picker>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contactNumber}
                  onChangeText={(text) => handleInputChange('contactNumber', text)}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date Joined</Text>
                <TextInput
                  style={styles.input}
                  value={formData.dateJoined}
                  onChangeText={(text) => handleInputChange('dateJoined', text)}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Account Status</Text>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </Text>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(value) => handleInputChange('isActive', value)}
                    trackColor={{ false: "#D3D3D3", true: "#AD7F65" }}
                    thumbColor={"#FFFFFF"}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Permissions</Text>
                <View style={styles.permissionsList}>
                  <View style={styles.permissionToggle}>
                    <Text style={styles.permissionLabel}>POS Access</Text>
                    <Switch
                      value={formData.permissions.pos}
                      onValueChange={() => handlePermissionToggle('pos')}
                      trackColor={{ false: "#D3D3D3", true: "#AD7F65" }}
                      thumbColor={"#FFFFFF"}
                    />
                  </View>
                  
                  <View style={styles.permissionToggle}>
                    <Text style={styles.permissionLabel}>Inventory Management</Text>
                    <Switch
                      value={formData.permissions.inventory}
                      onValueChange={() => handlePermissionToggle('inventory')}
                      trackColor={{ false: "#D3D3D3", true: "#AD7F65" }}
                      thumbColor={"#FFFFFF"}
                    />
                  </View>
                  
                  <View style={styles.permissionToggle}>
                    <Text style={styles.permissionLabel}>View Transactions</Text>
                    <Switch
                      value={formData.permissions.viewTransaction}
                      onValueChange={() => handlePermissionToggle('viewTransaction')}
                      trackColor={{ false: "#D3D3D3", true: "#AD7F65" }}
                      thumbColor={"#FFFFFF"}
                    />
                  </View>
                  
                  <View style={styles.permissionToggle}>
                    <Text style={styles.permissionLabel}>Generate Reports</Text>
                    <Switch
                      value={formData.permissions.generateReports}
                      onValueChange={() => handlePermissionToggle('generateReports')}
                      trackColor={{ false: "#D3D3D3", true: "#AD7F65" }}
                      thumbColor={"#FFFFFF"}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>
                  {editingEmployee ? 'Save Changes' : 'Add Employee'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Change Confirmation Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.modalTitle}>
              {selectedEmployee?.isActive ? 'Disable Employee' : 'Enable Employee'}
            </Text>
            <Text style={styles.confirmText}>
              Are you sure you want to {selectedEmployee?.isActive ? 'disable' : 'enable'} {selectedEmployee?.name}?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmActionButton]}
                onPress={confirmStatusChange}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>
                  {selectedEmployee?.isActive ? 'Disable' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingLeft: 8,
    color: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#AD7F65',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  employeeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 360,
    alignSelf: 'center',
  },
  inactiveEmployee: {
    opacity: 0.7,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  employeePosition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  employeeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  employeeDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  permissionsContainer: {
    marginTop: 8,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 12,
    color: '#555',
    marginRight: 6,
  },
  permissionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionGranted: {
    backgroundColor: '#E8F5E9',
  },
  permissionDenied: {
    backgroundColor: '#FFEBEE',
  },
  permissionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
  },
  confirmModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  confirmButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmActionButton: {
    backgroundColor: '#AD7F65',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#555',
  },
  permissionsList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  permissionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#AD7F65',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default RolesAndPermission;