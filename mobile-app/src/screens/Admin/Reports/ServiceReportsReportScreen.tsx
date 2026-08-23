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
import { useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../../services/api';
import Toast from 'react-native-toast-message';
import ReportPagination from '../../../components/ReportPagination';
import { collectReportSerialNumbers } from '../../../utils/reportSerialNumbers';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// @ts-ignore - xlsx may need to be installed: npm install xlsx
let XLSX: any;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('xlsx library not found. Excel export will not work. Install with: npm install xlsx');
}

const ServiceReportsReportScreen = () => {
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const routeParams = (route.params as { type?: string; serialNo?: string; companyId?: string }) || {};
  const reportScope = routeParams.type === 'rental' ? 'rental' : 'service';
  const pageTitle = reportScope === 'rental' ? 'Rental Reports' : 'Service Reports';

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [companyNameFilter, setCompanyNameFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [serialNoFilter, setSerialNoFilter] = useState(routeParams.serialNo || '');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const initialSerial = routeParams.serialNo || '';
      if (initialSerial && initialSerial !== serialNoFilter) {
        setSerialNoFilter(initialSerial);
        fetchServiceReports(fromDate, toDate, companyNameFilter, assignedToFilter, initialSerial, page, rowsPerPage);
      } else {
        fetchServiceReports();
      }
    }, [token, page, rowsPerPage, reportScope])
  );

  const fetchServiceReports = async (
    from = fromDate,
    to = toDate,
    companyName = companyNameFilter,
    assignedTo = assignedToFilter,
    serialNo = serialNoFilter,
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
        serialNo: serialNo,
        page: (currentPage + 1).toString(),
        limit: currentRowsPerPage.toString(),
      }).toString();

      const response = await axios.get(
        `${getApiBaseUrl()}/report/${reportScope}?${queryParams}`,
        {
          headers: { Authorization: token || '' },
        }
      );

      if (response.data.success) {
        setReports(response.data.reports || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.data.message || `Failed to fetch ${pageTitle.toLowerCase()}.`);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data.message || `Failed to fetch ${pageTitle.toLowerCase()}.`,
        });
      }
    } catch (err: any) {
      console.error(`Error fetching ${pageTitle.toLowerCase()}:`, err);
      setError(err.response?.data?.message || `Error fetching ${pageTitle.toLowerCase()}.`);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || `Error fetching ${pageTitle.toLowerCase()}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(0);
    fetchServiceReports(fromDate, toDate, companyNameFilter, assignedToFilter, serialNoFilter, 0, rowsPerPage);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    setCompanyNameFilter('');
    setAssignedToFilter('');
    setSerialNoFilter('');
    setPage(0);
    setRowsPerPage(10);
    fetchServiceReports('', '', '', '', '', 0, 10);
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
        'Serial No': collectReportSerialNumbers(report),
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
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serial No:</Text>
            <Text style={styles.detailValue}>{collectReportSerialNumbers(item)}</Text>
          </View>
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

  const renderPagination = () => (
    <ReportPagination
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
    />
  );

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
        <Text style={styles.headerTitle}>{pageTitle}</Text>
      </View>

      <TouchableOpacity
        style={styles.filterHeader}
        onPress={() => setFiltersExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View>
          <Text style={styles.filterTitle}>Filters</Text>
          {!filtersExpanded ? (
            <Text style={styles.filterSummary} numberOfLines={1}>
              {[fromDate && `From ${fromDate}`, toDate && `To ${toDate}`, companyNameFilter, assignedToFilter, serialNoFilter && `S/N ${serialNoFilter}`]
                .filter(Boolean)
                .join(' · ') || 'No filters applied'}
            </Text>
          ) : null}
        </View>
        <Icon
          name={filtersExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color="#019ee3"
        />
      </TouchableOpacity>

      {filtersExpanded ? (
      <ScrollView style={styles.filterSection} nestedScrollEnabled>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>From Date</Text>
          <TextInput
            style={styles.filterTextInput}
            value={fromDate}
            onChangeText={setFromDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>To Date</Text>
          <TextInput
            style={styles.filterTextInput}
            value={toDate}
            onChangeText={setToDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Company Name</Text>
          <TextInput
            style={styles.filterTextInput}
            value={companyNameFilter}
            onChangeText={setCompanyNameFilter}
            placeholder="Company Name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Assigned To</Text>
          <TextInput
            style={styles.filterTextInput}
            value={assignedToFilter}
            onChangeText={setAssignedToFilter}
            placeholder="Assigned To"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Serial No</Text>
          <TextInput
            style={styles.filterTextInput}
            value={serialNoFilter}
            onChangeText={setSerialNoFilter}
            placeholder="Search by serial no"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.applyButton} onPress={handleFilter}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilter}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      ) : null}

      <View style={styles.actionBar}>
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
        style={styles.list}
        data={reports}
        renderItem={({ item, index }) => renderReport({ item, index })}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => fetchServiceReports()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="description" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No {pageTitle.toLowerCase()} found</Text>
          </View>
        }
        contentContainerStyle={reports.length === 0 ? styles.emptyListContent : undefined}
      />

      {/* Pagination */}
      {totalCount > 0 && renderPagination()}
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
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginHorizontal: 15,
    maxHeight: 320,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  filterHeader: {
    marginHorizontal: 15,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterSummary: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
    maxWidth: 280,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  filterTextInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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
    fontSize: 14,
    fontWeight: '700',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#019ee3',
  },
  clearButtonText: {
    color: '#019ee3',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  list: {
    flex: 1,
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
