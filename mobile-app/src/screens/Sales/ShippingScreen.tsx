import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFrontHomeSettings } from '../../hooks/useFrontHomeSettings';
import { getCompanyShippingDefaults } from '../../utils/companyShipping';
import { getApiBaseUrl } from '../../services/api';
import { computeOrderAmountFromItems } from '../../utils/orderAmountUtil';
import * as WebBrowser from 'expo-web-browser';

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
  const { selectedCompany, companyDetails } = useSelector((state: RootState) => state.company);
  const { items: cartItems } = useSelector((state: RootState) => state.cart);
  const { sales } = useFrontHomeSettings();
  const [payOnCredit, setPayOnCredit] = useState(false);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('IN');
  const [state, setState] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [orderReferenceNo, setOrderReferenceNo] = useState('');
  const [availableCredit, setAvailableCredit] = useState(0);
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const lastAppliedCompanyRef = useRef<string | null>(null);

  const applyCompanyToShipping = async (company: any) => {
    const defaults = getCompanyShippingDefaults(company, user?.phone);
    if (!defaults) return;
    setAddress(defaults.address);
    setCity(defaults.city);
    setState(defaults.state);
    setPincode(defaults.pincode);
    setPhoneNo(defaults.phoneNo);
    setLandmark(defaults.landmark || '');
    setCountry(defaults.country || 'IN');
    await AsyncStorage.setItem('shippingInfo', JSON.stringify(defaults));
  };

  useEffect(() => {
    loadShippingInfo();
  }, []);

  useEffect(() => {
    if (!Array.isArray(companyDetails) || companyDetails.length === 0) return;
    if (!selectedCompany || selectedCompany === 'new') return;
    if (lastAppliedCompanyRef.current === selectedCompany) return;

    const company = companyDetails.find(
      (c) => String(c._id) === String(selectedCompany)
    );
    if (!company) return;

    lastAppliedCompanyRef.current = selectedCompany;
    applyCompanyToShipping(company);
  }, [companyDetails, selectedCompany, user?.phone]);

  const activeCompanyId =
    selectedCompany && selectedCompany !== 'new' ? selectedCompany : null;
  const orderTotal = computeOrderAmountFromItems(cartItems);
  const canUseCompanyCredit =
    sales?.creditOptionEnabled && !!activeCompanyId && availableCredit > 0;
  const creditCoversOrder = availableCredit >= orderTotal;

  useEffect(() => {
    const fetchCreditBalance = async () => {
      if (!token || !activeCompanyId) {
        setAvailableCredit(0);
        if (payOnCredit) setPayOnCredit(false);
        return;
      }
      try {
        const { data } = await axios.get(`${getApiBaseUrl()}/credit/balance`, {
          params: { companyId: activeCompanyId },
          headers: { Authorization: token },
        });
        const balance = Number(data?.summary?.availableCredit) || 0;
        setAvailableCredit(balance);
        if (balance <= 0 && payOnCredit) setPayOnCredit(false);
      } catch (error) {
        console.error('Error fetching credit balance:', error);
        setAvailableCredit(0);
        if (payOnCredit) setPayOnCredit(false);
      }
    };
    fetchCreditBalance();
  }, [token, activeCompanyId]);

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
      const storedRef = await AsyncStorage.getItem('orderReferenceNo');
      if (storedRef) setOrderReferenceNo(storedRef);
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

  const getCheckoutPayload = () => {
    if (!user || !token) {
      Toast.show({
        type: 'error',
        text1: 'Login Required',
        text2: 'Please log in to place an order',
      });
      return null;
    }

    const ref = String(orderReferenceNo || '').trim();
    if (!ref) {
      Toast.show({
        type: 'error',
        text1: 'Reference Required',
        text2: 'Please enter an order reference number',
      });
      return null;
    }

    if (!address || !city || !state || !pincode || !phoneNo) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill all required fields',
      });
      return null;
    }

    if (String(phoneNo).replace(/\D/g, '').length !== 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Mobile Number',
        text2: 'Please enter a valid 10-digit mobile number',
      });
      return null;
    }

    return {
      shippingInfo: {
        address,
        city,
        country,
        state,
        landmark,
        pincode,
        phoneNo,
      },
      orderReferenceNo: ref,
    };
  };

  const pollHdfcPayment = async (hdfcOrderId: string) => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const { data } = await axios.post(
        `${getApiBaseUrl()}/user/hdfc/verify`,
        { hdfcOrderId },
        { headers: { Authorization: token } }
      );
      if (data?.paid && data?.order?._id) return data;
      if (!data?.pending) return data;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    return { pending: true };
  };

  const openHdfcPaymentPage = async (payUrl: string) => {
    // Open in the system browser so UPI apps can return to the payment page.
    const opened = await Linking.canOpenURL(payUrl);
    if (opened) {
      await Linking.openURL(payUrl);
      return;
    }
    await WebBrowser.openBrowserAsync(payUrl, {
      dismissButtonStyle: 'done',
      enableBarCollapsing: false,
      showInRecents: true,
    });
  };

  const handleOnlinePayment = async () => {
    const checkout = getCheckoutPayload();
    if (!checkout) return;

    setPaying(true);
    try {
      await AsyncStorage.setItem('shippingInfo', JSON.stringify(checkout.shippingInfo));
      await AsyncStorage.setItem('orderReferenceNo', checkout.orderReferenceNo);
      await AsyncStorage.setItem('paymentMethod', 'online');

      const { data } = await axios.post(
        `${getApiBaseUrl()}/user/hdfc/session`,
        {
          orderItems: cartItems,
          shippingInfo: checkout.shippingInfo,
          orderReferenceNo: checkout.orderReferenceNo,
          companyId: activeCompanyId || undefined,
        },
        { headers: { Authorization: token } }
      );

      const payUrl =
        data?.paymentUrl ||
        data?.paymentLinks?.mobile ||
        data?.paymentLinks?.web;
      if (!data?.success || !payUrl || !data?.hdfcOrderId) {
        Toast.show({
          type: 'error',
          text1: 'Payment Failed',
          text2: data?.message || 'Could not start payment',
        });
        return;
      }

      await AsyncStorage.setItem('hdfcOrderId', data.hdfcOrderId);
      await AsyncStorage.setItem('hdfcPaymentUrl', payUrl);
      Toast.show({
        type: 'info',
        text1: 'Complete UPI in your app',
        text2: 'Keep this screen open and approve the UPI request. Do not close the payment page until you pay.',
      });
      await openHdfcPaymentPage(payUrl);

      const result = await pollHdfcPayment(data.hdfcOrderId);
      if (result?.paid && result?.order?._id) {
        await AsyncStorage.setItem('skipOrderId', String(result.order._id));
        await AsyncStorage.removeItem('hdfcOrderId');
        await AsyncStorage.removeItem('hdfcPaymentUrl');
        navigation.navigate('OrderSuccess' as never);
        return;
      }
      if (result?.pending || result?.resumePayment || result?.awaitingUpi) {
        Toast.show({
          type: 'info',
          text1: 'Payment not completed',
          text2: 'Approve UPI in PhonePe/GPay, or tap Make Payment again to reopen the page.',
        });
        return;
      }
      navigation.navigate('OrderFailed' as never);
    } catch (error: any) {
      console.error('HDFC payment error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Could not start payment',
      });
    } finally {
      setPaying(false);
    }
  };

  const handleSkipPayment = async () => {
    const checkout = getCheckoutPayload();
    if (!checkout) return;

    if (payOnCredit) {
      if (!activeCompanyId) {
        Toast.show({
          type: 'error',
          text1: 'Company Required',
          text2: 'Select your company to use credit',
        });
        return;
      }
      if (!creditCoversOrder) {
        Toast.show({
          type: 'error',
          text1: 'Insufficient Credit',
          text2: `Available ₹${availableCredit}, order total ₹${orderTotal}`,
        });
        return;
      }
    }

    setLoading(true);
    try {
      await AsyncStorage.setItem('shippingInfo', JSON.stringify(checkout.shippingInfo));
      await AsyncStorage.setItem('orderReferenceNo', checkout.orderReferenceNo);
      const paymentMethod = payOnCredit ? 'credit' : 'cash';
      await AsyncStorage.setItem('paymentMethod', paymentMethod);

      const { data } = await axios.post(
        `${getApiBaseUrl()}/user/create-order`,
        {
          orderItems: cartItems,
          shippingInfo: checkout.shippingInfo,
          orderReferenceNo: checkout.orderReferenceNo,
          paymentMethod,
          companyId: activeCompanyId || undefined,
        },
        {
          headers: { Authorization: token },
          timeout: 120000,
        }
      );

      if (data?.success && data?.order?._id) {
        await AsyncStorage.setItem('skipOrderId', String(data.order._id));
        navigation.navigate('OrderSuccess' as never);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Order Failed',
          text2: data?.message || 'Failed to place order',
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong. Please try again',
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
          <Text style={styles.label}>Order Reference Number *</Text>
          <TextInput
            style={styles.input}
            value={orderReferenceNo}
            onChangeText={setOrderReferenceNo}
            placeholder="Enter reference number"
          />
        </View>

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
            <Text style={styles.priceLabel}>Delivery/Freight Charges</Text>
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

        {canUseCompanyCredit && (
          <TouchableOpacity
            style={styles.creditRow}
            onPress={() => creditCoversOrder && setPayOnCredit(!payOnCredit)}
            disabled={!creditCoversOrder}
          >
            <Icon
              name={payOnCredit ? 'check-box' : 'check-box-outline-blank'}
              size={22}
              color={creditCoversOrder ? '#019ee3' : '#ccc'}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.creditLabel}>
                {sales?.creditLabel || 'Pay on Company Credit'}
              </Text>
              <Text style={styles.creditBalance}>
                Available credit: ₹{availableCredit.toLocaleString()}
              </Text>
              {!creditCoversOrder && (
                <Text style={styles.creditWarning}>
                  Order total exceeds available credit
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {sales?.showAssuredBadge && (
          <View style={styles.assuredRow}>
            <Icon name="verified-user" size={20} color="#019ee3" />
            <Text style={styles.assuredText}>
              {sales?.assuredBadgeLabel || 'Corpculture Assured'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.onlinePaymentButton, (loading || paying) && styles.paymentButtonDisabled]}
          onPress={handleOnlinePayment}
          disabled={loading || paying}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.paymentButtonText}>Make Payment</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentButton, (loading || paying) && styles.paymentButtonDisabled]}
          onPress={handleSkipPayment}
          disabled={loading || paying}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.paymentButtonText}>
              {payOnCredit ? 'Place Order (Use Credit)' : 'Place Order (Skip Payment)'}
            </Text>
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
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  creditLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  creditBalance: {
    fontSize: 13,
    color: '#019ee3',
    marginTop: 4,
  },
  creditWarning: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 2,
  },
  assuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#e6fbff',
    borderRadius: 8,
  },
  assuredText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#019ee3',
    flex: 1,
  },
  onlinePaymentButton: {
    backgroundColor: '#fb641b',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  paymentButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
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
