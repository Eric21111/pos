import Header from "@/components/shared/header";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

export default function Dashboard() {
  const [chartType, setChartType] = useState("daily");

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncModalVisible, setSyncModalVisible] = useState(false);

  // Toast animation
  const toastTranslate = useRef(new Animated.Value(-60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastIcon, setToastIcon] = useState('sync');

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    setSyncMessage("Syncing...");
    setSyncModalVisible(true);

    // Simulate network request
    setTimeout(() => {
      setRefreshing(false);
      setSyncMessage("Sync complete");
      
      // Hide toast after delay
      setTimeout(() => setSyncModalVisible(false), 1200);
    }, 1500);
  };

  useEffect(() => {
    if (syncModalVisible) {
      // Fade in
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
      // Fade out
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

  // Chart data
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

  return (
    <View style={styles.container}>
      <Header />

      {/* Modern Animated Toast */}
      <Animated.View
        style={[
          styles.toastContainer,
          {
            transform: [
              { 
                translateY: toastTranslate,
              },
              {
                // Add a slight scale effect
                scale: toastOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                })
              }
            ],
            opacity: toastOpacity,
            // Shadow effect
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}
      >
        <View style={styles.toastInner}>
          <View style={styles.toastContent}>
            <Text style={styles.toastText}>
              {syncMessage}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => setSyncModalVisible(false)}
            style={styles.toastCloseButton}
          >
            <Text style={styles.toastCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.whitecard} pointerEvents="box-none">
        <ScrollView 
          style={styles.main} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#AD7F65']}
              tintColor="#AD7F65"
            />
          }
        >
          {/* USER WELCOME CARD */}
          <View style={styles.welcomeCard}>
            <Image
              source={require("../(tabs)/iconz/profile3.png")}
              style={styles.profileImage}
            />
            <View style={styles.welcomesub}>
              <Text style={styles.welcomeText}>Welcome Back, Ms. Erika</Text>
              <Text style={styles.subtext}>Here’s your overview today</Text>
            </View>
          </View>

          {/* STAT CARDS */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₱25,430</Text>
              <Text style={styles.statLabel}>Total Sales Today</Text>
              <Text style={styles.statDesc}>
                Total sales from all transactions
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>42</Text>
              <Text style={styles.statLabel}>Total Transactions</Text>
              <Text style={styles.statDesc}>Sales made today</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₱300</Text>
              <Text style={styles.statLabel}>Average Transaction Value</Text>
              <Text style={styles.statDesc}>Average customer spend today</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Low Stock Items</Text>
              <Text style={styles.statDesc}>Products needing restock</Text>
            </View>
          </View>

          {/* CHART */}
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

// -------------------
//       STYLES
// -------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#53321c",
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

  main: {
    width: "100%",
    paddingHorizontal: 16,
  },

  // Chart styles
  chart: {
    marginTop: 8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  
  // Modern Toast
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
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginLeft: 10,
  },
  toastCloseButton: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCloseText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
  },

  // WELCOME
  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#53321c",
    padding: 24,
    borderRadius: 18,
    marginBottom: 20,
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  welcomesub: {
    flexDirection: "column",
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  subtext: {
    fontSize: 15,
    color: "#f0e6dd",
    opacity: 0.9,
  },

  // STATS
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

  // CHART
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    width: '100%',
    paddingHorizontal: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#53321c',
    fontSize: 18,
    fontWeight: "700",
    color: "#53321c",
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
