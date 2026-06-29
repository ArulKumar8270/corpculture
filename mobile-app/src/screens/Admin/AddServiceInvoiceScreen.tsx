import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl, companyAllPickerQuery } from '../../services/api';
import { parseSendToEmails } from '../../utils/functions';
import { normalizeMongoId } from '../../utils/normalizeMongoId';
import Toast from 'react-native-toast-message';
import {
  getInvoiceLineProductDisplayName,
  getServiceProductDisplayName,
  getServiceProductSearchText,
} from '../../utils/serviceProductDisplayName';

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
  /** Invoice list passes `invoiceId`; quotation list passes `quotationId` (same document, same API). */
  const invoiceId =
    normalizeMongoId(params?.invoiceId ?? params?.quotationId) || undefined;
  const invoiceType = params?.invoiceType || 'invoice';
  const employeeName = params?.employeeName;
  const employeeId = params?.employeeId; // Employee ID if passed
  const serviceId = params?.serviceId;
  const companyIdFromParams = normalizeMongoId(params?.companyId);
  const paramCompanyName =
    typeof params?.companyName === 'string' ? params.companyName.trim() : '';
  const initialCompanyId = companyIdFromParams;

  const [invoiceData, setInvoiceData] = useState({
    companyId: initialCompanyId,
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
    invoiceDate: new Date().toISOString(), // Match web: default to today
  });

  const [companyData, setCompanyData] = useState<any>(null);
  const [productsInTable, setProductsInTable] = useState<ProductInTable[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompaniesList, setLoadingCompaniesList] = useState(() => !!token);
  const [loadingCompanyProfile, setLoadingCompanyProfile] = useState(false);
  const [invoices, setInvoices] = useState<string | number>(0);
  const [globalInvoiceFormat, setGlobalInvoiceFormat] = useState('');
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [deliveryAddressPickerVisible, setDeliveryAddressPickerVisible] = useState(false);
  const [sendToPickerVisible, setSendToPickerVisible] = useState(false);
  const [paymentModePickerVisible, setPaymentModePickerVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const formSectionY = useRef(0); // Y of form container within scroll content
  const referenceSectionY = useRef(0); // Y within form
  const descriptionSectionY = useRef(0);

  const paymentModes = ['Cash', 'Card', 'Bank Transfer', 'UPI', 'CHEQUE', 'BANK TRANSFER', 'OTHERS'];

  // When navigating from Service Enquiry with companyId in params, sync once params are known
  useEffect(() => {
    if (invoiceId || !initialCompanyId) return;
    setInvoiceData((prev) => {
      if (String(prev.companyId) === String(initialCompanyId)) return prev;
      return { ...prev, companyId: initialCompanyId, productId: '', sendTo: [], deliveryAddress: '' };
    });
  }, [invoiceId, initialCompanyId]);

  // After companies load, ensure param company is applied when it exists in the list (list was paginated at 10 before fix)
  useEffect(() => {
    if (invoiceId || !initialCompanyId || companies.length === 0) return;
    const exists = companies.some((c) => String(c._id) === String(initialCompanyId));
    if (!exists) return;
    setInvoiceData((prev) => {
      if (String(prev.companyId) === String(initialCompanyId)) return prev;
      return { ...prev, companyId: initialCompanyId, productId: '', sendTo: [], deliveryAddress: '' };
    });
  }, [invoiceId, initialCompanyId, companies]);

  // Enquiry may only have company name on record; match after companies load
  useEffect(() => {
    if (invoiceId || companies.length === 0 || initialCompanyId || !paramCompanyName) return;
    const lower = paramCompanyName.toLowerCase();
    const m = companies.find((c) => (c.companyName || '').trim().toLowerCase() === lower);
    if (!m?._id) return;
    const id = String(m._id);
    setInvoiceData((prev) =>
      String(prev.companyId) === id ? prev : { ...prev, companyId: id, productId: '', sendTo: [], deliveryAddress: '' }
    );
  }, [invoiceId, companies, initialCompanyId, paramCompanyName]);

  // Keyboard show/hide: extra bottom padding so fields can scroll above keyboard
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToReference = () => {
    setTimeout(() => {
      const y = formSectionY.current + referenceSectionY.current - 120;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, 100);
  };
  const scrollToDescription = () => {
    setTimeout(() => {
      const y = formSectionY.current + descriptionSectionY.current - 120;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, 100);
  };

  // Helper to get product display name (Material.name from populated service product)
  const getProductDisplayName = (option: any): string => getServiceProductDisplayName(option);

  const filteredAvailableProducts = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return availableProducts;
    return availableProducts.filter((p) => getServiceProductSearchText(p).includes(q));
  }, [availableProducts, productSearchQuery]);

  // Fetch companies and invoice count when token is available (match web: company list needed to select company)
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setLoadingCompaniesList(false);
      return;
    }
    fetchInvoicesCount();
    fetchCompanies();
  }, [token]);

  useEffect(() => {
    setProductSearchQuery('');
    if (invoiceData.companyId && invoiceData.companyId !== '') {
      fetchCompanyData();
      fetchProductsByCompany();
    }
  }, [invoiceData.companyId]);

  // Reset form function - clears all form data
  const resetForm = React.useCallback((companyId?: string) => {
    const fromArg = normalizeMongoId(companyId as unknown);
    const companyIdToUse = fromArg || companyIdFromParams;
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
      invoiceDate: new Date().toISOString(),
    });
    setCompanyData(null);
    setProductsInTable([]);
    setAvailableProducts([]);
    setProductSearchQuery('');
    setLoadingCompanyProfile(false);
  }, [companyIdFromParams]);

  // Track leaving edit mode (create after edit) — fetch runs on focus when editing
  const prevInvoiceIdRef = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    const prev = prevInvoiceIdRef.current;
    if (prev && !invoiceId) {
      resetForm();
    }
    prevInvoiceIdRef.current = invoiceId;
  }, [invoiceId, resetForm]);

  // Helper function to generate invoice number based on format
  const generateInvoiceNumber = (invoiceCount: number, format: string): string => {
    if (!format || format.trim() === '') {
      return invoiceCount.toString();
    }

    // Get current date for year replacement
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentYearShort = currentYear.toString().slice(-2);
    const nextYearShort = (currentYear + 1).toString().slice(-2);
    const yearRange = `${currentYearShort}-${nextYearShort}`;
    const fullYearRange = `${currentYear}-${currentYear + 1}`;

    // Replace date/year patterns in the format
    let processedFormat = format;
    
    // IMPORTANT: Replace year range patterns FIRST, then handle single years
    // Step 1: Replace year range patterns (e.g., "26-27" with current year range)
    processedFormat = processedFormat.replace(/\d{2}-\d{2}/g, yearRange); // Replace YY-YY pattern
    processedFormat = processedFormat.replace(/\d{4}-\d{4}/g, fullYearRange); // Replace YYYY-YYYY pattern
    
    // Step 2: Handle single year patterns, but skip years that are part of a range
    // Replace standalone 2-digit years (not preceded or followed by a dash)
    processedFormat = processedFormat.replace(/\b(\d{2})\b/g, (match, yearStr, offset, string) => {
      // Check if this match is part of a range pattern (has dash before or after)
      const before = string[offset - 1];
      const after = string[offset + match.length];
      
      // If it's part of a range (has dash before or after), don't replace
      if (before === '-' || after === '-') {
        return match;
      }
      
      const num = parseInt(yearStr);
      // Only replace if it's a standalone 2-digit year (20-99)
      if (num >= 20 && num <= 99) {
        return currentYearShort;
      }
      return match;
    });
    
    // Replace standalone 4-digit years (not preceded or followed by a dash)
    processedFormat = processedFormat.replace(/\b(\d{4})\b/g, (match, yearStr, offset, string) => {
      // Check if this match is part of a range pattern (has dash before or after)
      const before = string[offset - 1];
      const after = string[offset + match.length];
      
      // If it's part of a range (has dash before or after), don't replace
      if (before === '-' || after === '-') {
        return match;
      }
      
      const num = parseInt(yearStr);
      // Only replace if it's a standalone 4-digit year (2000-2099)
      if (num >= 2000 && num <= 2099) {
        return currentYear.toString();
      }
      return match;
    });

    // Extract the last number sequence (sequential number part)
    const lastNumberMatch = processedFormat.match(/(\d+)(?!.*\d)/);
    
    if (lastNumberMatch) {
      const numberDigits = lastNumberMatch[1].length;
      const prefix = processedFormat.substring(0, processedFormat.lastIndexOf(lastNumberMatch[1]));
      const formattedNumber = invoiceCount.toString().padStart(numberDigits, '0');
      return prefix + formattedNumber;
    }
    
    // Fallback: append count to processed format
    return processedFormat + invoiceCount.toString().padStart(5, '0');
  };

  const fetchInvoicesCount = async () => {
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/common-details`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success) {
        const invoiceCount = data.commonDetails?.invoiceCount + 1 || 1;
        const format = data.commonDetails?.globalInvoiceFormat || '';
        setGlobalInvoiceFormat(format);
        
        // Generate invoice number based on format
        const invoiceNumber = generateInvoiceNumber(invoiceCount, format);
        setInvoices(invoiceNumber);
      }
    } catch (error) {
      console.error('Error fetching invoice count:', error);
    }
  };

  const fetchCompanies = async () => {
    if (!token) return;
    try {
      setLoadingCompaniesList(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/company/all?${companyAllPickerQuery}`, {
        headers: {
          Authorization: token,
        },
      });
      if (data?.success) {
        // Handle both direct .companies and nested .data.companies (match backend response shape)
        const list = data.companies ?? data.data?.companies ?? [];
        setCompanies(Array.isArray(list) ? list : []);
      } else {
        setCompanies([]);
      }
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load companies',
      });
      setCompanies([]);
    } finally {
      setLoadingCompaniesList(false);
      setLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    if (!invoiceData.companyId || !token) return;
    setLoadingCompanyProfile(true);
    try {
      const { data } = await axios.get(
        `${getApiBaseUrl()}/company/get/${invoiceData.companyId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (data?.success && data.company) {
        setCompanyData(data.company);
      } else {
        setCompanyData(null);
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load company details',
      });
      setCompanyData(null);
    } finally {
      setLoadingCompanyProfile(false);
    }
  };

  const fetchProductsByCompany = async () => {
    if (!invoiceData.companyId || !token) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${getApiBaseUrl()}/service-products/getServiceProductsByCompany/${invoiceData.companyId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (data?.success) {
        const list = data.serviceProducts ?? data.data?.serviceProducts ?? [];
        setAvailableProducts(Array.isArray(list) ? list : []);
      } else {
        setAvailableProducts([]);
      }
    } catch (error: any) {
      console.error('Error fetching products by company:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load products for this company',
      });
      setAvailableProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = React.useCallback(
    async (explicitDocId?: string) => {
      const docId =
        explicitDocId ||
        normalizeMongoId(
          (route.params as any)?.invoiceId ?? (route.params as any)?.quotationId
        ) ||
        undefined;
      if (!docId || !token) return;
      try {
        setLoading(true);
        setLoadingCompanyProfile(true);
        const { data } = await axios.get(`${getApiBaseUrl()}/service-invoice/get/${docId}`, {
          headers: {
            Authorization: token || '',
          },
        });
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
            sendTo: parseSendToEmails(invoice.sendTo),
            reInstall: false,
            otherProducts: '',
            benefitQuantity: '',
            invoiceDate: invoice.invoiceDate
              ? new Date(invoice.invoiceDate).toISOString()
              : new Date().toISOString(),
          });
          setProductsInTable(
            (invoice.products || []).map((p: any, idx: number) => {
              const productId = p.productId?._id || p.productId;
              const originalProduct = availableProducts.find((ap: any) => ap._id === productId);

              const productNameForDisplay = getInvoiceLineProductDisplayName(p);

              const fullProductName = p.productId?.productName || originalProduct?.productName;

              return {
                id: Date.now().toString() + idx,
                productId: productId,
                productName: productNameForDisplay,
                sku: p.productId?.sku || '',
                hsn: p.productId?.hsn || '',
                quantity: p.quantity,
                rate: p.rate,
                totalAmount: p.totalAmount,
                originalProduct: originalProduct || (fullProductName ? { productName: fullProductName } : null),
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
        setLoadingCompanyProfile(false);
      }
    },
    [token, route.params]
  );

  // On focus: load edit document; on create, apply company from route / optional reset
  useFocusEffect(
    React.useCallback(() => {
      const currentParams = route.params as any;
      const editDocId =
        normalizeMongoId(currentParams?.invoiceId ?? currentParams?.quotationId) || undefined;

      if (editDocId) {
        fetchInvoiceDetails(editDocId);
        return undefined;
      }

      let idToApply = normalizeMongoId(currentParams?.companyId);
      if (!idToApply && currentParams?.companyName) {
        const nm = String(currentParams.companyName).trim().toLowerCase();
        const m = companies.find((c) => (c.companyName || '').trim().toLowerCase() === nm);
        if (m?._id) idToApply = String(m._id);
      }
      if (idToApply) {
        setInvoiceData((prev) => {
          if (String(prev.companyId) === idToApply) return prev;
          return { ...prev, companyId: idToApply, productId: '', sendTo: [], deliveryAddress: '' };
        });
      }

      const timeoutId = setTimeout(() => {
        const p = route.params as any;
        if (normalizeMongoId(p?.invoiceId ?? p?.quotationId)) return;
        const hasParamCompany =
          !!normalizeMongoId(p?.companyId) || !!String(p?.companyName || '').trim();
        if (hasParamCompany || p?.serviceId) return;
        if (productsInTable.length > 0 || invoiceData.deliveryAddress || invoiceData.reference) {
          resetForm();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [route.params, companies, resetForm, productsInTable.length, fetchInvoiceDetails])
  );

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
      productName: getProductDisplayName(selectedProduct),
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
    const { companyId, modeOfPayment, deliveryAddress, reference, description, sendTo, invoiceDate } = invoiceData;

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
      // Invoice number is now generated by the backend from global settings
      // Only send invoiceNumber for quotations or when updating existing invoices
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
      invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
      assignedTo: employeeId || employeeName, // Use employeeId if available, fallback to employeeName
      invoiceType: invoiceType || 'invoice', // Ensure invoiceType is always set
      serviceId: serviceId,
    };

    try {
      setLoading(true);
      let response;
      if (invoiceId) {
        response = await axios.put(
          `${getApiBaseUrl()}/service-invoice/update/${invoiceId}`,
          payload,
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      } else {
        response = await axios.post(
          `${getApiBaseUrl()}/service-invoice/create`,
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
          // Invoice count is now incremented automatically by the backend
          // await updateInvoiceCount();
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

  // REMOVED: updateInvoiceCount function
  // Invoice count is now incremented automatically by the backend
  // No need to call increment-invoice endpoint

  const updateStatusToService = async (serviceId: string, status: string) => {
    try {
      await axios.put(
        `${getApiBaseUrl()}/service/update/${serviceId}`,
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
        `${getApiBaseUrl()}/commissions`,
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
            `${getApiBaseUrl()}/employee-benefits`,
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
            `${getApiBaseUrl()}/materials/updateMaterial/${product.productName}`,
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

  const selectedCompany = companies.find((c) => String(c._id) === String(invoiceData.companyId));
  const selectedProduct = availableProducts.find((p) => p._id === invoiceData.productId);
  // Show company name from list, or from fetched companyData (when coming from service enquiry before companies load)
  const companyDisplayName = selectedCompany?.companyName ?? companyData?.companyName ?? '';
  const showCompanyFieldLoader = loadingCompaniesList || loadingCompanyProfile;

  // Determine title based on invoiceType
  const screenTitle = invoiceType === 'quotation' ? 'Add Service Quotation' : 'Add Service Invoice';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <Text style={styles.title}>{screenTitle}</Text>
      </View>

      <View
        style={styles.form}
        onLayout={(e) => {
          formSectionY.current = e.nativeEvent.layout.y;
        }}
      >
        {/* Company Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company *</Text>
          <TouchableOpacity
            style={[styles.pickerButton, showCompanyFieldLoader && styles.pickerButtonBusy]}
            onPress={() => setCompanyPickerVisible(true)}
            disabled={!!invoiceId || !!invoiceData.companyId || loadingCompaniesList}
          >
            {showCompanyFieldLoader ? (
              <View style={styles.companyFieldLoaderRow}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.companyFieldLoaderText}>
                  {loadingCompaniesList ? 'Loading companies…' : 'Loading company…'}
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={[
                    styles.pickerButtonText,
                    !invoiceData.companyId && !companyDisplayName && styles.placeholder,
                  ]}
                >
                  {companyDisplayName || 'Select a Company'}
                </Text>
                {!invoiceId && !invoiceData.companyId && (
                  <Icon name="arrow-drop-down" size={24} color="#666" />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Product Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          {invoiceData.companyId && availableProducts.length > 0 ? (
            <View style={styles.productSearchRow}>
              <Icon name="search" size={20} color="#666" style={styles.productSearchIcon} />
              <TextInput
                style={styles.productSearchInput}
                placeholder="Search by name, SKU, HSN…"
                placeholderTextColor="#999"
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {productSearchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setProductSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={22} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setProductPickerVisible(true)}
            disabled={!invoiceData.companyId || availableProducts.length === 0}
          >
            <Text style={[styles.pickerButtonText, !invoiceData.productId && styles.placeholder]}>
              {selectedProduct ? getProductDisplayName(selectedProduct) : 'Select a Product'}
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
        <View
          style={styles.inputGroup}
          onLayout={(e) => {
            referenceSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Reference</Text>
          <TextInput
            style={styles.input}
            value={invoiceData.reference}
            onChangeText={(text) => setInvoiceData({ ...invoiceData, reference: text })}
            placeholder="Reference"
            onFocus={scrollToReference}
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
        <View
          style={styles.inputGroup}
          onLayout={(e) => {
            descriptionSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={invoiceData.description}
            onChangeText={(text) => setInvoiceData({ ...invoiceData, description: text })}
            placeholder="Description"
            multiline
            numberOfLines={3}
            onFocus={scrollToDescription}
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
              {/* <Text style={styles.tableHeaderText}>SKU</Text> */}
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
                  {typeof product.productName === 'string'
                    ? product.productName
                    : getProductDisplayName({ productName: product.productName })}
                </Text>
                {/* <Text style={styles.tableCell}>{product.sku}</Text> */}
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
              ListEmptyComponent={
                loadingCompaniesList ? (
                  <View style={styles.modalListLoading}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={[styles.emptyListText, styles.modalListLoadingCaption]}>Loading companies…</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyListText}>No companies found</Text>
                )
              }
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
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Product</Text>
            <View style={styles.productSearchRow}>
              <Icon name="search" size={20} color="#666" style={styles.productSearchIcon} />
              <TextInput
                style={styles.productSearchInput}
                placeholder="Search by name, SKU, HSN…"
                placeholderTextColor="#999"
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {productSearchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setProductSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={22} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>
            <FlatList
              data={filteredAvailableProducts}
              keyExtractor={(item) => item._id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyListText}>
                  {availableProducts.length === 0
                    ? 'No products found for this company'
                    : 'No products match your search'}
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, styles.productModalItem]}
                  onPress={() => {
                    setInvoiceData({ ...invoiceData, productId: item._id });
                    setProductPickerVisible(false);
                  }}
                >
                  <Text style={styles.productModalItemTitle}>
                    {getProductDisplayName(item)}
                  </Text>
                  {item.sku ? (
                    <Text style={styles.modalItemSub}>SKU: {item.sku}</Text>
                  ) : null}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
  pickerButtonBusy: {
    borderColor: '#cce5ff',
    backgroundColor: '#f7fbff',
  },
  companyFieldLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyFieldLoaderText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 10,
  },
  modalListLoading: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListLoadingCaption: {
    marginTop: 12,
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
  productSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 10,
    marginBottom: 10,
    minHeight: 44,
  },
  productSearchIcon: {
    marginRight: 6,
  },
  productSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 10,
    paddingHorizontal: 4,
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
  productModalItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  productModalItemTitle: {
    fontSize: 16,
    color: '#333',
    width: '100%',
  },
  modalItemSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    width: '100%',
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
  emptyListText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
});

export default AddServiceInvoiceScreen;

