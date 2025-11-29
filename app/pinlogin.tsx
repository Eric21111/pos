import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PinLogin() {
  const [pin, setPin] = useState("");
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const correctPin = "1234";

  const handleKeyPress = (value: string) => {
    if (value === "del") {
      setPin(pin.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  const handleLogin = () => {
    if (pin === correctPin) {
      router.replace("/(tabs)");
    } else {
      setShowModal(true); // open modal
      setPin("");
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER IMAGE */}
      <View style={styles.header}>
        <Image
          source={require("../app/(tabs)/iconz/pinbg.png")}
          style={styles.headerImage}
          resizeMode="cover"
        />
      </View>

      {/* WHITE CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>Enter your PIN</Text>

        <View style={styles.pinContainer}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.pinBox}>
              <Text style={styles.pinText}>{pin[i] ? "*" : ""}</Text>
            </View>
          ))}
        </View>

        <View style={styles.keypad}>
          {[
            ["7", "8", "9"],
            ["4", "5", "6"],
            ["1", "2", "3"],
            ["0", "del"],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.key}
                  onPress={() => handleKeyPress(key)}
                >
                  <Text style={styles.keyText}>
                    {key === "del" ? "⌫" : key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            pin.length < 4 && styles.loginButtonDisabled,
          ]}
          disabled={pin.length < 4}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Incorrect PIN</Text>
            <Text style={styles.modalMessage}>
              The PIN you entered is incorrect. Please try again.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  header: {
    height: "30%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -30,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: "center",
    paddingTop: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333",
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  pinBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  pinText: {
    fontSize: 24,
    fontWeight: "light",
    color: "#333",
    textAlign: "center",
  },
  keypad: {
    marginBottom: 12,
    paddingLeft: 10,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 8,
  },
  key: {
    width: 70,
    height: 70,
    marginLeft: 7,
    marginRight: 7,
    backgroundColor: "#f6f6f6",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  keyText: {
    fontSize: 24,
    fontWeight: "light",
    color: "#333",
  },
  loginButton: {
    width: "59%",
    backgroundColor: "#7C4A21",
    borderRadius: 20,
    paddingVertical: 11,
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.6,
    color: "#000000ff",
  },
  loginButtonText: {
    color: "#ffff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#7C4A21",
    marginBottom: 10,
  },
  modalMessage: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#8b5e39ff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
