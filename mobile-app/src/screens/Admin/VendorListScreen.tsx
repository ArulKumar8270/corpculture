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
  Platform,
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

const VendorListScreen = () => {
  const navigation = useNavigation();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];
  const LIST_BOTTOM_PADDING = Platform.OS === 'ios' ? 140 : 120;

  useFocusEffect(
    useCallback(() => {
      fetchVendors();
    }, [token])
  );

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/vendors`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success && response.data.vendors.length > 0) {
        setVendors(response.data.vendors);
      } else {
        setVendors([]);
        if (response.data?.message) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: response.data.message,
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching vendors.',
      });
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = () => {
    navigation.navigate('VendorCreate' as never);
  };

  const handleEdit = (vendorId: string) => {
    navigation.navigate('VendorCreate' as never, { vendor_id: vendorId } as never);
  };

  const handleDelete = async (vendorId: string) => {
    Alert.alert(
      'Delete Vendor',
      'Are you sure you want to delete this vendor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${getApiBaseUrl()}/vendors/${vendorId}`,
                {
                  headers: { Authorization: token || '' },
                }
              );
              if (response.data?.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: response.data.message || 'Vendor deleted successfully!',
                });
                fetchVendors();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: response.data?.message || 'Failed to delete vendor.',
                });
              }
            } catch (error: any) {
              console.error('Error deleting vendor:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong while deleting the vendor.',
              });
            }
          },
        },
      ]
    );
  };

  const filteredVendors = vendors.filter((vendor) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const companyName = vendor.companyName?.toLowerCase() || '';
    const mobileNumber = vendor.mobileNumber?.toLowerCase() || '';
    const personName = vendor.personName?.toLowerCase() || '';
    const mailId = vendor.mailId?.toLowerCase() || '';

    return (
      companyName.includes(lowerCaseSearchTerm) ||
      mobileNumber.includes(lowerCaseSearchTerm) ||
      personName.includes(lowerCaseSearchTerm) ||
      mailId.includes(lowerCaseSearchTerm)
    );
  });

  const paginatedVendors = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredVendors.slice(start, start + rowsPerPage);
  }, [filteredVendors, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
  }, [rowsPerPage]);

  const renderVendor = ({ item, index }: { item: any; index: number }) => {
    const canEdit = hasPermission('vendorList', 'edit') || user?.role === 1;

    return (
      <View style={styles.vendorCard}>
        <View style={styles.vendorInfo}>
          <View style={styles.vendorHeader}>
            <Text style={styles.vendorName}>{item.companyName || 'N/A'}</Text>
            <Text style={styles.serialNumber}>#{page * rowsPerPage + index + 1}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>City:</Text>
            <Text style={styles.detailValue}>{item.city || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>State:</Text>
            <Text style={styles.detailValue}>{item.state || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile:</Text>
            <Text style={styles.detailValue}>{item.mobileNumber || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{item.mailId || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Person:</Text>
            <Text style={styles.detailValue}>{item.personName || 'N/A'}</Text>
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

  const canAdd = hasPermission('vendorList', 'edit') || user?.role === 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendor List</Text>
        {canAdd && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddVendor}
          >
            <Text style={styles.addButtonText}>Add New Vendor</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Company, Mobile, Person Name, or Mail ID"
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
          data={paginatedVendors}
          renderItem={({ item, index }) => renderVendor({ item, index })}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchVendors}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="business" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No vendors found</Text>
            </View>
          }
          contentContainerStyle={[
            paginatedVendors.length === 0 ? styles.emptyListContent : null,
            { paddingBottom: LIST_BOTTOM_PADDING },
          ]}
          ListFooterComponent={
            <View style={styles.paginationWrapper}>
              {filteredVendors.length > 0 && (
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
              {filteredVendors.length > rowsPerPage ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                    onPress={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <Text style={styles.pageBtnText}>Previous</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageInfo}>
                    Page {page + 1} of {Math.max(1, Math.ceil(filteredVendors.length / rowsPerPage))}
                  </Text>
                  <TouchableOpacity
                    style={[styles.pageBtn, page >= Math.ceil(filteredVendors.length / rowsPerPage) - 1 && styles.pageBtnDisabled]}
                    onPress={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(filteredVendors.length / rowsPerPage) - 1}
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
  vendorCard: {
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
  vendorInfo: {
    marginBottom: 10,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vendorName: {
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
    width: 80,
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
  paginationWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    // Keep pagination fully tappable above bottom navigation / system UI
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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

export default VendorListScreen;
