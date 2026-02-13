import AddItem from "@/app/AddItem";
import Header from "@/components/shared/header";
import { useData } from "@/context/DataContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  AppState
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

// Table View Component
const InventoryTable = ({ items = [], onBack, onEditItem, onRefresh, loading }) => {
  useEffect(() => {
    // Lock to landscape
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  const [menuVisible, setMenuVisible] = useState(null);

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
    const itemId = item._id || item.id || '';
    const sku = item.sku || 'N/A';
    const name = item.name || 'No Name';
    const brand = item.brand || 'N/A';
    const category = item.category || 'N/A';
    const price = item.price || 0;
    const stock = item.stock || item.quantity || 0;
    const dateAdded = item.dateAdded || item.createdAt ?
      new Date(item.dateAdded || item.createdAt).toLocaleDateString() : 'N/A';

    const isMenuVisible = menuVisible === itemId;

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
              onPress={() => toggleMenu(itemId)}
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
                    onPress={() => handleMenuAction(menuItem.value, itemId)}
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

  const handleAction = async (action, itemId) => {
    const item = items.find(item => (item._id || item.id) === itemId);

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
            onPress: async () => {
              try {
                // Archive the item using API
                const { archiveAPI } = require('../../services/api');
                await archiveAPI.archive({
                  productId: item._id || item.id,
                  productName: item.name,
                  reason: 'Archived from mobile app'
                });
                Alert.alert('Success', 'Item archived successfully');
                // Refresh the table data
                fetchTableData();
              } catch (error) {
                Alert.alert('Error', 'Failed to archive item: ' + error.message);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      console.log(`${action} item ${itemId}`);
      // Handle other actions (stock in/out) - can be implemented later
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => (item._id || item.id || Math.random()).toString()}
          style={styles.tableList}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              colors={['#8B4513']}
              tintColor="#8B4513"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

// Constants for optimization
const STALE_TIME = 30000; // 30 seconds - data considered stale after this
const MIN_FETCH_INTERVAL = 5000; // 5 seconds - minimum time between fetches

export default function Inventory() {
  const router = useRouter();
  const { products: cachedProducts, productsLoading, fetchProducts: fetchCachedProducts, invalidateCache } = useData();

  const [showTableView, setShowTableView] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Optimization refs
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);
  const appState = useRef(AppState.currentState);

  // Reset to portrait when component unmounts
  useEffect(() => {
    return () => {
      if (Platform.OS !== 'web') {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      }
    };
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // App coming to foreground - check if data is stale
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const timeSinceLastFetch = Date.now() - lastFetchTime.current;
        if (timeSinceLastFetch > STALE_TIME) {
          fetchProductsOptimized(true);
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, []);

  const normalizeProduct = useCallback((product = {}) => {
    return {
      ...product,
      name: product.name || product.itemName || 'No Name',
      brand: product.brand || product.brandName || 'N/A',
      price: product.price ?? product.itemPrice ?? 0,
      stock: product.stock ?? product.currentStock ?? 0,
      category: product.category || 'Uncategorized',
      sku: product.sku || 'N/A',
      itemImage: product.itemImage || product.image || '',
      dateAdded: product.dateAdded || product.createdAt || product.updatedAt || null,
      costPrice: product.costPrice ?? 0,
    };
  }, []);

  // Memoized normalized products
  const products = useMemo(() => {
    return cachedProducts.map(normalizeProduct);
  }, [cachedProducts, normalizeProduct]);

  // Helper function for date formatting - defined before useMemo that uses it
  const formatDateAdded = useCallback((date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const itemDate = new Date(date);
    const diffTime = Math.abs(now - itemDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return itemDate.toLocaleDateString();
  }, []);

  // Memoized inventory stats
  const inventoryStats = useMemo(() => {
    const totalItems = products.length;
    const inStock = products.filter(p => (p.stock || 0) > 0).length;
    const lowStock = products.filter(p => {
      const stock = p.stock || 0;
      return stock > 0 && stock < 5;
    }).length;
    const outOfStock = products.filter(p => (p.stock || 0) === 0).length;
    const inventoryValue = products.reduce((sum, p) => {
      return sum + ((p.price || 0) * (p.stock || 0));
    }, 0);

    const totalCostValue = products.reduce((sum, p) => {
      return sum + ((p.costPrice || 0) * (p.stock || 0));
    }, 0);

    const grossProfit = inventoryValue - totalCostValue;
    const grossMargin = inventoryValue > 0 ? (grossProfit / inventoryValue) * 100 : 0;

    return { totalItems, inStock, lowStock, outOfStock, inventoryValue, totalCostValue, grossMargin };
  }, [products]);

  // Memoized recently added items
  const recentlyAddedItems = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.dateAdded || 0);
        const dateB = new Date(b.createdAt || b.dateAdded || 0);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(p => ({
        id: p._id || p.id,
        name: p.name,
        category: p.category,
        stock: p.stock || 0,
        dateAdded: formatDateAdded(p.createdAt || p.dateAdded)
      }));
  }, [products, formatDateAdded]);

  const loadingProducts = productsLoading && initialLoad;

  // Optimized fetch function with debouncing and stale check
  const fetchProductsOptimized = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;

    // Prevent concurrent fetches
    if (isFetching.current) {
      return;
    }

    // Skip if fetched recently (unless forced)
    if (!forceRefresh && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      return;
    }

    // Skip if data is fresh and not forced
    if (!forceRefresh && timeSinceLastFetch < STALE_TIME && cachedProducts.length > 0) {
      return;
    }

    try {
      isFetching.current = true;

      if (forceRefresh) {
        invalidateCache('products');
      }

      await fetchCachedProducts(forceRefresh);
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      isFetching.current = false;
    }
  }, [invalidateCache, fetchCachedProducts, cachedProducts.length]);

  // Load products on focus with optimization
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        // Only fetch if data is stale or empty
        const timeSinceLastFetch = Date.now() - lastFetchTime.current;
        const shouldFetch = cachedProducts.length === 0 || timeSinceLastFetch > STALE_TIME;

        if (shouldFetch) {
          await fetchProductsOptimized(false);
        }
        setInitialLoad(false);
      };
      loadData();
    }, [fetchProductsOptimized, cachedProducts.length])
  );

  // Handle manual refresh (always force)
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    await fetchProductsOptimized(forceRefresh);
  }, [fetchProductsOptimized]);

  const [editingItem, setEditingItem] = useState(null);

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowAddItem(true);
  };

  const handleAddItemBack = () => {
    setShowAddItem(false);
    setEditingItem(null);
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      lastFetchTime.current = 0; // Reset to force fetch
      await fetchProducts(true); // Force refresh
    } finally {
      setRefreshing(false);
    }
  }, [fetchProducts]);

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
        items={products}
        loading={loadingProducts}
        onBack={() => setShowTableView(false)}
        onEditItem={handleEditItem}
        onRefresh={fetchProducts}
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#8B4513']}
                tintColor="#8B4513"
              />
            }
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

              {/* <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#3E2723', flex: 1 }]}
              onPress={() => router.push('/ItemArchive')}
            >
              <Ionicons name="archive" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Item Archive</Text>
            </TouchableOpacity> */}
            </View>

            {/* INVENTORY VALUE CARD */}
            <View style={styles.card}>
              <Text style={styles.mainValue}>₱{inventoryStats.inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.title}>Inventory Value</Text>

              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.subValue}>₱{inventoryStats.totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  <Text style={styles.subLabel}>Total Cost Value</Text>
                </View>
                <View style={styles.column}>
                  <Text style={[styles.subValue, { color: inventoryStats.grossMargin >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                    {inventoryStats.grossMargin.toFixed(1)}%
                  </Text>
                  <Text style={styles.subLabel}>Gross Profit Margin</Text>
                </View>
              </View>
            </View>

            {/* SUMMARY STATS */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: "#E74C3C" }]}>
                <Text style={styles.statValue}>{inventoryStats.totalItems}</Text>
                <Text style={styles.statLabel}>Total Item</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: "#3498DB" }]}>
                <Text style={styles.statValue}>{inventoryStats.inStock}</Text>
                <Text style={styles.statLabel}>In Stock</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: "#F1C40F" }]}>
                <Text style={styles.statValue}>{inventoryStats.lowStock}</Text>
                <Text style={styles.statLabel}>Low Stock</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: "#2ECC71" }]}>
                <Text style={styles.statValue}>{inventoryStats.outOfStock}</Text>
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

            {/* ALL PRODUCTS LIST */}
            <View style={styles.allProductsContainer}>
              <Text style={styles.coltitle}>All Products</Text>
              <Text style={styles.colsubtitle}>
                Showing {products.length} items from local database
              </Text>
              {products.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No products found.</Text>
                </View>
              ) : (
                products.map((product) => (
                  <View key={(product._id || product.id || Math.random()).toString()} style={styles.productListItem}>
                    <View>
                      <Text style={styles.productName}>{product.name || 'Unnamed Product'}</Text>
                      <Text style={styles.productMeta}>
                        {product.category || 'Uncategorized'} • SKU: {product.sku || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.productRight}>
                      <Text style={styles.productPrice}>₱{Number(product.price || 0).toFixed(2)}</Text>
                      <Text style={[
                        styles.productStock,
                        (product.stock || 0) < 5 ? styles.lowStock : null
                      ]}>
                        {product.stock || 0} in stock
                      </Text>
                    </View>
                  </View>
                ))
              )}
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
    fontSize: 13, fontWeight: "600", color: "#333"
  },
  colsubtitle: {
    color: "#999", fontSize: 11, marginTop: 2
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  allProductsContainer: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    elevation: 1,
    marginBottom: 25,
  },
  productListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4037',
  },
  productStock: {
    fontSize: 12,
    color: '#0369A1',
    marginTop: 2,
  },
  lowStock: {
    color: '#DC2626',
    fontWeight: '600',
  },
});
