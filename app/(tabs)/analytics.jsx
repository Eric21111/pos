import Header from "@/components/shared/header";
import { useData } from "@/context/DataContext";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import * as XLSX from "xlsx";
import { transactionAPI, productAPI, stockMovementAPI } from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

global.Buffer = Buffer;

// Sample data for products (fallback)
const sampleData = [
  { item: "Product A", quantity: 120, total: 5000, image: require("./iconz/profile3.png") },
  { item: "Product B", quantity: 95, total: 3800, image: require("./iconz/profile3.png") },
  { item: "Product C", quantity: 80, total: 3200, image: require("./iconz/profile3.png") },
  { item: "Product D", quantity: 65, total: 2600, image: require("./iconz/profile3.png") },
  { item: "Product E", quantity: 50, total: 2000, image: require("./iconz/profile3.png") },
];

// Sample low stock data (fallback)
const sampleLowStock = [
  { id: 1, name: "Hair Serum", stocks: 5, status: "Low Stock" },
  { id: 2, name: "Shampoo 500ml", stocks: 0, status: "Out of Stock" },
  { id: 3, name: "Conditioner", stocks: 3, status: "Low Stock" },
  { id: 4, name: "Hair Gel", stocks: 0, status: "Out of Stock" },
  { id: 5, name: "Hair Spray", stocks: 2, status: "Low Stock" },
];

export default function Analytics() {
  const { transactions: cachedTransactions, products: cachedProducts, fetchTransactions, fetchProducts, invalidateCache } = useData();

  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState("daily");
  const [initialLoad, setInitialLoad] = useState(true);
  const analyticsCalculated = useRef(false);

  // Real-time data states
  const [dashboardStats, setDashboardStats] = useState({
    totalSalesToday: 0,
    totalTransactions: 0,
    averageTransactionValue: 0,
    salesGrowthRate: 0,
    previousPeriodSales: 0,
    previousPeriodTransactions: 0,
  });

  const [chartData, setChartData] = useState({
    daily: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], datasets: [{ data: [0] }] },
    monthly: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], datasets: [{ data: [0] }] },
    yearly: { labels: ["2023", "2024", "2025"], datasets: [{ data: [0] }] },
  });

  const [topProducts, setTopProducts] = useState(sampleData);
  const [lowStockItems, setLowStockItems] = useState(sampleLowStock);
  const [stockInData, setStockInData] = useState([50, 60, 70, 80, 65, 75]);
  const [stockOutData, setStockOutData] = useState([30, 40, 35, 45, 40, 50]);

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      console.log("Starting analytics data fetch...");
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchSalesOverTime(),
        fetchLowStockItems(),
        fetchStockMovements(),
      ]);
      console.log("Analytics data fetch complete");
    } catch (error) {
      console.warn("Failed to fetch analytics:", error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      console.log("Fetching dashboard stats...");
      const response = await transactionAPI.getDashboardStats();
      console.log("Dashboard stats response:", JSON.stringify(response));

      if (response?.success && response.data) {
        const { totalSalesToday, totalTransactions, profit, lowStockItems } = response.data;
        const avgValue = totalTransactions > 0 ? totalSalesToday / totalTransactions : 0;

        // For growth rate, we'll calculate based on profit margin or set a default
        const growthRate = totalSalesToday > 0 && profit > 0
          ? ((profit / totalSalesToday) * 100)
          : 0;

        setDashboardStats({
          totalSalesToday: totalSalesToday || 0,
          totalTransactions: totalTransactions || 0,
          averageTransactionValue: avgValue,
          salesGrowthRate: growthRate,
          previousPeriodSales: 0,
          previousPeriodTransactions: 0,
        });
        console.log("Dashboard stats updated:", totalSalesToday, totalTransactions);
      } else {
        console.warn("Invalid dashboard response:", response);
      }
    } catch (error) {
      console.warn("Failed to fetch dashboard stats:", error?.message);
    }
  };

  // Fetch sales over time for charts
  const fetchSalesOverTime = async () => {
    try {
      console.log("Fetching sales over time...");
      const [dailyRes, monthlyRes] = await Promise.all([
        transactionAPI.getSalesOverTime("daily"),
        transactionAPI.getSalesOverTime("monthly"),
      ]);
      console.log("Daily sales response:", JSON.stringify(dailyRes));
      console.log("Monthly sales response:", JSON.stringify(monthlyRes));

      const newChartData = { ...chartData };

      // Process daily data
      if (dailyRes?.success && dailyRes.data?.length > 0) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const labels = dailyRes.data.map(d => {
          const date = new Date(d.date || d._id);
          return dayNames[date.getDay()] || d.label || "Day";
        }).slice(-7);
        const data = dailyRes.data.map(d => d.totalSales || 0).slice(-7);
        newChartData.daily = { labels, datasets: [{ data: data.length > 0 ? data : [0] }] };
      }

      // Process monthly data
      if (monthlyRes?.success && monthlyRes.data?.length > 0) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const labels = monthlyRes.data.map(d => monthNames[d.month - 1] || d.label || "Month").slice(-6);
        const data = monthlyRes.data.map(d => d.totalSales || 0).slice(-6);
        newChartData.monthly = { labels, datasets: [{ data: data.length > 0 ? data : [0] }] };
      }

      // Yearly - aggregate from monthly
      if (monthlyRes?.success && monthlyRes.data?.length > 0) {
        const yearlyAgg = {};
        monthlyRes.data.forEach(d => {
          const year = d.year || new Date().getFullYear();
          yearlyAgg[year] = (yearlyAgg[year] || 0) + (d.totalSales || 0);
        });
        const years = Object.keys(yearlyAgg).sort();
        newChartData.yearly = {
          labels: years.slice(-5),
          datasets: [{ data: years.slice(-5).map(y => yearlyAgg[y] || 0) }]
        };
      }

      setChartData(newChartData);
    } catch (error) {
      console.warn("Failed to fetch sales over time:", error?.message);
    }
  };

  // Fetch low stock items
  const fetchLowStockItems = async () => {
    try {
      console.log("Fetching low stock items...");
      const response = await productAPI.getAll();
      console.log("Products response:", response?.success, "Count:", response?.data?.length);

      if (response?.success && response.data?.length > 0) {
        // Filter products with low or zero stock
        // Product model uses: itemName, currentStock, reorderNumber
        const items = response.data
          .filter(p => {
            const stock = p.currentStock ?? p.stock ?? p.quantity ?? 0;
            const reorderLevel = p.reorderNumber ?? p.lowStockThreshold ?? 10;
            return stock <= reorderLevel;
          })
          .map((p, idx) => {
            const stock = p.currentStock ?? p.stock ?? p.quantity ?? 0;
            return {
              id: p._id || p.id || idx,
              name: p.itemName || p.name || p.productName || "Unknown Product",
              stocks: stock,
              status: stock === 0 ? "Out of Stock" : "Low Stock",
            };
          })
          .slice(0, 10);

        console.log("Low stock items found:", items.length);
        if (items.length > 0) {
          setLowStockItems(items);
        }
      }
    } catch (error) {
      console.warn("Failed to fetch low stock items:", error?.message);
    }
  };

  // Fetch stock movements for charts
  const fetchStockMovements = async () => {
    try {
      const response = await stockMovementAPI.getAll({ limit: 30 });
      if (response?.success && response.data?.length > 0) {
        // Group by day and type
        const stockIn = [0, 0, 0, 0, 0, 0];
        const stockOut = [0, 0, 0, 0, 0, 0];

        response.data.forEach(movement => {
          const date = new Date(movement.createdAt || movement.date);
          const dayIndex = date.getDay();
          if (dayIndex < 6) {
            if (movement.type === "in" || movement.movementType === "stock-in") {
              stockIn[dayIndex] += movement.quantity || 1;
            } else if (movement.type === "out" || movement.movementType === "stock-out" || movement.movementType === "sale") {
              stockOut[dayIndex] += movement.quantity || 1;
            }
          }
        });

        if (stockIn.some(v => v > 0)) setStockInData(stockIn);
        if (stockOut.some(v => v > 0)) setStockOutData(stockOut);
      }
    } catch (error) {
      console.warn("Failed to fetch stock movements:", error?.message);
    }
  };

  // Load data on mount and focus - uses cached data when available
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        // Use cached data if available, only fetch if needed
        if (!analyticsCalculated.current || cachedTransactions.length === 0) {
          await Promise.all([fetchTransactions(false), fetchProducts(false)]);
        }
        await fetchAnalyticsData();
        analyticsCalculated.current = true;
        setInitialLoad(false);
      };
      loadData();
    }, [fetchTransactions, fetchProducts])
  );

  // Pull to refresh - force fetch new data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    invalidateCache('all');
    analyticsCalculated.current = false;
    await Promise.all([fetchTransactions(true), fetchProducts(true)]);
    await fetchAnalyticsData();
    setRefreshing(false);
  }, [invalidateCache, fetchTransactions, fetchProducts]);

  // Toggle expand for low stock table
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const visibleData = expanded ? lowStockItems : lowStockItems.slice(0, 3);

  // Format currency
  const formatCurrency = (value) => {
    return `₱${(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Format percentage
  const formatPercentage = (value) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${(value || 0).toFixed(1)}%`;
  };

  // Calculate comparison text
  const getComparisonText = (current, previous) => {
    if (previous === 0 || !previous) return "Today's data";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(0)}% vs last period`;
  };

  const handleExportExcel = async () => {
    try {
      const daily = chartData.daily.datasets[0].data.map((val, i) => ({
        Day: chartData.daily.labels[i] || `Day ${i + 1}`,
        Sales: val,
      }));

      const monthly = chartData.monthly.datasets[0].data.map((val, i) => ({
        Month: chartData.monthly.labels[i] || `Month ${i + 1}`,
        Sales: val,
      }));

      const yearly = chartData.yearly.datasets[0].data.map((val, i) => ({
        Year: chartData.yearly.labels[i] || `Year ${i + 1}`,
        Sales: val,
      }));

      const lowStock = lowStockItems.map(item => ({
        Product: item.name,
        Stock: item.stocks,
        Status: item.status,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daily), "Daily Sales");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthly), "Monthly Sales");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(yearly), "Yearly Sales");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lowStock), "Low Stock");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const fileUri = FileSystem.cacheDirectory + "Analytics_Report.xlsx";

      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Export Analytics Report",
        UTI: "com.microsoft.excel.xlsx",
      });

      Alert.alert("Success", "Analytics report exported!");
    } catch (error) {
      console.error("Export Error:", error);
      Alert.alert("Error", "Failed to export Excel: " + error.message);
    }
  };

  const handlePrint = async () => {
    try {
      const html = `
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h2 style="text-align:center;">Create Your Style Analytics Report</h2>
            
            <h3>Dashboard Summary</h3>
            <table border="1" style="width:100%;border-collapse:collapse;">
              <tr><td>Total Sales Today</td><td>${formatCurrency(dashboardStats.totalSalesToday)}</td></tr>
              <tr><td>Total Transactions</td><td>${dashboardStats.totalTransactions}</td></tr>
              <tr><td>Average Transaction</td><td>${formatCurrency(dashboardStats.averageTransactionValue)}</td></tr>
              <tr><td>Growth Rate</td><td>${formatPercentage(dashboardStats.salesGrowthRate)}</td></tr>
            </table>

            <h3 style="margin-top:25px;">Daily Sales</h3>
            <table border="1" style="width:100%;border-collapse:collapse;">
              <tr><th>Day</th><th>Sales</th></tr>
              ${chartData.daily.labels.map((day, i) =>
        `<tr><td>${day}</td><td>${formatCurrency(chartData.daily.datasets[0].data[i])}</td></tr>`
      ).join("")}
            </table>

            <h3 style="margin-top:25px;">Low Stock Items</h3>
            <table border="1" style="width:100%;border-collapse:collapse;">
              <tr><th>Product</th><th>Stock</th><th>Status</th></tr>
              ${lowStockItems.map(item =>
        `<tr><td>${item.name}</td><td>${item.stocks}</td><td>${item.status}</td></tr>`
      ).join("")}
            </table>

            <p style="text-align:center;margin-top:30px;">Generated on ${new Date().toLocaleString()}</p>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
    } catch (error) {
      console.error("Print Error:", error);
      Alert.alert("Error", "Failed to print report: " + error.message);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={[styles.whitecard, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#AD7F65" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.whitecard}>
        <ScrollView
          style={styles.main}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#AD7F65"]} />
          }
        >
          {/* SEARCH BAR + BUTTONS */}
          <View style={styles.searchContainer}>
            <Text style={styles.anafont}>Analytics</Text>
            <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
              <Image source={require("./iconz/print.png")} style={{ width: 21, height: 21 }} />
            </TouchableOpacity>
          </View>

          {/* DASHBOARD STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(dashboardStats.totalSalesToday)}</Text>
              <Text style={styles.statLabel}>Total Sales Today</Text>
              <Text style={styles.statLabel1}>Total sales from all transactions today</Text>
              <Text style={styles.statLabel2}>
                {getComparisonText(dashboardStats.totalSalesToday, dashboardStats.previousPeriodSales)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboardStats.totalTransactions}</Text>
              <Text style={styles.statLabel}>Total Transactions</Text>
              <Text style={styles.statLabel1}>Number of sales made today</Text>
              <Text style={styles.statLabel2}>
                {getComparisonText(dashboardStats.totalTransactions, dashboardStats.previousPeriodTransactions)}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(dashboardStats.averageTransactionValue)}</Text>
              <Text style={styles.statLabel}>Average Transaction Value</Text>
              <Text style={styles.statLabel1}>Average amount spent per transaction.</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, dashboardStats.salesGrowthRate >= 0 ? styles.statValuePositive : styles.statValueNegative]}>
                {formatPercentage(dashboardStats.salesGrowthRate)}
              </Text>
              <Text style={styles.statLabel}>Sales Growth Rate</Text>
              <Text style={styles.statLabel1}>Month-over-month growth</Text>
            </View>
          </View>

          {/* Sales Over Time Chart */}
          <View style={[styles.chartContainer, { marginBottom: 24 }]}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Sales Over Time</Text>
              <View style={styles.buttonContainer}>
                {["daily", "monthly", "yearly"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chartButton, chartType === type && styles.activeButton]}
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
              data={{ ...chartData[chartType], legend: [] }}
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
              style={styles.chart}
              withVerticalLines={false}
              withInnerLines={false}
              withShadow={false}
              fromZero
            />
          </View>

          {/* Stock In Bar Chart */}
          <View style={[styles.chartContainer, { marginBottom: 24 }]}>
            <Text style={[styles.chartTitle, { marginBottom: 16 }]}>Stock In</Text>
            <BarChart
              data={{
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                datasets: [{ data: stockInData }],
              }}
              width={350}
              height={220}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(173, 127, 101, ${opacity})`,
                barPercentage: 0.6,
                style: { borderRadius: 16 },
                propsForBackgroundLines: { strokeWidth: 0.5, stroke: "#e0e0e0" },
              }}
              style={{ marginTop: 8, marginBottom: 8 }}
              fromZero
              showBarTops={false}
            />
          </View>

          {/* Pull Outs Bar Chart */}
          <View style={[styles.chartContainer, { marginBottom: 24 }]}>
            <Text style={[styles.chartTitle, { marginBottom: 16 }]}>Pull Outs</Text>
            <BarChart
              data={{
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                datasets: [{ data: stockOutData }],
              }}
              width={350}
              height={220}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(173, 127, 101, ${opacity})`,
                barPercentage: 0.6,
                style: { borderRadius: 16 },
                propsForBackgroundLines: { strokeWidth: 0.5, stroke: "#e0e0e0" },
              }}
              style={{ marginTop: 8, marginBottom: 8 }}
              fromZero
              showBarTops={false}
            />
          </View>

          {/* Products Performance */}
          <View style={[styles.chartContainer, { height: 190 }]}>
            <Text style={styles.chartTitle}>Products Performance</Text>
            <FlatList
              data={topProducts}
              keyExtractor={(item, index) => item.item + index}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              renderItem={({ item }) => (
                <View style={styles.carouselCard}>
                  <Image source={item.image} style={styles.carouselImage} />
                  <Text style={styles.carouselLabel}>{item.item}</Text>
                  <Text style={styles.carouselLabel}>Sold: {item.total}</Text>
                </View>
              )}
            />
          </View>

          {/* Low & Out-of-Stock Items */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Low & Out-of-Stock Items</Text>
                <Text style={styles.sectionSubtitle}>Inventory items that need attention</Text>
              </View>
              <TouchableOpacity onPress={toggleExpand} style={styles.viewMoreButton} activeOpacity={0.7}>
                <Text style={styles.viewMoreText}>{expanded ? "Show Less" : "View All"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, { flex: 3, textAlign: "left" }]}>Product</Text>
                <Text style={[styles.headerText, { flex: 1, textAlign: "center" }]}>Stocks</Text>
                <Text style={[styles.headerText, { flex: 1.5, textAlign: "right" }]}>Status</Text>
              </View>

              <View style={styles.tableBody}>
                {visibleData.map((item, index) => (
                  <View key={item.id.toString()} style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}>
                    <Text style={[styles.rowText, { flex: 3, textAlign: "left", fontWeight: "500" }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.rowText, { flex: 1, textAlign: "center" }]}>{item.stocks}</Text>
                    <View style={[styles.statusCell, { flex: 1.5 }]}>
                      <Text style={[styles.statusText, item.status === "Out of Stock" ? styles.statusTextCritical : styles.statusTextLow]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 30,
    padding: 16,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#888",
  },
  viewMoreButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
  },
  viewMoreText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
  },
  tableContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableBody: {
    backgroundColor: "#fff",
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    width: "100%",
  },
  evenRow: {
    backgroundColor: "#fcfcfc",
  },
  rowText: {
    fontSize: 14,
    color: "#444",
  },
  statusCell: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "right",
    width: "100%",
    paddingRight: 8,
  },
  statusTextLow: {
    color: "#E6A23C",
  },
  statusTextCritical: {
    color: "#F56C6C",
  },
  container: {
    flex: 1,
    backgroundColor: "#53321c",
  },
  main: {
    width: "100%",
    paddingHorizontal: 16,
  },
  whitecard: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  anafont: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  printButton: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
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
  statValuePositive: {
    color: "#09A046",
  },
  statValueNegative: {
    color: "#F56C6C",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
    color: "#7c5a43",
  },
  statLabel1: {
    fontSize: 11,
    color: "#999",
    textAlign: "left",
    lineHeight: 13,
  },
  statLabel2: {
    fontSize: 11,
    color: "#09A046",
    marginTop: 4,
    fontWeight: "500",
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
    paddingHorizontal: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#53321c",
  },
  chart: {
    borderRadius: 16,
  },
  buttonContainer: {
    flexDirection: "row",
  },
  chartButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 6,
    backgroundColor: "#e4d7ce",
  },
  activeButton: {
    backgroundColor: "#AD7F65",
  },
  buttonText: {
    fontSize: 13,
    color: "#53321c",
    fontWeight: "600",
  },
  activeButtonText: {
    color: "#fff",
  },
  carouselCard: {
    width: 110,
    height: 130,
    borderRadius: 8,
    backgroundColor: "#fafafa",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  carouselImage: {
    width: 85,
    height: 75,
    borderRadius: 6,
    resizeMode: "cover",
  },
  carouselLabel: {
    fontSize: 9,
    fontWeight: "500",
    marginTop: 6,
    textAlign: "center",
    color: "#333",
  },
});
