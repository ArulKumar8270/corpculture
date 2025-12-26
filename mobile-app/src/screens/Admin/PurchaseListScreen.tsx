import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';

const PurchaseListScreen = () => {
  const navigation = useNavigation();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchPurchases();
      fetchMaterials();
    }, [token])
  );

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${getApiBaseUrl()}/purchases`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success) {
        setPurchases(response.data.purchases || []);
        setError(null);
      } else {
        setError(response.data?.message || 'Failed to fetch purchases.');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch purchases.',
        });
      }
    } catch (err: any) {
      console.error('Error fetching purchases:', err);
      setError('Something went wrong while fetching purchases.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching purchases.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/materials`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success) {
        setMaterials(response.data.materials || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch materials.',
        });
      }
    } catch (err: any) {
      console.error('Error fetching materials:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching materials.',
      });
    }
  };

  const handleAddPurchase = () => {
    (navigation as any).navigate('PurchaseRegister');
  };

  const handleEdit = (id: string) => {
    (navigation as any).navigate('PurchaseRegister', { id });
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Purchase',
      'Are you sure you want to delete this purchase record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${getApiBaseUrl()}/purchases/${id}`,
                {
                  headers: { Authorization: token || '' },
                }
              );
              if (response.data?.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: response.data?.message || 'Purchase deleted successfully.',
                });
                fetchPurchases();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: response.data?.message || 'Failed to delete purchase.',
                });
              }
            } catch (error: any) {
              console.error('Error deleting purchase:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong while deleting purchase.',
              });
            }
          },
        },
      ]
    );
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const productName = purchase?.productName?.productName?.toLowerCase() || '';
    const invoiceNumber = purchase.purchaseInvoiceNumber?.toLowerCase() || '';
    const vendorCompanyName = purchase.vendorCompanyName?.companyName?.toLowerCase() || '';
    const purchaseDate = purchase.purchaseDate
      ? new Date(purchase.purchaseDate).toLocaleDateString().toLowerCase()
      : '';

    return (
      productName.includes(lowerCaseSearchTerm) ||
      invoiceNumber.includes(lowerCaseSearchTerm) ||
      vendorCompanyName.includes(lowerCaseSearchTerm) ||
      purchaseDate.includes(lowerCaseSearchTerm)
    );
  });

  const paginatedPurchases = filteredPurchases.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const sortedProductGroups = useMemo(() => {
    return materials
      .map((material) => ({
        name: material.name,
        count: 1,
        totalQuantity: material.unit,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [materials]);

  const canEdit = hasPermission('vendorPurchaseList', 'edit') || user?.role === 1;

  const renderPurchase = ({ item, index }: { item: any; index: number }) => {
    const quantity = item.quantity || 0;
    const isNegative = quantity < 0;

    return (
      <View style={styles.purchaseCard}>
        <View style={styles.purchaseHeader}>
          <Text style={styles.serialNumber}>#{page * rowsPerPage + index + 1}</Text>
          <Text style={styles.invoiceNumber}>{item.purchaseInvoiceNumber || 'N/A'}</Text>
        </View>

        <View style={styles.purchaseDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vendor Company:</Text>
            <Text style={styles.detailValue}>
              {item.vendorCompanyName?.companyName || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Material Name:</Text>
            <Text style={styles.detailValue}>
              {item.productName?.productName || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase Date:</Text>
            <Text style={styles.detailValue}>
              {item.purchaseDate
                ? new Date(item.purchaseDate).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={[styles.detailValue, isNegative && styles.negativeValue]}>
              {quantity}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate:</Text>
            <Text style={styles.detailValue}>
              ₹{item.rate?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>
              ₹{item.price?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gross Total:</Text>
            <Text style={[styles.detailValue, styles.grossTotal]}>
              ₹{item.grossTotal?.toFixed(2) || '0.00'}
            </Text>
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

  const renderPagination = () => {
    const totalPages = Math.ceil(filteredPurchases.length / rowsPerPage);

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationText}>
          Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredPurchases.length)} of {filteredPurchases.length}
        </Text>
        <View style={styles.paginationButtons}>
          <TouchableOpacity
            style={[styles.paginationButton, page === 0 && styles.paginationButtonDisabled]}
            onPress={() => setPage(page - 1)}
            disabled={page === 0}
          >
            <Icon name="chevron-left" size={24} color={page === 0 ? '#ccc' : '#019ee3'} />
          </TouchableOpacity>
          <Text style={styles.paginationPageText}>
            Page {page + 1} of {totalPages || 1}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              page >= totalPages - 1 && styles.paginationButtonDisabled,
            ]}
            onPress={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            <Icon name="chevron-right" size={24} color={page >= totalPages - 1 ? '#ccc' : '#019ee3'} />
          </TouchableOpacity>
        </View>
        <View style={styles.rowsPerPageContainer}>
          <Text style={styles.rowsPerPageLabel}>Rows per page:</Text>
          <TouchableOpacity
            style={styles.rowsPerPageButton}
            onPress={() => {
              Alert.alert(
                'Rows per page',
                'Select number of rows',
                [
                  { text: '5', onPress: () => { setRowsPerPage(5); setPage(0); } },
                  { text: '10', onPress: () => { setRowsPerPage(10); setPage(0); } },
                  { text: '25', onPress: () => { setRowsPerPage(25); setPage(0); } },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <Text style={styles.rowsPerPageText}>{rowsPerPage}</Text>
            <Icon name="arrow-drop-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && purchases.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
        <Text style={styles.loadingText}>Loading Purchases...</Text>
      </View>
    );
  }

  if (error && purchases.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchPurchases()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Material List</Text>
        {canEdit && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPurchase}
          >
            <Text style={styles.addButtonText}>Add New Purchase</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Material Summary Section */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Material Summary</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {sortedProductGroups.map((group) => (
            <View key={group.name} style={styles.chip}>
              <Text style={styles.chipText}>
                {group.name}: {group.totalQuantity}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Purchases (Product, Invoice, Vendor, Date)"
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
      </View>

      {/* Purchases List */}
      <FlatList
        data={paginatedPurchases}
        renderItem={({ item, index }) => renderPurchase({ item, index })}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={fetchPurchases}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="shopping-cart" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No purchase records found</Text>
          </View>
        }
        contentContainerStyle={paginatedPurchases.length === 0 ? styles.emptyListContent : undefined}
      />

      {/* Pagination */}
      {filteredPurchases.length > 0 && renderPagination()}
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#019ee3',
  },
  chipText: {
    fontSize: 12,
    color: '#019ee3',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
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
  purchaseCard: {
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
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  serialNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  purchaseDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  negativeValue: {
    color: '#FF3B30',
  },
  grossTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#019ee3',
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
  paginationContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    marginBottom: 10,
  },
  paginationButton: {
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  paginationPageText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  rowsPerPageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  rowsPerPageLabel: {
    fontSize: 14,
    color: '#666',
  },
  rowsPerPageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 5,
  },
  rowsPerPageText: {
    fontSize: 14,
    color: '#333',
  },
});

export default PurchaseListScreen;
