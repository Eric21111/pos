import Header from "@/components/shared/header";
import { useData } from "@/context/DataContext";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

// Function to format date and time
const formatDateTime = (date = new Date()) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
};

export default function Transaction() {
  const { transactions: cachedTransactions, transactionsLoading, fetchTransactions: fetchCachedTransactions, invalidateCache } = useData();
  
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(formatDateTime());
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Filter transactions based on search and exclude voided/return transactions
  const transactions = useMemo(() => {
    const filtered = cachedTransactions.filter(t =>
      (t.paymentMethod !== 'return' || !t.originalTransactionId) &&
      t.status !== 'Voided'
    );
    
    if (!search) return filtered;
    
    const searchLower = search.toLowerCase();
    return filtered.filter(t => 
      t.transactionId?.toLowerCase().includes(searchLower) ||
      t.customerName?.toLowerCase().includes(searchLower) ||
      t.items?.some(item => item.name?.toLowerCase().includes(searchLower))
    );
  }, [cachedTransactions, search]);

  const loading = transactionsLoading && initialLoad;

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(formatDateTime());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Load transactions on focus (uses cached data)
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await fetchCachedTransactions(false); // Uses cache if valid
        setInitialLoad(false);
      };
      loadData();
    }, [fetchCachedTransactions])
  );

  // Handle manual refresh - force fetch new data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      invalidateCache('transactions');
      await fetchCachedTransactions(true);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setRefreshing(false);
    }
  }, [invalidateCache, fetchCachedTransactions]);

  // Function to get cashier name from transaction
  const getCashierName = (transaction) => {
    return transaction.performedByName || 
           transaction.userName || 
           transaction.user?.name || 
           'Unknown';
  };

  const filteredTransactions = transactions
    .filter(
      (t) => {
        const searchLower = search.toLowerCase();
        const receiptNo = t.receiptNo || t._id || '';
        const date = t.createdAt || t.date || '';
        const status = t.status || '';
        return (
          receiptNo.toLowerCase().includes(searchLower) ||
          date.toLowerCase().includes(searchLower) ||
          status.toLowerCase().includes(searchLower)
        );
      }
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.createdAt || b.date || 0).getTime();
      return dateB - dateA;
    });

  const handleView = (item) => {
    setSelectedTransaction(item);
    setModalVisible(true);
  };

  const calculateTotals = (transaction) => {
    const items = transaction.items || [];
    const subtotal = items.reduce((sum, item) => {
      const qty = item.quantity || item.qty || 0;
      const price = item.price || item.unitPrice || 0;
      return sum + (qty * price);
    }, 0);
    const discount = transaction.discountAmount || transaction.discount || 0;
    const total = transaction.totalAmount || transaction.total || subtotal - discount;
    return { subtotal, discount, total };
  };

  const handlePrint = async () => {
    if (!selectedTransaction) return;

    const items = selectedTransaction.items || [];
    const totals = calculateTotals(selectedTransaction);

    let htmlContent = `
      <div style="width:220px; font-family: monospace; padding:10px;">
        <h2 style="text-align:center; margin:0; font-size: 18px;">CREATE YOUR STYLE</h2>
        <p style="text-align:center; margin:2px 0; font-size: 10px;">KM 7 Pasonanca, Zamboanga City</p>
        <p style="text-align:center; margin:0;">Cashier: ${getCashierName(selectedTransaction)}</p>
        <p style="text-align:center; margin:0;">Date & Time: ${
          new Date(selectedTransaction.createdAt || selectedTransaction.date).toLocaleString()
        }</p>
        <p style="text-align:center; margin:0;">Receipt No: ${selectedTransaction.receiptNo || selectedTransaction._id}</p>
        <p style="text-align:center; margin:0;">Status: ${
          selectedTransaction.status
        }</p>
        <hr style="border:1px dashed #000;"/>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align:left;">Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => {
                  const name = item.name || item.productName || 'Unknown';
                  const qty = item.quantity || item.qty || 0;
                  const price = item.price || item.unitPrice || 0;
                  return `<tr>
                    <td>${name}</td>
                    <td style="text-align:center;">${qty}</td>
                    <td style="text-align:right;">₱${price.toFixed(2)}</td>
                  </tr>`;
                }
              )
              .join("")}
          </tbody>
        </table>
        <hr style="border:1px dashed #000;"/>
        <p style="text-align:right; margin:0;">Subtotal: ₱${totals.subtotal.toFixed(
          2
        )}</p>
        <p style="text-align:right; margin:0;">Discount: ₱${totals.discount.toFixed(
          2
        )}</p>
        <p style="text-align:right; font-weight:bold; margin:0;">Total: ₱${totals.total.toFixed(
          2
        )}</p>
        <hr style="border:1px dashed #000;"/>
        <p style="text-align:center; font-style:italic; margin:0;">This is not an official receipt</p>
        <p style="text-align:center; margin-top:10px;">Thank you for your purchase!</p>
      </div>
    `;

    try {
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      alert("Print Error: " + error.message);
    }
  };

  const renderItem = ({ item }) => {
    const status = item.status || 'Completed';
    const statusColor = status === "Completed" || status === "Paid"
      ? "#09A046"
      : status === "Returned"
        ? "#FF8C00"
        : "#C80000";

    const totals = calculateTotals(item);
    const receiptNo = item.receiptNo || item._id || 'N/A';
    const date = new Date(item.createdAt || item.date || Date.now()).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const items = item.items || [];

    return (
      <TouchableOpacity
        style={styles.logItem}
        onPress={() => handleView(item)}
      >
        <View style={styles.logHeader}>
          <Text style={styles.transactionId}>{receiptNo}</Text>
          <Text style={styles.date}>
              {getCashierName(item)}
          </Text>
        </View>

        <View style={styles.logDetails}>
          {items.length > 0 && (
            <Text style={styles.items}>
              {items.map((d, idx) => {
                const name = d.itemName || d.name || d.productName || 'Unknown';
                const qty = d.quantity || d.qty || 0;
                return `${qty}x ${name}`;
              }).join(', ')}
            </Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.logFooter}>
          <Text style={styles.total}>₱{totals.total.toFixed(2)}</Text>
          <Text style={styles.transactionDate}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.whitecard}>
        <SafeAreaView style={{ flex: 1, width: "100%" }}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#AD7F65"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search transactions..."
              placeholderTextColor="#B8A69B"
              style={styles.searchBox}
              value={search}
              onChangeText={setSearch}
              selectionColor="#AD7F65"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color="#B8A69B" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.listWrapper}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#AD7F65" />
                <Text style={styles.loadingText}>Loading transactions...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#AD7F65']}
                    tintColor="#AD7F65"
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>— No transaction found —</Text>
                  </View>
                }
              />
            )}
          </View>
        </SafeAreaView>
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedTransaction && (
              <>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close-circle" size={28} color="#AD7F65" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.receiptHeader}>CREATE YOUR STYLE</Text>
                <Text style={styles.locationText}>KM 7 Pasonanca, Zamboanga City</Text>
                <Text style={styles.receiptDate}>
                  {new Date(selectedTransaction.createdAt || selectedTransaction.date).toLocaleString()}
                </Text>
                <Text style={styles.receiptStatus}>
                  Status: {selectedTransaction.status}
                </Text>
                <Text style={styles.cashierLabel}>Receipt No: {selectedTransaction.receiptNo || selectedTransaction._id}</Text>
                <Text style={styles.cashierLabel}>Cashier: {getCashierName(selectedTransaction)}</Text>

                <ScrollView style={{ marginVertical: 10, maxHeight: 250 }}>
                  {(selectedTransaction.items || []).map(
                    (item, i) => {
                      const name = item.itemName || item.name || item.productName || 'Unknown';
                      const qty = item.quantity || item.qty || 0;
                      const price = item.price || item.unitPrice || 0;
                      return (
                        <View key={i} style={styles.receiptRow}>
                          <Text style={styles.receiptItem}>{name}</Text>
                          <Text style={styles.receiptQty}>{qty}</Text>
                          <Text style={styles.receiptPrice}>₱{price.toFixed(2)}</Text>
                        </View>
                      );
                    }
                  )}
                </ScrollView>

                <View style={styles.receiptTotals}>
                  {(() => {
                    const totals = calculateTotals(selectedTransaction);
                    return (
                      <>
                        <Text>Subtotal: ₱{totals.subtotal.toFixed(2)}</Text>
                        <Text>Discount: ₱{totals.discount.toFixed(2)}</Text>
                        <Text style={{ fontWeight: "bold" }}>
                          Total: ₱{totals.total.toFixed(2)}
                        </Text>
                      </>
                    );
                  })()}
                </View>

                <View style={styles.receiptFooter}>
                  <Text style={styles.receiptFooterText}>
                    This is not an official receipt
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.printButton,
                    selectedTransaction?.status === "Voided" && styles.disabledButton
                  ]}
                  onPress={selectedTransaction?.status !== "Voided" ? handlePrint : null}
                  disabled={selectedTransaction?.status === "Voided"}
                >
                  <Text style={styles.printButtonText}>
                    {selectedTransaction?.status === "Voided" ? "Cannot Print Voided Receipt" : "Print Receipt"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  whitecard: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 2,
    pointerEvents: "box-none",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: 15,
    marginBottom: 10,
    height: 40,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 4,
    fontSize: 18,
  },
  searchBox: {
    flex: 1,
    height: 35,
    color: '#333',
    fontSize: 13,
    paddingVertical: 0,
    marginLeft: 4,
  },
  clearButton: {
    padding: 4,
  },
  listWrapper: {
    flex: 1,
    padding: 10,
  },
  listContent: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  date: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  logDetails: {
    marginBottom: 10,
  },
  items: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.3,
  },
  transactionDate: {
    fontSize: 12,
    color: "#666",
    textAlign: 'right',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 15,
    padding: 20,
    paddingTop: 50,
    elevation: 10,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'column',
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  receiptHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#AD7F65',
    textAlign: 'center',
    marginBottom: 10,
  },
  receiptDate: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  receiptStatus: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cashierLabel: {
    fontSize: 12,
    color: '#333',
    marginBottom: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
    width: '100%',
  },
  receiptItem: {
    flex: 2,
    fontSize: 14,
  },
  receiptQty: {
    width: 30,
    textAlign: 'center',
    fontSize: 14,
  },
  receiptPrice: {
    width: 60,
    textAlign: 'right',
    fontSize: 14,
  },
  receiptTotals: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    width: '100%',
    marginTop: 10,
    paddingTop: 5,
    marginBottom: 10,
  },
  receiptFooter: {
    marginTop: 10,
  },
  receiptFooterText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  printButton: {
    backgroundColor: '#AD7F65',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 8,
    marginTop: 15,
    width: '95%',
    alignSelf: 'center',
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
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
  receiptPrice: {
    width: 60,
    textAlign: "right",
    fontSize: 14,
  },
  receiptTotals: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    width: "100%",
    marginTop: 10,
    paddingTop: 5,
  },
  buttonRow: {
    flexDirection: "column",
    position: "absolute",
    top: 10,
    right: 10,
    gap: 8,
    alignItems: "center",
  },
  iconButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  printButton: {
    backgroundColor: "#AD7F65",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 8,
    marginTop: 15,
    width: "95%",
    alignSelf: "center",
  },
  printButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
