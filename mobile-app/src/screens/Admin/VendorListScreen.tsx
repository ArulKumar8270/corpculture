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

  const renderVendor = ({ item, index }: { item: any; index: number }) => {
    const canEdit = hasPermission('vendorList', 'edit') || user?.role === 1;

    return (
      <View style={styles.vendorCard}>
        <View style={styles.vendorInfo}>
          <View style={styles.vendorHeader}>
            <Text style={styles.vendorName}>{item.companyName || 'N/A'}</Text>
            <Text style={styles.serialNumber}>#{index + 1}</Text>
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
          data={filteredVendors}
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
          contentContainerStyle={filteredVendors.length === 0 ? styles.emptyListContent : undefined}
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
});

export default VendorListScreen;
