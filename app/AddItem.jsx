import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

function AddItem({ onBack, item, isEditing = false }) {
  // State declarations with initial values from item prop if in edit mode
  const [itemImage, setItemImage] = useState(item?.image || null);
  const [itemName, setItemName] = useState(item?.name || "");
  const [itemCategory, setItemCategory] = useState(item?.category || "");
  const [itemSize, setItemSize] = useState(item?.size || "");
  const [waistSize, setWaistSize] = useState(item?.waistSize || "");
  const [accessoryType, setAccessoryType] = useState(item?.accessoryType || "");
  const [makeupBrand, setMakeupBrand] = useState(item?.makeupBrand || "");
  const [makeupShade, setMakeupShade] = useState(item?.makeupShade || "");
  const [shoeSize, setShoeSize] = useState(item?.shoeSize || "");
  const [essentialType, setEssentialType] = useState(item?.essentialType || "");
  const [customEssentialType, setCustomEssentialType] = useState(item?.customEssentialType || "");
  const [itemPrice, setItemPrice] = useState(item?.price ? item.price.toString() : "");
  const [itemStock, setItemStock] = useState(item?.stock ? item.stock.toString() : "");
  const [brand, setBrand] = useState(item?.brand || "");
  const [expirationDate, setExpirationDate] = useState(item?.expirationDate || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [essentialExpirationDate, setEssentialExpirationDate] = useState(item?.essentialExpirationDate || "");
  const [showEssentialDatePicker, setShowEssentialDatePicker] = useState(false);
  const [foodType, setFoodType] = useState(item?.foodType || "");
  const [customFoodType, setCustomFoodType] = useState(item?.customFoodType || "");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isForPOS, setIsForPOS] = useState(item?.isForPOS || false);
  
  // Animation refs
  const toastTranslate = useRef(new Animated.Value(-60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  
  // Handle toast animation
  useEffect(() => {
    if (showSuccess) {
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
      
      // Auto hide after delay
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
      return () => clearTimeout(timer);
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
  }, [showSuccess]);

  // Check if there are any unsaved changes
  const hasUnsavedChanges = () => {
    return (
      itemImage ||
      itemName ||
      itemCategory ||
      itemSize ||
      waistSize ||
      accessoryType ||
      makeupBrand ||
      makeupShade ||
      shoeSize ||
      essentialType ||
      customEssentialType ||
      itemPrice ||
      itemStock ||
      brand ||
      expirationDate ||
      essentialExpirationDate ||
      foodType ||
      customFoodType ||
      isForPOS
    );
  };

  // Handle back navigation with confirmation if there are unsaved changes
  const handleBack = () => {
    if (hasUnsavedChanges()) {
      // Show confirmation dialog
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              if (typeof onBack === 'function') {
                onBack();
              }
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      // No unsaved changes, proceed with back navigation
      if (typeof onBack === 'function') {
        onBack();
      }
    }
  };
  
  // Initialize all form fields with default values
  const initializeForm = () => {
    setItemImage(null);
    setItemName('');
    setItemCategory('');
    setItemSize('');
    setWaistSize('');
    setAccessoryType('');
    setMakeupBrand('');
    setMakeupShade('');
    setShoeSize('');
    setEssentialType('');
    setCustomEssentialType('');
    setItemPrice('');
    setItemStock('');
    setBrand('');
    setExpirationDate('');
    setEssentialExpirationDate('');
    setFoodType('');
    setCustomFoodType('');
    setIsForPOS(false);
  };
  
  // Initialize form on component mount or when item prop changes
  useEffect(() => {
    if (isEditing && item) {
      // Pre-fill form with item data when in edit mode
      setItemImage(item.image || null);
      setItemName(item.name || '');
      setItemCategory(item.category || '');
      setItemSize(item.size || '');
      setWaistSize(item.waistSize || '');
      setAccessoryType(item.accessoryType || '');
      setMakeupBrand(item.makeupBrand || '');
      setMakeupShade(item.makeupShade || '');
      setShoeSize(item.shoeSize || '');
      setEssentialType(item.essentialType || '');
      setCustomEssentialType(item.customEssentialType || '');
      setItemPrice(item.price ? item.price.toString() : '');
      setItemStock(item.stock ? item.stock.toString() : '');
      setBrand(item.brand || '');
      setExpirationDate(item.expirationDate || '');
      setEssentialExpirationDate(item.essentialExpirationDate || '');
      setFoodType(item.foodType || '');
      setCustomFoodType(item.customFoodType || '');
      setIsForPOS(!!item.isForPOS);
    } else {
      initializeForm();
    }
  }, [isEditing, item]);

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose your photo source',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickFromGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setItemImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setItemImage(result.assets[0].uri);
    }
  };

  const router = useRouter();
  
  const validateForm = () => {
    if (!itemName || !itemCategory || !itemPrice || !itemStock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    if (!itemImage) {
      Alert.alert("Error", "Please select an image");
      return false;
    }
    if (!itemName.trim()) {
      Alert.alert("Error", "Please enter item name");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (isLoading) return;
    
    // Basic validation
    if (!itemName || !itemCategory || !itemPrice || !itemStock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    if (parseFloat(itemPrice) <= 0) {
      Alert.alert('Error', 'Price must be greater than 0');
      return;
    }
    
    if (parseInt(itemStock) < 0) {
      Alert.alert('Error', 'Stock cannot be negative');
      return;
    }
    
    setIsLoading(true);
    
    // Prepare the item data
    const itemData = {
      ...(isEditing && { id: item.id }), // Include ID if editing
      name: itemName.trim(),
      category: itemCategory,
      size: itemSize,
      waistSize: waistSize,
      accessoryType: accessoryType,
      makeupBrand: makeupBrand,
      makeupShade: makeupShade,
      shoeSize: shoeSize,
      essentialType: essentialType,
      customEssentialType: customEssentialType,
      price: parseFloat(itemPrice) || 0,
      stock: parseInt(itemStock) || 0,
      brand: brand.trim(),
      expirationDate: expirationDate,
      essentialExpirationDate: essentialExpirationDate,
      foodType: foodType,
      customFoodType: customFoodType,
      isForPOS: isForPOS,
      image: itemImage,
      // Keep the original SKU and date added when editing
      ...(isEditing && { 
        sku: item.sku,
        dateAdded: item.dateAdded
      })
    };
    
    console.log(isEditing ? 'Updating item:' : 'Adding new item:', itemData);
    
    // Here you would typically make an API call to save the item
    // For now, we'll just simulate an API call with a timeout
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(isEditing ? 'Item updated successfully!' : 'Item added successfully!');
      setShowSuccess(true);
      
      // Hide success message after 2 seconds and go back
      setTimeout(() => {
        setShowSuccess(false);
        // Navigate back after a short delay
        setTimeout(() => onBack(), 500);
      }, 2000);
    }, 1000);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Add search functionality here if needed
  };

  return (
    <View style={styles.container}>
      {/* Success Toast */}
      <Animated.View
        style={[
          styles.toastContainer,
          {
            transform: [{ translateY: toastTranslate }],
            opacity: toastOpacity,
          },
        ]}
      >
        <View style={styles.toastContent}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.toastIcon} />
          <Text style={styles.toastText}>{successMessage}</Text>
        </View>
      </Animated.View>
      {/* Notification container */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Item' : 'Add New Item'}</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showConfirmation}
          onRequestClose={() => setShowConfirmation(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Add Item</Text>
              <Text style={styles.modalText}>
                Are you sure you want to add this item to your inventory?
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSubmit}
                >
                  <Text style={[styles.buttonText, {color: 'white'}]}>Add Item</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        {/* Image Upload */}
        <TouchableOpacity 
          style={styles.imageUploadContainer} 
          onPress={showImagePickerOptions}
        >
          {itemImage ? (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: itemImage }} 
                style={styles.image} 
                resizeMode="cover"
                onError={(error) => {
                  console.log('Image load error:', error);
                  // If there's an error loading the image, we'll show the placeholder view
                  setItemImage(null);
                }}
              />
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={32} color="#6b7280" />
                <Ionicons name="images" size={32} color="#6b7280" style={{marginLeft: 10}} />
              </View>
              <Text style={styles.imagePlaceholderText}>Tap to take a photo or select from gallery</Text>
            </View>
          )}
        </TouchableOpacity>

      {/* Item Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter item name"
          value={itemName}
          onChangeText={setItemName}
        />
      </View>

      {/* Brand */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Brand</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter brand name (optional)"
          value={brand}
          onChangeText={setBrand}
        />
      </View>

      {/* Item Category */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={itemCategory}
            onValueChange={(itemValue) => setItemCategory(itemValue)}
            style={styles.picker}
            dropdownIconColor="#6b7280"
            mode="dropdown"
          >
            <Picker.Item label="Select a category" value="" />
            <Picker.Item label="Tops" value="tops" />
            <Picker.Item label="Bottoms" value="bottoms" />
            <Picker.Item label="Dresses" value="dresses" />
            <Picker.Item label="Headwear" value="headwear" />
            <Picker.Item label="Makeup" value="makeup" />
            <Picker.Item label="Accessories" value="accessories" />
            <Picker.Item label="Shoes" value="shoes" />
            <Picker.Item label="Food" value="food" />
          </Picker>
        </View>
      </View>

      {/* Size Selection - For tops and dresses */}
      {['tops', 'dresses'].includes(itemCategory) && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Size *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={itemSize}
              onValueChange={(itemValue) => setItemSize(itemValue)}
              style={styles.picker}
              dropdownIconColor="#6b7280"
              mode="dropdown"
            >
              <Picker.Item label="Select size" value="" />
              <Picker.Item label="Free Size" value="Free Size" />
              <Picker.Item label="XS" value="XS" />
              <Picker.Item label="S" value="S" />
              <Picker.Item label="M" value="M" />
              <Picker.Item label="L" value="L" />
              <Picker.Item label="XL" value="XL" />
              <Picker.Item label="XXL" value="XXL" />
              <Picker.Item label="XXXL" value="XXXL" />
            </Picker>
          </View>
        </View>
      )}

      {/* Makeup Fields - For makeup */}
      {itemCategory === 'makeup' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Variant *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Nude, Ruby, etc."
            value={makeupShade}
            onChangeText={setMakeupShade}
          />
          <Text style={[styles.label, {marginTop: 10}]}>Expiration Date *</Text>
          <TouchableOpacity 
            style={styles.input} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{color: expirationDate ? '#000' : '#6b7280'}}>
              {expirationDate ? new Date(expirationDate).toLocaleDateString() : 'Select expiration date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={expirationDate ? new Date(expirationDate) : new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setExpirationDate(selectedDate.toISOString().split('T')[0]);
                }
              }}
            />
          )}
        </View>
      )}

      {/* Shoe Size - For shoes */}
      {itemCategory === 'shoes' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Shoe Size *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 7, 8, 9, etc."
            keyboardType="numeric"
            value={shoeSize}
            onChangeText={setShoeSize}
          />
        </View>
      )}

      {/* Food Type - For food */}
      {itemCategory === 'food' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Food Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={foodType}
              onValueChange={(itemValue) => setFoodType(itemValue)}
              style={styles.picker}
              dropdownIconColor="#6b7280"
              mode="dropdown"
            >
              <Picker.Item label="Select food type" value="" />
              <Picker.Item label="Meals" value="meals" />
              <Picker.Item label="Desserts" value="desserts" />
              <Picker.Item label="Beverages" value="beverages" />
              <Picker.Item label="Snacks" value="snacks" />
              <Picker.Item label="Others: Please specify" value="other" />
            </Picker>
          </View>
          {foodType === 'other' && (
            <View style={[styles.inputContainer, {marginTop: 10}]}>
              <Text style={styles.label}>Please specify *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter food type"
                value={customFoodType}
                onChangeText={setCustomFoodType}
              />
            </View>
          )}
          <View style={[styles.inputContainer, {marginTop: 10}]}>
            <Text style={styles.label}>Expiration Date *</Text>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{color: expirationDate ? '#000' : '#6b7280'}}>
                {expirationDate ? new Date(expirationDate).toLocaleDateString() : 'Select expiration date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={expirationDate ? new Date(expirationDate) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setExpirationDate(selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}
            {expirationDate && (
              <Text style={styles.helperText}>
                {new Date(expirationDate) > new Date()
                  ? `Expires in ${Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24))} days`
                  : 'Expired'}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Essential Type - For essentials */}
      {itemCategory === 'essentials' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Essential Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={essentialType}
              onValueChange={(itemValue) => setEssentialType(itemValue)}
              style={styles.picker}
              dropdownIconColor="#6b7280"
              mode="dropdown"
            >
              <Picker.Item label="Select essential type" value="" />
              <Picker.Item label="Acne Cleaner" value="Acne Cleaner" />
              <Picker.Item label="Face Wash" value="Face Wash" />
              <Picker.Item label="Moisturizer" value="Moisturizer" />
              <Picker.Item label="Sunscreen" value="Sunscreen" />
              <Picker.Item label="Toner" value="Toner" />
              <Picker.Item label="Serum" value="Serum" />
              <Picker.Item label="Face Mask" value="Face Mask" />
              <Picker.Item label="Body Lotion" value="Body Lotion" />
              <Picker.Item label="Food" value="Food" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
          {essentialType === 'Other' && (
            <View style={[styles.inputContainer, {marginTop: 10}]}>
              <Text style={styles.label}>Please specify *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter essential type"
                value={customEssentialType}
                onChangeText={setCustomEssentialType}
              />
            </View>
          )}
          <View style={[styles.inputContainer, {marginTop: 10}]}>
            <Text style={styles.label}>Expiration Date (optional)</Text>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowEssentialDatePicker(true)}
            >
              <Text style={{color: essentialExpirationDate ? '#000' : '#6b7280'}}>
                {essentialExpirationDate ? new Date(essentialExpirationDate).toLocaleDateString() : 'Select expiration date (optional)'}
              </Text>
            </TouchableOpacity>
            {showEssentialDatePicker && (
              <DateTimePicker
                value={essentialExpirationDate ? new Date(essentialExpirationDate) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowEssentialDatePicker(false);
                  if (selectedDate) {
                    setEssentialExpirationDate(selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}
          </View>
        </View>
      )}

      {/* Accessory Type - For accessories */}
      {itemCategory === 'accessories' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Accessory Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={accessoryType}
              onValueChange={(itemValue) => setAccessoryType(itemValue)}
              style={styles.picker}
              dropdownIconColor="#6b7280"
              mode="dropdown"
            >
              <Picker.Item label="Select accessory type" value="" />
              <Picker.Item label="Keychains / Anik-anik" value="Keychains / Anik-anik" />
              <Picker.Item label="Rings" value="Rings" />
              <Picker.Item label="Necklace" value="Necklace" />
              <Picker.Item label="Bracelet" value="Bracelet" />
            </Picker>
          </View>
        </View>
      )}

      {/* Size Selection - For bottoms */}
      {itemCategory === 'bottoms' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Size *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={itemSize}
              onValueChange={(itemValue) => setItemSize(itemValue)}
              style={styles.picker}
              dropdownIconColor="#6b7280"
              mode="dropdown"
            >
              <Picker.Item label="Select size" value="" />
              <Picker.Item label="Free Size" value="Free Size" />
              <Picker.Item label="XS" value="XS" />
              <Picker.Item label="S" value="S" />
              <Picker.Item label="M" value="M" />
              <Picker.Item label="L" value="L" />
              <Picker.Item label="XL" value="XL" />
              <Picker.Item label="XXL" value="XXL" />
              <Picker.Item label="XXXL" value="XXXL" />
            </Picker>
          </View>
        </View>
      )}

      {/* Item Price */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Price (₱) *</Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currencySymbol}>₱</Text>
          <TextInput
            style={[styles.input, {flex: 1}]}
            placeholder="0.00"
            keyboardType="numeric"
            value={itemPrice}
            onChangeText={setItemPrice}
          />
        </View>
      </View>

      {/* Item Stock */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Stock Quantity *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter stock quantity"
          keyboardType="numeric"
          value={itemStock}
          onChangeText={setItemStock}
        />
      </View>

      {/* POS Toggle */}
      <View style={styles.inputContainer}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Available in POS</Text>
          <Switch
            value={isForPOS}
            onValueChange={setIsForPOS}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={isForPOS ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

        {/* Submit Button */}
      <TouchableOpacity 
        style={[
          styles.addButton, 
          isLoading && styles.disabledButton,
          { marginBottom: 20 }
        ]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.addButtonText}>
            {isEditing ? 'Update Item' : 'Add Item'}
          </Text>
        )}
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#AD7F65',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toastContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toastIcon: {
    marginRight: 12,
  },
  toastText: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#AD7F65',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    marginLeft: 8,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  imageUploadContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff',
},
loadingText: {
  marginTop: 16,
  fontSize: 16,
  color: '#666',
},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imageError: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8d7da',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 20,
  },
  cameraIconContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#6b7280',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#1f2937',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  currencySymbol: {
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#8B4513', 
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#5D2D0C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonText: {
    color: '#FFF8DC', 
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});

export default AddItem;
