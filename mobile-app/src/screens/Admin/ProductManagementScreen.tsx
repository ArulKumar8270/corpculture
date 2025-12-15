import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';

const ProductManagementScreen = () => {
  const navigation = useNavigation();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', commission: '' });
  const [categoryErrors, setCategoryErrors] = useState<{ name?: string; commission?: string }>({});
  const [categoryLoading, setCategoryLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/product/seller-product`,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
      if (response.status === 201) {
        setProducts(response.data.products || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 500) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Something went wrong! Please try after sometime.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.message || 'Failed to load products',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateDeletedProduct = (id: string) => {
    setProducts((prevProducts) => {
      return prevProducts.filter((product) => product._id !== id);
    });
  };

  const handleDelete = async (id: string) => {
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
              const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/product/delete-product`,
                { id },
                {
                  headers: {
                    Authorization: token || '',
                  },
                }
              );
              if (response.status === 200) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Product deleted successfully',
                });
                updateDeletedProduct(id);
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete product',
              });
            }
          },
        },
      ]
    );
  };

  const handleCategoryOpen = () => {
    setCategoryModalOpen(true);
    setCategoryForm({ name: '', commission: '' });
    setCategoryErrors({});
  };

  const handleCategoryClose = () => {
    setCategoryModalOpen(false);
  };

  const handleCategoryChange = (field: string, value: string) => {
    setCategoryForm({ ...categoryForm, [field]: value });
    setCategoryErrors({ ...categoryErrors, [field]: undefined });
  };

  const handleCategorySubmit = async () => {
    let errors: { name?: string; commission?: string } = {};
    if (!categoryForm.name.trim()) {
      errors.name = 'Category name is required';
    }
    if (!categoryForm.commission || isNaN(Number(categoryForm.commission))) {
      errors.commission = 'Commission is required and must be a number';
    }
    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors);
      return;
    }
    setCategoryLoading(true);
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/category/create`,
        {
          name: categoryForm.name.trim(),
          commission: Number(categoryForm.commission),
        },
        {
          headers: { Authorization: token || '' },
        }
      );
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Category added successfully!',
      });
      setCategoryModalOpen(false);
      setCategoryForm({ name: '', commission: '' });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to add category',
      });
    } finally {
      setCategoryLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0]?.url || item.images?.[0];
    const stock = item.stock || 0;
    const hasEditPermission = hasPermission('salesAllProducts', 'edit') || user?.role === 1;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          if (hasEditPermission) {
            (navigation as any).navigate('ProductCreate', { product: item } as any);
          }
        }}
      >
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Icon name="image" size={30} color="#ccc" />
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productId} numberOfLines={1}>
            ID: {item._id?.substring(0, 8) || 'N/A'}
          </Text>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name || 'Unnamed Product'}
          </Text>
          <Text style={styles.productCategory}>{item.category || 'No Category'}</Text>
          <View style={styles.productDetailsRow}>
            <View style={styles.stockContainer}>
              <Text style={styles.stockLabel}>Stock: </Text>
              {stock < 10 ? (
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockText}>{stock}</Text>
                </View>
              ) : (
                <Text style={styles.stockText}>{stock}</Text>
              )}
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹{item.price?.toLocaleString() || '0'}</Text>
            {item.discountPrice && item.discountPrice > 0 && (
              <Text style={styles.discountPrice}>
                ₹{item.discountPrice?.toLocaleString()}
              </Text>
            )}
          </View>
          {item.ratings !== undefined && (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.ratings || 0}</Text>
            </View>
          )}
        </View>
        {hasEditPermission && (
          <View style={styles.productActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => (navigation as any).navigate('ProductCreate', { product: item } as any)}
            >
              <Icon name="edit" size={20} color="#019ee3" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item._id)}
            >
              <Icon name="delete" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const canManageProducts = hasPermission('salesAllProducts', 'edit') || user?.role === 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        {canManageProducts && (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.newProductButton}
              onPress={() => (navigation as any).navigate('ProductCreate')}
            >
              <Text style={styles.buttonText}>+ New Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newCategoryButton}
              onPress={handleCategoryOpen}
            >
              <Text style={styles.buttonText}>+ New Category</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#019ee3" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={loadProducts}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inventory" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}

      {/* Category Modal */}
      <Modal
        visible={categoryModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCategoryClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity onPress={handleCategoryClose}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={[styles.input, categoryErrors.name && styles.inputError]}
                  placeholder="Enter category name"
                  value={categoryForm.name}
                  onChangeText={(value) => handleCategoryChange('name', value)}
                  placeholderTextColor="#999"
                />
                {categoryErrors.name && (
                  <Text style={styles.errorText}>{categoryErrors.name}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Commission (%) *</Text>
                <TextInput
                  style={[styles.input, categoryErrors.commission && styles.inputError]}
                  placeholder="Enter commission percentage"
                  value={categoryForm.commission}
                  onChangeText={(value) => handleCategoryChange('commission', value)}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                {categoryErrors.commission && (
                  <Text style={styles.errorText}>{categoryErrors.commission}</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCategoryClose}
                disabled={categoryLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, categoryLoading && styles.buttonDisabled]}
                onPress={handleCategorySubmit}
                disabled={categoryLoading}
              >
                {categoryLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#019ee3',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  newProductButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newCategoryButton: {
    backgroundColor: '#afcb09',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6fbff',
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e6fbff',
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productId: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  productDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#666',
  },
  stockText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  lowStockBadge: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c62828',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  discountPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#019ee3',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ProductManagementScreen;
