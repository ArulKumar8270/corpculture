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
import { useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';

interface ProductInTable {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  hsn: string;
  quantity: number;
  rate: number;
  totalAmount: number;
}

const AddServiceQuotationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const quotationId = params?.quotationId;
  const employeeName = params?.employeeName;

  const [quotationData, setQuotationData] = useState({
    companyId: '',
    productId: '',
    quantity: '',
    modeOfPayment: 'Cash',
    deliveryAddress: '',
    reference: '',
    description: '',
    status: 'draft',
    sendTo: [] as string[],
  });

  const [companyData, setCompanyData] = useState<any>(null);
  const [productsInTable, setProductsInTable] = useState<ProductInTable[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState(0);
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [deliveryAddressPickerVisible, setDeliveryAddressPickerVisible] = useState(false);
  const [sendToPickerVisible, setSendToPickerVisible] = useState(false);

  useEffect(() => {
    fetchQuotationsCount();
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (quotationData.companyId && quotationData.companyId !== '') {
      fetchCompanyData();
      fetchProductsByCompany();
    }
  }, [quotationData.companyId]);

  useEffect(() => {
    if (quotationId) {
      fetchQuotationDetails();
    }
  }, [quotationId]);

  const fetchQuotationsCount = async () => {
    try {
      const { data } = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/service-invoice/all`, {
        headers: {
          Authorization: user?.token || '',
        },
      });
      if (data?.success) {
        setInvoices((data.serviceInvoices?.length || 0) + 1);
      }
    } catch (error) {
      console.error('Error fetching quotations count:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/company/all`, {
        headers: {
          Authorization: user?.token || '',
        },
      });
      if (data?.success) {
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/company/get/${quotationData.companyId}`,
        {
          headers: {
            Authorization: user?.token || '',
          },
        }
      );
      if (data?.success && data.company) {
        setCompanyData(data.company);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  const fetchProductsByCompany = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/service-products/getServiceProductsByCompany/${quotationData.companyId}`,
        {
          headers: {
            Authorization: user?.token || '',
          },
        }
      );
      if (data?.success) {
        setAvailableProducts(data.serviceProducts || []);
      } else {
        setAvailableProducts([]);
      }
    } catch (error) {
      setAvailableProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotationDetails = async () => {
    if (!quotationId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/get/${quotationId}`,
        {
          headers: {
            Authorization: user?.token || '',
          },
        }
      );
      if (data?.success) {
        const quotation = data.serviceInvoice;
        setQuotationData({
          companyId: quotation.companyId?._id || quotation.companyId || '',
          productId: '',
          quantity: '',
          modeOfPayment: quotation.modeOfPayment || 'Cash',
          deliveryAddress: quotation.deliveryAddress || '',
          reference: quotation.reference || '',
          description: quotation.description || '',
          status: quotation.status || 'draft',
          sendTo: Array.isArray(quotation.sendTo) ? quotation.sendTo : quotation.sendTo ? [quotation.sendTo] : [],
        });
        setProductsInTable(
          (quotation.products || []).map((p: any, idx: number) => ({
            id: Date.now().toString() + idx,
            productId: p.productId?._id || p.productId,
            productName: p.productId?.productName?.productName?.productName || p.productName,
            sku: p.productId?.sku || '',
            hsn: p.productId?.hsn || '',
            quantity: p.quantity,
            rate: p.rate,
            totalAmount: p.totalAmount,
          }))
        );
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fetch quotation details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    const selectedProduct = availableProducts.find((p) => p._id === quotationData.productId);

    if (!selectedProduct || !quotationData.quantity || parseFloat(quotationData.quantity) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a product and enter a valid quantity',
      });
      return;
    }

    const newProduct: ProductInTable = {
      id: Date.now().toString() + Math.random(),
      productId: selectedProduct._id,
      productName: selectedProduct.productName?.productName?.productName || '',
      sku: selectedProduct.sku || '',
      hsn: selectedProduct.hsn || '',
      quantity: parseInt(quotationData.quantity),
      rate: selectedProduct.rate || 0,
      totalAmount: parseInt(quotationData.quantity) * (selectedProduct.totalAmount || 0),
    };

    setProductsInTable([...productsInTable, newProduct]);
    setQuotationData({
      ...quotationData,
      productId: '',
      quantity: '',
    });
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Product added to list!',
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProductsInTable(productsInTable.filter((product) => product.id !== id));
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Product removed!',
    });
  };

  const handleSubmit = async () => {
    const { companyId, modeOfPayment, deliveryAddress, reference, description, status, sendTo } =
      quotationData;

    if (!companyId || !modeOfPayment || !deliveryAddress || productsInTable.length === 0 || sendTo.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill all required fields and add at least one product',
      });
      return;
    }

    const subtotal = productsInTable.reduce((sum, item) => sum + item.totalAmount, 0);
    const tax = 0;
    const grandTotal = subtotal + tax;

    const payload: any = {
      quotationNumber: invoices,
      companyId,
      products: productsInTable.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        quantity: p.quantity,
        rate: p.rate,
        totalAmount: p.totalAmount,
      })),
      modeOfPayment,
      deliveryAddress,
      reference,
      description,
      subtotal,
      tax,
      grandTotal,
      status,
      assignedTo: employeeName,
      sendTo,
      invoiceType: 'quotation',
    };

    try {
      setLoading(true);
      let response;
      if (quotationId) {
        response = await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/update/${quotationId}`,
          payload,
          {
            headers: {
              Authorization: user?.token || '',
            },
          }
        );
      } else {
        response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/create`,
          payload,
          {
            headers: {
              Authorization: user?.token || '',
            },
          }
        );
      }

      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || 'Quotation saved successfully!',
        });
        (navigation as any).navigate('ServiceQuotationList');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to save quotation',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong while saving the quotation',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCompany = companies.find((c) => c._id === quotationData.companyId);
  const selectedProduct = availableProducts.find((p) => p._id === quotationData.productId);

  if (loading && !quotationData.companyId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Service Quotation</Text>
      </View>

      <View style={styles.form}>
        {/* Company Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setCompanyPickerVisible(true)}
            disabled={!!quotationId}
          >
            <Text style={[styles.pickerButtonText, !quotationData.companyId && styles.placeholder]}>
              {selectedCompany ? selectedCompany.companyName : 'Select a Company'}
            </Text>
            {!quotationId && <Icon name="arrow-drop-down" size={24} color="#666" />}
          </TouchableOpacity>
        </View>

        {/* Product Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setProductPickerVisible(true)}
            disabled={!quotationData.companyId || availableProducts.length === 0}
          >
            <Text style={[styles.pickerButtonText, !quotationData.productId && styles.placeholder]}>
              {selectedProduct
                ? selectedProduct.productName?.productName?.productName || 'Selected'
                : 'Select a Product'}
            </Text>
            {quotationData.companyId && availableProducts.length > 0 && (
              <Icon name="arrow-drop-down" size={24} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        {/* Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            value={quotationData.quantity}
            onChangeText={(text) => setQuotationData({ ...quotationData, quantity: text })}
            placeholder="Enter Quantity"
            keyboardType="numeric"
            editable={!!quotationData.productId}
          />
        </View>

        {/* Delivery Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service / Delivery Address *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setDeliveryAddressPickerVisible(true)}
            disabled={!quotationData.companyId || !companyData?.serviceDeliveryAddresses?.length}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !quotationData.deliveryAddress && styles.placeholder,
              ]}
            >
              {quotationData.deliveryAddress || 'Select Delivery Address'}
            </Text>
            {quotationData.companyId && companyData?.serviceDeliveryAddresses?.length > 0 && (
              <Icon name="arrow-drop-down" size={24} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        {/* Reference */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reference</Text>
          <TextInput
            style={styles.input}
            value={quotationData.reference}
            onChangeText={(text) => setQuotationData({ ...quotationData, reference: text })}
            placeholder="Reference"
          />
        </View>

        {/* Send To */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Send To *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setSendToPickerVisible(true)}
            disabled={!quotationData.companyId || !companyData?.contactPersons?.length}
          >
            <Text
              style={[
                styles.pickerButtonText,
                quotationData.sendTo.length === 0 && styles.placeholder,
              ]}
            >
              {quotationData.sendTo.length > 0
                ? quotationData.sendTo
                    .map((email) => {
                      const person = companyData?.contactPersons?.find((p: any) => p.email === email);
                      return person ? person.name : email;
                    })
                    .join(', ')
                : 'Select Contact Person(s)'}
            </Text>
            {quotationData.companyId && companyData?.contactPersons?.length > 0 && (
              <Icon name="arrow-drop-down" size={24} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={quotationData.description}
            onChangeText={(text) => setQuotationData({ ...quotationData, description: text })}
            placeholder="Description"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Add Product Button */}
        <TouchableOpacity
          style={[
            styles.addProductButton,
            (!quotationData.productId ||
              !quotationData.quantity ||
              parseFloat(quotationData.quantity) <= 0) &&
              styles.addProductButtonDisabled,
          ]}
          onPress={handleAddProduct}
          disabled={
            !quotationData.productId ||
            !quotationData.quantity ||
            parseFloat(quotationData.quantity) <= 0
          }
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.addProductButtonText}>Add Product to List</Text>
        </TouchableOpacity>

        {/* Products Table */}
        {productsInTable.length > 0 && (
          <View style={styles.productsTable}>
            <Text style={styles.tableTitle}>Products</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>S.No</Text>
              <Text style={styles.tableHeaderText}>Product Name</Text>
              <Text style={styles.tableHeaderText}>SKU</Text>
              <Text style={styles.tableHeaderText}>HSN</Text>
              <Text style={styles.tableHeaderText}>Qty</Text>
              <Text style={styles.tableHeaderText}>Rate</Text>
              <Text style={styles.tableHeaderText}>Total</Text>
              <Text style={styles.tableHeaderText}>Action</Text>
            </View>
            {productsInTable.map((product, index) => (
              <View key={product.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.productNameCell]}>
                  {product.productName}
                </Text>
                <Text style={styles.tableCell}>{product.sku}</Text>
                <Text style={styles.tableCell}>{product.hsn}</Text>
                <Text style={styles.tableCell}>{product.quantity}</Text>
                <Text style={styles.tableCell}>₹{product.rate.toFixed(2)}</Text>
                <Text style={styles.tableCell}>₹{product.totalAmount.toFixed(2)}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProduct(product.id)}
                >
                  <Icon name="delete" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.tableFooter}>
              <Text style={styles.totalLabel}>Grand Total:</Text>
              <Text style={styles.totalAmount}>
                ₹{productsInTable.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

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
              // Navigate back to ServiceQuotationList screen explicitly
              (navigation as any).navigate('ServiceQuotationList');
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
        onRequestClose={() => setCompanyPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCompanyPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Company</Text>
            <FlatList
              data={companies}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setQuotationData({
                      ...quotationData,
                      companyId: item._id,
                      productId: '',
                      quantity: '',
                      sendTo: [],
                      deliveryAddress: '',
                    });
                    setCompanyPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.companyName}</Text>
                </TouchableOpacity>
              )}
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
              data={availableProducts}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setQuotationData({ ...quotationData, productId: item._id });
                    setProductPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.productName?.productName?.productName || 'N/A'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delivery Address Picker Modal */}
      <Modal
        visible={deliveryAddressPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDeliveryAddressPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeliveryAddressPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Delivery Address</Text>
            <FlatList
              data={companyData?.serviceDeliveryAddresses || []}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setQuotationData({
                      ...quotationData,
                      deliveryAddress: `${item.address} - ${item.pincode}`,
                    });
                    setDeliveryAddressPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{`${item.address} - ${item.pincode}`}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Send To Picker Modal */}
      <Modal
        visible={sendToPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSendToPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSendToPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Contact Person(s)</Text>
            <FlatList
              data={companyData?.contactPersons || []}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => {
                const isSelected = quotationData.sendTo.includes(item.email);
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.selectedItem]}
                    onPress={() => {
                      if (isSelected) {
                        setQuotationData({
                          ...quotationData,
                          sendTo: quotationData.sendTo.filter((email) => email !== item.email),
                        });
                      } else {
                        setQuotationData({
                          ...quotationData,
                          sendTo: [...quotationData.sendTo, item.email],
                        });
                      }
                    }}
                  >
                    <Icon
                      name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={isSelected ? '#007AFF' : '#666'}
                    />
                    <Text style={styles.modalItemText}>
                      {item.name} ({item.email})
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={[styles.modalItem, styles.modalCancel]}
              onPress={() => setSendToPickerVisible(false)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  addProductButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productsTable: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  productNameCell: {
    flex: 2,
  },
  deleteButton: {
    padding: 5,
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
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
});

export default AddServiceQuotationScreen;

