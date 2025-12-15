import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const PurchaseRegisterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const purchaseId = params?.id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorCompanyName: '',
    productName: '',
    selectedProductId: '',
    voucherType: 'Purchase',
    purchaseInvoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    quantity: '',
    rate: '',
  });

  const [vendorCompanies, setVendorCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [gstOptions, setGstOptions] = useState<any[]>([]);
  const voucherTypes = ['Purchase', 'Return', 'Other'];

  const [vendorPickerVisible, setVendorPickerVisible] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [voucherTypePickerVisible, setVoucherTypePickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVendorCompanies();
      if (purchaseId) {
        fetchPurchaseData();
      } else {
        resetForm();
      }
    }, [purchaseId])
  );

  const fetchVendorCompanies = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/vendors`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success) {
        setVendorCompanies(response.data.vendors || []);
      }
    } catch (error: any) {
      console.error('Error fetching vendor companies:', error);
    }
  };

  const fetchVendorProducts = async (vendorId: string) => {
    if (!vendorId) {
      setProducts([]);
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/vendor-products/getProductsByVendorId/${vendorId}`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success) {
        setProducts(response.data.vendorProducts || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch products for the selected vendor.',
        });
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Error fetching vendor products:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching vendor products.',
      });
      setProducts([]);
    }
  };

  const fetchPurchaseData = async () => {
    if (!purchaseId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/purchases/${purchaseId}`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success) {
        const purchase = response.data.purchase;
        const vendorId = purchase.vendorCompanyName?._id || '';
        setFormData({
          vendorCompanyName: vendorId,
          productName: purchase.productName || '',
          selectedProductId: purchase.productName?._id || '',
          voucherType: purchase.voucherType || 'Purchase',
          purchaseInvoiceNumber: purchase.purchaseInvoiceNumber || '',
          purchaseDate: purchase.purchaseDate
            ? new Date(purchase.purchaseDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          quantity: purchase.quantity?.toString() || '',
          rate: purchase.rate?.toString() || '',
        });
        if (vendorId) {
          await fetchVendorProducts(vendorId);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch purchase details.',
        });
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error fetching purchase for edit:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching purchase details.',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.vendorCompanyName) {
      fetchVendorProducts(formData.vendorCompanyName);
    } else {
      setProducts([]);
    }
    setFormData((prev) => ({
      ...prev,
      productName: '',
      selectedProductId: '',
      rate: '',
    }));
  }, [formData.vendorCompanyName]);

  useEffect(() => {
    if (formData.selectedProductId && products.length > 0) {
      const selectedProduct = products.find((p) => p._id === formData.selectedProductId);
      if (selectedProduct && selectedProduct.pricePerQuantity !== undefined) {
        setFormData((prev) => ({
          ...prev,
          rate: selectedProduct.pricePerQuantity.toString(),
        }));
        setGstOptions(selectedProduct.gstType || []);
      } else {
        setFormData((prev) => ({ ...prev, rate: '' }));
      }
    } else {
      setFormData((prev) => ({ ...prev, rate: '' }));
    }
  }, [formData.selectedProductId, products]);

  const resetForm = () => {
    setFormData({
      vendorCompanyName: '',
      productName: '',
      selectedProductId: '',
      voucherType: 'Purchase',
      purchaseInvoiceNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: '',
      rate: '',
    });
    setProducts([]);
    setGstOptions([]);
  };

  const parsedQuantity = parseFloat(formData.quantity) || 0;
  const parsedRate = parseFloat(formData.rate) || 0;
  const calculatedPrice = parsedQuantity * parsedRate;

  const totalGstPercentage =
    Array.isArray(gstOptions) && gstOptions.length > 0
      ? gstOptions.reduce((sum, option) => sum + parseFloat(option.gstPercentage || 0), 0)
      : 0;
  const calculatedGstAmount = calculatedPrice * (totalGstPercentage / 100);
  const calculatedGrossTotal = calculatedPrice + calculatedGstAmount;

  const handleSubmit = async () => {
    if (!formData.vendorCompanyName || !formData.selectedProductId || !formData.purchaseDate || !formData.rate) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const purchaseData = {
        vendorCompanyName: formData.vendorCompanyName,
        productName: formData.selectedProductId,
        voucherType: formData.voucherType,
        purchaseInvoiceNumber: formData.purchaseInvoiceNumber,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : null,
        quantity: parsedQuantity,
        rate: parsedRate,
        price: calculatedPrice,
        grossTotal: calculatedGrossTotal,
      };

      let response;
      if (purchaseId) {
        response = await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/purchases/${purchaseId}`,
          purchaseData,
          {
            headers: { Authorization: token || '' },
          }
        );
      } else {
        response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/purchases`,
          purchaseData,
          {
            headers: { Authorization: token || '' },
          }
        );
      }

      if (response.data?.success) {
        // Update or create material entry
        try {
          const materialResponse = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/materials/update-or-create`,
            {
              name: formData.productName,
              unit: purchaseData.quantity,
            },
            {
              headers: { Authorization: token || '' },
            }
          );
          if (materialResponse.data?.success) {
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Material entry updated/created successfully',
            });
          }
        } catch (materialError: any) {
          console.error('Error updating material:', materialError);
        }

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || `Purchase ${purchaseId ? 'updated' : 'registered'} successfully!`,
        });

        if (!purchaseId) {
          resetForm();
        }
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || `Failed to ${purchaseId ? 'update' : 'register'} purchase.`,
        });
      }
    } catch (error: any) {
      console.error(`Error ${purchaseId ? 'updating' : 'registering'} purchase:`, error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = vendorCompanies.find((v) => v._id === formData.vendorCompanyName);
  const selectedProduct = products.find((p) => p._id === formData.selectedProductId);

  if (loading && purchaseId) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {purchaseId ? 'Edit Purchase Entry' : 'Purchase Register'}
        </Text>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.viewButtonText}>View Purchases</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vendor Company Name *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setVendorPickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {selectedVendor?.companyName || '--select Company Name--'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TouchableOpacity
            style={[styles.pickerButton, !formData.vendorCompanyName && styles.pickerButtonDisabled]}
            onPress={() => formData.vendorCompanyName && setProductPickerVisible(true)}
            disabled={!formData.vendorCompanyName}
          >
            <Text style={styles.pickerButtonText}>
              {selectedProduct?.productName || '--select Product Name--'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Voucher Type</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setVoucherTypePickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>{formData.voucherType}</Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Purchase Invoice Number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.purchaseInvoiceNumber}
              onChangeText={(text) => setFormData({ ...formData, purchaseInvoiceNumber: text })}
              placeholder="Enter invoice number"
              placeholderTextColor="#999"
            />
            <Icon name="receipt" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Purchase Date *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setDatePickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {formData.purchaseDate || '--select Date--'}
            </Text>
            <Icon name="calendar-today" size={20} color="#666" style={styles.inputIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholder="Enter quantity"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Icon name="shopping-cart" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rate *</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={[styles.input, styles.inputWithCurrency]}
              value={formData.rate}
              onChangeText={(text) => setFormData({ ...formData, rate: text })}
              placeholder="Enter rate"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (Calculated)</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={[styles.input, styles.inputWithCurrency, styles.readOnlyInput]}
              value={calculatedPrice.toFixed(2)}
              placeholder="0.00"
              placeholderTextColor="#999"
              editable={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gross Total (Calculated)</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={[styles.input, styles.inputWithCurrency, styles.readOnlyInput]}
              value={calculatedGrossTotal.toFixed(2)}
              placeholder="0.00"
              placeholderTextColor="#999"
              editable={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {purchaseId ? 'Update' : 'Register'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Vendor Picker Modal */}
      <Modal
        visible={vendorPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVendorPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVendorPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Vendor Company</Text>
            <FlatList
              data={vendorCompanies}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({ ...formData, vendorCompanyName: item._id });
                    setVendorPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.companyName}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setVendorPickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Product Picker Modal */}
      <Modal
        visible={productPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProductPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProductPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Product</Text>
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      selectedProductId: item._id,
                      productName: item.productName,
                    });
                    setProductPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.productName}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setProductPickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Voucher Type Picker Modal */}
      <Modal
        visible={voucherTypePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVoucherTypePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVoucherTypePickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Voucher Type</Text>
            <FlatList
              data={voucherTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({ ...formData, voucherType: item });
                    setVoucherTypePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setVoucherTypePickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal - Simple text input for date */}
      <Modal
        visible={datePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDatePickerVisible(false)}
        >
          <View style={styles.datePickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Purchase Date</Text>
            <TextInput
              style={styles.dateInput}
              value={formData.purchaseDate}
              onChangeText={(text) => setFormData({ ...formData, purchaseDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setDatePickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#019ee3',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    flex: 1,
  },
  inputWithCurrency: {
    paddingLeft: 30,
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  currencySymbol: {
    position: 'absolute',
    left: 12,
    fontSize: 16,
    color: '#666',
    zIndex: 1,
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
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
  pickerButtonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  datePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    marginBottom: 15,
  },
});

export default PurchaseRegisterScreen;
