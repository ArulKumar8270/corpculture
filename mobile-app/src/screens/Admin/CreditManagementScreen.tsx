import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { getApiBaseUrl } from '../../services/api';

interface Credit {
  _id: string;
  companyId: {
    _id: string;
    companyName: string;
  };
  amount: number;
  creditType: 'Given' | 'Used' | 'Adjusted';
  description?: string;
  createdBy?: {
    name: string;
  };
  createdAt: string;
}

interface Company {
  _id: string;
  companyName: string;
}

const CreditManagementScreen = () => {
  const navigation = useNavigation();
  const { token } = useSelector((state: RootState) => state.auth);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [creditTypeFilter, setCreditTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    companyId: '',
    creditType: '',
    fromDate: '',
    toDate: '',
  });

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [formData, setFormData] = useState({
    companyId: '',
    amount: '',
    description: '',
    creditType: 'Given' as 'Given' | 'Used' | 'Adjusted',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [creditTypeModalVisible, setCreditTypeModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchCompanies();
      fetchCredits();
    }, [token, page, rowsPerPage, appliedFilters])
  );

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const API_BASE_URL = getApiBaseUrl();
      const { data } = await axios.get(
        `${API_BASE_URL}/company/all?limit=1000`,
        {
          headers: { Authorization: token || '' },
          timeout: 30000,
        }
      );
      if (data?.success) {
        setCompanies(data.companies || []);
      }
    } catch (err: any) {
      console.error('Error fetching companies:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch companies',
      });
    } finally {
      setCompaniesLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        companyId: appliedFilters.companyId || '',
        creditType: appliedFilters.creditType || '',
        fromDate: appliedFilters.fromDate || '',
        toDate: appliedFilters.toDate || '',
      }).toString();

      const API_BASE_URL = getApiBaseUrl();
      const { data } = await axios.get(
        `${API_BASE_URL}/credit/all?${queryParams}`,
        {
          headers: { Authorization: token || '' },
          timeout: 30000,
        }
      );

      if (data?.success) {
        setCredits(data.credits || []);
        setTotalCount(data.totalCount || 0);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data?.message || 'Failed to fetch credits',
        });
      }
    } catch (err: any) {
      console.error('Error fetching credits:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch credits',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      companyId: selectedCompanyId,
      creditType: creditTypeFilter,
      fromDate: fromDate,
      toDate: toDate,
    });
    setPage(0);
  };

  const handleClearFilters = () => {
    setSelectedCompanyId('');
    setCreditTypeFilter('');
    setFromDate('');
    setToDate('');
    setAppliedFilters({
      companyId: '',
      creditType: '',
      fromDate: '',
      toDate: '',
    });
    setPage(0);
  };

  const handleOpenModal = (credit: Credit | null = null) => {
    if (credit) {
      setEditingCredit(credit);
      setFormData({
        companyId: credit.companyId._id || credit.companyId as any,
        amount: credit.amount.toString(),
        description: credit.description || '',
        creditType: credit.creditType,
      });
    } else {
      setEditingCredit(null);
      setFormData({
        companyId: '',
        amount: '',
        description: '',
        creditType: 'Given',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCredit(null);
    setFormData({
      companyId: '',
      amount: '',
      description: '',
      creditType: 'Given',
    });
  };

  const handleSubmit = async () => {
    if (!formData.companyId || !formData.amount) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a company and enter an amount',
      });
      return;
    }

    if (isNaN(Number(formData.amount)) || Number(formData.amount) < 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Amount must be a positive number',
      });
      return;
    }

    setFormLoading(true);
    try {
      if (editingCredit) {
        await axios.put(
          `${getApiBaseUrl()}/credit/update/${editingCredit._id}`,
          {
            amount: parseFloat(formData.amount),
            description: formData.description,
            creditType: formData.creditType,
          },
          { headers: { Authorization: token || '' } }
        );
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Credit updated successfully',
        });
      } else {
        await axios.post(
          `${getApiBaseUrl()}/credit/create`,
          formData,
          { headers: { Authorization: token || '' } }
        );
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Credit added successfully',
        });
      }
      handleCloseModal();
      fetchCredits();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || (editingCredit ? 'Failed to update credit' : 'Failed to add credit'),
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (creditId: string) => {
    Alert.alert(
      'Delete Credit',
      'Are you sure you want to delete this credit entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${getApiBaseUrl()}/credit/delete/${creditId}`, {
                headers: { Authorization: token || '' },
              });
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Credit deleted successfully',
              });
              fetchCredits();
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.response?.data?.message || 'Failed to delete credit',
              });
            }
          },
        },
      ]
    );
  };

  const getCreditTypeColor = (type: string) => {
    switch (type) {
      case 'Given':
        return '#28a745';
      case 'Used':
        return '#dc3545';
      case 'Adjusted':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const selectedCompany = companies.find((c) => c._id === formData.companyId);

  const renderCredit = ({ item }: { item: Credit }) => (
    <View style={styles.creditCard}>
      <View style={styles.creditHeader}>
        <View style={styles.creditInfo}>
          <Text style={styles.companyName}>{item.companyId?.companyName || 'N/A'}</Text>
          <Text style={styles.creditDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.creditTypeBadge, { backgroundColor: `${getCreditTypeColor(item.creditType)}20` }]}>
          <Text style={[styles.creditTypeText, { color: getCreditTypeColor(item.creditType) }]}>
            {item.creditType}
          </Text>
        </View>
      </View>
      <View style={styles.creditDetails}>
        <Text style={styles.amountText}>₹ {item.amount.toLocaleString('en-IN')}</Text>
        {item.description && (
          <Text style={styles.descriptionText}>{item.description}</Text>
        )}
        {item.createdBy && (
          <Text style={styles.createdByText}>Created by: {item.createdBy.name}</Text>
        )}
      </View>
      <View style={styles.creditActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleOpenModal(item)}
        >
          <Icon name="edit" size={18} color="#019ee3" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item._id)}
        >
          <Icon name="delete" size={18} color="#dc3545" />
          <Text style={[styles.actionButtonText, { color: '#dc3545' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && credits.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Credit Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Credit</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      <ScrollView style={styles.filterSection} nestedScrollEnabled>
        <Text style={styles.filterTitle}>Filters</Text>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Company</Text>
          <TouchableOpacity
            style={styles.filterInput}
            onPress={() => setCompanyModalVisible(true)}
          >
            <Text style={selectedCompanyId ? styles.filterInputText : styles.filterPlaceholder}>
              {selectedCompanyId
                ? companies.find((c) => c._id === selectedCompanyId)?.companyName || 'Select Company'
                : 'All Companies'}
            </Text>
            <Icon name="arrow-drop-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Credit Type</Text>
          <TouchableOpacity
            style={styles.filterInput}
            onPress={() => setCreditTypeModalVisible(true)}
          >
            <Text style={creditTypeFilter ? styles.filterInputText : styles.filterPlaceholder}>
              {creditTypeFilter || 'All Types'}
            </Text>
            <Icon name="arrow-drop-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>From Date</Text>
          <TextInput
            style={styles.filterInput}
            value={fromDate}
            onChangeText={setFromDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>To Date</Text>
          <TextInput
            style={styles.filterInput}
            value={toDate}
            onChangeText={setToDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
            <Text style={styles.applyButtonText}>Apply Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Credits List */}
      <FlatList
        data={credits}
        renderItem={renderCredit}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchCredits}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-balance-wallet" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No credits found</Text>
          </View>
        }
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.paginationButton, page === 0 && styles.paginationButtonDisabled]}
            onPress={() => setPage(page - 1)}
            disabled={page === 0}
          >
            <Icon name="chevron-left" size={24} color={page === 0 ? '#ccc' : '#019ee3'} />
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Page {page + 1} of {Math.ceil(totalCount / rowsPerPage)}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              page >= Math.ceil(totalCount / rowsPerPage) - 1 && styles.paginationButtonDisabled,
            ]}
            onPress={() => setPage(page + 1)}
            disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
          >
            <Icon
              name="chevron-right"
              size={24}
              color={page >= Math.ceil(totalCount / rowsPerPage) - 1 ? '#ccc' : '#019ee3'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Add/Edit Credit Modal */}
      <Modal
        visible={modalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCredit ? 'Edit Credit' : 'Add New Credit'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.formLabel}>Company *</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => {
                  setCompanyModalVisible(true);
                }}
                disabled={!!editingCredit || companiesLoading}
              >
                <Text style={selectedCompany ? styles.formInputText : styles.formPlaceholder}>
                  {selectedCompany?.companyName || 'Select Company'}
                </Text>
                <Icon name="arrow-drop-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.formLabel}>Amount (₹) *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text.replace(/[^0-9.]/g, '') })}
                placeholder="Enter amount"
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>Credit Type</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setCreditTypeModalVisible(true)}
              >
                <Text style={styles.formInputText}>{formData.creditType}</Text>
                <Icon name="arrow-drop-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCloseModal}
                disabled={formLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, formLoading && styles.modalSubmitButtonDisabled]}
                onPress={handleSubmit}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {editingCredit ? 'Update' : 'Add'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Company Picker Modal */}
      <Modal
        visible={companyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCompanyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCompanyModalVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Company</Text>
            {companiesLoading ? (
              <ActivityIndicator size="large" color="#019ee3" />
            ) : (
              <FlatList
                data={companies}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => {
                      if (modalOpen) {
                        setFormData({ ...formData, companyId: item._id });
                      } else {
                        setSelectedCompanyId(item._id);
                      }
                      setCompanyModalVisible(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{item.companyName}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyPicker}>
                    <Text style={styles.emptyPickerText}>No companies available</Text>
                  </View>
                }
              />
            )}
            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setCompanyModalVisible(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Credit Type Picker Modal */}
      <Modal
        visible={creditTypeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreditTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCreditTypeModalVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Credit Type</Text>
            <FlatList
              data={['Given', 'Used', 'Adjusted']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    if (modalOpen) {
                      setFormData({ ...formData, creditType: item as any });
                    } else {
                      setCreditTypeFilter(item);
                    }
                    setCreditTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setCreditTypeModalVisible(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#019ee3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    maxHeight: 300,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#019ee3',
    marginBottom: 15,
  },
  filterRow: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterInputText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  filterPlaceholder: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#019ee3',
    padding: 12,
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
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
    paddingTop: 0,
  },
  creditCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  creditInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  creditDate: {
    fontSize: 12,
    color: '#666',
  },
  creditTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  creditTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  creditDetails: {
    marginBottom: 12,
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#019ee3',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  createdByText: {
    fontSize: 12,
    color: '#999',
  },
  creditActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 5,
  },
  editButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#019ee3',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#019ee3',
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 15,
  },
  paginationButton: {
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  modalBody: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formInputText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  formPlaceholder: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    padding: 20,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#019ee3',
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
  emptyPicker: {
    padding: 20,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 14,
    color: '#999',
  },
  pickerCancelButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default CreditManagementScreen;
