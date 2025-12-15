import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';

const VendorProductListScreen = () => {
  const navigation = useNavigation();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchVendorProducts();
    }, [token])
  );

  const fetchVendorProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/vendor-products`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success && response.data.vendorProducts.length > 0) {
        setVendorProducts(response.data.vendorProducts);
      } else {
        setVendorProducts([]);
        if (response.data?.message) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: response.data.message,
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching vendor products:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching vendor products.',
      });
      setVendorProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendorProduct = () => {
    navigation.navigate('AddVendorProduct' as never);
  };

  const handleEdit = (productId: string) => {
    navigation.navigate('AddVendorProduct' as never, { product_id: productId } as never);
  };

  const handleDelete = async (productId: string) => {
    Alert.alert(
      'Delete Vendor Product',
      'Are you sure you want to delete this vendor product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/vendor-products/${productId}`,
                {
                  headers: { Authorization: token || '' },
                }
              );
              if (response.data?.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: response.data.message || 'Vendor product deleted successfully!',
                });
                fetchVendorProducts();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: response.data?.message || 'Failed to delete vendor product.',
                });
              }
            } catch (error: any) {
              console.error('Error deleting vendor product:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong while deleting the vendor product.',
              });
            }
          },
        },
      ]
    );
  };

  const filteredProducts = vendorProducts.filter((product) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const vendorCompanyName = product.vendorCompanyName?.companyName?.toLowerCase() || '';
    const productName = product.productName?.toLowerCase() || '';

    return (
      vendorCompanyName.includes(lowerCaseSearchTerm) ||
      productName.includes(lowerCaseSearchTerm)
    );
  });

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const canEdit = hasPermission('vendorProducts', 'edit') || user?.role === 1;

    return (
      <View style={styles.productCard}>
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.productName || 'N/A'}</Text>
            <Text style={styles.serialNumber}>#{index + 1}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vendor Company:</Text>
            <Text style={styles.detailValue}>
              {item.vendorCompanyName?.companyName || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product Code:</Text>
            <Text style={styles.detailValue}>{item.productCode || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GST Type:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {item.gstType && item.gstType.length > 0
                ? item.gstType
                    .map((gst: any) => `${gst.gstType} (${gst.gstPercentage}%)`)
                    .join(', ')
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price Per Quantity:</Text>
            <Text style={styles.detailValue}>₹{item.pricePerQuantity || '0.00'}</Text>
          </View>
        </View>
        {canEdit && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(item._id)}
            >
              <Icon name="edit" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item._id)}
            >
              <Icon name="delete" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const canAdd = hasPermission('vendorProducts', 'edit') || user?.role === 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendor Product List</Text>
        {canAdd && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddVendorProduct}
          >
            <Text style={styles.addButtonText}>Add New Product</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Vendor Company Name or Product Name"
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#019ee3" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={({ item, index }) => renderProduct({ item, index })}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchVendorProducts}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inventory" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No vendor products found</Text>
            </View>
          }
          contentContainerStyle={filteredProducts.length === 0 ? styles.emptyListContent : undefined}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#019ee3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
  productCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    marginBottom: 10,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  serialNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 140,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#019ee3',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  emptyListContent: {
    flexGrow: 1,
  },
});

export default VendorProductListScreen;
