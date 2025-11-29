import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  // confirmation switch state
  const [confirmRequired, setConfirmRequired] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingConfirmValue, setPendingConfirmValue] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    console.log("Dark Mode:", !darkMode);
  };

  const toggleNotifications = () => {
    setNotifications((prev) => !prev);
    console.log("Notifications:", !notifications);
  };

  const requestToggleConfirm = (value: boolean) => {
    // ask user to confirm the change before applying
    setPendingConfirmValue(value);
    setConfirmModalVisible(true);
  };

  const applyPendingConfirm = () => {
    setConfirmRequired(Boolean(pendingConfirmValue));
    console.log("Confirm Required:", pendingConfirmValue);
    setPendingConfirmValue(false);
    setConfirmModalVisible(false);
  };

  const cancelPendingConfirm = () => {
    setPendingConfirmValue(false);
    setConfirmModalVisible(false);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: darkMode ? "#1A1A1A" : "#FAF6F2" },
        ]}
      >
        {/* Dark Mode Switch */}
        <View style={styles.switchContainer}>
          <Text
            style={[styles.label, { color: darkMode ? "#000000ff" : "#333" }]}
          >
            {darkMode ? "Dark Mode" : "Light Mode"}
          </Text>
          <Switch
            trackColor={{ false: "#ccc", true: "#76462B" }}
            thumbColor="#fff"
            value={darkMode}
            onValueChange={toggleDarkMode}
          />
        </View>

        {/* Notifications Switch */}
        <View style={styles.switchContainer}>
          <Text
            style={[styles.label, { color: darkMode ? "#000000ff" : "#333" }]}
          >
            Notifications
          </Text>
          <Switch
            trackColor={{ false: "#ccc", true: "#76462B" }}
            thumbColor="#fff"
            value={notifications}
            onValueChange={toggleNotifications}
          />
        </View>

        {/* Confirm-on-toggle Switch (with Yes/No modal) */}
        <View style={styles.switchContainer}>
          <View>
            <Text
              style={[styles.label, { color: darkMode ? "#000000ff" : "#333" }]}
            >
              Owner Status
            </Text>
            <Text
              style={[
                styles.statusText,
                { color: confirmRequired ? "#09A046" : "#999" },
              ]}
            >
              {confirmRequired ? "Active" : "Inactive"}
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#ccc", true: "#76462B" }}
            thumbColor="#fff"
            value={confirmRequired}
            onValueChange={(v) => requestToggleConfirm(v)}
          />
        </View>

        <Text
          style={[styles.description, { color: darkMode ? "#ccc" : "#777" }]}
        ></Text>
      </View>

      {/* Confirmation modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelPendingConfirm}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Change</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to{" "}
              {pendingConfirmValue ? "enable" : "disable"} confirmation?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={cancelPendingConfirm}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText]}>
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={applyPendingConfirm}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  description: {
    marginTop: 10,
    fontSize: 14,
  },
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  modalCancel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  modalConfirm: {
    backgroundColor: "#76462B",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalCancelText: {
    color: "#333",
  },
  modalConfirmText: {
    color: "#fff",
  },
  statusText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
});
