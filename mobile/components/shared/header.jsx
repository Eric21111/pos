import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { stockAPI } from "../../services/api";

const Header = () => {
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);

  const [fontsLoaded] = useFonts({
    Allura: require("../shared/fontz/Allura-Regular.ttf"),
    Insta: require("../shared/fontz/Instagram Sans.ttf"),
    DancingS: require("../shared/fontz/DancingScript.ttf"),
    Poppins: require("../shared/fontz/Poppins-Bold.ttf"),
  });

  useFocusEffect(
    useCallback(() => {
      const fetchNotifications = async () => {
        try {
          const response = await stockAPI.getLowStock();
          if (response && response.success) {
            setNotificationCount(response.count || 0);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };

      fetchNotifications();
    }, [])
  );

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#C2A68C", "#AD7F65", "#76462B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      >
        <Text style={styles.headerTitle}>Create your style</Text>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/Notification")}
        >
          <Ionicons name="notifications-outline" size={25} color="#fff" />
          {notificationCount > 0 && (
            <View style={styles.notificationDot}>
              <Text style={styles.notificationText}>
                {notificationCount > 9 ? "9+" : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBackground: {
    height: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTitle: {
    marginTop: -1,
    fontSize: 18,
    color: "#fff",
    fontFamily: "Poppins",
  },
  notificationButton: {
    position: "relative",
    bottom: 3,
    padding: 8,
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#AD7F65",
  },
  notificationText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default Header;
