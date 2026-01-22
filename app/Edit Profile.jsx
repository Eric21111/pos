import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { employeeAPI } from "../services/api";

export default function EditProfile() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load current profile from storage/API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem("currentEmployee");
        if (!stored) return;
        const parsed = JSON.parse(stored);

        let latest = parsed;
        if (parsed._id || parsed.id) {
          try {
            const res = await employeeAPI.getById(parsed._id || parsed.id);
            if (res?.success && res.data) {
              latest = res.data;
              await AsyncStorage.setItem("currentEmployee", JSON.stringify(latest));
            }
          } catch {
            // keep parsed if API fails
          }
        }

        setEmployeeId(latest._id || latest.id || null);
        setName(
          latest.name ||
            `${latest.firstName || ""} ${latest.lastName || ""}`.trim()
        );
        setEmail(latest.email || "");
        setContactNumber(latest.contactNo || "");
        setProfilePicture(latest.profileImage || latest.image || null);
      } catch (error) {
        console.warn("Failed to load profile for editing:", error?.message);
      }
    };

    loadProfile();
  }, []);

  // -------- PICK FROM GALLERY WITH CROP --------
  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // enable cropping
        aspect: [1, 1], // square crop
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  // -------- TAKE PHOTO WITH CROP --------
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Camera permission is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, // enable cropping
        aspect: [1, 1], // square crop
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo.");
    }
  };

  // -------- OPEN OPTIONS --------
  const openImageOptions = () => {
    Alert.alert("Change Profile Picture", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickImageFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!employeeId) {
      Alert.alert("Error", "Cannot update profile. Employee ID is missing.");
      return;
    }

    try {
      setSaving(true);

      // Split name into first and last for backend compatibility
      const parts = (name || "").trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ");

      const updatePayload = {
        name: name.trim(),
        firstName,
        lastName,
        email: email.trim(),
        contactNo: contactNumber.trim(),
        profileImage: profilePicture || "",
      };

      const res = await employeeAPI.update(employeeId, updatePayload);

      if (res?.success && res.data) {
        await AsyncStorage.setItem(
          "currentEmployee",
          JSON.stringify(res.data)
        );
        Alert.alert("Success", "Profile updated successfully.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
          "Error",
          res?.message || "Failed to update profile. Please try again."
        );
      }
    } catch (error) {
      console.log("Error saving profile:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          <TouchableOpacity onPress={openImageOptions}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.profilePicture} />
            )}
          </TouchableOpacity>

          {!profilePicture && (
            <Text style={styles.npplabelText}>New Profile Pic</Text>
          )}
        </View>

        {/* Name Input */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#999"
        />

        {/* Email Input */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Contact Number Input */}
        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholder="Enter your contact number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />

        {/* Bio Input */}
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingTop: 20,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#A9A9A9",
    justifyContent: "center",
    alignItems: "center",
  },
  npplabelText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#A67C5C",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#B8907C",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
