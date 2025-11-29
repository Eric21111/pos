import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Header = () => {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Allura: require("../shared/fontz/Allura-Regular.ttf"),
    Insta: require("../shared/fontz/Instagram Sans.ttf"),
    DancingS: require("../shared/fontz/DancingScript.ttf"),
    Poppins: require("../shared/fontz/Poppins-Bold.ttf"),
  });

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
          onPress={() => router.push("/Notification")} // ✅ Redirects to Notification.jsx
        >
          <Ionicons name="notifications-outline" size={25} color="#fff" />
          <View style={styles.notificationDot} />
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
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 4,
  },
});

export default Header;
