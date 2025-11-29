import Header from "@/components/shared/header";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AccountSettings = () => {
  const router = useRouter();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [toastIcon, setToastIcon] = useState("sync");
  const toastTranslate = useRef(new Animated.Value(-60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    setSyncMessage("Syncing your data...");
    setToastIcon("sync");
    setSyncModalVisible(true);

    // Simulate network request
    setTimeout(() => {
      setRefreshing(false);
      setSyncMessage("Sync completed successfully!");
      setToastIcon("check-circle");

      // Hide toast after delay
      setTimeout(() => setSyncModalVisible(false), 2000);
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
          toValue: -60,
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
  }, [syncModalVisible, toastTranslate, toastOpacity]);

  const handleLogout = () => {
    // TODO: Add actual logout logic
    console.log("User logged out");
    setLogoutModalVisible(false);
    router.replace("/pinlogin");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Header />

      <Animated.View
        style={[
          styles.toastContainer,
          {
            transform: [
              {
                translateY: toastTranslate,
              },
              {
                scale: toastOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
            opacity: toastOpacity,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}
      >
        <View style={styles.toastInner}>
          <View style={styles.toastContent}>
            <Text style={styles.toastText}>{syncMessage}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSyncModalVisible(false)}
            style={styles.toastCloseButton}
          >
            <Text style={styles.toastCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* SCROLL CONTENT */}
      <View style={styles.whitecard}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <View style={styles.flexprofile}>
              <Image
                source={require("../(tabs)/iconz/profile3.png")}
                style={styles.profileImageLarge}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Barbie Dela Cruz</Text>
                <Text style={styles.profileJob}>Cashier</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>Active</Text>
                </View>
              </View>
            </View>
            <View>
              <Text style={styles.profileDetails}>09263482655</Text>
              <Text style={styles.profileDetails}>
                yourname.yourname123@gmail.com
              </Text>
              <Text style={styles.profileDetails}>
                Owner of Create Your Style
              </Text>
            </View>
          </View>

          {/* SETTINGS LIST */}
          <View style={styles.settingsList}>
            {/* Edit Profile */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("../Edit Profile")}
            >
              <Image
                source={require("../(tabs)/iconz/edit.png")}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Edit Profile</Text>
            </TouchableOpacity>

            {/* Update Pincode */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("../Update Pin")}
            >
              <Image
                source={require("../(tabs)/iconz/pin.png")}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Update Pincode</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("../RolesAndPermission")}
            >
              <Image
                source={require("../(tabs)/iconz/roles.png")}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Roles and Permission</Text>
            </TouchableOpacity>

            {/* Preferences */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("../Preferences")}
            >
              <Image
                source={require("../(tabs)/iconz/preferences.png")}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>
                Push Notification and Preferences
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("../SyncLog")}
            >
              <Image
                source={require("../(tabs)/iconz/sync.png")}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Sync Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("../VoidLog")}
            >
              <Image
                source={require("../(tabs)/iconz/void.png")}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Void Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("../Archive")}
            >
              <Image
                source={require("../(tabs)/iconz/archive.png")}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Archive</Text>
            </TouchableOpacity>

            {/* About */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("../About")}
            >
              <Image
                source={require("../(tabs)/iconz/about.png")}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>About</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setLogoutModalVisible(true)}
            >
              <Image
                source={require("../(tabs)/iconz/logout.png")}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* -------------------- ENHANCED LOGOUT MODAL -------------------- */}
      <Modal
        transparent={true}
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Logout</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Image
                source={require("../(tabs)/iconz/logout.png")}
                style={styles.modalIcon}
                resizeMode="contain"
              />
              <Text style={styles.modalMessage}>
                Are you sure you want to log out of your account?
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AccountSettings;

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: 400,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 25,
    alignItems: 'center',
  },
  modalIcon: {
    width: 60,
    height: 60,
    marginBottom: 20,
    tintColor: '#AD7F65',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  logoutButton: {
    backgroundColor: '#AD7F65',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
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

  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },

  profileCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "92%",
    maxWidth: 400,
    alignSelf: "center",
    marginTop: 15,
    elevation: 5,
  },

  profileInfo: {
    alignItems: "flex-start",
  },

  flexprofile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  profileImageLarge: {
    width: 85,
    height: 85,
    borderRadius: 42,
    marginRight: 12,
  },

  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2b2b2b",
  },

  profileJob: {
    fontSize: 14,
    color: "#d17b59",
    marginBottom: 5,
  },

  activeBadge: {
    backgroundColor: "#c8f7c5",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
  },

  activeText: {
    color: "#2b8a3e",
    fontSize: 12,
  },

  profileDetails: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },

  settingsList: {
    marginTop: 20,
    width: "88%",
    alignSelf: "center",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingIcon: {
    width: 20,
    height: 20,
    marginRight: 15,
    tintColor: "#333",
  },
  settingText: {
    fontSize: 16,
    color: "#3b3b3b",
  },

  /* MODALS */
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "80%",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalClose: {
    marginTop: 20,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d37d4c",
  },
  syncButton: {
    marginTop: 12,
    alignSelf: "center",
    backgroundColor: "#AD7F65",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 10,
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  // Modern Toast
  toastContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "white",
  },
  toastInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#53321c",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  toastContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginLeft: 10,
  },
  toastCloseButton: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  toastCloseText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    lineHeight: 16,
    fontWeight: "600",
  },
});
