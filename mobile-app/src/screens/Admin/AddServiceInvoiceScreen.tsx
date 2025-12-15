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
import Toast from 'react-native-toast-message';

interface ProductInTable {
  id: string;
  productId: string;
  productName: string | any; // Can be string for display or full object for payload
  sku: string;
  hsn: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  otherProducts?: string;
  benefitQuantity?: number;
  reInstall?: boolean;
  originalProduct?: any; // Store reference to original product for full data
}

const AddServiceInvoiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const invoiceId = params?.invoiceId;
  const invoiceType = params?.invoiceType || 'invoice';
  const employeeName = params?.employeeName;
  const employeeId = params?.employeeId; // Employee ID if passed
  const serviceId = params?.serviceId;
  const companyIdFromParams = params?.companyId;

  const [invoiceData, setInvoiceData] = useState({
    companyId: companyIdFromParams && companyIdFromParams !== 'null' ? companyIdFromParams : '',
    productId: '',
    quantity: '',
    modeOfPayment: 'Cash',
    deliveryAddress: '',
    reference: '',
    description: '',
    sendTo: [] as string[],
    reInstall: false,
    otherProducts: '',
    benefitQuantity: '',
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
  const [paymentModePickerVisible, setPaymentModePickerVisible] = useState(false);

  const paymentModes = ['Cash', 'Card', 'Bank Transfer', 'UPI', 'CHEQUE', 'BANK TRANSFER', 'OTHERS'];

  useEffect(() => {
    fetchInvoicesCount();
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (invoiceData.companyId && invoiceData.companyId !== '') {
      fetchCompanyData();
      fetchProductsByCompany();
    }
  }, [invoiceData.companyId]);

  // Reset form function - clears all form data
  const resetForm = React.useCallback((companyId?: string) => {
    const companyIdToUse = companyId && companyId !== 'null' ? companyId : (companyIdFromParams && companyIdFromParams !== 'null' ? companyIdFromParams : '');
    setInvoiceData({
      companyId: companyIdToUse,
      productId: '',
      quantity: '',
      modeOfPayment: 'Cash',
      deliveryAddress: '',
      reference: '',
      description: '',
      sendTo: [] as string[],
      reInstall: false,
      otherProducts: '',
      benefitQuantity: '',
    });
    setCompanyData(null);
    setProductsInTable([]);
    setAvailableProducts([]);
  }, [companyIdFromParams]);

  // Track previous invoiceId to detect when we switch from edit to create mode
  const prevInvoiceIdRef = React.useRef<string | undefined>(invoiceId);

  useEffect(() => {
    const currentInvoiceId = invoiceId;
    const prevInvoiceId = prevInvoiceIdRef.current;

    if (currentInvoiceId) {
      // We have an invoiceId, fetch the details
      fetchInvoiceDetails();
    } else if (prevInvoiceId && !currentInvoiceId) {
      // We switched from edit mode (had invoiceId) to create mode (no invoiceId)
      // This means user navigated to create a new invoice after editing
      resetForm();
    }

    // Update the ref for next render
    prevInvoiceIdRef.current = currentInvoiceId;
  }, [invoiceId]);

  // Reset form when screen is focused and there's no invoiceId but form has old data
  useFocusEffect(
    React.useCallback(() => {
      const currentParams = route.params as any;
      const currentInvoiceId = currentParams?.invoiceId;
      
      // If we're creating a new invoice (no invoiceId), ensure form is reset
      // The main useEffect handles most cases, but this catches edge cases
      if (!currentInvoiceId) {
        // Small delay to check current state
        const timeoutId = setTimeout(() => {
          // Check if we need to reset by looking at current state
          if (productsInTable.length > 0 || invoiceData.deliveryAddress || invoiceData.reference) {
            resetForm(currentParams?.companyId);
          }
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }, [route.params])
  );

  const fetchInvoicesCount = async () => {
    try {
      const { data } = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/common-details`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success) {
        setInvoices(data.commonDetails?.invoiceCount + 1 || 1);
      }
    } catch (error) {
      console.error('Error fetching invoice count:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/company/all`, {
        headers: {
          Authorization: token || '',
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
        `${process.env.EXPO_PUBLIC_API_URL}/company/get/${invoiceData.companyId}`,
        {
          headers: {
            Authorization: token || '',
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
        `${process.env.EXPO_PUBLIC_API_URL}/service-products/getServiceProductsByCompany/${invoiceData.companyId}`,
        {
          headers: {
            Authorization: token || '',
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

  const fetchInvoiceDetails = async () => {
    if (!invoiceId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/get/${invoiceId}`,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
      if (data?.success) {
        const invoice = data.serviceInvoice;
        setInvoiceData({
          companyId: invoice.companyId?._id || invoice.companyId || '',
          productId: '',
          quantity: '',
          modeOfPayment: invoice.modeOfPayment || 'Cash',
          deliveryAddress:
            typeof invoice.deliveryAddress === 'object' && invoice.deliveryAddress !== null
              ? `${invoice.deliveryAddress.address} - ${invoice.deliveryAddress.pincode}`
              : invoice.deliveryAddress || '',
          reference: invoice.reference || '',
          description: invoice.description || '',
          sendTo: Array.isArray(invoice.sendTo) ? invoice.sendTo : invoice.sendTo ? [invoice.sendTo] : [],
          reInstall: false,
          otherProducts: '',
          benefitQuantity: '',
        });
        setProductsInTable(
          (invoice.products || []).map((p: any, idx: number) => {
            const productId = p.productId?._id || p.productId;
            // Try to find the product in availableProducts to get full structure
            const originalProduct = availableProducts.find((ap: any) => ap._id === productId);
            
            // Use productName from invoice if it's a full object, otherwise use from availableProducts or extract string
            const productNameForDisplay = p.productId?.productName?.productName?.productName || 
                                        p.productName || 
                                        (typeof p.productId?.productName === 'string' ? p.productId.productName : '');
            
            // Store the full productName object for payload (from invoice or availableProducts)
            const fullProductName = p.productId?.productName || originalProduct?.productName;
            
            return {
              id: Date.now().toString() + idx,
              productId: productId,
              productName: productNameForDisplay, // String for display
              sku: p.productId?.sku || '',
              hsn: p.productId?.hsn || '',
              quantity: p.quantity,
              rate: p.rate,
              totalAmount: p.totalAmount,
              originalProduct: originalProduct || (fullProductName ? { productName: fullProductName } : null), // Store full product structure
            };
          })
        );
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fetch invoice details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    const selectedProduct = availableProducts.find((p) => p._id === invoiceData.productId);

    if (!selectedProduct || !invoiceData.quantity || parseFloat(invoiceData.quantity) <= 0) {
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
      productName: selectedProduct.productName?.productName?.productName || '', // String for display
      sku: selectedProduct.sku || '',
      hsn: selectedProduct.hsn || '',
      quantity: parseInt(invoiceData.quantity),
      rate: selectedProduct.rate || 0,
      totalAmount: parseInt(invoiceData.quantity) * (selectedProduct.totalAmount || 0),
      otherProducts: invoiceData.otherProducts,
      benefitQuantity: invoiceData.benefitQuantity ? parseInt(invoiceData.benefitQuantity) : undefined,
      reInstall: invoiceData.reInstall,
      originalProduct: selectedProduct, // Store full product for payload construction
    };

    setProductsInTable([...productsInTable, newProduct]);
    setInvoiceData({
      ...invoiceData,
      productId: '',
      quantity: '',
      otherProducts: '',
      benefitQuantity: '',
      reInstall: false,
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
    const { companyId, modeOfPayment, deliveryAddress, reference, description, sendTo } = invoiceData;

    // Validation: For quotations, modeOfPayment is not required (based on client)
    if (!companyId || !deliveryAddress || productsInTable.length === 0 || sendTo.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill all required fields and add at least one product',
      });
      return;
    }

    // For invoices, modeOfPayment is required
    if (invoiceType !== 'quotation' && !modeOfPayment) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select mode of payment',
      });
      return;
    }

    const subtotal = productsInTable.reduce((sum, item) => sum + item.totalAmount, 0);
    const tax = 0;
    const grandTotal = subtotal + tax;

    // Get the full product objects for the payload
    const productsWithFullData = productsInTable.map((p) => {
      // Use originalProduct if stored, otherwise find from availableProducts
      const originalProduct = p.originalProduct || availableProducts.find((ap: any) => ap._id === p.productId);
      
      // Get productName - prefer full object structure, fallback to what we have
      let productName = originalProduct?.productName;
      
      // If productName is still not an object, try to construct it or use what we have
      if (!productName || typeof productName === 'string') {
        // If we have a string, we need to find the full object from availableProducts
        const productFromAvailable = availableProducts.find((ap: any) => ap._id === p.productId);
        productName = productFromAvailable?.productName || productName;
      }
      
      return {
        productId: p.productId,
        productName: productName, // Should be full object structure
        quantity: p.quantity,
        rate: p.rate,
        totalAmount: p.totalAmount,
      };
    });

    const payload: any = {
      ...(!invoiceId && invoiceType !== 'quotation' ? { invoiceNumber: invoices } : {}),
      companyId,
      products: productsWithFullData,
      modeOfPayment,
      deliveryAddress,
      reference,
      description,
      subtotal,
      tax,
      grandTotal,
      sendTo,
      assignedTo: employeeId || employeeName, // Use employeeId if available, fallback to employeeName
      invoiceType: invoiceType || 'invoice', // Ensure invoiceType is always set
      serviceId: serviceId,
    };

    try {
      setLoading(true);
      let response;
      if (invoiceId) {
        response = await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/update/${invoiceId}`,
          payload,
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      } else {
        response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/create`,
          payload,
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      }
     
      if (response.data?.success) {
        if (!invoiceId && invoiceType !== 'quotation') {
          await updateInvoiceCount();
          await updateEmployeeBenefit(response.data.serviceInvoice);
          await updateMaterialData();
        }
        await updateCommissionDetails(response.data.serviceInvoice);
        if (serviceId) {
          await updateStatusToService(serviceId, 'Completed');
        }
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || (invoiceType === 'quotation' ? 'Quotation saved successfully!' : 'Invoice saved successfully!'),
        });
        // Navigate based on invoiceType
        if (invoiceType === 'quotation') {
          // Navigate to quotation list - useFocusEffect will refresh the data
          (navigation as any).navigate('ServiceQuotationList');
        } else {
          (navigation as any).navigate('ServiceInvoiceList', { invoiceType: 'invoice' });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to save invoice',
        });
      }
    } catch (error: any) {
      console.log('error234534523452345', error, payload);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong while saving the invoice',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceCount = async () => {
    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/common-details/increment-invoice`,
        { invoiceCount: invoices },
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
    } catch (error) {
      console.error('Error updating invoice count:', error);
    }
  };

  const updateStatusToService = async (serviceId: string, status: string) => {
    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/service/update/${serviceId}`,
        { status },
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
    } catch (error) {
      console.error('Error updating service status:', error);
    }
  };

  const updateCommissionDetails = async (invoice: any) => {
    try {
      let totalCommissionAmount = 0;
      let percentageRate = 0;

      if (invoice?.products && invoice.products.length > 0) {
        totalCommissionAmount = invoice.products.reduce((sum: number, product: any) => {
          if (product.productId && typeof product.productId.commission === 'number') {
            return sum + product.totalAmount * (product.productId.commission / 100);
          }
          return sum;
        }, 0);

        if (invoice.products[0].productId && typeof invoice.products[0].productId.commission === 'number') {
          percentageRate = invoice.products[0].productId.commission;
        }
      }

      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/commissions`,
        {
          commissionFrom: 'Service',
          userId: user?._id,
          companyId: invoice?.companyId?._id,
          serviceInvoiceId: invoice?._id,
          commissionAmount: totalCommissionAmount,
          percentageRate: percentageRate,
        },
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
    } catch (error) {
      console.error('Error updating commission details:', error);
    }
  };

  const updateEmployeeBenefit = async (invoice: any) => {
    try {
      for (const product of productsInTable) {
        if (product.reInstall === true || product.otherProducts) {
          await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/employee-benefits`,
            {
              employeeId: invoice?.assignedTo?._id,
              invoiceId: invoice?._id,
              productId: product.productId,
              quantity: product.benefitQuantity,
              reInstall: product.reInstall || false,
              otherProducts: product.otherProducts || null,
            },
            {
              headers: {
                Authorization: token || '',
              },
            }
          );
        }
      }
    } catch (error) {
      console.error('Error updating employee benefit:', error);
    }
  };

  const updateMaterialData = async () => {
    try {
      for (const product of productsInTable) {
        if (product.reInstall === true || product.otherProducts) {
          await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/materials/updateMaterial/${product.productName}`,
            {
              name: product.productName,
              unit: product.quantity,
            },
            {
              headers: {
                Authorization: token || '',
              },
            }
          );
        }
      }
    } catch (error) {
      console.error('Error updating material data:', error);
    }
  };

  const selectedCompany = companies.find((c) => c._id === invoiceData.companyId);
  const selectedProduct = availableProducts.find((p) => p._id === invoiceData.productId);

  if (loading && !invoiceData.companyId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Determine title based on invoiceType
  const screenTitle = invoiceType === 'quotation' ? 'Add Service Quotation' : 'Add Service Invoice';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{screenTitle}</Text>
      </View>

      <View style={styles.form}>
        {/* Company Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setCompanyPickerVisible(true)}
            disabled={!!invoiceId || !!invoiceData.companyId}
          >
            <Text style={[styles.pickerButtonText, !invoiceData.companyId && styles.placeholder]}>
              {selectedCompany ? selectedCompany.companyName : 'Select a Company'}
            </Text>
            {!invoiceId && !invoiceData.companyId && (
              <Icon name="arrow-drop-down" size={24} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        {/* Product Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setProductPickerVisible(true)}
            disabled={!invoiceData.companyId || availableProducts.length === 0}
          >
            <Text style={[styles.pickerButtonText, !invoiceData.productId && styles.placeholder]}>
              {selectedProduct
                ? selectedProduct.productName?.productName?.productName || 'Selected'
                : 'Select a Product'}
            </Text>
            {invoiceData.companyId && availableProducts.length > 0 && (
              <Icon name="arrow-drop-down" size={24} color="#666" />
            )}
          </TouchableOpacity>

          {/* Rework, Other Product, Benefit Quantity Fields */}
          {invoiceData.productId && (
            <View style={styles.productOptions}>
              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Rework:</Text>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() =>
                    setInvoiceData({
                      ...invoiceData,
                      reInstall: !invoiceData.reInstall,
                      otherProducts: invoiceData.reInstall ? '' : invoiceData.otherProducts,
                    })
                  }
                >
                  <Icon
                    name={invoiceData.reInstall ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={invoiceData.reInstall ? '#007AFF' : '#666'}
                  />
                  <Text style={styles.toggleText}>{invoiceData.reInstall ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Other Product:</Text>
                <TextInput
                  style={styles.optionInput}
                  value={invoiceData.otherProducts}
                  onChangeText={(text) =>
                    setInvoiceData({
                      ...invoiceData,
                      otherProducts: text,
                      reInstall: text ? false : invoiceData.reInstall,
                    })
                  }
                  placeholder="Specify other product if any"
                  editable={!invoiceData.reInstall}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Benefit Quantity:</Text>
                <TextInput
                  style={styles.optionInput}
                  value={invoiceData.benefitQuantity}
                  onChangeText={(text) => setInvoiceData({ ...invoiceData, benefitQuantity: text })}
                  placeholder="Enter Quantity"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>

        {/* Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            value={invoiceData.quantity}
            onChangeText={(text) => setInvoiceData({ ...invoiceData, quantity: text })}
            placeholder="Enter Quantity"
            keyboardType="numeric"
            editable={!!invoiceData.productId}
          />
        </View>

        {/* Delivery Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service / Delivery Address *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setDeliveryAddressPickerVisible(true)}
            disabled={!invoiceData.companyId || !companyData?.serviceDeliveryAddresses?.length}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !invoiceData.deliveryAddress && styles.placeholder,
              ]}
            >
              {invoiceData.deliveryAddress || 'Select Delivery Address'}
            </Text>
            {invoiceData.companyId && companyData?.serviceDeliveryAddresses?.length > 0 && (
              <Icon name="arrow-drop-down" size={24} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        {/* Reference */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reference</Text>
          <TextInput
            style={styles.input}
            value={invoiceData.reference}
            onChangeText={(text) => setInvoiceData({ ...invoiceData, reference: text })}
            placeholder="Reference"
          />
        </View>

        {/* Send To */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Send To *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setSendToPickerVisible(true)}
            disabled={!invoiceData.companyId || !companyData?.contactPersons?.length}
          >
            <Text
              style={[
                styles.pickerButtonText,
                invoiceData.sendTo.length === 0 && styles.placeholder,
              ]}
            >
              {invoiceData.sendTo.length > 0
                ? invoiceData.sendTo
                    .map((email) => {
                      const person = companyData?.contactPersons?.find((p: any) => p.email === email);
                      return person ? person.name : email;
                    })
                    .join(', ')
                : 'Select Contact Person(s)'}
            </Text>
            {invoiceData.companyId && companyData?.contactPersons?.length > 0 && (
              <Icon name="arrow-drop-down" size={24} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={invoiceData.description}
            onChangeText={(text) => setInvoiceData({ ...invoiceData, description: text })}
            placeholder="Description"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Add Product Button */}
        <TouchableOpacity
          style={[
            styles.addProductButton,
            (!invoiceData.productId || !invoiceData.quantity || parseFloat(invoiceData.quantity) <= 0) &&
              styles.addProductButtonDisabled,
          ]}
          onPress={handleAddProduct}
          disabled={!invoiceData.productId || !invoiceData.quantity || parseFloat(invoiceData.quantity) <= 0}
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
              // Navigate back based on invoiceType
              if (invoiceType === 'quotation') {
                (navigation as any).navigate('ServiceQuotationList');
              } else {
                (navigation as any).navigate('ServiceInvoiceList', { invoiceType: 'invoice' });
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
                    setInvoiceData({
                      ...invoiceData,
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
                    setInvoiceData({ ...invoiceData, productId: item._id });
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
                    setInvoiceData({
                      ...invoiceData,
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
                const isSelected = invoiceData.sendTo.includes(item.email);
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.selectedItem]}
                    onPress={() => {
                      if (isSelected) {
                        setInvoiceData({
                          ...invoiceData,
                          sendTo: invoiceData.sendTo.filter((email) => email !== item.email),
                        });
                      } else {
                        setInvoiceData({
                          ...invoiceData,
                          sendTo: [...invoiceData.sendTo, item.email],
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
  productOptions: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  toggleText: {
    fontSize: 14,
    color: '#333',
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
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

export default AddServiceInvoiceScreen;

