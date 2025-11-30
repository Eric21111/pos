import Header from "@/components/shared/header";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image, LayoutAnimation, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import * as XLSX from "xlsx";
global.Buffer = Buffer;

export default function Analytics() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  
  const lowStockData = [
    {
      id: 1,
      name: "Beige Crop Top",
      stocks: 12,
      reorder: 15,
      status: "Low Stock",
    },
    {
      id: 2,
      name: "White Blouse",
      stocks: 8,
      reorder: 10,
      status: "Low Stock",
    },
    { id: 3, name: "Brown Pants", stocks: 4, reorder: 10, status: "Low Stock" },
    { id: 4, name: "Blue Dress", stocks: 3, reorder: 8, status: "Low Stock" },
    { id: 5, name: "Black Skirt", stocks: 2, reorder: 10, status: "Low Stock" },
    { id: 6, name: "Eric Shirt", stocks: 1, reorder: 10, status: "Low Stock" },
  ];

  const visibleData = expanded ? lowStockData : lowStockData.slice(0, 3);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const sampleData = [
    {
      item: "Dress 1",
      quantity: 3,
      total: 450,
      image: require("../(tabs)/iconz/dress-carousel.png"),
    },
    {
      item: "Dress Red",
      quantity: 23,
      total: 1200,
      image: require("../(tabs)/iconz/dress-carousel.png"),
    },
    {
      item: "Dress White",
      quantity: 23,
      total: 1200,
      image: require("../(tabs)/iconz/dress-carousel.png"),
    },
    {
      item: "Dress Black",
      quantity: 23,
      total: 1200,
      image: require("../(tabs)/iconz/dress-carousel.png"),
    },
    {
      item: "Dress Green",
      quantity: 245,
      total: 1200,
      image: require("../(tabs)/iconz/dress-carousel.png"),
    },
  ];

  const [chartType, setChartType] = useState("daily");

  const chartData = useMemo(() => ({
    daily: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ data: [30, 45, 28, 80, 99, 43, 50] }],
      legend: ["Daily Sales"]
    },
    monthly: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [{ data: [300, 450, 280, 800, 990, 430, 500, 650] }],
      legend: ["Monthly Sales"]
    },
    yearly: {
      labels: ["2024", "2025", "2026", "2027", "2028"],
      datasets: [{ data: [6000, 7000, 6500, 5000, 9000] }],
      legend: ["Yearly Sales"]
    },
  }), []);
  

  const handleExportExcel = async () => {
    try {
      const mostSold = sampleData
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map((d) => ({
          "Most Sold Product": d.item,
          "Quantity Sold": d.quantity,
          "Total Sales (₱)": d.total,
        }));

      const leastSold = sampleData
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5)
        .map((d) => ({
          "Least Sold Product": d.item,
          "Quantity Sold": d.quantity,
          "Total Sales (₱)": d.total,
        }));

      const daily = chartData.daily.datasets[0].data.map((val, i) => ({
        Day: chartData.daily.labels[i],
        Sales: val,
      }));

      const weekly = [
        { Week: "Week 1", TotalSales: 2300 },
        { Week: "Week 2", TotalSales: 3500 },
        { Week: "Week 3", TotalSales: 4100 },
        { Week: "Week 4", TotalSales: 3900 },
      ];

      const yearly = chartData.yearly.datasets[0].data.map((val, i) => ({
        Year: chartData.yearly.labels[i],
        Sales: val,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(mostSold),
        "Most Sold"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(leastSold),
        "Least Sold"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(daily),
        "Daily Sales"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(weekly),
        "Weekly Sales"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(yearly),
        "Yearly Sales"
      );

      // ✅ Correct export method for Expo
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      const fileUri = FileSystem.cacheDirectory + "Analytics_Report.xlsx";

      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Export Analytics Report",
        UTI: "com.microsoft.excel.xlsx",
      });

      Alert.alert(
        "✅ Success",
        "Analytics (Most/Least/Daily/Weekly/Yearly) exported!"
      );
    } catch (error) {
      console.error("Export Error:", error);
      Alert.alert("Error", "Failed to export Excel: " + error.message);
    }
  };

  const handlePrint = async () => {
    try {
      const mostSold = sampleData
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      const leastSold = sampleData
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);

      const html = `
    <html>
      <body style="font-family: Arial; padding: 20px;">
        <h2 style="text-align:center;">Create Your Style Analytics Report</h2>

        <h3>Most Sold Products</h3>
        <table border="1" style="width:100%;border-collapse:collapse;">
          <tr><th>Item</th><th>Quantity</th><th>Total (₱)</th></tr>
          ${mostSold
            .map(
              (d) =>
                `<tr><td>${d.item}</td><td>${d.quantity}</td><td>₱${d.total}</td></tr>`
            )
            .join("")}
        </table>

        <h3 style="margin-top:25px;">Least Sold Products</h3>
        <table border="1" style="width:100%;border-collapse:collapse;">
          <tr><th>Item</th><th>Quantity</th><th>Total (₱)</th></tr>
          ${leastSold
            .map(
              (d) =>
                `<tr><td>${d.item}</td><td>${d.quantity}</td><td>₱${d.total}</td></tr>`
            )
            .join("")}
        </table>

        <h3 style="margin-top:25px;">Daily Sales</h3>
        <table border="1" style="width:100%;border-collapse:collapse;">
          <tr><th>Day</th><th>Sales</th></tr>
          ${chartData.daily.labels
            .map(
              (day, i) =>
                `<tr><td>${day}</td><td>${chartData.daily.datasets[0].data[i]}</td></tr>`
            )
            .join("")}
        </table>

        <h3 style="margin-top:25px;">Weekly Sales</h3>
        <table border="1" style="width:100%;border-collapse:collapse;">
          <tr><th>Week</th><th>Total Sales</th></tr>
          <tr><td>Week 1</td><td>2300</td></tr>
          <tr><td>Week 2</td><td>3500</td></tr>
          <tr><td>Week 3</td><td>4100</td></tr>
          <tr><td>Week 4</td><td>3900</td></tr>
        </table>

        <h3 style="margin-top:25px;">Yearly Sales</h3>
        <table border="1" style="width:100%;border-collapse:collapse;">
          <tr><th>Year</th><th>Sales</th></tr>
          ${chartData.yearly.labels
            .map(
              (year, i) =>
                `<tr><td>${year}</td><td>${chartData.yearly.datasets[0].data[i]}</td></tr>`
            )
            .join("")}
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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Header />
      <View style={styles.whitecard}>
        <ScrollView style={styles.main}>
          {/* SEARCH BAR + BUTTONS */}
          <View style={styles.searchContainer}>
            <Text style={styles.anafont}>Analytics</Text>
            {/*<TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportExcel}
            >
              <Image
                source={require("../(tabs)/iconz/export.png")}
                style={{ width: 21, height: 21 }}
              />
            </TouchableOpacity>*/}
            <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
              <Image
                source={require("../(tabs)/iconz/print.png")}
                style={{ width: 21, height: 21 }}
              />
            </TouchableOpacity>
          </View>

          {/* DASHBOARD STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₱25,430</Text>
              <Text style={styles.statLabel}>Total Sales Today</Text>
              <Text style={styles.statLabel1}>
                Total sales from all transactions today
              </Text>
              <Text style={styles.statLabel2}>+12% vs last period</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>42</Text>
              <Text style={styles.statLabel}>Total Transactions</Text>
              <Text style={styles.statLabel1}>Number of sales made today</Text>
              <Text style={styles.statLabel2}>+12% vs last period</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₱300</Text>
              <Text style={styles.statLabel}>Average Transaction Value</Text>
              <Text style={styles.statLabel1}>
                Average amount spent per transaction.
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValueG}>+12.3%</Text>
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
                    style={[
                      styles.button,
                      chartType === type && styles.activeButton,
                    ]}
                    onPress={() => setChartType(type)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        chartType === type && styles.activeButtonText,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <LineChart
              data={{
                ...chartData[chartType],
                legend: []
              }}
              width={350}
              height={220}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(173, 127, 101, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#fff"
                }
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
                datasets: [
                  {
                    data: [50, 60, 70, 80, 65, 75],
                  },
                ],
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
                useShadowColorFromDataset: false,
                style: {
                  borderRadius: 16,
                },
                propsForBackgroundLines: {
                  strokeWidth: 0.5,
                  stroke: "#e0e0e0",
                },
              }}
              style={{ marginTop: 8, marginBottom: 8 }}
              verticalLabelRotation={0}
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
                datasets: [
                  {
                    data: [30, 40, 35, 45, 40, 50],
                  },
                ],
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
                useShadowColorFromDataset: false,
                style: {
                  borderRadius: 16,
                },
                propsForBackgroundLines: {
                  strokeWidth: 0.5,
                  stroke: "#e0e0e0",
                },
              }}
              style={{ marginTop: 8, marginBottom: 8 }}
              verticalLabelRotation={0}
              fromZero
              showBarTops={false}
            />
          </View>

          {/* Most and Least Sell Products */}
          <View style={[styles.chartContainer, { height: 190 }]}>
            <Text style={styles.chartTitle}>Products Performance</Text>
            <FlatList
              data={sampleData}
              keyExtractor={(item) => item.item}
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
                <Text style={styles.sectionSubtitle}>
                  Inventory items that need attention
                </Text>
              </View>
              <TouchableOpacity 
                onPress={toggleExpand}
                style={styles.viewMoreButton}
                activeOpacity={0.7}
              >
                <Text style={styles.viewMoreText}>
                  {expanded ? "Show Less" : "View All"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, { flex: 3, textAlign: 'left' }]}>Product</Text>
                <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Stocks</Text>
                <Text style={[styles.headerText, { flex: 1.5, textAlign: 'right' }]}>Status</Text>
              </View>

              <View style={styles.tableBody}>
                {visibleData.map((item, index) => (
                  <View 
                    key={item.id.toString()} 
                    style={[
                      styles.tableRow, 
                      index % 2 === 0 && styles.evenRow
                    ]}
                  >
                    <Text 
                      style={[styles.rowText, { flex: 3, textAlign: 'left', fontWeight: '500' }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.rowText, { flex: 1, textAlign: 'center' }]}>
                      {item.stocks}
                    </Text>
                    <View style={[styles.statusCell, { flex: 1.5 }]}>
                      <Text style={[
                        styles.statusText,
                        item.status === 'Out of Stock' ? styles.statusTextCritical : styles.statusTextLow
                      ]}>
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
  // New styles for the inventory section
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 10,
    padding: 16,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  viewMoreButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  viewMoreText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableBody: {
    backgroundColor: '#fff',
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    width: '100%',
  },
  evenRow: {
    backgroundColor: '#fcfcfc',
  },
  rowText: {
    fontSize: 14,
    color: '#444',
  },
  statusCell: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    width: '100%',
    paddingRight: 8,
  },
  statusTextLow: {
    color: '#E6A23C',
  },
  statusTextCritical: {
    color: '#F56C6C',
  },
  container: {
    flex: 1,
    backgroundColor: "#53321c",
  },
  headerBackground: {
    height: 120,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  button: {
    padding: 10,
  },
  buttonImage: {
    width: 22,
    height: 22,
    resizeMode: "contain",
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
  exportButton: {
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
  statLabel1: {
    fontSize: 11,
    color: "#999",
    textAlign: "left",
    lineHeight: 13,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#53321c",
    marginBottom: 4,
  },

  buttonContainer: { 
    flexDirection: "row" 
  },
  button: {
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

  growthStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginHorizontal: 10,
  },
  growthCard: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 5,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 10,
    elevation: 2,
    alignItems: "center",
  },
  growthValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
  },
  growthValueG: {
    fontSize: 20,
    fontWeight: "700",
    color: "#09A046",
  },
  growthLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#53321c",
    marginTop: 5,
    textAlign: "center",
  },
  growthImage: {
    width: 40,
    height: 40,
    marginBottom: 5,
    resizeMode: "contain",
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    paddingHorizontal: 2
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#53321c'
  },

  // Chart buttons
  buttonContainer: { flexDirection: "row" },
  button: {
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
});
