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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../../services/api';
import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
// @ts-ignore - xlsx may need to be installed: npm install xlsx
let XLSX: any;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('xlsx library not found. Excel export will not work. Install with: npm install xlsx');
}

const ServiceEnquiriesReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const reportType = params?.type || 'service';

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [companyNameFilter, setCompanyNameFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [serviceTypePickerVisible, setServiceTypePickerVisible] = useState(false);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchServiceEnquiries();
    }, [token, page, rowsPerPage])
  );

  const fetchServiceEnquiries = async (
    from = fromDate,
    to = toDate,
    companyName = companyNameFilter,
    serviceType = serviceTypeFilter,
    status = statusFilter,
    currentPage = page,
    currentRowsPerPage = rowsPerPage
  ) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        fromDate: from,
        toDate: to,
        companyName: companyName,
        serviceType: serviceType,
        status: status,
        page: (currentPage + 1).toString(),
        limit: currentRowsPerPage.toString(),
      }).toString();

      const { data } = await axios.get(
        `${getApiBaseUrl()}/${reportType}/all?${queryParams}`,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );

      if (data.success) {
        setEnquiries(data.services || data?.rental || []);
        setTotalCount(data.totalCount || 0);
      } else {
        setError(data.message || 'Failed to fetch service enquiries.');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Failed to fetch service enquiries.',
        });
      }
    } catch (err: any) {
      console.error('Error fetching service enquiries:', err);
      setError(err.response?.data?.message || 'Error fetching service enquiries.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Error fetching service enquiries.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(0);
    setFilterModalVisible(false);
    fetchServiceEnquiries(fromDate, toDate, companyNameFilter, serviceTypeFilter, statusFilter, 0, rowsPerPage);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    setCompanyNameFilter('');
    setServiceTypeFilter('');
    setStatusFilter('');
    setPage(0);
    setRowsPerPage(10);
    fetchServiceEnquiries('', '', '', '', '', 0, 10);
    setFilterModalVisible(false);
  };

  const handleExportExcel = async () => {
    if (enquiries.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No data to export.',
      });
      return;
    }

    if (!XLSX) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Excel export requires xlsx library. Please install: npm install xlsx',
      });
      return;
    }

    try {
      setExporting(true);
      const dataToExport = enquiries.map((enquiry) => ({
        'Enquiry ID': enquiry._id || 'N/A',
        'Company Name': enquiry.companyName || 'N/A',
        'Phone': enquiry.phone || 'N/A',
        'Service Type': enquiry.serviceTitle || 'N/A',
        'Complaint': enquiry.complaint || 'N/A',
        'Status': enquiry.status || 'N/A',
        'Contact Person': enquiry.contactPerson || 'N/A',
        'Email': enquiry.email || 'N/A',
        'Location': enquiry.location || 'N/A',
        'Created Date': new Date(enquiry.createdAt).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Service Enquiries');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const fileName = `service_enquiries_report_${Date.now()}.xlsx`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, btoa(String.fromCharCode(...excelBuffer)), {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Exported to Excel successfully!',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Sharing is not available on this device.',
        });
      }
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to export to Excel.',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const renderEnquiry = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={styles.enquiryCard}>
        <View style={styles.enquiryHeader}>
          <Text style={styles.enquiryId}>#{item._id?.substring(0, 8) || 'N/A'}</Text>
          <View style={[styles.statusBadge, getStatusColor(item.status)]}>
            <Text style={styles.statusText}>{item.status || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.enquiryDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Company Name:</Text>
            <Text style={styles.detailValue}>{item.companyName || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{item.phone || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Type:</Text>
            <Text style={styles.detailValue}>{item.serviceTitle || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Complaint:</Text>
            <Text style={styles.detailValue}>{item.complaint || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact Person:</Text>
            <Text style={styles.detailValue}>{item.contactPerson || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{item.email || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.location || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return { backgroundColor: '#d4edda', borderColor: '#28a745' };
      case 'Pending':
        return { backgroundColor: '#fff3cd', borderColor: '#ffc107' };
      case 'Cancelled':
        return { backgroundColor: '#f8d7da', borderColor: '#dc3545' };
      default:
        return { backgroundColor: '#e9ecef', borderColor: '#6c757d' };
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    const startItem = page * rowsPerPage + 1;
    const endItem = Math.min((page + 1) * rowsPerPage, totalCount);

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationText}>
          Showing {startItem}-{endItem} of {totalCount}
        </Text>
        <View style={styles.paginationButtons}>
          <TouchableOpacity
            style={[styles.paginationButton, page === 0 && styles.paginationButtonDisabled]}
            onPress={() => handleChangePage(page - 1)}
            disabled={page === 0}
          >
            <Icon name="chevron-left" size={24} color={page === 0 ? '#ccc' : '#007AFF'} />
          </TouchableOpacity>
          <Text style={styles.paginationPageText}>
            Page {page + 1} of {totalPages || 1}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              page >= totalPages - 1 && styles.paginationButtonDisabled,
            ]}
            onPress={() => handleChangePage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            <Icon name="chevron-right" size={24} color={page >= totalPages - 1 ? '#ccc' : '#007AFF'} />
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
                  { text: '5', onPress: () => handleChangeRowsPerPage(5) },
                  { text: '10', onPress: () => handleChangeRowsPerPage(10) },
                  { text: '25', onPress: () => handleChangeRowsPerPage(25) },
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

  if (loading && enquiries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (error && enquiries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchServiceEnquiries()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Service Enquiries Report</Text>
      </View>

      {/* Filter and Export Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Icon name="filter-list" size={20} color="#007AFF" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={handleExportExcel}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="file-download" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>Export Excel</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsCount}>
        <Text style={styles.resultsCountText}>
          Total: {totalCount} enquir{totalCount !== 1 ? 'ies' : 'y'}
        </Text>
      </View>

      {/* Enquiries List */}
      <FlatList
        data={enquiries}
        renderItem={({ item, index }) => renderEnquiry({ item, index })}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => fetchServiceEnquiries()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No service enquiries found</Text>
          </View>
        }
        contentContainerStyle={enquiries.length === 0 ? styles.emptyListContent : undefined}
      />

      {/* Pagination */}
      {totalCount > 0 && renderPagination()}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Filter Options</Text>

            <View style={styles.filterInputGroup}>
              <Text style={styles.filterLabel}>From Date</Text>
              <TextInput
                style={styles.filterInput}
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.filterInputGroup}>
              <Text style={styles.filterLabel}>To Date</Text>
              <TextInput
                style={styles.filterInput}
                value={toDate}
                onChangeText={setToDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.filterInputGroup}>
              <Text style={styles.filterLabel}>Company Name</Text>
              <TextInput
                style={styles.filterInput}
                value={companyNameFilter}
                onChangeText={setCompanyNameFilter}
                placeholder="Enter company name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.filterInputGroup}>
              <Text style={styles.filterLabel}>Service Type</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setServiceTypePickerVisible(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {serviceTypeFilter || '--select Service Type--'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterInputGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setStatusPickerVisible(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {statusFilter || '--select Status--'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalClearButton]}
                onPress={handleClearFilter}
              >
                <Text style={styles.modalClearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalApplyButton]}
                onPress={handleFilter}
              >
                <Text style={styles.modalApplyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

      {/* Service Type Picker Modal */}
      <Modal
        visible={serviceTypePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setServiceTypePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setServiceTypePickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Service Type</Text>
            <FlatList
              data={[
                { value: '', label: 'All' },
                { value: 'AC Service', label: 'AC Service' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setServiceTypeFilter(item.value);
                    setServiceTypePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setServiceTypePickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Picker Modal */}
      <Modal
        visible={statusPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Status</Text>
            <FlatList
              data={[
                { value: '', label: 'All' },
                { value: 'Pending', label: 'Pending' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setStatusFilter(item.value);
                    setStatusPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setStatusPickerVisible(false)}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  filterButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  resultsCount: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsCountText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  enquiryCard: {
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
  enquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  enquiryId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  enquiryDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  modalContentContainer: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#019ee3',
  },
  filterInputGroup: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalClearButton: {
    backgroundColor: '#e0e0e0',
  },
  modalApplyButton: {
    backgroundColor: '#019ee3',
  },
  modalClearButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  modalApplyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
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
  modalButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default ServiceEnquiriesReportScreen;
