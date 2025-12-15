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

const AddVendorProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const productId = params?.product_id || params?.productId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorCompanyName: '',
    productName: '',
    gstType: [] as string[],
    pricePerQuantity: '',
    productCode: '',
    category: '',
  });

  const [vendorCompanies, setVendorCompanies] = useState<any[]>([]);
  const [gstOptions, setGstOptions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [vendorPickerVisible, setVendorPickerVisible] = useState(false);
  const [gstPickerVisible, setGstPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVendorCompanies();
      fetchGstOptions();
      fetchCategories();
      if (productId) {
        fetchVendorProduct();
      } else {
        resetForm();
      }
    }, [productId])
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

  const fetchGstOptions = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/gst`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success) {
        setGstOptions(response.data.gst || []);
      }
    } catch (error: any) {
      console.error('Error fetching GST options:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/category/all`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchVendorProduct = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/vendor-products/${productId}`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success) {
        const product = response.data.vendorProduct;
        setFormData({
          vendorCompanyName: product.vendorCompanyName?._id || product.vendorCompanyName || '',
          productName: product.productName || '',
          gstType: product.gstType ? product.gstType.map((gst: any) => gst._id || gst) : [],
          pricePerQuantity: product.pricePerQuantity?.toString() || '',
          productCode: product.productCode || '',
          category: product.category?._id || product.category || '',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch vendor product details.',
        });
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error fetching vendor product:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching vendor product details.',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendorCompanyName: '',
      productName: '',
      gstType: [],
      pricePerQuantity: '',
      productCode: '',
      category: '',
    });
  };

  const handleSubmit = async () => {
    // Basic validation
    if (
      !formData.vendorCompanyName ||
      !formData.productName ||
      formData.gstType.length === 0 ||
      !formData.pricePerQuantity ||
      !formData.productCode
    ) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        vendorCompanyName: formData.vendorCompanyName,
        productName: formData.productName,
        gstType: formData.gstType,
        pricePerQuantity: parseFloat(formData.pricePerQuantity),
        productCode: formData.productCode,
        category: formData.category,
      };

      let response;
      if (productId) {
        // Update existing vendor product
        response = await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/vendor-products/${productId}`,
          productData,
          {
            headers: { Authorization: token || '' },
          }
        );
      } else {
        // Create new vendor product
        response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/vendor-products`,
          productData,
          {
            headers: { Authorization: token || '' },
          }
        );
      }

      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || `Product ${productId ? 'updated' : 'registered'} successfully!`,
        });
        if (!productId) {
          resetForm();
        }
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || `Failed to ${productId ? 'update' : 'register'} product.`,
        });
      }
    } catch (error: any) {
      console.error(`Error ${productId ? 'updating' : 'registering'} product:`, error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGstType = (gstId: string) => {
    setFormData((prev) => ({
      ...prev,
      gstType: prev.gstType.includes(gstId)
        ? prev.gstType.filter((id) => id !== gstId)
        : [...prev.gstType, gstId],
    }));
  };

  const getSelectedGstLabels = () => {
    return formData.gstType
      .map((id) => {
        const gst = gstOptions.find((opt) => opt._id === id);
        return gst ? `${gst.gstType} (${gst.gstPercentage}%)` : null;
      })
      .filter(Boolean)
      .join(', ');
  };

  const selectedVendor = vendorCompanies.find((v) => v._id === formData.vendorCompanyName);
  const selectedCategory = categories.find((c) => c._id === formData.category);

  if (loading && productId) {
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
          {productId ? 'Edit Product' : 'Product Register'}
        </Text>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.viewButtonText}>View Products</Text>
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
              {selectedVendor?.companyName || '--select Vendor Company--'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.productName}
              onChangeText={(text) => setFormData({ ...formData, productName: text })}
              placeholder="Enter product name"
              placeholderTextColor="#999"
            />
            <Icon name="description" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setCategoryPickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {selectedCategory?.name || '--select Category--'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Code *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.productCode}
              onChangeText={(text) => setFormData({ ...formData, productCode: text })}
              placeholder="Enter product code"
              placeholderTextColor="#999"
            />
            <Icon name="description" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Type *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setGstPickerVisible(true)}
          >
            <Text style={styles.pickerButtonText} numberOfLines={1}>
              {getSelectedGstLabels() || '--select GST Type--'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
          {formData.gstType.length > 0 && (
            <View style={styles.chipContainer}>
              {formData.gstType.map((gstId) => {
                const gst = gstOptions.find((opt) => opt._id === gstId);
                if (!gst) return null;
                return (
                  <View key={gstId} style={styles.chip}>
                    <Text style={styles.chipText}>
                      {gst.gstType} ({gst.gstPercentage}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price Per Quantity *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.pricePerQuantity}
              onChangeText={(text) => setFormData({ ...formData, pricePerQuantity: text })}
              placeholder="Enter price per quantity"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            <Icon name="description" size={20} color="#666" style={styles.inputIcon} />
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
              {productId ? 'Update' : 'Register'}
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

      {/* Category Picker Modal */}
      <Modal
        visible={categoryPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({ ...formData, category: item._id });
                    setCategoryPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setCategoryPickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GST Type Picker Modal */}
      <Modal
        visible={gstPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGstPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGstPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select GST Type (Multiple)</Text>
            <FlatList
              data={gstOptions}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = formData.gstType.includes(item._id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerOption,
                      isSelected && styles.pickerOptionSelected,
                    ]}
                    onPress={() => toggleGstType(item._id)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        isSelected && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {item.gstType} ({item.gstPercentage}%)
                    </Text>
                    {isSelected && <Icon name="check" size={20} color="#019ee3" />}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setGstPickerVisible(false)}
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
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
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#019ee3',
  },
  chipText: {
    fontSize: 12,
    color: '#019ee3',
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  pickerOptionTextSelected: {
    color: '#019ee3',
    fontWeight: '600',
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
});

export default AddVendorProductScreen;
