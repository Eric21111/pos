import AddItem from "@/app/AddItem";
import Header from "@/components/shared/header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Table View Component
const InventoryTable = ({ items, onBack, onEditItem }) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    // Lock to landscape
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      subscription?.remove();
    };
  }, []);

    const tableData = [
    { 
      id: 1, 
      sku: 'DRS001', 
      name: 'Summer Dress', 
      brand: 'ZARA', 
      category: 'Dresses', 
      price: 1299.99, 
      stock: 10, 
      dateAdded: '2025-11-15',
      image: 'https://example.com/dress.jpg'
    },
    { 
      id: 2, 
      sku: 'UKM123', 
      name: 'Denim Jacket', 
      brand: 'Levi\'s', 
      category: 'Tops', 
      price: 2499.99, 
      stock: 5, 
      dateAdded: '2025-11-20',
      image: 'https://example.com/jacket.jpg'
    },
    { 
      id: 3, 
      sku: 'UKF342', 
      name: 'Denim Jacket', 
      brand: 'Levi\'s', 
      category: 'Tops', 
      price: 2499.99, 
      stock: 5, 
      dateAdded: '2025-11-20',
      image: 'https://example.com/jacket.jpg'
    },
    { 
      id: 4, 
      sku: 'ERC144', 
      name: 'Denim Jacket', 
      brand: 'Levi\'s', 
      category: 'Tops', 
      price: 2499.99, 
      stock: 3, 
      dateAdded: '2025-11-20',
      image: 'https://example.com/jacket.jpg'
    },
    { 
      id: 5, 
      sku: 'OBS092', 
      name: 'Denim Jacket', 
      brand: 'Levi\'s', 
      category: 'Tops', 
      price: 2499.99, 
      stock: 5, 
      dateAdded: '2025-11-20',
      image: 'https://example.com/jacket.jpg'
    },
  ];

  const [menuVisible, setMenuVisible] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const menuItems = [
    { 
      value: 'edit', 
      icon: 'pencil',
      iconColor: '#4a90e2',
      bgColor: 'rgba(74, 144, 226, 0.1)'
    },
    { 
      value: 'stockIn', 
      icon: 'add-circle',
      iconColor: '#2ecc71',
      bgColor: 'rgba(46, 204, 113, 0.1)'
    },
    { 
      value: 'stockOut', 
      icon: 'remove-circle',
      iconColor: '#e67e22',
      bgColor: 'rgba(230, 126, 34, 0.1)'
    },
    { 
      value: 'archive', 
      icon: 'archive', 
      iconColor: '#9b59b6',
      bgColor: 'rgba(155, 89, 182, 0.1)'
    }
  ];

  const toggleMenu = (itemId) => {
    setMenuVisible(menuVisible === itemId ? null : itemId);
  };

  const handleMenuAction = (action, itemId) => {
    setMenuVisible(null);
    handleAction(action, itemId);
  };

  const renderItem = ({ item = {} }) => {
    const {
      sku = 'N/A',
      name = 'No Name',
      brand = 'N/A',
      category = 'N/A',
      price = 0,
      stock = 0,
      dateAdded = 'N/A',
      id = ''
    } = item || {};
    
    const isMenuVisible = menuVisible === id;
    
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 0.7 }]}>{sku}</Text>
        <Text style={[styles.tableCell, { flex: 1.3 }]}>{name}</Text>
        <Text style={[styles.tableCell, { flex: 0.9 }]}>{brand}</Text>
        <Text style={[styles.tableCell, { flex: 0.9 }]}>{category}</Text>
        <Text style={[styles.tableCell, { flex: 0.7 }]}>₱{typeof price === 'number' ? price.toFixed(2) : '0.00'}</Text>
        <Text style={[styles.tableCell, { flex: 0.4, color: (stock || 0) < 4 ? '#E74C3C' : '#000' }]}>{stock}</Text>
        <Text style={[styles.tableCell, { flex: 0.7 }]}>{dateAdded}</Text>
        <View style={[styles.tableCell, { flex: 0.8 }]}>
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity 
              onPress={() => toggleMenu(id)}
              style={styles.menuButton}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </TouchableOpacity>
          
          {isMenuVisible && (
            <View style={[styles.menuContainer, { right: 10, top: 30 }]}>
              {menuItems.map((menuItem) => (
                <TouchableOpacity
                  key={menuItem.value}
                  style={[styles.menuItem, { backgroundColor: menuItem.bgColor }]}
                  onPress={() => handleMenuAction(menuItem.value, id)}
                >
                  <Ionicons 
                    name={menuItem.icon} 
                    size={20} 
                    color={menuItem.iconColor} 
                    style={styles.menuIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        </View>
      </View>
    );
  };

  const handleAction = (action, itemId) => {
    const item = tableData.find(item => item.id === itemId);
    
    if (!item) return;
    
    if (action === 'edit') {
      onEditItem(item);
      return;
    }
    
    if (action === 'archive') {
      Alert.alert(
        'Archive Item',
        'Are you sure you want to archive this item?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Archive',
            style: 'destructive',
            onPress: () => {
              // Handle archive logic here
              console.log(`Archiving item ${itemId}`);
              // Add your actual archive logic here
              // For example: archiveItem(itemId);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      console.log(`${action} item ${itemId}`);
      // Handle other actions
    }
  };

  return (
    <SafeAreaView style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <View style={styles.headerLeft} />
        <Text style={styles.tableTitle}>Inventory Table</Text>
        <TouchableOpacity onPress={onBack} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>SKU</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Item Name</Text>
        <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Brand</Text>
        <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Category</Text>
        <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>Price</Text>
        <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>Stock</Text>
        <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>Date Added</Text>
        <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>Actions</Text>
      </View>
      
      <FlatList
        data={tableData}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        style={styles.tableList}
      />
    </SafeAreaView>
  );
};

export default function Inventory() {
  const router = useRouter();
  const [showTableView, setShowTableView] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  
  // Reset to portrait when component unmounts
  useEffect(() => {
    return () => {
      if (Platform.OS !== 'web') {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      }
    };
  }, []);
  const recentlyAddedItems = [
    {
      id: 101,
      name: "Summer Dress",
      category: "Dresses",
      stock: 15,
      dateAdded: "Today",
    },
    {
      id: 102,
      name: "KBB Shirt",
      category: "Tops",
      stock: 8,
      dateAdded: "Today",
    },
    {
      id: 103,
      name: "Eric Pants",
      category: "Bottoms",
      stock: 3,
      dateAdded: "Yesterday",
    },
    {
      id: 104,
      name: "Slim Fit Jeans",
      category: "Bottoms",
      stock: 12,
      dateAdded: "2 days ago",
    },
    {
      id: 105,
      name: "Leather Belt",
      category: "Accessories",
      stock: 20,
      dateAdded: "3 days ago",
    },
  ];


  const [editingItem, setEditingItem] = useState(null);

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowAddItem(true);
  };

  const handleAddItemBack = () => {
    setShowAddItem(false);
    setEditingItem(null);
  };

  if (showAddItem) {
    return (
      <View style={{ flex: 1 }}>
        <AddItem 
          onBack={handleAddItemBack} 
          item={editingItem} 
          isEditing={!!editingItem}
        />
      </View>
    );
  }

  if (showTableView) {
    return (
      <InventoryTable 
        items={recentlyAddedItems} 
        onBack={() => setShowTableView(false)}
        onEditItem={handleEditItem}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
      {/* HEADER */}
      <Header />
      <View style={styles.whitecard}>
        {/* MAIN CONTENT */}
        <ScrollView 
          style={styles.main}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP ACTION BUTTONS */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#8B4513', flex: 1 }]}
              onPress={() => setShowAddItem(true)}
            >
              <Ionicons name="add" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Add Item</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#3E2723', flex: 1 }]}
              onPress={() => router.push('/ItemArchive')}
            >
              <Ionicons name="archive" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Item Archive</Text>
            </TouchableOpacity>
          </View>

          {/* INVENTORY VALUE CARD */}
          <View style={styles.card}>
            <Text style={styles.mainValue}>₱450,000</Text>
            <Text style={styles.title}>Inventory Value</Text>

            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.subValue}>₱65,600</Text>
                <Text style={styles.subLabel}>Cost of Goods Sold</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.subValue}>42%</Text>
                <Text style={styles.subLabel}>Gross Profit Margin</Text>
              </View>
            </View>
          </View>

          {/* SUMMARY STATS */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: "#E74C3C" }]}>
              <Text style={styles.statValue}>430</Text>
              <Text style={styles.statLabel}>Total Item</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#3498DB" }]}>
              <Text style={styles.statValue}>42</Text>
              <Text style={styles.statLabel}>In Stock</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: "#F1C40F" }]}>
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#2ECC71" }]}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Out of Stock</Text>
            </View>
          </View>

          {/* RECENTLY ADDED ITEMS */}
          <View style={styles.recentlyAddedContainer}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.coltitle}>Recently Added Items</Text>
                <Text style={styles.colsubtitle}>
                  Your newly added products
                </Text>
              </View>
            </View>

            {recentlyAddedItems.map((item) => (
              <TouchableOpacity 
                key={item.id.toString()}
                style={styles.recentItemCard}
              >
                <View style={styles.recentItemContent}>
                  <Text style={styles.recentItemName}>{item.name}</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.recentItemCategory}>
                      {item.category}
                    </Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={[styles.stockText, { color: item.stock < 5 ? '#DC2626' : '#0369A1' }]}>
                      {item.stock} in stock
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentItemDate}>{item.dateAdded}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* VIEW INVENTORY BUTTON */}
          <View style={[styles.actionButtonsContainer, { justifyContent: 'center', marginTop: 5, marginBottom: 10 }]}>
            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: '#5D4037', 
                width: '90%',
                maxWidth: '100%',
                paddingVertical: 15
              }]}
              onPress={() => setShowTableView(true)}
            >
              <Ionicons name="grid" size={20} color="#ffffffff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>View Inventory</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
  
    zIndex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#8B4513',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButton: {
    backgroundColor: '#000000ff',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,  // Reduced from 20 to 10 to move it left
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  tableTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F0E5',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E0D9C8',
  },
  tableHeaderCell: {
    fontWeight: '600',
    textAlign: 'left',
    paddingHorizontal: 12,
    color: '#333333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    padding: 10,
    borderRadius: 20,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
    flexDirection: 'row',
    gap: 8,
  },
  menuItem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
  },
  tableCell: {
    padding: 10,
    textAlign: 'left',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    zIndex: 1,
  },
  tableList: {
    flex: 1,
  },
  
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: "#53321c",
  },
  headerBackground: {
    height: 120,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  button: {
    padding: 10,
  },
  buttonImage: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  main: { 
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#f7f2ef",
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  card2: {
    height: 100,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
    marginRight: 20,
    marginLeft: 25,
    padding: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  mainValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#AD7F65",
  },
  whitecard: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 2,
  },
  title: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  column: {
    alignItems: "flex-start",
    flex: 1,
  },
  subValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: 0,
    textAlign: "left",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f7f2ef",
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#53321c",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
    color: "#7c5a43",
  },
  statDesc: {
    fontSize: 12,
    marginTop: 2,
    color: "#8b776a",
  },
  colcontainer: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    elevation: 1,
    marginBottom: 15,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  coltitle: {
     fontSize: 13, fontWeight: "600", color: "#333" },
  colsubtitle: {
     color: "#999", fontSize: 11, marginTop: 2 },
  viewMore: { color: "#AD7F65", fontWeight: "600", fontSize: 12 },
  recentlyAddedContainer: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    elevation: 1,
    marginBottom: 15,
  },
  recentItemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  recentItemContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  recentItemCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  separator: {
    marginHorizontal: 6,
    color: '#D1D5DB',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recentItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  recentItemDate: {
    fontSize: 10,
    color: "#AD7F65",
    fontWeight: "500",
    marginLeft: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerText: { fontSize: 11, color: "#999", fontWeight: "600" },
  rowtext: { fontSize: 12, color: "#333", paddingVertical: 6 },
  statusBadge: {
    backgroundColor: "#FFE8CC",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: "center",
  },
  statusText: { color: "#AD7F65", fontWeight: "600", fontSize: 10 },
  addItemButton: {
    backgroundColor: "#8B4513",
    padding: 15,
    borderRadius: 8,
    margin: 16,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addItemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
