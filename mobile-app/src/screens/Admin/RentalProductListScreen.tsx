import React, { useEffect, useState, useCallback } from 'react';
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

const RentalProductListScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();

  const [products, setProducts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeePickerVisible, setEmployeePickerVisible] = useState<string | null>(null);

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
      'Delete Rental Product',
      'Are you sure you want to delete this rental product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
                  text2: data.message || 'Rental product deleted successfully!',
                });
                fetchRentalProducts();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: data?.message || 'Failed to delete rental product',
                });
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete rental product',
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

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const gstTypes = Array.isArray(item.gstType) && item.gstType.length > 0
      ? item.gstType.map((gst: any) => `${gst.gstType} (${gst.gstPercentage}%)`).join(', ')
      : 'N/A';

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <Text style={styles.productSNo}>{index + 1}</Text>
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
        {hasPermission('rentalAllProducts') && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => (navigation as any).navigate('AddRentalProduct')}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
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
          data={filteredProducts}
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
});

export default RentalProductListScreen;
