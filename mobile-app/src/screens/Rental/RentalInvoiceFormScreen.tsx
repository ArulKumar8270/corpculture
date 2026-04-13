import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
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
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { getTotalRentalInvoicePayment } from '../../utils/functions';

interface ProductConfig {
  bwOldCount: number | string;
  bwNewCount: number | string;
  colorOldCount?: number | string;
  colorNewCount?: number | string;
  colorScanningOldCount?: number | string;
  colorScanningNewCount?: number | string;
}

interface Product {
  id: number;
  machineId: string;
  serialNo: string;
  selectedProduct: any;
  countImageFile: string | null;
  imagePreview: string;
  basePrice: string;
  a3Config: ProductConfig;
  a4Config: ProductConfig;
  a5Config: ProductConfig;
}

const RentalInvoiceFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const entryId = params?.id;
  const invoiceType = params?.invoiceType || 'invoice';
  const employeeName = params?.employeeName;
  const employeeId = params?.employeeId;
  const rentalId = params?.rentalId;
  // Normalize companyId: API may return populated object { _id, companyName } or string _id
  const companyIdFromParams =
    params?.companyId != null
      ? typeof params.companyId === 'object'
        ? params.companyId?._id
        : params.companyId
      : undefined;
  const initialCompanyId =
    companyIdFromParams && companyIdFromParams !== 'null' ? String(companyIdFromParams) : '';

  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any>(null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [contactOptions, setContactOptions] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<string | number | null>(null);
  const [globalInvoiceFormat, setGlobalInvoiceFormat] = useState('');
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState<number | null>(null);
  const [sendToPickerVisible, setSendToPickerVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const invoiceDateSectionY = useRef(0);
  const remarksSectionY = useRef(0);

  const [formData, setFormData] = useState({
    companyId: initialCompanyId,
    machineId: '',
    sendDetailsTo: [] as string[],
    countImageFile: null as string | null,
    remarks: '',
    invoiceDate: new Date().toISOString(), // Match web: default to today
    a3Config: { bwOldCount: '', bwNewCount: '' } as ProductConfig,
    a4Config: { bwOldCount: '', bwNewCount: '' } as ProductConfig,
    a5Config: { bwOldCount: '', bwNewCount: '' } as ProductConfig,
  });

  const parseSendDetailsTo = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
    const s = String(value).trim();
    if (!s) return [];
    // Use newline as our multi-select delimiter (safe because option string contains commas).
    if (s.includes('\n')) return s.split('\n').map((x) => x.trim()).filter(Boolean);
    return [s];
  };

  const serializeSendDetailsTo = (values: string[]) => {
    const cleaned = (values || []).map((v) => String(v).trim()).filter(Boolean);
    return cleaned.join('\n');
  };

  const sendToDisplayLabel = (option: string) => {
    const s = String(option || '').trim();
    if (!s) return '';
    return s;
  };

  const sendToSummary = (values: string[]) => {
    const labels = (values || []).map(sendToDisplayLabel).filter(Boolean);
    if (!labels.length) return '--select Option--';
    return labels.join(', ');
  };

  const [products, setProducts] = useState<Product[]>([
    {
      id: Date.now(),
      machineId: '',
      serialNo: '',
      selectedProduct: null,
      countImageFile: null,
      imagePreview: '',
      basePrice: '',
      a3Config: {
        bwOldCount: '',
        bwNewCount: '',
        colorOldCount: '',
        colorNewCount: '',
        colorScanningOldCount: '',
        colorScanningNewCount: '',
      },
      a4Config: {
        bwOldCount: '',
        bwNewCount: '',
        colorOldCount: '',
        colorNewCount: '',
        colorScanningOldCount: '',
        colorScanningNewCount: '',
      },
      a5Config: {
        bwOldCount: '',
        bwNewCount: '',
        colorOldCount: '',
        colorNewCount: '',
        colorScanningOldCount: '',
        colorScanningNewCount: '',
      },
    },
  ]);

  useEffect(() => {
    fetchInvoicesCounts();
  }, [rentalId]);

  useEffect(() => {
    if (token) fetchCompanies();
  }, [token]);

  useEffect(() => {
    if (entryId) {
      fetchRentalEntry();
    } else {
      setLoading(false);
    }
  }, [entryId]);

  // Sync companyId from params when navigating from rental enquiries (e.g. screen reused in stack)
  useEffect(() => {
    if (entryId || !initialCompanyId) return;
    setFormData((prev) => {
      if (prev.companyId === initialCompanyId) return prev;
      return { ...prev, companyId: initialCompanyId, sendDetailsTo: [] };
    });
  }, [entryId, initialCompanyId]);

  // Auto-select company when initialCompanyId is provided and companies are loaded
  useEffect(() => {
    if (initialCompanyId && companies.length > 0 && !entryId) {
      const companyExists = companies.find((c) => String(c._id) === String(initialCompanyId));
      if (companyExists) {
        setFormData((prev) => {
          if (String(prev.companyId) === String(initialCompanyId)) return prev;
          return { ...prev, companyId: initialCompanyId };
        });
      }
    }
  }, [initialCompanyId, companies, entryId]);

  useEffect(() => {
    if (formData.companyId && formData.companyId !== '') {
      fetchProductsByCompany();
      fetchCompanyData();
    }
  }, [formData.companyId]);

  // Populate contact options from companies list or from companyData (e.g. when coming from rental enquiries before companies load)
  useEffect(() => {
    if (!formData.companyId) {
      setContactOptions([]);
      return;
    }
    const selectedCompany = companies.find((comp) => String(comp._id) === String(formData.companyId));
    const persons = selectedCompany?.contactPersons ?? companyData?.contactPersons;
    if (persons && Array.isArray(persons)) {
      const options = persons
        .map((person: any) => String(person?.name || '').trim())
        .filter(Boolean);
      setContactOptions(options);
    } else {
      setContactOptions([]);
    }
    if (!entryId) {
      setFormData((prev) => ({ ...prev, sendDetailsTo: [] }));
    }
  }, [formData.companyId, companies, companyData, entryId]);

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

  const scrollToInvoiceDate = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, invoiceDateSectionY.current - 120),
        animated: true,
      });
    }, 100);
  };
  const scrollToRemarks = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, remarksSectionY.current - 120),
        animated: true,
      });
    }, 100);
  };

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

  const fetchInvoicesCounts = async () => {
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
    try {
      setLoadingCompanies(true);
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/company/all`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success) {
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch companies',
      });
    } finally {
      setLoadingCompanies(false);
      setLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    if (!formData.companyId || !token) return;
    try {
      const { data } = await axios.get(
        `${getApiBaseUrl()}/company/get/${formData.companyId}`,
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
      setCompanyData(null);
    }
  };

  const fetchProductsByCompany = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${getApiBaseUrl()}/rental-products/getServiceProductsByCompany/${formData.companyId}`,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
      if (data?.success) {
        setAvailableProducts(data.rentalProducts || []);
        
        if (entryId && products.length > 0) {
          setProducts((prevProducts) =>
            prevProducts.map((product) => {
              if (product.machineId) {
                const foundProduct = data.rentalProducts.find((p: any) => p._id === product.machineId);
                if (foundProduct) {
                  return {
                    ...product,
                    selectedProduct: foundProduct,
                    serialNo: foundProduct.serialNo || product.serialNo,
                  };
                }
              }
              return product;
            })
          );
        }
      } else {
        setAvailableProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setAvailableProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalEntry = async () => {
    if (!entryId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${getApiBaseUrl()}/rental-payment/${entryId}`,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
      if (data?.success) {
        const entry = data.entry;
        
        setFormData({
          companyId: entry.companyId?._id || entry.companyId || '',
          machineId: entry.machineId?._id || entry.machineId || '',
          sendDetailsTo: parseSendDetailsTo(entry?.sendDetailsTo),
          countImageFile: null,
          remarks: entry.remarks || '',
          invoiceDate: entry.invoiceDate ? new Date(entry.invoiceDate).toISOString() : new Date().toISOString(),
          a3Config: {
            bwOldCount: entry.a3Config?.bwOldCount ?? 0,
            bwNewCount: entry.a3Config?.bwNewCount ?? 0,
            colorOldCount: entry.a3Config?.colorOldCount ?? 0,
            colorNewCount: entry.a3Config?.colorNewCount ?? 0,
            colorScanningOldCount: entry.a3Config?.colorScanningOldCount ?? 0,
            colorScanningNewCount: entry.a3Config?.colorScanningNewCount ?? 0,
          },
          a4Config: {
            bwOldCount: entry.a4Config?.bwOldCount ?? 0,
            bwNewCount: entry.a4Config?.bwNewCount ?? 0,
            colorOldCount: entry.a4Config?.colorOldCount ?? 0,
            colorNewCount: entry.a4Config?.colorNewCount ?? 0,
            colorScanningOldCount: entry.a4Config?.colorScanningOldCount ?? 0,
            colorScanningNewCount: entry.a4Config?.colorScanningNewCount ?? 0,
          },
          a5Config: {
            bwOldCount: entry.a5Config?.bwOldCount ?? 0,
            bwNewCount: entry.a5Config?.bwNewCount ?? 0,
            colorOldCount: entry.a5Config?.colorOldCount ?? 0,
            colorNewCount: entry.a5Config?.colorNewCount ?? 0,
            colorScanningOldCount: entry.a5Config?.colorScanningOldCount ?? 0,
            colorScanningNewCount: entry.a5Config?.colorScanningNewCount ?? 0,
          },
        });

        if (entry.products && Array.isArray(entry.products) && entry.products.length > 0) {
          const productsData = entry.products.map((product: any, index: number) => {
            const machineIdValue =
              typeof product.machineId === 'object' && product.machineId?._id
                ? product.machineId._id
                : product.machineId || '';
            const machineObject = typeof product.machineId === 'object' ? product.machineId : null;

            return {
              id: Date.now() + index,
              machineId: machineIdValue,
              serialNo: product.serialNo || machineObject?.serialNo || '',
              selectedProduct: machineObject,
              countImageFile: null,
              imagePreview: product.countImageUpload?.url || '',
              basePrice: product.basePrice || '',
              a3Config: {
                bwOldCount: product.a3Config?.bwOldCount ?? 0,
                bwNewCount: product.a3Config?.bwNewCount ?? 0,
                colorOldCount: product.a3Config?.colorOldCount ?? 0,
                colorNewCount: product.a3Config?.colorNewCount ?? 0,
                colorScanningOldCount: product.a3Config?.colorScanningOldCount ?? 0,
                colorScanningNewCount: product.a3Config?.colorScanningNewCount ?? 0,
              },
              a4Config: {
                bwOldCount: product.a4Config?.bwOldCount ?? 0,
                bwNewCount: product.a4Config?.bwNewCount ?? 0,
                colorOldCount: product.a4Config?.colorOldCount ?? 0,
                colorNewCount: product.a4Config?.colorNewCount ?? 0,
                colorScanningOldCount: product.a4Config?.colorScanningOldCount ?? 0,
                colorScanningNewCount: product.a4Config?.colorScanningNewCount ?? 0,
              },
              a5Config: {
                bwOldCount: product.a5Config?.bwOldCount ?? 0,
                bwNewCount: product.a5Config?.bwNewCount ?? 0,
                colorOldCount: product.a5Config?.colorOldCount ?? 0,
                colorNewCount: product.a5Config?.colorNewCount ?? 0,
                colorScanningOldCount: product.a5Config?.colorScanningOldCount ?? 0,
                colorScanningNewCount: product.a5Config?.colorScanningNewCount ?? 0,
              },
            };
          });
          setProducts(productsData);
        } else if (entry.machineId) {
          const machineIdValue =
            typeof entry.machineId === 'object' && entry.machineId?._id
              ? entry.machineId._id
              : entry.machineId || '';
          const machineObject = typeof entry.machineId === 'object' ? entry.machineId : null;

          setProducts([
            {
              id: Date.now(),
              machineId: machineIdValue,
              serialNo: machineObject?.serialNo || '',
              selectedProduct: machineObject,
              countImageFile: null,
              imagePreview: entry.countImageUpload?.url || '',
              basePrice: '',
              a3Config: {
                bwOldCount: entry.a3Config?.bwOldCount ?? 0,
                bwNewCount: entry.a3Config?.bwNewCount ?? 0,
                colorOldCount: entry.a3Config?.colorOldCount ?? 0,
                colorNewCount: entry.a3Config?.colorNewCount ?? 0,
                colorScanningOldCount: entry.a3Config?.colorScanningOldCount ?? 0,
                colorScanningNewCount: entry.a3Config?.colorScanningNewCount ?? 0,
              },
              a4Config: {
                bwOldCount: entry.a4Config?.bwOldCount ?? 0,
                bwNewCount: entry.a4Config?.bwNewCount ?? 0,
                colorOldCount: entry.a4Config?.colorOldCount ?? 0,
                colorNewCount: entry.a4Config?.colorNewCount ?? 0,
                colorScanningOldCount: entry.a4Config?.colorScanningOldCount ?? 0,
                colorScanningNewCount: entry.a4Config?.colorScanningNewCount ?? 0,
              },
              a5Config: {
                bwOldCount: entry.a5Config?.bwOldCount ?? 0,
                bwNewCount: entry.a5Config?.bwNewCount ?? 0,
                colorOldCount: entry.a5Config?.colorOldCount ?? 0,
                colorNewCount: entry.a5Config?.colorNewCount ?? 0,
                colorScanningOldCount: entry.a5Config?.colorScanningOldCount ?? 0,
                colorScanningNewCount: entry.a5Config?.colorScanningNewCount ?? 0,
              },
            },
          ]);
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fetch rental entry',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      companyId: initialCompanyId,
      machineId: '',
      sendDetailsTo: [],
      countImageFile: null,
      remarks: '',
      invoiceDate: new Date().toISOString(),
      a3Config: { bwOldCount: '', bwNewCount: '' },
      a4Config: { bwOldCount: '', bwNewCount: '' },
      a5Config: { bwOldCount: '', bwNewCount: '' },
    });
    setProducts([
      {
        id: Date.now(),
        machineId: '',
        serialNo: '',
        selectedProduct: null,
        countImageFile: null,
        imagePreview: '',
        basePrice: '',
        a3Config: {
          bwOldCount: '',
          bwNewCount: '',
          colorOldCount: '',
          colorNewCount: '',
          colorScanningOldCount: '',
          colorScanningNewCount: '',
        },
        a4Config: {
          bwOldCount: '',
          bwNewCount: '',
          colorOldCount: '',
          colorNewCount: '',
          colorScanningOldCount: '',
          colorScanningNewCount: '',
        },
        a5Config: {
          bwOldCount: '',
          bwNewCount: '',
          colorOldCount: '',
          colorNewCount: '',
          colorScanningOldCount: '',
          colorScanningNewCount: '',
        },
      },
    ]);
  }, [initialCompanyId]);

  useFocusEffect(
    useCallback(() => {
      const currentParams = route.params as any;
      const currentEntryId = currentParams?.id;
      const rawCompanyId = currentParams?.companyId;
      const currentCompanyId =
        rawCompanyId != null
          ? typeof rawCompanyId === 'object'
            ? rawCompanyId?._id
            : rawCompanyId
          : undefined;
      const normalizedId = currentCompanyId && currentCompanyId !== 'null' ? String(currentCompanyId) : '';

      // If companyId is provided in params and not in edit mode, set it
      if (!currentEntryId && normalizedId) {
        setFormData((prev) => {
          if (String(prev.companyId) === normalizedId) return prev;
          return { ...prev, companyId: normalizedId, sendDetailsTo: [] };
        });
      }

      if (!currentEntryId) {
        const timeoutId = setTimeout(() => {
          if (!normalizedId && (products.length > 0 || formData.companyId || formData.remarks)) {
            resetForm();
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }, [route.params, resetForm, formData.companyId])
  );

  const handleProductSelect = (productId: number, selectedProduct: any) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            machineId: selectedProduct ? selectedProduct._id : '',
            serialNo: selectedProduct ? selectedProduct.serialNo : '',
            selectedProduct: selectedProduct,
            basePrice: selectedProduct ? selectedProduct.basePrice : '',
            a3Config: selectedProduct
              ? {
                  ...p.a3Config,
                  bwOldCount: selectedProduct.a3Config?.bwOldCount ?? 0,
                  colorOldCount: selectedProduct.a3Config?.colorOldCount ?? 0,
                  colorScanningOldCount: selectedProduct.a3Config?.colorScanningOldCount ?? 0,
                }
              : p.a3Config,
            a4Config: selectedProduct
              ? {
                  ...p.a4Config,
                  bwOldCount: selectedProduct.a4Config?.bwOldCount ?? 0,
                  colorOldCount: selectedProduct.a4Config?.colorOldCount ?? 0,
                  colorScanningOldCount: selectedProduct.a4Config?.colorScanningOldCount ?? 0,
                }
              : p.a4Config,
            a5Config: selectedProduct
              ? {
                  ...p.a5Config,
                  bwOldCount: selectedProduct.a5Config?.bwOldCount ?? 0,
                  colorOldCount: selectedProduct.a5Config?.colorOldCount ?? 0,
                  colorScanningOldCount: selectedProduct.a5Config?.colorScanningOldCount ?? 0,
                }
              : p.a5Config,
          };
        }
        return p;
      })
    );
    setProductPickerVisible(null);
  };

  const handleProductConfigChange = (productId: number, configType: 'a3Config' | 'a4Config' | 'a5Config', field: string, value: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            [configType]: {
              ...p[configType],
              [field]: value,
            },
          };
        }
        return p;
      })
    );
  };

  const handleProductImageChange = async (productId: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType?.Images || 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              countImageFile: asset.uri,
              imagePreview: asset.uri,
            };
          }
          return p;
        })
      );
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        machineId: '',
        serialNo: '',
        selectedProduct: null,
        countImageFile: null,
        imagePreview: '',
        basePrice: '',
        a3Config: {
          bwOldCount: '',
          bwNewCount: '',
          colorOldCount: '',
          colorNewCount: '',
          colorScanningOldCount: '',
          colorScanningNewCount: '',
        },
        a4Config: {
          bwOldCount: '',
          bwNewCount: '',
          colorOldCount: '',
          colorNewCount: '',
          colorScanningOldCount: '',
          colorScanningNewCount: '',
        },
        a5Config: {
          bwOldCount: '',
          bwNewCount: '',
          colorOldCount: '',
          colorNewCount: '',
          colorScanningOldCount: '',
          colorScanningNewCount: '',
        },
      },
    ]);
  };

  const removeProduct = (productId: number) => {
    if (products.length > 1) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'At least one product is required',
      });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.companyId) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Company is required',
      });
      return false;
    }
    if (!formData.sendDetailsTo || formData.sendDetailsTo.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Send Details To is required',
      });
      return false;
    }

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.machineId) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: `Product ${i + 1}: Serial No. is required`,
        });
        return false;
      }

      const validateCountField = (config: ProductConfig, fieldName: string, label: string) => {
        const value = config[fieldName as keyof ProductConfig];
        if (value !== '' && value !== null && value !== undefined && Number(value) < 0) {
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: `Product ${i + 1} - ${label} ${fieldName} must be a non-negative number`,
          });
          return false;
        }
        return true;
      };

      if (!validateCountField(product.a3Config, 'bwNewCount', 'A3 B/W')) return false;
      if (!validateCountField(product.a3Config, 'colorNewCount', 'A3 Color')) return false;
      if (!validateCountField(product.a3Config, 'colorScanningNewCount', 'A3 Color Scanning')) return false;

      if (!validateCountField(product.a4Config, 'bwNewCount', 'A4 B/W')) return false;
      if (!validateCountField(product.a4Config, 'colorNewCount', 'A4 Color')) return false;
      if (!validateCountField(product.a4Config, 'colorScanningNewCount', 'A4 Color Scanning')) return false;

      if (!validateCountField(product.a5Config, 'bwNewCount', 'A5 B/W')) return false;
      if (!validateCountField(product.a5Config, 'colorNewCount', 'A5 Color')) return false;
      if (!validateCountField(product.a5Config, 'colorScanningNewCount', 'A5 Color Scanning')) return false;
    }

    return true;
  };

  // REMOVED: handleUpdateInvoiceCount function
  // Invoice count is now incremented automatically by the backend
  // No need to call increment-invoice endpoint

  const updateStatusToRental = async (rentalId: string, status: string, totalAmount?: string | number) => {
    try {
      await axios.put(
        `${getApiBaseUrl()}/rental/update/${rentalId}`,
        { status, ...(totalAmount != null && { grandTotal: totalAmount }) },
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
    } catch (error) {
      console.error('Error updating rental status:', error);
    }
  };

  const updateRentalProduct = async (product: any, a3Config: ProductConfig, a4Config: ProductConfig, a5Config: ProductConfig) => {
    const apiPayload = {
      ...product,
      a3Config: {
        ...product?.a3Config,
        bwOldCount: Number(a3Config.bwNewCount) || 0,
        colorOldCount: Number(a3Config.colorNewCount) || 0,
        colorScanningOldCount: Number(a3Config.colorScanningNewCount) || 0,
      },
      a4Config: {
        ...product?.a4Config,
        bwOldCount: Number(a4Config.bwNewCount) || 0,
        colorOldCount: Number(a4Config.colorNewCount) || 0,
        colorScanningOldCount: Number(a4Config.colorScanningNewCount) || 0,
      },
      a5Config: {
        ...product?.a5Config,
        bwOldCount: Number(a5Config.bwNewCount) || 0,
        colorOldCount: Number(a5Config.colorNewCount) || 0,
        colorScanningOldCount: Number(a5Config.colorScanningNewCount) || 0,
      },
    };
    try {
      await axios.put(`${getApiBaseUrl()}/rental-products/${product?._id}`, apiPayload, {
        headers: {
          Authorization: token || '',
        },
      });
    } catch (error) {
      console.error('Error updating rental product:', error);
    }
  };

  // Helper function to convert URI to base64 data URI
  const uriToBase64 = async (uri: string): Promise<string> => {
    // If already base64 data URI, return as is
    if (uri.startsWith('data:image')) {
      return uri;
    }
    
    try {
      // Try using expo-file-system first (React Native compatible)
      try {
        // @ts-ignore - expo-file-system types may not be available
        const FileSystem = require('expo-file-system');
        // @ts-ignore
        const base64 = await FileSystem.readAsStringAsync(uri, {
          // @ts-ignore
          encoding: FileSystem.EncodingType.Base64,
        });
        // Determine MIME type from URI or default to jpeg
        const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
      } catch (fsError) {
        // Fallback to fetch if expo-file-system fails
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Convert blob to base64 using FileReader (works in web and some RN environments)
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to convert to base64'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error(`Failed to convert image to base64: ${error}`);
      throw new Error(`Failed to convert image to base64: ${error}`);
    }
  };

  const updateCommissionDetails = async (entry: any) => {
    try {
      // Calculate total amount - this would need the actual calculation logic
      // For now, using a placeholder
      // Calculate total amount using utility function
      let totalAmountIncludingGST = 0;
      let commissionAmount = 0;
      let commissionRate = 0;
      
      try {
        if (entry) {
          const totalData = getTotalRentalInvoicePayment(entry);
          totalAmountIncludingGST = parseFloat(totalData.totalAmount) || 0;
          commissionAmount = parseFloat(totalData.commissionAmount) || 0;
          commissionRate = totalData.commissionRate || 0;
        }
      } catch (error) {
        console.error('Error calculating total amount:', error);
        // Use fallback values
        totalAmountIncludingGST = 0;
        commissionAmount = 0;
        commissionRate = 0;
      }

      const apiParams = {
        commissionFrom: 'Rental',
        userId: user?._id,
        companyId: entry?.companyId?._id || entry?.companyId,
        rentalInvoiceId: entry?._id,
        commissionAmount,
        percentageRate: commissionRate,
      };

      await axios.post(`${getApiBaseUrl()}/commissions`, apiParams, {
        headers: { Authorization: token || '' },
      });
    } catch (error) {
      console.error('Commission calc error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('rentalId', rentalId || '');
      if (invoiceType !== 'quotation') {
        // Invoice number is now generated by the backend from global settings
        // Only send invoiceNumber for quotations or when updating existing invoices
        // data.append('invoiceNumber', invoices?.toString() || '');
      }
      const finalCompanyId = initialCompanyId || formData.companyId;
      if (!finalCompanyId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Company is required',
        });
        setLoading(false);
        return;
      }
      data.append('companyId', finalCompanyId);
      data.append('sendDetailsTo', serializeSendDetailsTo(formData.sendDetailsTo));
      data.append('remarks', formData.remarks || '');
      data.append('invoiceDate', formData.invoiceDate ? new Date(formData.invoiceDate).toISOString() : new Date().toISOString());
      // Use employeeId (User ID) for assignedTo, fallback to employeeName if employeeId not available
      const assignedToValue = employeeId || employeeName || '';
      if (!assignedToValue) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Employee assignment is required',
        });
        setLoading(false);
        return;
      }
      data.append('assignedTo', assignedToValue);
      data.append('invoiceType', invoiceType || '');

      const hasMultipleProducts = products.some((p) => p.machineId);
      const useOldFormat = !hasMultipleProducts && formData.machineId;

      if (useOldFormat) {
        data.append('machineId', formData.machineId);
        data.append('a3Config', JSON.stringify(formData.a3Config));
        data.append('a4Config', JSON.stringify(formData.a4Config));
        data.append('a5Config', JSON.stringify(formData.a5Config));
        if (formData.countImageFile) {
          try {
            const imageBase64 = await uriToBase64(formData.countImageFile);
            data.append('countImageUpload', imageBase64);
          } catch (error) {
            console.error('Error converting image to base64:', error);
            // Continue without image if conversion fails
          }
        }
      } else {
        // Convert product images to base64 before including in JSON
        const productsArray = await Promise.all(
          products
            .filter((p) => p.machineId)
            .map(async (p) => {
              let imageBase64 = null;
              if (p.countImageFile) {
                try {
                  imageBase64 = await uriToBase64(p.countImageFile);
                } catch (error) {
                  console.error(`Error converting product image to base64:`, error);
                  // Continue without image if conversion fails
                }
              }
              
              return {
                machineId: p.machineId,
                serialNo: p.serialNo,
                a3Config: p.a3Config,
                a4Config: p.a4Config,
                a5Config: p.a5Config,
                countImageUpload: imageBase64 || null,
              };
            })
        );

        // Validate and stringify products array
        try {
          // Validate base64 strings before stringifying
          const validatedProducts = productsArray.map((p: any) => {
            if (p.countImageUpload && typeof p.countImageUpload === 'string') {
              const base64Str = p.countImageUpload;
              // Check if base64 string is complete (ends with proper format)
              if (base64Str.length > 1000000) { // If over ~1MB, it might cause issues
                console.warn(`Product image is very large (${base64Str.length} bytes). Consider compressing.`);
              }
              // Ensure it's a complete base64 string (not truncated)
              if (!base64Str.includes('base64,') || base64Str.split('base64,')[1]?.length === 0) {
                console.warn('Invalid base64 string detected, removing from product data');
                delete p.countImageUpload;
              }
            }
            return p;
          });

          const productsJson = JSON.stringify(validatedProducts);
          // Validate JSON size (warn if approaching 1MB limit)
          if (productsJson.length > 900000) {
            console.warn(`Products JSON is large (${productsJson.length} bytes). Consider optimizing image sizes.`);
          }
          if (productsJson.length > 1048576) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Products data is too large. Please reduce image sizes or remove some images.',
            });
            setLoading(false);
            return;
          }
          data.append('products', productsJson);
        } catch (error: any) {
          console.error('Error stringifying products array:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Error preparing products data. Please check your product images.',
          });
          setLoading(false);
          return;
        }

        // Convert main count image to base64 if provided
        if (formData.countImageFile) {
          try {
            const mainImageBase64 = await uriToBase64(formData.countImageFile);
            data.append('countImageUpload', mainImageBase64);
          } catch (error) {
            console.error('Error converting main image to base64:', error);
            // Continue without main image if conversion fails
          }
        }
      }

      let res;
      if (entryId) {
        res = await axios.put(`${getApiBaseUrl()}/rental-payment/${entryId}`, data, {
          headers: {
            Authorization: token || '',
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        res = await axios.post(
          `${getApiBaseUrl()}/rental-payment/create-rental-entry`,
          data,
          {
            headers: {
              Authorization: token || '',
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      if (res.data?.success) {
        if (!entryId && invoiceType !== 'quotation') {
          // Invoice count is now incremented automatically by the backend
          // await handleUpdateInvoiceCount();
        }
        if (!entryId) {
          let totalAmount: string | number | undefined;
          try {
            const calc = getTotalRentalInvoicePayment(res.data?.entry);
            totalAmount = calc?.totalAmount ?? calc;
          } catch (_) {
            totalAmount = undefined;
          }
          await updateStatusToRental(rentalId || '', 'Completed', totalAmount);
        }
        await updateCommissionDetails(res.data?.entry);

        if (hasMultipleProducts) {
          await Promise.all(
            products
              .filter((p) => p.machineId && p.selectedProduct)
              .map((p) => updateRentalProduct(p.selectedProduct, p.a3Config, p.a4Config, p.a5Config))
          );
        }

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Rental entry created successfully!',
        });

        resetForm();

        if (invoiceType === 'quotation') {
          (navigation as any).navigate('RentalQuotationList');
        } else {
          (navigation as any).navigate('RentalInvoiceList', { invoiceType: 'invoice' });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: res.data?.message || `Failed to ${entryId ? 'update' : 'create'} rental payment entry`,
        });
      }
    } catch (error: any) {
      console.error(`Error ${entryId ? 'updating' : 'creating'} rental payment entry:`, error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderConfigSection = (product: Product, configType: 'a3Config' | 'a4Config' | 'a5Config', size: string) => {
    const config = product[configType];
    const hasConfig =
      (config.bwOldCount && Number(config.bwOldCount) > 0) ||
      (config.colorOldCount && Number(config.colorOldCount) > 0) ||
      (config.colorScanningOldCount && Number(config.colorScanningOldCount) > 0);

    if (!hasConfig) return null;

    return (
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>{size} Entry:</Text>
        <View style={styles.configRow}>
          {config.bwOldCount && Number(config.bwOldCount) > 0 && (
            <>
              <View style={styles.configField}>
                <Text style={styles.configLabel}>{size} B/W Old Count</Text>
                <TextInput
                  style={styles.configInput}
                  value={config.bwOldCount.toString()}
                  editable={false}
                />
              </View>
              <View style={styles.configField}>
                <Text style={styles.configLabel}>{size} B/W New Count</Text>
                <TextInput
                  style={styles.configInput}
                  value={config.bwNewCount.toString()}
                  onChangeText={(value) => handleProductConfigChange(product.id, configType, 'bwNewCount', value)}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}
          {config.colorOldCount && Number(config.colorOldCount) > 0 && (
            <>
              <View style={styles.configField}>
                <Text style={styles.configLabel}>{size} Color Old Count</Text>
                <TextInput
                  style={styles.configInput}
                  value={config.colorOldCount.toString()}
                  editable={false}
                />
              </View>
              <View style={styles.configField}>
                <Text style={styles.configLabel}>{size} Color New Count</Text>
                <TextInput
                  style={styles.configInput}
                  value={config.colorNewCount?.toString() || ''}
                  onChangeText={(value) => handleProductConfigChange(product.id, configType, 'colorNewCount', value)}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}
          {config.colorScanningOldCount && Number(config.colorScanningOldCount) > 0 && (
            <>
              <View style={styles.configField}>
                <Text style={styles.configLabel}>{size} Color Scanning Old Count</Text>
                <TextInput
                  style={styles.configInput}
                  value={config.colorScanningOldCount.toString()}
                  editable={false}
                />
              </View>
              <View style={styles.configField}>
                <Text style={styles.configLabel}>{size} Color Scanning New Count</Text>
                <TextInput
                  style={styles.configInput}
                  value={config.colorScanningNewCount?.toString() || ''}
                  onChangeText={(value) =>
                    handleProductConfigChange(product.id, configType, 'colorScanningNewCount', value)
                  }
                  keyboardType="numeric"
                />
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading && !entryId) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
        <Text style={styles.title}>
          {entryId ? 'Edit Rental Payment Entry' : 'Add Rental Payment Entry'}
        </Text>
      </View>

      {/* Company Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Company *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setCompanyPickerVisible(true)}
          disabled={!!entryId || !!initialCompanyId}
        >
          <Text style={styles.pickerButtonText}>
            {companies.find((c) => String(c._id) === String(formData.companyId))?.companyName ??
              companyData?.companyName ??
              '--select Company--'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Products Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products ({products.length})</Text>
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={addProduct}
            disabled={!formData.companyId}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addProductButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {products.map((product, productIndex) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productTitle}>
                Product {productIndex + 1} {product.serialNo && `- ${product.serialNo}`}
              </Text>
              {products.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeProduct(product.id)}
                >
                  <Icon name="delete" size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.productRow}>
              <View style={styles.productField}>
                <Text style={styles.label}>Serial No. *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setProductPickerVisible(product.id)}
                  disabled={!formData.companyId || availableProducts.length === 0}
                >
                  <Text style={styles.pickerButtonText}>
                    {product.selectedProduct?.serialNo || '--select Serial No.--'}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.productField}>
                <Text style={styles.label}>Product Count Image:</Text>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => handleProductImageChange(product.id)}
                >
                  {product.imagePreview ? (
                    <Image source={{ uri: product.imagePreview }} style={styles.imagePreview} />
                  ) : (
                    <Icon name="image" size={40} color="#ccc" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {renderConfigSection(product, 'a3Config', 'A3')}
            {renderConfigSection(product, 'a4Config', 'A4')}
            {renderConfigSection(product, 'a5Config', 'A5')}
          </View>
        ))}
      </View>

      {/* Send Details To */}
      <View style={styles.section}>
        <Text style={styles.label}>Send Details To *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setSendToPickerVisible(true)}
          disabled={!formData.companyId || contactOptions.length === 0}
        >
          <Text style={styles.pickerButtonText}>
            {sendToSummary(formData.sendDetailsTo)}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Invoice Date - match web */}
      <View
        style={styles.section}
        onLayout={(e) => {
          invoiceDateSectionY.current = e.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.label}>Invoice Date</Text>
        <TextInput
          style={styles.configInput}
          value={formData.invoiceDate ? formData.invoiceDate.slice(0, 10) : ''}
          onChangeText={(text) => {
            const trimmed = text.trim();
            if (!trimmed) {
              setFormData((prev) => ({ ...prev, invoiceDate: new Date().toISOString() }));
              return;
            }
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) {
              setFormData((prev) => ({ ...prev, invoiceDate: d.toISOString() }));
            }
          }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
          onFocus={scrollToInvoiceDate}
        />
      </View>

      {/* Remarks */}
      <View
        style={styles.section}
        onLayout={(e) => {
          remarksSectionY.current = e.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.label}>Remarks</Text>
        <TextInput
          style={styles.textArea}
          value={formData.remarks}
          onChangeText={(text) => setFormData({ ...formData, remarks: text })}
          multiline
          numberOfLines={4}
          placeholder="Enter remarks"
          onFocus={scrollToRemarks}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {entryId ? 'Update Rental Entry' : 'Submit Rental Entry'}
          </Text>
        )}
      </TouchableOpacity>

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
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Company</Text>
            <FlatList
              data={companies}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({ ...formData, companyId: item._id });
                    setCompanyPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.companyName}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setCompanyPickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Product Picker Modal */}
      <Modal
        visible={productPickerVisible !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProductPickerVisible(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProductPickerVisible(null)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Serial No.</Text>
            <FlatList
              data={availableProducts}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    if (productPickerVisible) {
                      handleProductSelect(productPickerVisible, item);
                    }
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.serialNo}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setProductPickerVisible(null)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
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
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Contact</Text>
            <FlatList
              data={contactOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    const exists = formData.sendDetailsTo?.includes(item);
                    const next = exists
                      ? (formData.sendDetailsTo || []).filter((x) => x !== item)
                      : [...(formData.sendDetailsTo || []), item];
                    setFormData({ ...formData, sendDetailsTo: next });
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Icon
                      name={formData.sendDetailsTo?.includes(item) ? 'check-box' : 'check-box-outline-blank'}
                      size={20}
                      color="#019ee3"
                    />
                    <Text style={[styles.pickerOptionText, { flex: 1 }]}>{item}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setSendToPickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  productCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  removeButton: {
    padding: 5,
  },
  productRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  productField: {
    flex: 1,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  configSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  configRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  configField: {
    flex: 1,
    minWidth: '45%',
  },
  configLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  configInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
});

export default RentalInvoiceFormScreen;
