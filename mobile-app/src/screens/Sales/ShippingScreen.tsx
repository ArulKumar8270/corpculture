import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// States data
const states = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chandigarh' },
  { code: 'CH', name: 'Chhattisgarh' },
  { code: 'DH', name: 'Dadra and Nagar Haveli' },
  { code: 'DD', name: 'Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
];

const ShippingScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { items: cartItems } = useSelector((state: RootState) => state.cart);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('IN');
  const [state, setState] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShippingInfo();
  }, []);

  const loadShippingInfo = async () => {
    try {
      const info = await AsyncStorage.getItem('shippingInfo');
      if (info) {
        const shippingInfo = JSON.parse(info);
        setAddress(shippingInfo.address || '');
        setCity(shippingInfo.city || '');
        setState(shippingInfo.state || '');
        setLandmark(shippingInfo.landmark || '');
        setPincode(shippingInfo.pincode || '');
        setPhoneNo(shippingInfo.phoneNo || '');
      }
    } catch (error) {
      console.error('Error loading shipping info:', error);
    }
  };

  const saveShippingInfo = async () => {
    if (phoneNo.length !== 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Mobile Number',
        text2: 'Please enter a valid 10-digit mobile number',
      });
      return;
    }

    const data = {
      address,
      city,
      country,
      state,
      landmark,
      pincode,
      phoneNo,
    };

    try {
      await AsyncStorage.setItem('shippingInfo', JSON.stringify(data));
      Toast.show({
        type: 'success',
        text1: 'Shipping Info Saved',
      });
    } catch (error) {
      console.error('Error saving shipping info:', error);
    }
  };

  // Helper function to get the correct price for an item based on quantity
  const getPrice = (item: any) => {
    const quantity = item.quantity || 0;
    const priceRange = item.priceRange?.find(
      (range: any) =>
        quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
    );
    return priceRange
      ? parseFloat(priceRange.price)
      : item.discountPrice || item.price || 0;
  };

  // Calculate price details
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const itemPrice = getPrice(item);
    return sum + itemPrice * (item.quantity || 0);
  }, 0);

  const totalDiscount = cartItems.reduce((sum: number, item: any) => {
    const regularPrice = (item.price || 0) * (item.quantity || 0);
    const actualPrice = getPrice(item) * (item.quantity || 0);
    return sum + (regularPrice - actualPrice);
  }, 0);

  const totalDeliveryCharges = cartItems.reduce((sum: number, item: any) => {
    return sum + (item.deliveryCharge || 0);
  }, 0);

  const totalInstallationCharges = cartItems.reduce((sum: number, item: any) => {
    return sum + (item.isInstalation ? item.installationCost || 0 : 0);
  }, 0);

  const totalAmount = subtotal + totalDeliveryCharges + totalInstallationCharges;

  const handlePayment = async () => {
    if (!user || !token) {
      Toast.show({
        type: 'error',
        text1: 'Login Required',
        text2: 'Please log in to place an order',
      });
      return;
    }

    if (!address || !city || !state || !pincode || !phoneNo) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill all required fields',
      });
      return;
    }

    setLoading(true);
    try {
      await saveShippingInfo();
      
      // Set sessionId similar to client's placeOrderHandler
      await AsyncStorage.setItem('sessionId', 'sdfas09df8as7');
      
      // Navigate to order success screen (equivalent to /shipping/confirm)
      navigation.navigate('OrderSuccess' as never);
    } catch (error: any) {
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong. Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shipping Details</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              placeholder="Enter pincode"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Phone No *</Text>
            <TextInput
              style={styles.input}
              value={phoneNo}
              onChangeText={setPhoneNo}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Enter city"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Landmark (Optional)</Text>
            <TextInput
              style={styles.input}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Enter landmark"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setStatePickerVisible(true)}
          >
            <Text style={[styles.pickerButtonText, !state && styles.placeholderText]}>
              {state ? states.find((s) => s.code === state)?.name : 'Select State'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>PRICE DETAILS</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Price ({cartItems.length} item)
            </Text>
            <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          {totalDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Discount</Text>
              <Text style={styles.discountValue}>
                - ₹{totalDiscount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charges</Text>
            <Text style={styles.priceValue}>
              ₹{totalDeliveryCharges.toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Installation Charges</Text>
            <Text style={styles.priceValue}>
              ₹{totalInstallationCharges.toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          {totalDiscount > 0 && (
            <View style={styles.savingsContainer}>
              <Text style={styles.savingsText}>
                You will save ₹{totalDiscount.toFixed(2)} on this order
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.paymentButton, loading && styles.paymentButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.paymentButtonText}>Make Payment</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* State Picker Modal */}
      {statePickerVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setStatePickerVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {states.map((s) => (
                <TouchableOpacity
                  key={s.code}
                  style={styles.stateOption}
                  onPress={() => {
                    setState(s.code);
                    setStatePickerVisible(false);
                  }}
                >
                  <Text style={styles.stateOptionText}>{s.name}</Text>
                  {state === s.code && <Icon name="check" size={20} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  discountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
  savingsContainer: {
    backgroundColor: '#f7fafd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50',
  },
  paymentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  stateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stateOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ShippingScreen;
