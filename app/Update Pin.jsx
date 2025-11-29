import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function UpdatePin() {
  const navigation = useNavigation();

  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [rePin, setRePin] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showRe, setShowRe] = useState(false);

  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("red");
  const [successModal, setSuccessModal] = useState(false);

  // Fake OLD PIN (replace with backend response later)
  const storedOldPin = "1234";

  const handleConfirm = () => {
    setMessage("");

    if (oldPin !== storedOldPin) {
      setMessage("Old PIN is incorrect.");
      setMessageColor("red");
      return;
    }

    if (newPin.length !== 4) {
      setMessage("New PIN must be 4 digits.");
      setMessageColor("red");
      return;
    }

    if (newPin !== rePin) {
      setMessage("New PIN and Re-enter PIN do not match.");
      setMessageColor("red");
      return;
    }

    setTimeout(() => {
      setSuccessModal(true);

      setTimeout(() => {
        setSuccessModal(false);
        router.push("/(tabs)/profile");
      }, 1000);
    }, 200);
  };

  const PinField = ({ value, setValue, show, setShow, label }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            if (text.length <= 4) setValue(text);
          }}
          secureTextEntry={!show}
          keyboardType="numeric"
          maxLength={4}
          style={styles.input}
        />

        <TouchableOpacity onPress={() => setShow(!show)}>
          <Ionicons
            name={show ? "eye" : "eye-off"}
            size={22}
            color="#444"
            style={{ paddingRight: 10 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <PinField
        label="Old PIN"
        value={oldPin}
        setValue={setOldPin}
        show={showOld}
        setShow={setShowOld}
      />

      <PinField
        label="New PIN"
        value={newPin}
        setValue={setNewPin}
        show={showNew}
        setShow={setShowNew}
      />

      <PinField
        label="Re-enter New PIN"
        value={rePin}
        setValue={setRePin}
        show={showRe}
        setShow={setShowRe}
      />

      {message !== "" && (
        <Text style={[styles.message, { color: messageColor }]}>{message}</Text>
      )}

      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
        <Text style={styles.confirmText}>Confirm</Text>
      </TouchableOpacity>

      {/* Instruction / Description below Confirm button */}
      <Text style={styles.instruction}>
        Make sure your new PIN is 4 digits. need to enter the correct old pin
        and then enter the new pin and then re enter new pin
      </Text>

      {/* SUCCESS POP NOTIFICATION */}
      <Modal transparent visible={successModal} animationType="fade">
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={50} color="green" />
            <Text style={styles.successText}>PIN updated successfully!</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: "#fff",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 18,
    letterSpacing: 3,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  confirmBtn: {
    backgroundColor: "#8B4513",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  confirmText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  instruction: {
    marginTop: 8,
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
  modalWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
  },
  successText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
});
