import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';

interface ModelSpecs {
  isA3Selected: boolean;
  isA4Selected: boolean;
  isA5Selected: boolean;
}

interface Config {
  bwOldCount: number | string;
  freeCopiesBw: number | string;
  extraAmountBw: number | string;
  bwUnlimited: boolean;
  colorOldCount: number | string;
  freeCopiesColor: number | string;
  extraAmountColor: number | string;
  colorUnlimited: boolean;
  colorScanningOldCount: number | string;
  freeCopiesColorScanning: number | string;
  extraAmountColorScanning: number | string;
  colorScanningUnlimited: boolean;
}

const AddRentalProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const productId = params?.product_id;
  const employeeName = params?.employeeName;
  const isEditMode = !!productId;

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [gstOptions, setGstOptions] = useState<any[]>([]);
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);
  const [gstPickerVisible, setGstPickerVisible] = useState(false);
  const [paymentDatePickerVisible, setPaymentDatePickerVisible] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [companyPage, setCompanyPage] = useState(1);
  const [companyTotalCount, setCompanyTotalCount] = useState(0);
  const [loadingMoreCompanies, setLoadingMoreCompanies] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [formData, setFormData] = useState({
    company: '',
    branch: '',
    department: '',
    modelName: '',
    serialNo: '',
    hsn: '',
    basePrice: '',
    commission: '',
    paymentDate: '',
    gstTypeIds: [] as string[],
  });

  const [modelSpecs, setModelSpecs] = useState<ModelSpecs>({
    isA3Selected: false,
    isA4Selected: false,
    isA5Selected: false,
  });

  const [a3Config, setA3Config] = useState<Config>({
    bwOldCount: '',
    freeCopiesBw: '',
    extraAmountBw: '',
    bwUnlimited: false,
    colorOldCount: '',
    freeCopiesColor: '',
    extraAmountColor: '',
    colorUnlimited: false,
    colorScanningOldCount: '',
    freeCopiesColorScanning: '',
    extraAmountColorScanning: '',
    colorScanningUnlimited: false,
  });

  const [a4Config, setA4Config] = useState<Config>({
    bwOldCount: '',
    freeCopiesBw: '',
    extraAmountBw: '',
    bwUnlimited: false,
    colorOldCount: '',
    freeCopiesColor: '',
    extraAmountColor: '',
    colorUnlimited: false,
    colorScanningOldCount: '',
    freeCopiesColorScanning: '',
    extraAmountColorScanning: '',
    colorScanningUnlimited: false,
  });

  const [a5Config, setA5Config] = useState<Config>({
    bwOldCount: '',
    freeCopiesBw: '',
    extraAmountBw: '',
    bwUnlimited: false,
    colorOldCount: '',
    freeCopiesColor: '',
    extraAmountColor: '',
    colorUnlimited: false,
    colorScanningOldCount: '',
    freeCopiesColorScanning: '',
    extraAmountColorScanning: '',
    colorScanningUnlimited: false,
  });

  useEffect(() => {
    fetchCompanies(1, false); // Load first 10 companies
    fetchGstOptions();
    if (isEditMode && productId) {
      fetchProduct(productId);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!companyPickerVisible) return; // Only search when picker is visible
    
    const searchTimer = setTimeout(() => {
      fetchCompanies(1, false, companySearch);
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimer);
  }, [companySearch, companyPickerVisible]);

  useFocusEffect(
    useCallback(() => {
      const currentParams = route.params as any;
      const currentProductId = currentParams?.product_id;

      if (!currentProductId) {
        const timeoutId = setTimeout(() => {
          if (
            formData.company ||
            formData.modelName ||
            formData.serialNo ||
            modelSpecs.isA3Selected ||
            modelSpecs.isA4Selected ||
            modelSpecs.isA5Selected
          ) {
            resetForm();
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }, [route.params])
  );

  const resetForm = useCallback(() => {
    setFormData({
      company: '',
      branch: '',
      department: '',
      modelName: '',
      serialNo: '',
      hsn: '',
      basePrice: '',
      commission: '',
      paymentDate: '',
      gstTypeIds: [],
    });
    setModelSpecs({
      isA3Selected: false,
      isA4Selected: false,
      isA5Selected: false,
    });
    setA3Config({
      bwOldCount: '',
      freeCopiesBw: '',
      extraAmountBw: '',
      bwUnlimited: false,
      colorOldCount: '',
      freeCopiesColor: '',
      extraAmountColor: '',
      colorUnlimited: false,
      colorScanningOldCount: '',
      freeCopiesColorScanning: '',
      extraAmountColorScanning: '',
      colorScanningUnlimited: false,
    });
    setA4Config({
      bwOldCount: '',
      freeCopiesBw: '',
      extraAmountBw: '',
      bwUnlimited: false,
      colorOldCount: '',
      freeCopiesColor: '',
      extraAmountColor: '',
      colorUnlimited: false,
      colorScanningOldCount: '',
      freeCopiesColorScanning: '',
      extraAmountColorScanning: '',
      colorScanningUnlimited: false,
    });
    setA5Config({
      bwOldCount: '',
      freeCopiesBw: '',
      extraAmountBw: '',
      bwUnlimited: false,
      colorOldCount: '',
      freeCopiesColor: '',
      extraAmountColor: '',
      colorUnlimited: false,
      colorScanningOldCount: '',
      freeCopiesColorScanning: '',
      extraAmountColorScanning: '',
      colorScanningUnlimited: false,
    });
  }, []);

  const fetchCompanies = async (page = 1, append = false, search = '') => {
    if (!append) {
      setLoadingCompanies(true);
    }
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const { data } = await axios.get(`${getApiBaseUrl()}/company/all?page=${page}&limit=10${searchParam}`, {
        headers: { Authorization: token || '' },
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
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch companies',
        });
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
        headers: { Authorization: token || '' },
      });
      if (data?.success) {
        setGstOptions(data.gst || []);
      }
    } catch (error) {
      console.error('Error fetching GST options:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch GST options',
      });
    }
  };

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/rental-products/${id}`, {
        headers: { Authorization: token || '' },
      });
      if (data?.success) {
        const product = data.rentalProduct;
        setFormData({
          company: product.company?._id || product.company || '',
          branch: product.branch || '',
          department: product.department || '',
          modelName: product.modelName || '',
          serialNo: product.serialNo || '',
          hsn: product.hsn || '',
          basePrice: product.basePrice?.toString() || '',
          commission: product.commission?.toString() || '',
          paymentDate: product.paymentDate
            ? new Date(product.paymentDate).toISOString().split('T')[0]
            : '',
          gstTypeIds: Array.isArray(product.gstType)
            ? product.gstType.map((gst: any) => gst._id)
            : product.gstType?._id
            ? [product.gstType._id]
            : [],
        });

        setModelSpecs({
          isA3Selected: product.modelSpecs?.isA3Selected || false,
          isA4Selected: product.modelSpecs?.isA4Selected || false,
          isA5Selected: product.modelSpecs?.isA5Selected || false,
        });

        setA3Config(product.a3Config || a3Config);
        setA4Config(product.a4Config || a4Config);
        setA5Config(product.a5Config || a5Config);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load product data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModelSpecChange = (specName: keyof ModelSpecs, value: boolean) => {
    setModelSpecs((prev) => ({ ...prev, [specName]: value }));
  };

  const handleConfigChange = (
    size: 'A3' | 'A4' | 'A5',
    key: keyof Config,
    value: string | boolean
  ) => {
    const setter = {
      A3: setA3Config,
      A4: setA4Config,
      A5: setA5Config,
    }[size];

    setter((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (
      !formData.company ||
      !formData.branch ||
      !formData.department ||
      !formData.modelName ||
      !formData.serialNo ||
      !formData.hsn ||
      !formData.basePrice ||
      formData.gstTypeIds.length === 0 ||
      !formData.paymentDate ||
      !formData.commission
    ) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setLoading(true);
      const rentalProductData = {
        company: formData.company,
        branch: formData.branch,
        department: formData.department,
        modelName: formData.modelName,
        serialNo: formData.serialNo,
        hsn: formData.hsn,
        basePrice: parseFloat(formData.basePrice),
        gstType: formData.gstTypeIds,
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate).toISOString() : null,
        commission: parseFloat(formData.commission),
        modelSpecs,
        a3Config: modelSpecs.isA3Selected ? a3Config : {},
        a4Config: modelSpecs.isA4Selected ? a4Config : {},
        a5Config: modelSpecs.isA5Selected ? a5Config : {},
        assignedTo: employeeName,
      };

      let response;
      if (isEditMode) {
        response = await axios.put(
          `${getApiBaseUrl()}/rental-products/${productId}`,
          rentalProductData,
          {
            headers: { Authorization: token || '' },
          }
        );
      } else {
        response = await axios.post(
          `${getApiBaseUrl()}/rental-products`,
          rentalProductData,
          {
            headers: { Authorization: token || '' },
          }
        );
      }

      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || (isEditMode ? 'Product updated successfully' : 'Product created successfully'),
        });
        resetForm();
        (navigation as any).navigate('RentalProductList');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to save product',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to save product',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderConfigSection = (size: 'A3' | 'A4' | 'A5', config: Config) => {
    if (!modelSpecs[`is${size}Selected` as keyof ModelSpecs]) return null;

    return (
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>{size} Configuration</Text>

        {/* B/W Configuration */}
        <View style={styles.configGroup}>
          <Text style={styles.configGroupTitle}>B/W Configuration</Text>
          <View style={styles.configRow}>
            <View style={styles.configField}>
              <Text style={styles.configLabel}>{size} B/W Old Count</Text>
              <TextInput
                style={styles.configInput}
                value={config.bwOldCount.toString()}
                onChangeText={(value) => handleConfigChange(size, 'bwOldCount', value)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.configField}>
              <Text style={styles.configLabel}>Free Copies in B/W</Text>
              <TextInput
                style={[styles.configInput, config.bwUnlimited && styles.configInputDisabled]}
                value={config.freeCopiesBw.toString()}
                onChangeText={(value) => handleConfigChange(size, 'freeCopiesBw', value)}
                keyboardType="numeric"
                placeholder="0"
                editable={!config.bwUnlimited}
              />
            </View>
            <View style={styles.configField}>
              <Text style={styles.configLabel}>Amount for extra B/W copies</Text>
              <TextInput
                style={[styles.configInput, config.bwUnlimited && styles.configInputDisabled]}
                value={config.extraAmountBw.toString()}
                onChangeText={(value) => handleConfigChange(size, 'extraAmountBw', value)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                editable={!config.bwUnlimited}
              />
            </View>
            <View style={styles.checkboxRow}>
              <Text style={styles.configLabel}>{size} B/W Unlimited</Text>
              <Switch
                value={config.bwUnlimited}
                onValueChange={(value) => handleConfigChange(size, 'bwUnlimited', value)}
              />
            </View>
          </View>
        </View>

        {/* Color Configuration */}
        <View style={styles.configGroup}>
          <Text style={styles.configGroupTitle}>Color Configuration</Text>
          <View style={styles.configRow}>
            <View style={styles.configField}>
              <Text style={styles.configLabel}>{size} Color Old Count</Text>
              <TextInput
                style={styles.configInput}
                value={config.colorOldCount.toString()}
                onChangeText={(value) => handleConfigChange(size, 'colorOldCount', value)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.configField}>
              <Text style={styles.configLabel}>Free Copies in Colour</Text>
              <TextInput
                style={[styles.configInput, config.colorUnlimited && styles.configInputDisabled]}
                value={config.freeCopiesColor.toString()}
                onChangeText={(value) => handleConfigChange(size, 'freeCopiesColor', value)}
                keyboardType="numeric"
                placeholder="0"
                editable={!config.colorUnlimited}
              />
            </View>
            <View style={styles.configField}>
              <Text style={styles.configLabel}>Amount for extra colour copies</Text>
              <TextInput
                style={[styles.configInput, config.colorUnlimited && styles.configInputDisabled]}
                value={config.extraAmountColor.toString()}
                onChangeText={(value) => handleConfigChange(size, 'extraAmountColor', value)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                editable={!config.colorUnlimited}
              />
            </View>
            <View style={styles.checkboxRow}>
              <Text style={styles.configLabel}>{size} Color Unlimited</Text>
              <Switch
                value={config.colorUnlimited}
                onValueChange={(value) => handleConfigChange(size, 'colorUnlimited', value)}
              />
            </View>
          </View>
        </View>

        {/* Color Scanning Configuration */}
        <View style={styles.configGroup}>
          <Text style={styles.configGroupTitle}>Color Scanning Configuration</Text>
          <View style={styles.configRow}>
            <View style={styles.configField}>
              <Text style={styles.configLabel}>{size} Color Scanning Old Count</Text>
              <TextInput
                style={styles.configInput}
                value={config.colorScanningOldCount.toString()}
                onChangeText={(value) => handleConfigChange(size, 'colorScanningOldCount', value)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.configField}>
              <Text style={styles.configLabel}>Free Copies in Colour Scanning</Text>
              <TextInput
                style={[
                  styles.configInput,
                  config.colorScanningUnlimited && styles.configInputDisabled,
                ]}
                value={config.freeCopiesColorScanning.toString()}
                onChangeText={(value) => handleConfigChange(size, 'freeCopiesColorScanning', value)}
                keyboardType="numeric"
                placeholder="0"
                editable={!config.colorScanningUnlimited}
              />
            </View>
            <View style={styles.configField}>
              <Text style={styles.configLabel}>Amount for extra colour scanning</Text>
              <TextInput
                style={[
                  styles.configInput,
                  config.colorScanningUnlimited && styles.configInputDisabled,
                ]}
                value={config.extraAmountColorScanning.toString()}
                onChangeText={(value) => handleConfigChange(size, 'extraAmountColorScanning', value)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                editable={!config.colorScanningUnlimited}
              />
            </View>
            <View style={styles.checkboxRow}>
              <Text style={styles.configLabel}>{size} Color Scanning Unlimited</Text>
              <Switch
                value={config.colorScanningUnlimited}
                onValueChange={(value) => handleConfigChange(size, 'colorScanningUnlimited', value)}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Rental Product' : 'Add Rental Product'}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Company */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setCompanyPickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {companies.find((c) => c._id === formData.company)?.companyName || '--select Company--'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Branch */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Branch *</Text>
          <TextInput
            style={styles.input}
            value={formData.branch}
            onChangeText={(text) => setFormData({ ...formData, branch: text })}
            placeholder="Enter Company Branch"
          />
        </View>

        {/* Department */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Department *</Text>
          <TextInput
            style={styles.input}
            value={formData.department}
            onChangeText={(text) => setFormData({ ...formData, department: text })}
            placeholder="Enter Company Department"
          />
        </View>

        {/* Model Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Model Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.modelName}
            onChangeText={(text) => setFormData({ ...formData, modelName: text })}
            placeholder="Enter Model Name"
          />
        </View>

        {/* Serial No */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Serial No *</Text>
          <TextInput
            style={styles.input}
            value={formData.serialNo}
            onChangeText={(text) => setFormData({ ...formData, serialNo: text })}
            placeholder="Enter Serial Name"
          />
        </View>

        {/* HSN */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>HSN *</Text>
          <TextInput
            style={styles.input}
            value={formData.hsn}
            onChangeText={(text) => setFormData({ ...formData, hsn: text })}
            placeholder="Enter HSN"
          />
        </View>

        {/* Base Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Base Price *</Text>
          <TextInput
            style={styles.input}
            value={formData.basePrice}
            onChangeText={(text) => setFormData({ ...formData, basePrice: text })}
            placeholder="Enter Machine's Base Price"
            keyboardType="decimal-pad"
          />
        </View>

        {/* GST Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select GST *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setGstPickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {formData.gstTypeIds.length > 0
                ? formData.gstTypeIds
                    .map(
                      (id) =>
                        gstOptions.find((gst) => gst._id === id)?.gstType ||
                        `${gstOptions.find((gst) => gst._id === id)?.gstPercentage}%`
                    )
                    .join(', ')
                : '--select GST Type--'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Payment Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Date *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setPaymentDatePickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {formData.paymentDate || '--select Payment Date--'}
            </Text>
            <Icon name="calendar-today" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Commission */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Commission *</Text>
          <TextInput
            style={styles.input}
            value={formData.commission}
            onChangeText={(text) => setFormData({ ...formData, commission: text })}
            placeholder="Enter Commission Percentage"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Model Specifications */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Model Specifications *</Text>
          <View style={styles.checkboxContainer}>
            <View style={styles.checkboxRow}>
              <Text style={styles.checkboxLabel}>A3</Text>
              <Switch
                value={modelSpecs.isA3Selected}
                onValueChange={(value) => handleModelSpecChange('isA3Selected', value)}
              />
            </View>
            <View style={styles.checkboxRow}>
              <Text style={styles.checkboxLabel}>A4</Text>
              <Switch
                value={modelSpecs.isA4Selected}
                onValueChange={(value) => handleModelSpecChange('isA4Selected', value)}
              />
            </View>
            <View style={styles.checkboxRow}>
              <Text style={styles.checkboxLabel}>A5</Text>
              <Switch
                value={modelSpecs.isA5Selected}
                onValueChange={(value) => handleModelSpecChange('isA5Selected', value)}
              />
            </View>
          </View>
        </View>

        {/* Configuration Sections */}
        {renderConfigSection('A3', a3Config)}
        {renderConfigSection('A4', a4Config)}
        {renderConfigSection('A5', a5Config)}

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
              {isEditMode ? 'Update' : 'Submit'}
            </Text>
          )}
        </TouchableOpacity>
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
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Company</Text>
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
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({ ...formData, company: item._id });
                    setCompanyPickerVisible(false);
                    setCompanySearch('');
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.companyName}</Text>
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
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setCompanyPickerVisible(false);
                setCompanySearch('');
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GST Picker Modal (Multi-select) */}
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
                const isSelected = formData.gstTypeIds.includes(item._id);
                return (
                  <TouchableOpacity
                    style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                    onPress={() => {
                      const newGstIds = isSelected
                        ? formData.gstTypeIds.filter((id) => id !== item._id)
                        : [...formData.gstTypeIds, item._id];
                      setFormData({ ...formData, gstTypeIds: newGstIds });
                    }}
                  >
                    <Icon
                      name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={isSelected ? '#007AFF' : '#666'}
                    />
                    <Text style={styles.pickerOptionText}>
                      {item.gstType} ({item.gstPercentage}%)
                    </Text>
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

      {/* Payment Date Picker Modal */}
      <Modal
        visible={paymentDatePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentDatePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPaymentDatePickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Payment Date</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                value={formData.paymentDate}
                onChangeText={(text) => setFormData({ ...formData, paymentDate: text })}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
              />
              <Text style={styles.dateHint}>Format: YYYY-MM-DD</Text>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setPaymentDatePickerVisible(false)}
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
    marginBottom: 15,
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
  checkboxContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  configSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#019ee3',
    marginBottom: 15,
  },
  configGroup: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  configGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  configRow: {
    gap: 10,
  },
  configField: {
    marginBottom: 10,
  },
  configLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  configInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  configInputDisabled: {
    backgroundColor: '#e0e0e0',
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    opacity: 0.6,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  pickerOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
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
  dateInputContainer: {
    marginBottom: 15,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 5,
  },
  dateHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
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
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default AddRentalProductScreen;
