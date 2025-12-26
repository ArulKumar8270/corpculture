import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
import { getApiBaseUrl } from '../../services/api';

const CompanyListScreen = () => {
  const navigation = useNavigation();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // Input value for search
  const [appliedSearch, setAppliedSearch] = useState(''); // Applied search filter
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (token) {
      fetchCompanies();
    }
  }, [token, page, rowsPerPage, appliedSearch]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(), // Backend expects 1-indexed page
        limit: rowsPerPage.toString(),
        search: appliedSearch || '',
      }).toString();

      const API_BASE_URL = getApiBaseUrl();
      const response = await axios.get(
        `${API_BASE_URL}/company/all?${queryParams}`,
        {
          headers: { Authorization: token || '' },
          timeout: 30000,
        }
      );
      if (response.data?.success) {
        setCompanies(response.data.companies || []);
        setTotalCount(response.data.totalCount || 0);
        setError(null);
      } else {
        setError(response.data?.message || 'Failed to fetch companies.');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch companies.',
        });
      }
    } catch (err: any) {
      console.error('Error fetching companies:', err);
      setError('Something went wrong while fetching companies.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching companies.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
  };

  const handleApplyFilter = () => {
    setAppliedSearch(searchQuery);
    setPage(0); // Reset to first page when applying filters
  };

  const handleClearFilter = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setPage(0); // Reset to first page when clearing filters
  };

  const renderCompany = ({ item }: { item: any }) => {
    return (
      <View style={styles.companyCard}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{item.companyName || 'N/A'}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Billing Address:</Text>
            <Text style={styles.detailValue}>{item.billingAddress || 'N/A'}</Text>
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
            <Text style={styles.detailLabel}>Pincode:</Text>
            <Text style={styles.detailValue}>{item.pincode || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GST No:</Text>
            <Text style={styles.detailValue}>{item.gstNo || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact Person:</Text>
            <Text style={styles.detailValue}>
              {item.contactPersons?.[0]?.name || item.contactPerson || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Company Mobile:</Text>
            <Text style={styles.detailValue}>
              {item.phone || item.contactPersons?.[0]?.mobile || 'N/A'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (navigation as any).navigate('AddCompany', { companyId: item._id })}
        >
          <Icon name="edit" size={18} color="#fff" style={{ marginRight: 5 }} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const canAdd = hasPermission('reportsCompanyList', 'edit') || user?.role === 1;

  if (loading && companies.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (error && companies.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchCompanies()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Company List</Text>
        {canAdd && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => (navigation as any).navigate('AddCompany')}
          >
            <Text style={styles.addButtonText}>Add New Company</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filters</Text>
        <View style={styles.filterInputContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.filterInput}
            placeholder="Search by company name, pincode, GST, address, city, state, or contact"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
            onSubmitEditing={handleApplyFilter}
          />
        </View>
        <View style={styles.filterButtons}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilter}>
            <Text style={styles.applyButtonText}>Apply Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilter}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={companies}
        renderItem={renderCompany}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={fetchCompanies}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="business" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No companies found</Text>
          </View>
        }
        contentContainerStyle={companies.length === 0 ? styles.emptyListContent : undefined}
      />

      {/* Pagination Controls */}
      {companies.length > 0 && (
        <View style={styles.paginationContainer}>
          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount}
            </Text>
          </View>
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 0 && styles.paginationButtonDisabled]}
              onPress={() => handleChangePage(page - 1)}
              disabled={page === 0}
            >
              <Icon name="chevron-left" size={24} color={page === 0 ? '#ccc' : '#019ee3'} />
            </TouchableOpacity>
            <Text style={styles.paginationPageText}>
              Page {page + 1} of {Math.ceil(totalCount / rowsPerPage) || 1}
            </Text>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                (page + 1) * rowsPerPage >= totalCount && styles.paginationButtonDisabled,
              ]}
              onPress={() => handleChangePage(page + 1)}
              disabled={(page + 1) * rowsPerPage >= totalCount}
            >
              <Icon
                name="chevron-right"
                size={24}
                color={(page + 1) * rowsPerPage >= totalCount ? '#ccc' : '#019ee3'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.rowsPerPageContainer}>
            <Text style={styles.rowsPerPageLabel}>Rows per page:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[5, 10, 25, 50].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.rowsPerPageOption,
                    rowsPerPage === option && styles.rowsPerPageOptionSelected,
                  ]}
                  onPress={() => handleChangeRowsPerPage(option)}
                >
                  <Text
                    style={[
                      styles.rowsPerPageOptionText,
                      rowsPerPage === option && styles.rowsPerPageOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
    backgroundColor: '#f5f5f5',
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
  filterSection: {
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
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#019ee3',
    marginBottom: 15,
  },
  filterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  filterInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#019ee3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  paginationContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationInfo: {
    marginBottom: 10,
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  paginationButton: {
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationPageText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    minWidth: 100,
    textAlign: 'center',
  },
  rowsPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  rowsPerPageLabel: {
    fontSize: 14,
    color: '#666',
  },
  rowsPerPageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  rowsPerPageOptionSelected: {
    backgroundColor: '#019ee3',
    borderColor: '#019ee3',
  },
  rowsPerPageOptionText: {
    fontSize: 14,
    color: '#666',
  },
  rowsPerPageOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  companyCard: {
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
  companyInfo: {
    marginBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  editButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
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

export default CompanyListScreen;
