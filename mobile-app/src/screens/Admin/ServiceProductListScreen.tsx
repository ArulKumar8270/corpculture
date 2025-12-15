import React, { useEffect, useState } from 'react';
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
import Toast from 'react-native-toast-message';

const ServiceProductListScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/service-products`, {
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
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data } = await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/service-products/${productId}`,
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
                  text2: data.message || 'Product deleted successfully!',
                });
                loadProducts();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: data?.message || 'Failed to delete product.',
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
    const productName = product.productName?.productName?.productName?.toLowerCase() || '';
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return companyName.includes(lowerCaseSearchTerm) || productName.includes(lowerCaseSearchTerm);
  });

  const renderProduct = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.serialNumber}>{index + 1}</Text>
        <View style={styles.productDetails}>
          <Text style={styles.companyName}>{item.company?.companyName || 'N/A'}</Text>
          <Text style={styles.productName}>
            {item.productName?.productName?.productName || 'N/A'}
          </Text>
          <View style={styles.productSpecs}>
            <Text style={styles.specText}>SKU: {item.sku || 'N/A'}</Text>
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
          {item.commission && (
            <Text style={styles.commission}>Commission: {item.commission}%</Text>
          )}
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
        {hasPermission('serviceProductList', 'edit') && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => (navigation as any).navigate('AddServiceProduct')}
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
          placeholder="Search by Company or Product Name"
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
          onRefresh={loadProducts}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inventory" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No service products found</Text>
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
});

export default ServiceProductListScreen;
