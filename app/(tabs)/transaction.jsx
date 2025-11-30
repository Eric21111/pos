import Header from "@/components/shared/header";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useEffect, useState } from "react";
import {
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(formatDateTime());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(formatDateTime());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Void logs data - moved to VoidLog.jsx

  // Function to get cashier name based on transaction ID (odd/even)
  const getCashierName = (transactionId) => {
    const idNum = parseInt(transactionId.split('-')[1]);
    return idNum % 2 === 0 ? 'Ferrose Marie Obias' : 'Pia Pendergat';
  };

  // Default cashier name (can be used when no transaction is selected)
  const defaultCashier = 'Ferrose Marie Obias';

  const [transactions, setTransactions] = useState([
    { 
      id: "TRX-101", 
      date: "October 1, 2027, 10:30 AM", 
      status: "Paid",
      timestamp: new Date(2027, 9, 1, 10, 30).getTime()
    },
    { 
      id: "TRX-103", 
      date: "October 5, 2027, 2:15 PM", 
      status: "Returned",
      timestamp: new Date(2027, 9, 5, 14, 15).getTime()
    },
    { 
      id: "TRX-104", 
      date: "October 7, 2027, 9:45 AM", 
      status: "Paid",
      timestamp: new Date(2027, 9, 7, 9, 45).getTime()
    },
    { 
      id: "TRX-105", 
      date: "October 9, 2027, 3:20 PM", 
      status: "Paid",
      timestamp: new Date(2027, 9, 9, 15, 20).getTime()
    },
    { 
      id: "TRX-106", 
      date: "October 10, 2027, 11:10 AM", 
      status: "Paid",
      timestamp: new Date(2027, 9, 10, 11, 10).getTime()
    },
    { 
      id: "TRX-107", 
      date: "October 11, 2027, 4:30 PM", 
      status: "Returned",
      timestamp: new Date(2027, 9, 11, 16, 30).getTime()
    },
  ]);

  const transactionDetails = {
    "TRX-101": [
      { item: "Protein Shake", qty: 2, price: 150 },
      { item: "Workout Gloves", qty: 1, price: 250 },
    ],
    "TRX-103": [
      { item: "Shoes", qty: 1, price: 1800 },
      { item: "Cap", qty: 1, price: 300 },
    ],
    "TRX-104": [
      { item: "Whey Protein", qty: 1, price: 1200 },
      { item: "Shaker Bottle", qty: 1, price: 250 },
    ],
    "TRX-105": [
      { item: "Resistance Band", qty: 2, price: 200 },
      { item: "Floral Dress", qty: 1, price: 150 },
      { item: "Checker Dress", qty: 1, price: 150 },
    ],
    "TRX-106": [
      { item: "Running Shoes", qty: 1, price: 2500 },
      { item: "Socks", qty: 2, price: 100 },
    ],
    "TRX-107": [
      { item: "Yoga Mat", qty: 1, price: 800 },
      { item: "Water Bottle", qty: 1, price: 300 },
    ],
  };

  const filteredTransactions = transactions
    .filter(
      (t) =>
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.date.toLowerCase().includes(search.toLowerCase()) ||
        t.status.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp in descending order

  const handleView = (item) => {
    setSelectedTransaction(item);
    setModalVisible(true);
  };

  const calculateTotals = (details) => {
    const subtotal = details.reduce((sum, d) => sum + d.qty * d.price, 0);
    const discount = subtotal * 0.1;
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const handlePrint = async () => {
    if (!selectedTransaction) return;

    const details = transactionDetails[selectedTransaction.id] || [];
    const totals = calculateTotals(details);

    let htmlContent = `
      <div style="width:220px; font-family: monospace; padding:10px;">
        <h2 style="text-align:center; margin:0; font-size: 18px;">CREATE YOUR STYLE</h2>
        <p style="text-align:center; margin:2px 0; font-size: 10px;">KM 7 Pasonanca, Zamboanga City</p>
        <p style="text-align:center; margin:0;">Cashier: ${getCashierName(selectedTransaction.id)}</p>
        <p style="text-align:center; margin:0;">Date & Time: ${
          selectedTransaction.date
        }</p>
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
            ${details
              .map(
                (d) =>
                  `<tr>
                    <td>${d.item}</td>
                    <td style="text-align:center;">${d.qty}</td>
                    <td style="text-align:right;">₱${d.price}</td>
                  </tr>`
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
    const statusColor = item.status === "Paid"
      ? "#09A046"
      : item.status === "Returned"
        ? "#FF8C00"
        : "#C80000";

    const details = transactionDetails[item.id] || [];
    const totals = calculateTotals(details);

    return (
      <TouchableOpacity
        style={styles.logItem}
        onPress={() => handleView(item)}
      >
        <View style={styles.logHeader}>
          <Text style={styles.transactionId}>{item.id}</Text>
          <Text style={styles.date}>
              {getCashierName(item.id)}
          </Text>
        </View>

        <View style={styles.logDetails}>
          <Text style={styles.items}>
            {details.map(d => `${d.qty}x ${d.item}`).join(', ')}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.logFooter}>
          <Text style={styles.total}>₱{totals.total.toFixed(2)}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
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
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>— No transaction found —</Text>
                </View>
              }
            />
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
                  {selectedTransaction.date}
                </Text>
                <Text style={styles.receiptStatus}>
                  Status: {selectedTransaction.status}
                </Text>
                <Text style={styles.cashierLabel}>Cashier: {getCashierName(selectedTransaction.id)}</Text>

                <ScrollView style={{ marginVertical: 10, maxHeight: 250 }}>
                  {(transactionDetails[selectedTransaction.id] || []).map(
                    (d, i) => (
                      <View key={i} style={styles.receiptRow}>
                        <Text style={styles.receiptItem}>{d.item}</Text>
                        <Text style={styles.receiptQty}>{d.qty}</Text>
                        <Text style={styles.receiptPrice}>₱{d.price}</Text>
                      </View>
                    )
                  )}
                </ScrollView>

                <View style={styles.receiptTotals}>
                  {(() => {
                    const totals = calculateTotals(
                      transactionDetails[selectedTransaction.id] || []
                    );
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
