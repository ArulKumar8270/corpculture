import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import { getServiceProductDisplayName, getServiceProductSearchText } from '../../utils/serviceProductDisplayName';
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

const ServiceProductListScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportingExcel, setExportingExcel] = useState(false);
  const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/service-products`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success && data.serviceProducts?.length > 0) {
        setProducts(data.serviceProducts);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load products',
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    // Filtering is handled in renderProduct
  };

  const handleEdit = (product: any) => {
    // Pass product_id to match what AddServiceProductScreen expects
    (navigation as any).navigate('AddServiceProduct', { product_id: product._id || product });
  };

  const handleDelete = async (productId: string) => {
    Alert.alert(
      'Trash Product',
      'Are you sure you want to move this product to trash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data } = await axios.delete(
                `${getApiBaseUrl()}/service-products/${productId}`,
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
                  text2: data.message || 'Product moved to trash successfully!',
                });
                loadProducts();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: data?.message || 'Failed to move to trash product.',
                });
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong while deleting the product.',
              });
            }
          },
        },
      ]
    );
  };

  const filteredProducts = products.filter(product => {
    const companyName = product.company?.companyName?.toLowerCase() || '';
    const productName = getServiceProductSearchText(product);
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return companyName.includes(lowerCaseSearchTerm) || productName.includes(lowerCaseSearchTerm);
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

  const handleDownloadExcel = async () => {
    if (!filteredProducts.length) {
      Toast.show({ type: 'error', text1: 'No service products to export.' });
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
        'Product Name': getServiceProductDisplayName(product),
        HSN: product.hsn ?? '',
        Quantity: product.quantity ?? '',
        Rate: product.rate ?? '',
        'GST Type': formatGstTypes(product.gstType),
        'Partner Profit': product.commission ?? '',
        'Employee Commission': product.employeeCommission ?? '',
        'Total Amount': product.totalAmount ?? '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Service Products');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const stamp = new Date().toISOString().slice(0, 10);
      const fileName = `service_products_${stamp}.xlsx`;
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
        text1: `Exported ${rows.length} service product(s) to Excel.`,
      });
    } catch (err) {
      console.error('Excel export error:', err);
      Toast.show({ type: 'error', text1: 'Failed to export Excel.' });
    } finally {
      setExportingExcel(false);
    }
  };

  const renderProduct = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.serialNumber}>{page * rowsPerPage + index + 1}</Text>
        <View style={styles.productDetails}>
          <Text style={styles.companyName}>{item.company?.companyName || 'N/A'}</Text>
          <Text style={styles.productName}>
            {getServiceProductDisplayName(item)}
          </Text>
          <View style={styles.productSpecs}>
            {/* <Text style={styles.specText}>SKU: {item.sku || 'N/A'}</Text> */}
            <Text style={styles.specText}>HSN: {item.hsn || 'N/A'}</Text>
          </View>
          <View style={styles.productSpecs}>
            <Text style={styles.specText}>Quantity: {item.quantity || 0}</Text>
            <Text style={styles.specText}>Rate: ₹{item.rate || 0}</Text>
          </View>
          <View style={styles.gstContainer}>
            <Text style={styles.gstLabel}>GST Type: </Text>
            {Array.isArray(item.gstType) && item.gstType.length > 0 ? (
              <View style={styles.gstChips}>
                {item.gstType.map((gst: any, idx: number) => (
                  <View key={idx} style={styles.gstChip}>
                    <Text style={styles.gstChipText}>
                      {gst.gstType} ({gst.gstPercentage}%)
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.specText}>N/A</Text>
            )}
          </View>
          <Text style={styles.totalAmount}>Total Amount: ₹{item.totalAmount || 0}</Text>
          <Text style={styles.commission}>Partner Profit: {item.commission ?? 'N/A'}</Text>
          <Text style={styles.commission}>Employee Commission: {item.employeeCommission ?? 'N/A'}</Text>
        </View>
      </View>
      {hasPermission('serviceProductList', 'edit') && (
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Icon name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Product List</Text>
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
          {hasPermission('serviceProductList', 'edit') && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => (navigation as any).navigate('AddServiceProduct')}
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
          placeholder="Search by Company or Product Name"
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
          onRefresh={loadProducts}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inventory" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No service products found</Text>
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
    color: '#333',
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
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  serialNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginRight: 10,
    minWidth: 30,
  },
  productDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#019ee3',
    marginBottom: 8,
  },
  productSpecs: {
    flexDirection: 'row',
    marginBottom: 5,
    gap: 15,
  },
  specText: {
    fontSize: 14,
    color: '#666',
  },
  gstContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  gstLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  gstChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  gstChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gstChipText: {
    fontSize: 12,
    color: '#1976d2',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 5,
  },
  commission: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  productActions: {
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
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
  paginationWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  rowsPerPageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowsPerPageLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  rowsPerPageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rowsPerPageBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  rowsPerPageBtnActive: {
    backgroundColor: '#019ee3',
  },
  rowsPerPageBtnText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  rowsPerPageBtnTextActive: {
    color: '#fff',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#019ee3',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  pageBtnDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.8,
  },
  pageBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    color: '#333',
  },
});

export default ServiceProductListScreen;
