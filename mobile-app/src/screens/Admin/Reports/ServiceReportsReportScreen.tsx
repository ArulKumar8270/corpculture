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

const ServiceReportsReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [companyNameFilter, setCompanyNameFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [reportTypePickerVisible, setReportTypePickerVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchServiceReports();
    }, [token, page, rowsPerPage])
  );

  const fetchServiceReports = async (
    from = fromDate,
    to = toDate,
    companyName = companyNameFilter,
    assignedTo = assignedToFilter,
    reportType = reportTypeFilter,
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
        assignedTo: assignedTo,
        reportType: reportType,
        page: (currentPage + 1).toString(),
        limit: currentRowsPerPage.toString(),
      }).toString();

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/report/service?${queryParams}`,
        {
          headers: { Authorization: token || '' },
        }
      );

      if (response.data.success) {
        setReports(response.data.reports || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.data.message || 'Failed to fetch service reports.');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data.message || 'Failed to fetch service reports.',
        });
      }
    } catch (err: any) {
      console.error('Error fetching service reports:', err);
      setError(err.response?.data?.message || 'Error fetching service reports.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Error fetching service reports.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(0);
    setFilterModalVisible(false);
    fetchServiceReports(fromDate, toDate, companyNameFilter, assignedToFilter, reportTypeFilter, 0, rowsPerPage);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    setCompanyNameFilter('');
    setAssignedToFilter('');
    setReportTypeFilter('');
    setPage(0);
    setRowsPerPage(10);
    fetchServiceReports('', '', '', '', '', 0, 10);
    setFilterModalVisible(false);
  };

  const handleExportExcel = async () => {
    if (reports.length === 0) {
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
      const dataToExport = reports.map((report) => ({
        'Report ID': report._id || 'N/A',
        'Company Name': report.company?.companyName || 'N/A',
        'Report Type': report.reportType || 'N/A',
        'Problem Report': report.problemReport || 'N/A',
        'Assigned To': report.assignedTo?.name || 'N/A',
        'Created Date': new Date(report.createdAt).toLocaleDateString(),
        'Model No': report.modelNo || 'N/A',
        'Serial No': report.serialNo || 'N/A',
        'Branch': report.branch || 'N/A',
        'Reference': report.reference || 'N/A',
        'Usage Data': report.usageData || 'N/A',
        'Description': report.description || 'N/A',
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Service Reports');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const fileName = `service_reports_report_${Date.now()}.xlsx`;
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

  const renderReport = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportId}>#{item._id?.substring(0, 8) || 'N/A'}</Text>
          <View style={styles.reportTypeBadge}>
            <Text style={styles.reportTypeText}>{item.reportType || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.reportDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Company Name:</Text>
            <Text style={styles.detailValue}>{item.company?.companyName || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Problem Report:</Text>
            <Text style={styles.detailValue}>{item.problemReport || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned To:</Text>
            <Text style={styles.detailValue}>
              {item.assignedTo?.name || 'N/A'}
            </Text>
          </View>
          {item.modelNo && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Model No:</Text>
              <Text style={styles.detailValue}>{item.modelNo}</Text>
            </View>
          )}
          {item.serialNo && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Serial No:</Text>
              <Text style={styles.detailValue}>{item.serialNo}</Text>
            </View>
          )}
          {item.branch && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Branch:</Text>
              <Text style={styles.detailValue}>{item.branch}</Text>
            </View>
          )}
          {item.reference && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference:</Text>
              <Text style={styles.detailValue}>{item.reference}</Text>
            </View>
          )}
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

  if (loading && reports.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (error && reports.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchServiceReports()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Service Reports</Text>
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
          Total: {totalCount} report{totalCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Reports List */}
      <FlatList
        data={reports}
        renderItem={({ item, index }) => renderReport({ item, index })}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => fetchServiceReports()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="description" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No service reports found</Text>
          </View>
        }
        contentContainerStyle={reports.length === 0 ? styles.emptyListContent : undefined}
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
              <Text style={styles.filterLabel}>Assigned To</Text>
              <TextInput
                style={styles.filterInput}
                value={assignedToFilter}
                onChangeText={setAssignedToFilter}
                placeholder="Enter assigned to"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.filterInputGroup}>
              <Text style={styles.filterLabel}>Report Type</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setReportTypePickerVisible(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {reportTypeFilter || '--select Report Type--'}
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

      {/* Report Type Picker Modal */}
      <Modal
        visible={reportTypePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportTypePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setReportTypePickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Report Type</Text>
            <FlatList
              data={[
                { value: '', label: 'All' },
                { value: 'Service Report', label: 'Service Report' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setReportTypeFilter(item.value);
                    setReportTypePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setReportTypePickerVisible(false)}
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
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reportId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reportTypeBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  reportTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  reportDetails: {
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

export default ServiceReportsReportScreen;
