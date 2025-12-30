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
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';

const AddServiceProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const product_id = (route.params as any)?.product_id;
  const isAdmin = user?.role === 1 || user?.role === 3;
  
  // Track previous product_id to detect changes
  const [previousProductId, setPreviousProductId] = React.useState<string | undefined>(product_id);

  const [company, setCompany] = useState('');
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [hsn, setHsn] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [rate, setRate] = useState('');
  const [gstTypeIds, setGstTypeIds] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState('0');
  const [commission, setCommission] = useState('');
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState<any[]>([]);
  const [gstOptions, setGstOptions] = useState<any[]>([]);
  const [purchaseProducts, setPurchaseProducts] = useState<any[]>([]);
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [gstPickerVisible, setGstPickerVisible] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [companyPage, setCompanyPage] = useState(1);
  const [companyTotalCount, setCompanyTotalCount] = useState(0);
  const [loadingMoreCompanies, setLoadingMoreCompanies] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    fetchCompanies(1, false); // Load first 10 companies
    fetchGstOptions();
    fetchPurchaseProducts();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!companyPickerVisible) return; // Only search when picker is visible
    
    const searchTimer = setTimeout(() => {
      fetchCompanies(1, false, companySearch);
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimer);
  }, [companySearch, companyPickerVisible]);

  // Function to clear all form fields
  const clearForm = () => {
    setCompany('');
    setProductName('');
    setSku('');
    setHsn('');
    setQuantity('1');
    setRate('');
    setGstTypeIds([]);
    setTotalAmount('0');
    setCommission('');
  };

  useEffect(() => {
    const currentProductId = (route.params as any)?.product_id;
    
    // If product_id changed from a value to undefined/null, clear the form
    if (previousProductId && !currentProductId) {
      clearForm();
    }
    
    // If product_id exists, fetch the product
    if (currentProductId) {
      fetchProduct(currentProductId);
    } else if (!previousProductId) {
      // Only clear on initial load if there's no product_id
      clearForm();
    }
    
    setPreviousProductId(currentProductId);
  }, [route.params]);

  // Clear form when screen is focused and there's no product_id (add mode)
  useFocusEffect(
    React.useCallback(() => {
      const currentProductId = (route.params as any)?.product_id;
      if (!currentProductId) {
        clearForm();
      }
    }, [route.params])
  );

  useEffect(() => {
    calculateTotalAmount();
  }, [quantity, rate, gstTypeIds, gstOptions]);

  const fetchCompanies = async (page = 1, append = false, search = '') => {
    if (!append) {
      setLoadingCompanies(true);
    }
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const { data } = await axios.get(`${getApiBaseUrl()}/company/all?page=${page}&limit=10${searchParam}`, {
        headers: {
          Authorization: token || '',
        },
        timeout: 30000,
      });
      if (data?.success) {
        if (append) {
          setCompanies(prev => [...prev, ...(data.companies || [])]);
        } else {
          setCompanies(data.companies || []);
        }
        setCompanyTotalCount(data.totalCount || 0);
        setCompanyPage(page);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      if (!append) {
        setCompanies([]);
      }
    } finally {
      if (!append) {
        setLoadingCompanies(false);
      }
    }
  };

  const loadMoreCompanies = async () => {
    if (loadingMoreCompanies || companies.length >= companyTotalCount) return;
    
    setLoadingMoreCompanies(true);
    try {
      const nextPage = companyPage + 1;
      await fetchCompanies(nextPage, true, companySearch);
    } catch (error) {
      console.error('Error loading more companies:', error);
    } finally {
      setLoadingMoreCompanies(false);
    }
  };

  const fetchGstOptions = async () => {
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/gst`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success) {
        setGstOptions(data.gst || []);
      }
    } catch (error) {
      console.error('Error fetching GST options:', error);
    }
  };

  const fetchPurchaseProducts = async () => {
    try {
      const url = `${getApiBaseUrl()}/purchases${user?.role !== 1 ? `?category=${user?.department}` : ''}`;
      const { data } = await axios.get(url, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success) {
        const uniqueProductsMap = new Map();
        data.purchases.forEach((purchase: any) => {
          if (purchase.productName && typeof purchase.productName.productCode === 'string' && purchase.productName.productCode.length > 0) {
            if (!uniqueProductsMap.has(purchase.productName.productCode)) {
              uniqueProductsMap.set(purchase.productName.productCode, purchase);
            }
          }
        });
        setPurchaseProducts(Array.from(uniqueProductsMap.values()));
      }
    } catch (error) {
      console.error('Error fetching purchase products:', error);
    }
  };

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/service-products/${productId}`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success) {
        const product = data.serviceProduct;
        setCompany(product.company?._id || product.company || '');
        setProductName(product.productName?._id || '');
        setSku(product.sku || '');
        setHsn(product.hsn || '');
        setQuantity(product.quantity?.toString() || '1');
        setRate(product.rate?.toString() || '');
        setCommission(product.commission?.toString() || '');
        setGstTypeIds(
          Array.isArray(product.gstType)
            ? product.gstType.map((g: any) => (typeof g === 'object' ? g._id : g))
            : []
        );
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fetch product details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    const currentRate = parseFloat(rate) || 0;
    const currentQuantity = parseInt(quantity) || 0;
    let totalGstPercentage = 0;

    if (gstTypeIds.length > 0 && gstOptions.length > 0) {
      gstTypeIds.forEach((id) => {
        const selectedGst = gstOptions.find((gst) => gst._id === id);
        if (selectedGst) {
          totalGstPercentage += selectedGst.gstPercentage;
        }
      });
    }

    const subTotal = currentRate * currentQuantity;
    const gstAmount = subTotal * (totalGstPercentage / 100);
    setTotalAmount((subTotal + gstAmount).toFixed(2));
  };

  const handleSubmit = async () => {
    // Commission is only required for admin users
    if (!company || !productName || !sku || !hsn || !quantity || !rate || gstTypeIds.length === 0 || (isAdmin && !commission)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields.',
      });
      return;
    }

    setLoading(true);
    try {
      const productData = {
        company,
        productName,
        sku,
        hsn,
        quantity: parseInt(quantity),
        rate: parseFloat(rate),
        gstType: gstTypeIds,
        totalAmount: parseFloat(totalAmount),
        ...(isAdmin && { commission: parseFloat(commission) }), // Add commission to payload only for admin
      };

      let response;
      if (product_id) {
        response = await axios.put(
          `${getApiBaseUrl()}/service-products/${product_id}`,
          productData,
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      } else {
        response = await axios.post(
          `${getApiBaseUrl()}/service-products`,
          productData,
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      }

      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || (product_id ? 'Product updated successfully!' : 'Product added successfully!'),
        });
        // Navigate back to ServiceProductList screen explicitly
        (navigation as any).navigate('ServiceProductList');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to save product.',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCompany = companies.find((c) => c._id === company);
  const selectedProduct = purchaseProducts.find((p) => p._id === productName);
  const selectedGstTypes = gstOptions.filter((gst) => gstTypeIds.includes(gst._id));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{product_id ? 'Edit Product' : 'Add Product'}</Text>
      </View>

      <View style={styles.form}>
        {/* Company Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setCompanyPickerVisible(true)}
          >
            <Text style={[styles.pickerButtonText, !company && styles.placeholder]}>
              {selectedCompany ? selectedCompany.companyName : 'Select a Company'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Product Name Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setProductPickerVisible(true)}
            disabled={!company}
          >
            <Text style={[styles.pickerButtonText, !productName && styles.placeholder]}>
              {selectedProduct ? selectedProduct.productName?.productName : 'Select a Product'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* SKU */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>SKU *</Text>
          <TextInput
            style={styles.input}
            value={sku}
            onChangeText={setSku}
            placeholder="Enter SKU"
          />
        </View>

        {/* HSN */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>HSN *</Text>
          <TextInput
            style={styles.input}
            value={hsn}
            onChangeText={setHsn}
            placeholder="Enter HSN"
          />
        </View>

        {/* Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Enter Quantity"
            keyboardType="numeric"
          />
        </View>

        {/* Rate */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rate *</Text>
          <TextInput
            style={styles.input}
            value={rate}
            onChangeText={setRate}
            placeholder="Enter Rate"
            keyboardType="decimal-pad"
          />
        </View>

        {/* GST Type Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Type *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setGstPickerVisible(true)}
          >
            <Text style={[styles.pickerButtonText, gstTypeIds.length === 0 && styles.placeholder]}>
              {selectedGstTypes.length > 0
                ? selectedGstTypes.map((gst) => `${gst.gstType} (${gst.gstPercentage}%)`).join(', ')
                : 'Select GST Type(s)'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Commission - Only for Admin */}
        {isAdmin && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Commission *</Text>
            <TextInput
              style={styles.input}
              value={commission}
              onChangeText={setCommission}
              placeholder="Enter Commission"
              keyboardType="decimal-pad"
            />
          </View>
        )}

        {/* Total Amount (Read-only) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Amount</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={totalAmount}
            editable={false}
            placeholder="Calculated automatically"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              // Navigate back to ServiceProductList screen explicitly
              if ((navigation as any).canGoBack()) {
                navigation.goBack();
              } else {
                (navigation as any).navigate('ServiceProductList');
              }
            }}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Company Picker Modal */}
      <Modal
        visible={companyPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setCompanyPickerVisible(false);
          setCompanySearch('');
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setCompanyPickerVisible(false);
            setCompanySearch('');
          }}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Company</Text>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search company..."
                value={companySearch}
                onChangeText={setCompanySearch}
                placeholderTextColor="#999"
              />
            </View>
            <FlatList
              data={companies}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCompany(item._id);
                    setCompanyPickerVisible(false);
                    setCompanySearch('');
                    setProductName(''); // Reset product when company changes
                  }}
                >
                  <Text style={styles.modalItemText}>{item.companyName}</Text>
                </TouchableOpacity>
              )}
              onEndReached={() => {
                if (companies.length < companyTotalCount && !loadingMoreCompanies) {
                  loadMoreCompanies();
                }
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMoreCompanies ? (
                  <View style={styles.loadingFooter}>
                    <ActivityIndicator size="small" color="#019ee3" />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {loadingCompanies ? 'Loading...' : 'No companies found'}
                  </Text>
                </View>
              }
            />
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Product</Text>
            <FlatList
              data={purchaseProducts}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setProductName(item._id);
                    setProductPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.productName?.productName || 'N/A'}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No products found</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GST Picker Modal */}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select GST Type(s)</Text>
            <FlatList
              data={gstOptions}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = gstTypeIds.includes(item._id);
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.selectedItem]}
                    onPress={() => {
                      if (isSelected) {
                        setGstTypeIds(gstTypeIds.filter((id) => id !== item._id));
                      } else {
                        setGstTypeIds([...gstTypeIds, item._id]);
                      }
                    }}
                  >
                    <Icon
                      name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={isSelected ? '#007AFF' : '#666'}
                    />
                    <Text style={styles.modalItemText}>
                      {item.gstType} ({item.gstPercentage}%)
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No GST options found</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={[styles.modalItem, styles.modalCancel]}
              onPress={() => setGstPickerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Done</Text>
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
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#019ee3',
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
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholder: {
    color: '#999',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitButton: {
    backgroundColor: '#1976d2',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  modalItemText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
    flex: 1,
  },
  modalCancel: {
    borderBottomWidth: 0,
    marginTop: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
});

export default AddServiceProductScreen;

