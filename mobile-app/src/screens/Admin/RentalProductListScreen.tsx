import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

let XLSX: any;
try {
  XLSX = require('xlsx');
} catch {
  // xlsx optional
}

const formatGstTypes = (gstType: any) => {
  if (!Array.isArray(gstType) || gstType.length === 0) return 'N/A';
  return gstType.map((gst: any) => `${gst.gstType} (${gst.gstPercentage}%)`).join(', ');
};

const RentalProductListScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();

  const [products, setProducts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeePickerVisible, setEmployeePickerVisible] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportingExcel, setExportingExcel] = useState(false);
  const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

  useEffect(() => {
    fetchRentalProducts();
    fetchEmployees();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRentalProducts();
      fetchEmployees();
    }, [token])
  );

  const fetchRentalProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/rental-products`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success && data.rentalProducts?.length > 0) {
        setProducts(data.rentalProducts);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fetch rental products',
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/employee/all`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEdit = (product: any) => {
    (navigation as any).navigate('AddRentalProduct', {
      product_id: product._id,
    });
  };

  const handleDelete = async (productId: string) => {
    Alert.alert(
      'Trash Rental Product',
      'Are you sure you want to move this rental product to trash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data } = await axios.delete(
                `${getApiBaseUrl()}/rental-products/${productId}`,
                {
                  headers: {
                    Authorization: token || '',
                  },
                }
              );
              if (data?.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: data.message || 'Rental product moved to trash successfully!',
                });
                fetchRentalProducts();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: data?.message || 'Failed to move to trash rental product',
                });
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to move to trash rental product',
              });
            }
          },
        },
      ]
    );
  };

  const handleAssignEmployee = async (productId: string, employeeId: string, product: any) => {
    try {
      const rentalProductData = { ...product, employeeId: employeeId };
      const { data } = await axios.put(
        `${getApiBaseUrl()}/rental-products/${productId}`,
        rentalProductData,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
      if (data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Employee assigned successfully!',
        });
        fetchRentalProducts();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data?.message || 'Failed to assign employee',
        });
        fetchRentalProducts();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to assign employee',
      });
      fetchRentalProducts();
    }
  };

  const filteredProducts = products.filter((product) => {
    // Filter to show only assigned products (products with employeeId)
    const isAssigned = product.employeeId && (
      (typeof product.employeeId === 'object' && product.employeeId._id) ||
      (typeof product.employeeId === 'string' && product.employeeId.trim() !== '')
    );
    
    if (!isAssigned) {
      return false;
    }

    // Apply search filter
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const companyName = product.company?.companyName?.toLowerCase() || '';
    const modelName = product.modelName?.toLowerCase() || '';
    const serialNo = product.serialNo?.toLowerCase() || '';
    const paymentDate = product.paymentDate
      ? new Date(product.paymentDate).toLocaleDateString().toLowerCase()
      : '';

    return (
      companyName.includes(lowerCaseSearchTerm) ||
      modelName.includes(lowerCaseSearchTerm) ||
      serialNo.includes(lowerCaseSearchTerm) ||
      paymentDate.includes(lowerCaseSearchTerm)
    );
  });

  const paginatedProducts = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredProducts.slice(start, start + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
  }, [rowsPerPage]);

  const getAssignedEmployeeName = (product: any) => {
    if (product?.employeeId?.name) return product.employeeId.name;
    const employeeId =
      typeof product?.employeeId === 'object'
        ? product?.employeeId?._id
        : product?.employeeId;
    if (!employeeId) return '';
    return employees.find((emp) => emp._id === employeeId)?.name || '';
  };

  const handleDownloadExcel = async () => {
    if (!filteredProducts.length) {
      Toast.show({ type: 'error', text1: 'No rental products to export.' });
      return;
    }
    if (!XLSX) {
      Toast.show({ type: 'error', text1: 'Excel export requires the xlsx library.' });
      return;
    }
    try {
      setExportingExcel(true);
      const rows = filteredProducts.map((product, index) => ({
        'S.No': index + 1,
        Company: product.company?.companyName || 'N/A',
        'Model Name': product.modelName ?? '',
        'Serial No': product.serialNo ?? '',
        HSN: product.hsn ?? '',
        'Base Price': product.basePrice ?? '',
        'GST Type': formatGstTypes(product.gstType),
        'Payment Date': product.paymentDate
          ? new Date(product.paymentDate).toLocaleDateString()
          : '',
        Commission: product.commission != null ? `${product.commission}%` : '',
        'Assigned Employee': getAssignedEmployeeName(product) || 'None',
        Branch: product.branch ?? '',
        Department: product.department ?? '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rental Products');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const stamp = new Date().toISOString().slice(0, 10);
      const fileName = `rental_products_${stamp}.xlsx`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const base64 = btoa(
        new Uint8Array(excelBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      Toast.show({
        type: 'success',
        text1: `Exported ${rows.length} rental product(s) to Excel.`,
      });
    } catch (err) {
      console.error('Excel export error:', err);
      Toast.show({ type: 'error', text1: 'Failed to export Excel.' });
    } finally {
      setExportingExcel(false);
    }
  };

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const gstTypes = Array.isArray(item.gstType) && item.gstType.length > 0
      ? item.gstType.map((gst: any) => `${gst.gstType} (${gst.gstPercentage}%)`).join(', ')
      : 'N/A';

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <Text style={styles.productSNo}>{page * rowsPerPage + index + 1}</Text>
          <View style={styles.productMainInfo}>
            <Text style={styles.productCompany}>{item.company?.companyName || 'N/A'}</Text>
            <Text style={styles.productModel}>{item.modelName || 'N/A'}</Text>
            <Text style={styles.productSerial}>Serial: {item.serialNo || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>HSN:</Text>
            <Text style={styles.detailValue}>{item.hsn || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Base Price:</Text>
            <Text style={styles.detailValue}>₹{item.basePrice?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GST Type:</Text>
            <Text style={styles.detailValue}>{gstTypes}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Date:</Text>
            <Text style={styles.detailValue}>
              {item.paymentDate
                ? new Date(item.paymentDate).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Commission:</Text>
            <Text style={styles.detailValue}>
              {item.commission ? `${item.commission}%` : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Branch:</Text>
            <Text style={styles.detailValue}>{item.branch || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department:</Text>
            <Text style={styles.detailValue}>{item.department || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned Employee:</Text>
            <TouchableOpacity
              style={styles.employeePicker}
              onPress={() => setEmployeePickerVisible(item._id)}
              disabled={user?.role !== 1}
            >
              <Text style={styles.employeePickerText}>
                {item.employeeId?.name || employees.find((e) => e._id === item.employeeId)?.name || 'None'}
              </Text>
              {user?.role === 1 && <Icon name="arrow-drop-down" size={20} color="#666" />}
            </TouchableOpacity>
          </View>
        </View>

        {hasPermission('rentalAllProducts') && (
          <View style={styles.productActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(item)}
            >
              <Icon name="edit" size={18} color="#007AFF" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rental Product List</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.exportButton,
              (exportingExcel || !filteredProducts.length) && styles.exportButtonDisabled,
            ]}
            onPress={handleDownloadExcel}
            disabled={exportingExcel || !filteredProducts.length}
          >
            {exportingExcel ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="download" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Excel</Text>
              </>
            )}
          </TouchableOpacity>
          {hasPermission('rentalAllProducts') && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => (navigation as any).navigate('AddRentalProduct')}
            >
              <Icon name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Company, Model, Serial No, or Payment Date"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={paginatedProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchRentalProducts}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inventory" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No rental products found</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.paginationWrapper}>
              {filteredProducts.length > 0 && (
                <View style={styles.rowsPerPageRow}>
                  <Text style={styles.rowsPerPageLabel}>Rows per page:</Text>
                  <View style={styles.rowsPerPageOptions}>
                    {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.rowsPerPageBtn, rowsPerPage === opt && styles.rowsPerPageBtnActive]}
                        onPress={() => setRowsPerPage(opt)}
                      >
                        <Text style={[styles.rowsPerPageBtnText, rowsPerPage === opt && styles.rowsPerPageBtnTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {filteredProducts.length > rowsPerPage ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                    onPress={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <Text style={styles.pageBtnText}>Previous</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageInfo}>
                    Page {page + 1} of {Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage))}
                  </Text>
                  <TouchableOpacity
                    style={[styles.pageBtn, page >= Math.ceil(filteredProducts.length / rowsPerPage) - 1 && styles.pageBtnDisabled]}
                    onPress={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(filteredProducts.length / rowsPerPage) - 1}
                  >
                    <Text style={styles.pageBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          }
        />
      )}

      {/* Employee Picker Modal */}
      <Modal
        visible={employeePickerVisible !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEmployeePickerVisible(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEmployeePickerVisible(null)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Employee</Text>
            <FlatList
              data={[{ _id: '', name: 'None' }, ...employees]}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    if (employeePickerVisible) {
                      const product = products.find((p) => p._id === employeePickerVisible);
                      if (product) {
                        handleAssignEmployee(employeePickerVisible, item._id, product);
                      }
                      setEmployeePickerVisible(null);
                    }
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setEmployeePickerVisible(null)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#019ee3',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#019ee3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  exportButtonDisabled: {
    backgroundColor: '#9e9e9e',
    opacity: 0.8,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  loader: {
    marginTop: 50,
  },
  productCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productHeader: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  productSNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 15,
    minWidth: 30,
  },
  productMainInfo: {
    flex: 1,
  },
  productCompany: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  productModel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  productSerial: {
    fontSize: 12,
    color: '#999',
  },
  productDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  employeePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 8,
    minHeight: 36,
    flex: 2,
  },
  employeePickerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  productActions: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 5,
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
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
  paginationWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  rowsPerPageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowsPerPageLabel: { fontSize: 14, color: '#666', marginRight: 8 },
  rowsPerPageOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowsPerPageBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#e0e0e0' },
  rowsPerPageBtnActive: { backgroundColor: '#019ee3' },
  rowsPerPageBtnText: { fontSize: 14, color: '#333', fontWeight: '500' },
  rowsPerPageBtnTextActive: { color: '#fff' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  pageBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#019ee3', borderRadius: 8, marginHorizontal: 8 },
  pageBtnDisabled: { backgroundColor: '#ccc', opacity: 0.8 },
  pageBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pageInfo: { fontSize: 14, color: '#333' },
});

export default RentalProductListScreen;
