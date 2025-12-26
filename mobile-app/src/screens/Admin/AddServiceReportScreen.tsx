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
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';

interface MaterialGroup {
  name: string;
  products: Array<{
    id?: string;
    productName: string;
    quantity: number;
    rate: number;
    totalAmount: number;
  }>;
}

const AddServiceReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const reportId = params?.id;
  const employeeName = params?.employeeName;
  const employeeId = params?.employeeId; // Employee ID for assignedTo field
  const reportFor = params?.reportType || 'service';
  const serviceId = params?.serviceId;
  const companyIdFromParams = params?.companyId;
  const isEditMode = !!reportId;

  const [formData, setFormData] = useState({
    reportType: 'Service Report',
    reportFor: reportFor,
    company: '',
    problemReport: '',
    remarksPendingWorks: '',
    accessService: '',
    modelNo: '',
    serialNo: '',
    branch: '',
    reference: '',
    usageData: '',
    description: '',
    materialProductName: '',
    materialQuantity: '',
  });

  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  // Auto-select company when companyIdFromParams is provided and companies are loaded
  useEffect(() => {
    if (companyIdFromParams && companies.length > 0 && !formData.company && !reportId) {
      const companyIdToSet = typeof companyIdFromParams === 'object' 
        ? companyIdFromParams._id || companyIdFromParams 
        : companyIdFromParams;
      if (companyIdToSet) {
        setFormData((prev) => ({
          ...prev,
          company: companyIdToSet,
        }));
      }
    }
  }, [companyIdFromParams, companies, reportId]);

  useEffect(() => {
    if (formData.company) {
      fetchCompanyRelatedData();
    } else {
      setBranches([]);
      setAvailableProducts([]);
    }
  }, [formData.company, token]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/company/all`, {
        headers: { Authorization: token || '' },
      });
      if (data?.success) {
        setCompanies(data.companies || []);
      }

      if (reportId) {
        const reportResponse = await axios.get(
          `${getApiBaseUrl()}/report/getById/${reportId}`,
          { headers: { Authorization: token || '' } }
        );
        if (reportResponse.data.success) {
          const fetchedReport = reportResponse.data.report;
          setFormData({
            reportType: fetchedReport.reportType || 'Service Report',
            reportFor: fetchedReport.reportFor || 'service',
            company: fetchedReport.company?._id || '',
            problemReport: fetchedReport.problemReport || '',
            remarksPendingWorks: fetchedReport.remarksPendingWorks || '',
            accessService: fetchedReport.accessService || '',
            modelNo: fetchedReport.modelNo || '',
            serialNo: fetchedReport.serialNo || '',
            branch: fetchedReport.branch || '',
            reference: fetchedReport.reference || '',
            usageData: fetchedReport.usageData || '',
            description: fetchedReport.description || '',
            materialProductName: '',
            materialQuantity: '',
          });
          if (Array.isArray(fetchedReport.materialGroups) && fetchedReport.materialGroups.length > 0) {
            setMaterialGroups(
              fetchedReport.materialGroups.map((group: any) => ({
                ...group,
                products: group.products.map((prod: any, index: number) => ({
                  ...prod,
                  id: `initial-${group.name}-${index}-${Date.now()}`,
                })),
              }))
            );
          } else if (Array.isArray(fetchedReport.materials) && fetchedReport.materials.length > 0) {
            setMaterialGroups([
              {
                name: 'Materials1',
                products: fetchedReport.materials.map((mat: any, index: number) => ({
                  ...mat,
                  id: `initial-Materials1-${index}-${Date.now()}`,
                })),
              },
            ]);
          } else {
            setMaterialGroups([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyRelatedData = async () => {
    try {
      const { data: companyData } = await axios.get(
        `${getApiBaseUrl()}/company/get/${formData.company}`,
        { headers: { Authorization: token || '' } }
      );
      if (companyData?.success && companyData.company) {
        const extractedBranches = new Set<string>();
        companyData.company.serviceDeliveryAddresses?.forEach((addressObj: any) => {
          if (addressObj.address) {
            extractedBranches.add(addressObj.address);
          }
        });
        setBranches(Array.from(extractedBranches));
      }

      const { data: productsData } = await axios.get(
        `${getApiBaseUrl()}/service-products/getServiceProductsByCompany/${formData.company}`,
        { headers: { Authorization: token || '' } }
      );
      if (productsData?.success) {
        // Filter and validate products to ensure they have required fields
        // Note: productName might be a populated object, so we need to handle it
        const validProducts = (productsData.serviceProducts || []).filter(
          (product: any) => {
            if (!product || typeof product !== 'object' || !product._id) {
              return false;
            }
            // Check if productName exists (could be string or populated object)
            const hasProductName = product.productName && (
              typeof product.productName === 'string' || 
              (typeof product.productName === 'object' && product.productName.productName)
            );
            return hasProductName || product.name;
          }
        );
        setAvailableProducts(validProducts);
      }
    } catch (error) {
      console.error('Error fetching company related data:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'company') {
      setFormData((prev) => ({
        ...prev,
        company: value,
        branch: '',
        materialProductName: '',
      }));
      setMaterialGroups([]);
      setSelectedGroupIndex(null);
      setEditingProductId(null);
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Helper function to safely extract productName from various structures
  const extractProductName = (product: any): string => {
    if (!product) return 'Unknown Product';
    
    // If productName is a string, return it directly
    if (typeof product.productName === 'string') {
      return product.productName;
    }
    
    // If productName is an object, try to extract the actual name
    if (typeof product.productName === 'object' && product.productName !== null) {
      const productNameObj = product.productName as any;
      
      // Try productName.productName (nested structure - could be Purchase -> VendorProduct)
      if (productNameObj.productName) {
        // If productName.productName is a string, return it
        if (typeof productNameObj.productName === 'string') {
          return productNameObj.productName;
        }
        // If it's still an object, go one level deeper (Purchase -> VendorProduct -> productName)
        if (typeof productNameObj.productName === 'object' && productNameObj.productName !== null) {
          const nested = productNameObj.productName as any;
          // Check if nested.productName is a string (the actual product name)
          if (typeof nested.productName === 'string') {
            return nested.productName;
          }
          // Fallback to nested.name
          if (typeof nested.name === 'string') {
            return nested.name;
          }
        }
      }
      
      // Try productName.name
      if (productNameObj.name && typeof productNameObj.name === 'string') {
        return productNameObj.name;
      }
    }
    
    // Fallback to product.name
    if (product.name && typeof product.name === 'string') {
      return product.name;
    }
    
    return 'Unknown Product';
  };

  const handleAddGroup = () => {
    const newGroupName = `Materials${materialGroups.length + 1}`;
    setMaterialGroups([...materialGroups, { name: newGroupName, products: [] }]);
    setSelectedGroupIndex(materialGroups.length);
    setEditingProductId(null);
    setFormData((prev) => ({
      ...prev,
      materialProductName: '',
      materialQuantity: '',
    }));
  };

  const handleSelectGroup = (idx: number) => {
    setSelectedGroupIndex(idx);
    setEditingProductId(null);
    setFormData((prev) => ({
      ...prev,
      materialProductName: '',
      materialQuantity: '',
    }));
  };

  const handleSaveProduct = () => {
    if (selectedGroupIndex === null) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a material group first',
      });
      return;
    }
    const selectedProduct = availableProducts.find((p) => p._id === formData.materialProductName);
    if (!selectedProduct || !formData.materialQuantity || parseInt(formData.materialQuantity) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a product and enter a valid quantity',
      });
      return;
    }

    // Debug: Log the selected product structure
    console.log('Selected product:', JSON.stringify(selectedProduct, null, 2));

    const quantity = parseInt(formData.materialQuantity);
    
    // Use helper function to safely extract productName
    const productName = extractProductName(selectedProduct);
    
    // Final validation - ensure it's a string
    if (typeof productName !== 'string') {
      console.error('productName extraction failed, got:', productName);
      throw new Error('Failed to extract product name');
    }
    
    const productRate = selectedProduct.rate || 0;
    const productData = {
      productName: productName,
      quantity: quantity,
      rate: productRate,
      totalAmount: quantity * productRate,
    };
    
    // Debug log to verify productName is a string
    console.log('Product data being saved:', JSON.stringify(productData, null, 2));

    setMaterialGroups((prevGroups) =>
      prevGroups.map((group, idx) => {
        if (idx === selectedGroupIndex) {
          if (editingProductId) {
            return {
              ...group,
              products: group.products.map((prod) =>
                prod.id === editingProductId ? { ...prod, ...productData } : prod
              ),
            };
          } else {
            return {
              ...group,
              products: [...group.products, { id: Date.now().toString(), ...productData }],
            };
          }
        }
        return group;
      })
    );

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: editingProductId ? 'Product updated!' : 'Product added to group!',
    });
    setEditingProductId(null);
    setFormData((prev) => ({
      ...prev,
      materialProductName: '',
      materialQuantity: '',
    }));
  };

  const handleEditProduct = (groupIdx: number, product: any) => {
    setSelectedGroupIndex(groupIdx);
    setEditingProductId(product.id || null);
    // Find product by matching productName (handle both string and object cases)
    const productToEdit = availableProducts.find((p) => {
      const pName = typeof p.productName === 'string' 
        ? p.productName 
        : (p.productName?.productName || p.productName?.name || '');
      return pName === product.productName;
    });
    setFormData((prev) => ({
      ...prev,
      materialProductName: productToEdit ? productToEdit._id : '',
      materialQuantity: product.quantity.toString(),
    }));
  };

  const handleDeleteProduct = (groupIdx: number, productId: string) => {
    setMaterialGroups((prevGroups) =>
      prevGroups.map((group, idx) => {
        if (idx === groupIdx) {
          return {
            ...group,
            products: group.products.filter((prod) => prod.id !== productId),
          };
        }
        return group;
      })
    );
    if (editingProductId === productId) {
      setEditingProductId(null);
      setFormData((prev) => ({
        ...prev,
        materialProductName: '',
        materialQuantity: '',
      }));
    }
  };

  const handleDeleteGroup = (groupIdx: number) => {
    Alert.alert('Delete Group', 'Are you sure you want to delete this material group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setMaterialGroups((prevGroups) => prevGroups.filter((_, idx) => idx !== groupIdx));
          if (selectedGroupIndex === groupIdx) {
            setSelectedGroupIndex(null);
            setEditingProductId(null);
            setFormData((prev) => ({
              ...prev,
              materialProductName: '',
              materialQuantity: '',
            }));
          }
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!formData.company) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a company',
      });
      return;
    }
    const hasProducts = materialGroups.some((group) => group.products.length > 0);
    if (materialGroups.length === 0 || !hasProducts) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please add at least one material group with products',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Validate and clean materialGroups before sending
      const cleanedMaterialGroups = materialGroups.map((group) => ({
        name: group.name,
        products: group.products.map(({ id, ...rest }: any) => {
          // Use helper function to extract productName safely
          const productName = extractProductName(rest);
          
          // Ensure all numeric fields are numbers
          return {
            productName: productName, // Already a string from extractProductName
            quantity: Number(rest.quantity) || 0,
            rate: Number(rest.rate) || 0,
            totalAmount: Number(rest.totalAmount) || 0,
          };
        }),
      }));

      const payload = {
        serviceId: serviceId,
        reportType: formData.reportType,
        company: formData.company,
        problemReport: formData.problemReport,
        remarksPendingWorks: formData.remarksPendingWorks,
        accessService: formData.accessService,
        modelNo: formData.modelNo,
        serialNo: formData.serialNo,
        branch: formData.branch,
        reference: formData.reference,
        usageData: formData.usageData,
        description: formData.description,
        assignedTo: employeeId || user?._id,
        reportFor: reportFor,
        materialGroups: cleanedMaterialGroups,
      };

      // Log payload for debugging
      console.log('Report payload:', JSON.stringify(payload, null, 2));
      
      let response;
      if (reportId) {
        response = await axios.put(`${getApiBaseUrl()}/report/${reportId}`, payload, {
          headers: { Authorization: token || '', 'Content-Type': 'application/json' },
        });
      } else {
        response = await axios.post(`${getApiBaseUrl()}/report`, payload, {
          headers: { Authorization: token || '', 'Content-Type': 'application/json' },
        });
      }

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || (reportId ? 'Report updated successfully' : 'Report created successfully'),
        });
        (navigation as any).navigate('ServiceReports');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data.message || 'Failed to save report',
        });
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save report. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditMode ? 'Edit Service Report' : 'Add Service Report'}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Company *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setCompanyPickerVisible(true)}
        >
          <Text style={styles.pickerButtonText}>
            {formData.company
              ? companies.find((c) => c._id === formData.company)?.companyName || 'Select Company'
              : 'Select Company'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>Problem Report</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.problemReport}
          onChangeText={(text) => handleChange('problemReport', text)}
          placeholder="Enter Problem Report"
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Remarks / Pending Works</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.remarksPendingWorks}
          onChangeText={(text) => handleChange('remarksPendingWorks', text)}
          placeholder="Enter Remarks / Pending Works"
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Access Service</Text>
        <TextInput
          style={styles.input}
          value={formData.accessService}
          onChangeText={(text) => handleChange('accessService', text)}
          placeholder="Enter Access Service"
        />

        <Text style={styles.label}>Model No</Text>
        <TextInput
          style={styles.input}
          value={formData.modelNo}
          onChangeText={(text) => handleChange('modelNo', text)}
          placeholder="Enter Model No"
        />

        <Text style={styles.label}>Serial No</Text>
        <TextInput
          style={styles.input}
          value={formData.serialNo}
          onChangeText={(text) => handleChange('serialNo', text)}
          placeholder="Enter Serial No"
        />

        <Text style={styles.label}>Branch</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setBranchPickerVisible(true)}
          disabled={!formData.company}
        >
          <Text style={[styles.pickerButtonText, !formData.company && styles.disabledText]}>
            {formData.branch || 'Select Branch'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>Reference</Text>
        <TextInput
          style={styles.input}
          value={formData.reference}
          onChangeText={(text) => handleChange('reference', text)}
          placeholder="Enter Reference"
        />

        <Text style={styles.label}>Usage Data</Text>
        <TextInput
          style={styles.input}
          value={formData.usageData}
          onChangeText={(text) => handleChange('usageData', text)}
          placeholder="Enter Usage Data"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => handleChange('description', text)}
          placeholder="Enter Description"
          multiline
          numberOfLines={2}
        />

        <Text style={styles.sectionTitle}>Material Groups</Text>
        <View style={styles.groupButtons}>
          <TouchableOpacity style={styles.addGroupButton} onPress={handleAddGroup}>
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addGroupButtonText}>Add Material Group</Text>
          </TouchableOpacity>
          {materialGroups.map((group, idx) => (
            <TouchableOpacity
              key={group.name}
              style={[
                styles.groupButton,
                selectedGroupIndex === idx && styles.groupButtonSelected,
              ]}
              onPress={() => handleSelectGroup(idx)}
            >
              <Text
                style={[
                  styles.groupButtonText,
                  selectedGroupIndex === idx && styles.groupButtonTextSelected,
                ]}
              >
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedGroupIndex !== null && (
          <View style={styles.productForm}>
            <Text style={styles.label}>Select Product</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setProductPickerVisible(true)}
              disabled={editingProductId !== null}
            >
              <Text style={styles.pickerButtonText}>
                {formData.materialProductName
                  ? (() => {
                      const selected = availableProducts.find((p) => p._id === formData.materialProductName);
                      if (!selected) return 'Select Product';
                      // Use helper function to extract productName safely
                      return extractProductName(selected);
                    })()
                  : 'Select Product'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={formData.materialQuantity}
              onChangeText={(text) => handleChange('materialQuantity', text)}
              placeholder="Enter Quantity"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.saveProductButton}
              onPress={handleSaveProduct}
              disabled={!formData.materialProductName || !formData.materialQuantity}
            >
              <Text style={styles.saveProductButtonText}>
                {editingProductId ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
            {editingProductId && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingProductId(null);
                  setFormData((prev) => ({
                    ...prev,
                    materialProductName: '',
                    materialQuantity: '',
                  }));
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {materialGroups.map((group, groupIdx) => (
          <View key={group.name} style={styles.materialGroupCard}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{group.name}</Text>
              <TouchableOpacity onPress={() => handleDeleteGroup(groupIdx)}>
                <Icon name="delete" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            {group.products.length === 0 ? (
              <Text style={styles.emptyText}>No products added to this group yet.</Text>
            ) : (
              group.products.map((product, productIdx) => (
                <View key={product.id} style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {product.productName ? String(product.productName) : 'Unknown Product'}
                    </Text>
                    <Text style={styles.productDetails}>
                      Qty: {product.quantity || 0} | Rate: ₹{product.rate || 0} | Total: ₹{product.totalAmount || 0}
                    </Text>
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      onPress={() => handleEditProduct(groupIdx, product)}
                      disabled={editingProductId !== null && editingProductId !== product.id}
                    >
                      <Icon name="edit" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteProduct(groupIdx, product.id!)}>
                      <Icon name="delete" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ))}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{isEditMode ? 'Update Report' : 'Submit'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => (navigation as any).goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
          <View style={styles.pickerModal}>
            <Text style={styles.pickerModalTitle}>Select Company</Text>
            <FlatList
              data={companies}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    handleChange('company', item._id);
                    setCompanyPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.companyName}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCompanyPickerVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Branch Picker Modal */}
      <Modal
        visible={branchPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBranchPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setBranchPickerVisible(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerModalTitle}>Select Branch</Text>
            <FlatList
              data={branches}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    handleChange('branch', item);
                    setBranchPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setBranchPickerVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
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
          <View style={styles.pickerModal}>
            <Text style={styles.pickerModalTitle}>Select Product</Text>
            <FlatList
              data={availableProducts}
              keyExtractor={(item) => item?._id || String(item)}
              renderItem={({ item }) => {
                if (!item || typeof item !== 'object') {
                  return null;
                }
                const productId = item._id;
                if (!productId) {
                  return null;
                }
                // Use helper function to extract productName safely
                const productName = extractProductName(item);
                return (
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => {
                      handleChange('materialProductName', productId);
                      setProductPickerVisible(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{productName}</Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setProductPickerVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
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
  loaderContainer: {
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
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  disabledText: {
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#019ee3',
    marginTop: 20,
    marginBottom: 10,
  },
  groupButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  addGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#019ee3',
    padding: 10,
    borderRadius: 8,
    gap: 5,
  },
  addGroupButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  groupButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  groupButtonSelected: {
    backgroundColor: '#019ee3',
    borderColor: '#019ee3',
  },
  groupButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  groupButtonTextSelected: {
    color: '#fff',
  },
  productForm: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  saveProductButton: {
    backgroundColor: '#019ee3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveProductButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  materialGroupCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  productActions: {
    flexDirection: 'row',
    gap: 15,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
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
  modalCloseButton: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default AddServiceReportScreen;
