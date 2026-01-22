import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/shared/header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useFocusEffect } from "@react-navigation/native";
import { transactionAPI, productAPI } from "../../services/api";

export default function Dashboard() {
  const [chartType, setChartType] = useState("daily");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dashboard statistics state
  const [dashboardStats, setDashboardStats] = useState({
    totalSalesToday: 0,
    totalTransactions: 0,
    averageTransactionValue: 0,
    lowStockItems: 0,
  });

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncModalVisible, setSyncModalVisible] = useState(false);

  // Toast animation
  const toastTranslate = useRef(new Animated.Value(-60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Fetch dashboard statistics from API
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch transactions for today's stats
      const transactionsResponse = await transactionAPI.getAll({ limit: '1000' });
      const productsResponse = await productAPI.getAll();

      if (transactionsResponse.success && transactionsResponse.data) {
        const transactions = transactionsResponse.data;

        // Filter today's transactions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.createdAt || t.date);
          transactionDate.setHours(0, 0, 0, 0);
          return transactionDate.getTime() === today.getTime() &&
            t.status !== 'Voided' &&
            t.paymentMethod !== 'return';
        });

        // Calculate total sales today
        const totalSalesToday = todayTransactions.reduce((sum, t) => {
          return sum + (t.totalAmount || t.total || 0);
        }, 0);

        // Calculate average transaction value
        const averageTransactionValue = todayTransactions.length > 0
          ? totalSalesToday / todayTransactions.length
          : 0;

        // Count low stock items (stock < 5)
        let lowStockItems = 0;
        if (productsResponse.success && productsResponse.data) {
          lowStockItems = productsResponse.data.filter(p => {
            const stock = p.stock || p.quantity || 0;
            return stock > 0 && stock < 5;
          }).length;
        }

        setDashboardStats({
          totalSalesToday,
          totalTransactions: todayTransactions.length,
          averageTransactionValue,
          lowStockItems,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setSyncMessage("Syncing...");
    setSyncModalVisible(true);

    try {
      await fetchDashboardStats();
      setSyncMessage("Sync complete");
    } catch (error) {
      setSyncMessage("Sync failed");
    } finally {
      setRefreshing(false);
      setTimeout(() => setSyncModalVisible(false), 1200);
    }
  };

  useEffect(() => {
    if (syncModalVisible) {
      Animated.parallel([
        Animated.timing(toastTranslate, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(toastTranslate, {
          toValue: -20,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [syncModalVisible]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("currentEmployee");
          if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
          }
          await fetchDashboardStats();
        } catch (error) {
          console.warn("Failed to load data:", error?.message);
        }
      };
      loadData();
    }, [])
  );

  const welcomeName =
    currentUser?.firstName ||
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "Owner";
  const welcomeSubtitle = currentUser
    ? `Logged in as ${currentUser.name || welcomeName}`
    : "Here's your overview today";

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const chartData = {
    daily: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ data: [30, 45, 28, 80, 99, 43, 50] }],
    },
    monthly: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [{ data: [300, 450, 280, 800, 990, 430, 500, 650] }],
    },
    yearly: {
      labels: ["2021", "2022", "2023", "2024", "2025"],
      datasets: [{ data: [5000, 6500, 7000, 9000, 11000] }],
    },
  };

  // Platform-specific shadow styles
  const getShadowStyle = () => {
    if (Platform.OS === 'web') {
      return { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)' };
    }
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    };
  };

  return (
    <View style={styles.container}>
      <Header />
      <Animated.View
        style={[
          styles.toastContainer,
          {
            transform: [
              { translateY: toastTranslate },
              { scale: toastOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }
            ],
            opacity: toastOpacity,
          },
          getShadowStyle(),
        ]}
      >
        <View style={styles.toastInner}>
          <View style={styles.toastContent}>
            <Text style={styles.toastText}>{syncMessage}</Text>
          </View>
          <TouchableOpacity onPress={() => setSyncModalVisible(false)} style={styles.toastCloseButton}>
            <Text style={styles.toastCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.whitecard}>
        <ScrollView
          style={styles.main}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#AD7F65']} tintColor="#AD7F65" />}
        >
          <View style={styles.welcomeCard}>
            {currentUser?.profileImage || currentUser?.image ? (
              <Image source={{ uri: currentUser.profileImage || currentUser.image }} style={styles.profileImage} />
            ) : (
              <Image source={require("../(tabs)/iconz/default.jpeg")} style={styles.profileImage} />
            )}
            <View style={styles.welcomesub}>
              <Text style={styles.welcomeText}>Welcome back, {welcomeName}</Text>
              <Text style={styles.subtext}>{welcomeSubtitle}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#AD7F65" />
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatCurrency(dashboardStats.totalSalesToday)}</Text>
                  <Text style={styles.statLabel}>Total Sales Today</Text>
                  <Text style={styles.statDesc}>Total sales from all transactions</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{dashboardStats.totalTransactions}</Text>
                  <Text style={styles.statLabel}>Total Transactions</Text>
                  <Text style={styles.statDesc}>Sales made today</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatCurrency(dashboardStats.averageTransactionValue)}</Text>
                  <Text style={styles.statLabel}>Average Transaction Value</Text>
                  <Text style={styles.statDesc}>Average customer spend today</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, dashboardStats.lowStockItems > 0 && styles.warningValue]}>
                    {dashboardStats.lowStockItems}
                  </Text>
                  <Text style={styles.statLabel}>Low Stock Items</Text>
                  <Text style={styles.statDesc}>Products needing restock</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Sales Over Time</Text>
            <View style={styles.buttonContainer}>
              {["daily", "monthly", "yearly"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.button, chartType === type && styles.activeButton]}
                  onPress={() => setChartType(type)}
                >
                  <Text style={[styles.buttonText, chartType === type && styles.activeButtonText]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <LineChart
            data={chartData[chartType]}
            width={350}
            height={220}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(173, 127, 101, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" }
            }}
            bezier
            style={[styles.chart, { marginBottom: 16 }]}
            withVerticalLines={false}
            withInnerLines={false}
            withShadow={false}
            fromZero
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#53321c" },
  whitecard: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 2,
  },
  main: { width: "100%", paddingHorizontal: 16 },
  chart: { marginTop: 8, borderRadius: 12, alignSelf: 'center' },
  loadingContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  toastContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#53321c',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  toastContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500', lineHeight: 20, marginLeft: 10 },
  toastCloseButton: { marginLeft: 12, padding: 4, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  toastCloseText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, lineHeight: 16, fontWeight: '600' },
  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f2ef",
    padding: 24,
    borderRadius: 18,
    marginBottom: 20,
    marginTop: 10,
    elevation: 3,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  profileImage: { width: 70, height: 70, borderRadius: 40, marginRight: 16, borderWidth: 3, borderColor: 'rgba(255, 255, 255, 0.2)' },
  welcomesub: { flexDirection: "column", flex: 1 },
  welcomeText: { fontSize: 22, fontWeight: "800", color: "#53321c", marginBottom: 4 },
  subtext: { fontSize: 15, color: "#53321c", opacity: 0.9 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: "#f7f2ef", padding: 14, borderRadius: 14, marginHorizontal: 6, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#53321c" },
  warningValue: { color: "#DC2626" },
  statLabel: { fontSize: 13, marginTop: 4, fontWeight: "600", color: "#7c5a43" },
  statDesc: { fontSize: 12, marginTop: 2, color: "#8b776a" },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 18, fontWeight: '700', color: '#53321c' },
  buttonContainer: { flexDirection: "row" },
  button: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginLeft: 6, backgroundColor: "#e4d7ce" },
  activeButton: { backgroundColor: "#AD7F65" },
  buttonText: { fontSize: 13, color: "#53321c", fontWeight: "600" },
  activeButtonText: { color: "#fff" },
});
