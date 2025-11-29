import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, FlatList, LayoutAnimation, Modal, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, UIManager, View } from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Mock data for archived items
const archivedItems = [
  {
    id: 1,
    sku: 'ARC001',
    name: 'Winter Coat',
    brand: 'North Face',
    category: 'Tops',
    price: 7999.99,
    stock: 0,
    dateArchived: '2025-10-15'
  },
  {
    id: 2,
    sku: 'ARC002',
    name: 'Leather Boots',
    brand: 'Dr. Martens',
    category: 'Shoes',
    price: 6499.99,
    stock: 0,
    dateArchived: '2025-11-01'
  },
  {
    id: 3,
    sku: 'ARC003',
    name: 'Graphic T-Shirt',
    brand: 'Supreme',
    category: 'Tops',
    price: 2499.99,
    stock: 0,
    dateArchived: '2025-11-10'
  },
];

const CollapsibleItem = ({ item, isExpanded, onPress, onRestore }) => {
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, animation]);

  const height = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100], // Adjust based on your content height
  });

  const handleRestoreClick = (e) => {
    e.stopPropagation(); // Prevent toggling the expand/collapse
    onRestore(item.id);
  };

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemHeader} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.itemInfo}>
          <View style={styles.itemHeaderRow}>
            <View style={styles.nameAndRestoreContainer}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <TouchableOpacity 
                onPress={handleRestoreClick}
                style={styles.restoreIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="refresh" size={20} color="#3498db" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.itemSku}>SKU: {item.sku}</Text>
          <Text style={styles.itemDate}>Archived: {item.dateArchived}</Text>
        </View>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>
      
      <Animated.View style={[styles.collapsibleContent, { height }]}>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Brand:</Text>
            <Text style={styles.detailValue}>{item.brand}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{item.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={[styles.detailValue, styles.price]}>
              ₱{item.price.toFixed(2)}
            </Text>
          </View>
          <View style={styles.actionsContainer}>
            <Text style={styles.restoreLabel}>Restore this item?</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRestoreClick}
              activeOpacity={0.9}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Restore Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default function ItemArchive() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [itemToRestore, setItemToRestore] = useState(null);

  const toggleItem = (itemId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Sort items based on selected filter
  const getSortedItems = () => {
    const items = [...archivedItems];
    
    switch(sortBy) {
      case 'a-z':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return items.sort((a, b) => b.name.localeCompare(a.name));
      case 'newest':
        return items.sort((a, b) => new Date(b.dateArchived) - new Date(a.dateArchived));
      case 'oldest':
        return items.sort((a, b) => new Date(a.dateArchived) - new Date(b.dateArchived));
      default:
        return items;
    }
  };

  const renderFilterButton = (label, value) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.filterButton,
        sortBy === value && styles.activeFilter
      ]}
      onPress={() => {
        setSortBy(value);
        setIsFilterVisible(false);
      }}
    >
      <Text style={[
        styles.filterButtonText,
        sortBy === value && styles.activeFilterText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <CollapsibleItem
      item={item}
      isExpanded={!!expandedItems[item.id]}
      onPress={() => toggleItem(item.id)}
      onRestore={(itemId) => handleRestore(itemId)}
    />
  );

  const handleRestore = (itemId) => {
    setItemToRestore(itemId);
    setShowRestoreModal(true);
  };

  const confirmRestore = () => {
    console.log('Restoring item:', itemToRestore);
    // Add your restore logic here
    setShowRestoreModal(false);
    setItemToRestore(null);
  };

  const cancelRestore = () => {
    setShowRestoreModal(false);
    setItemToRestore(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.filterToggle}
          onPress={() => setIsFilterVisible(!isFilterVisible)}
        >
          <Ionicons name="filter" size={20} color="#333" />
          <Text style={styles.filterToggleText}>Sort</Text>
          <Ionicons 
            name={isFilterVisible ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      {isFilterVisible && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Sort By:</Text>
          <View style={styles.filterButtons}>
            {renderFilterButton('A to Z', 'a-z')}
            {renderFilterButton('Z to A', 'z-a')}
            {renderFilterButton('Newest First', 'newest')}
            {renderFilterButton('Oldest First', 'oldest')}
          </View>
        </View>
      )}

      <FlatList
        data={getSortedItems()}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />

      {/* Restore Confirmation Modal */}
      <Modal
        visible={showRestoreModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelRestore}
      >
        <TouchableWithoutFeedback onPress={cancelRestore}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Confirm Restore</Text>
                <Text style={styles.modalText}>
                  Are you sure you want to restore this item? It will be moved back to your inventory.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={cancelRestore}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={confirmRestore}
                  >
                    <Text style={styles.confirmButtonText}>Restore</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemHeaderRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameAndRestoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restoreIcon: {
    marginLeft: 8,
    padding: 4,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginLeft: 'auto',
    marginTop: 12,
  },
  filterToggleText: {
    marginLeft: 6,
    marginRight: 6,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  activeFilter: {
    backgroundColor: '#5D4037',
    borderColor: '#5D4037',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  collapsibleContent: {
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  detailsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  price: {
    fontWeight: '600',
    color: '#2ecc71',
  },
  actionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2ecc71',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  restoreLabel: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  // Modal styles
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
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  modalText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
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
  confirmButton: {
    backgroundColor: '#8B4513',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});
