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
import { openSignedCopyDownload } from '../../../utils/functions';
import ReportPagination from '../../../components/ReportPagination';
import {
  buildRentalInvoiceGstrWorksheet,
  excelBufferToBase64,
} from '../../../utils/gstrExport';
import {
  openRentalInvoicePdf,
  openPaymentCopyPdf,
} from '../../../utils/invoiceDownload';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// @ts-ignore - xlsx may need to be installed: npm install xlsx
let XLSX: any;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('xlsx library not found. Excel export will not work. Install with: npm install xlsx');
}

const RentalInvoiceReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const reportType = params?.type || 'invoice';
  const filterCompanyId = params?.companyId;

  const [rentalInvoices, setRentalInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [companyNameFilter, setCompanyNameFilter] = useState('');
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [paymentStatusPickerVisible, setPaymentStatusPickerVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRentalInvoices();
    }, [token, page, rowsPerPage])
  );

  const fetchRentalInvoices = async (
    from = fromDate,
    to = toDate,
    companyName = companyNameFilter,
    invoiceNumber = invoiceNumberFilter,
    paymentStatus = paymentStatusFilter,
    currentPage = page,
    currentRowsPerPage = rowsPerPage
  ) => {
    setLoading(true);
    setError(null);
    try {
      const requestBody = {
        invoiceType: reportType,
        fromDate: from,
        toDate: to,
        ...(filterCompanyId ? { companyId: filterCompanyId } : {}),
        companyName: companyName,
        invoiceNumber: invoiceNumber,
        paymentStatus: paymentStatus,
        page: currentPage + 1,
        limit: currentRowsPerPage,
      };

      const response = await axios.post(
        `${getApiBaseUrl()}/rental-payment/all/`,
        requestBody,
        {
          headers: { Authorization: token || '' },
        }
      );

      if (response.data.success) {
        setRentalInvoices(response.data.entries || []);
        setTotalCount(response.data.totalCount || response.data.entries?.length || 0);
      } else {
        setError(response.data.message || 'Failed to fetch rental invoices.');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data.message || 'Failed to fetch rental invoices.',
        });
      }
    } catch (err: any) {
      console.error('Error fetching rental invoices:', err);
      setError(err.response?.data?.message || 'Error fetching rental invoices.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Error fetching rental invoices.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(0);
    setFilterModalVisible(false);
    fetchRentalInvoices(fromDate, toDate, companyNameFilter, invoiceNumberFilter, paymentStatusFilter, 0, rowsPerPage);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    setCompanyNameFilter('');
    setInvoiceNumberFilter('');
    setPaymentStatusFilter('');
    setPage(0);
    setRowsPerPage(10);
    fetchRentalInvoices('', '', '', '', '', 0, 10);
    setFilterModalVisible(false);
  };

  const handleExportExcel = async () => {
    if (!token) {
      Toast.show({ type: 'error', text1: 'You must be signed in to export.' });
      return;
    }
    if (totalCount === 0 && rentalInvoices.length === 0) {
      Toast.show({ type: 'error', text1: 'No data to export for the current filters.' });
      return;
    }
    if (!XLSX) {
      Toast.show({ type: 'error', text1: 'Excel export requires xlsx library.' });
      return;
    }

    try {
      setExporting(true);
      const exportLimit = Math.min(Math.max(totalCount || rentalInvoices.length, 1), 100000);
      const requestBody = {
        invoiceType: reportType,
        fromDate,
        toDate,
        ...(filterCompanyId ? { companyId: filterCompanyId } : {}),
        companyName: companyNameFilter,
        invoiceNumber: invoiceNumberFilter,
        paymentStatus: paymentStatusFilter,
        page: 1,
        limit: exportLimit,
      };
      const response = await axios.post(
        `${getApiBaseUrl()}/rental-payment/all/`,
        requestBody,
        { headers: { Authorization: token || '' } }
      );
      if (!response.data?.success) {
        Toast.show({ type: 'error', text1: response.data?.message || 'Failed to fetch export data' });
        return;
      }
      const rows = response.data.entries || [];
      if (!rows.length) {
        Toast.show({ type: 'error', text1: 'No data to export.' });
        return;
      }

      const ws = buildRentalInvoiceGstrWorksheet(XLSX, rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rental Invoices');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileName = `rental_invoices_gstr_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, excelBufferToBase64(excelBuffer), {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Toast.show({
          type: 'success',
          text1: `Exported ${rows.length} row(s) (GSTR layout)`,
        });
      } else {
        Toast.show({ type: 'error', text1: 'Sharing is not available on this device.' });
      }
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || error.message || 'Export failed.',
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

  const handleDownloadSignedCopy = async (invoice: any) => {
    try {
      await openSignedCopyDownload(invoice, (msg) => {
        Toast.show({ type: 'error', text1: msg });
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open signed copy' });
    }
  };

  const handleDownloadInvoicePdf = async (invoice: any) => {
    try {
      const ok = await openRentalInvoicePdf(invoice);
      if (!ok) Toast.show({ type: 'error', text1: 'Invoice PDF not available' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open invoice PDF' });
    }
  };

  const handleDownloadPaymentCopy = async (invoice: any) => {
    try {
      const ok = await openPaymentCopyPdf(invoice);
      if (!ok) Toast.show({ type: 'error', text1: 'Payment copy not available' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open payment copy' });
    }
  };

  const handleEditPayment = (invoice: any) => {
    (navigation as any).navigate('Rentals', {
      screen: 'RentalInvoiceList',
      params: { highlightInvoiceId: invoice?._id, openPayment: true },
    });
  };

  const renderInvoice = ({ item, index }: { item: any; index: number }) => {
    const firstProduct = item.products && item.products.length > 0
      ? item.products[0]
      : item.machineId ? { machineId: item.machineId } : null;
    const dateVal = item.invoiceDate || item.entryDate || item.createdAt;

    return (
      <View style={styles.invoiceCard}>
        <View style={styles.invoiceHeader}>
          <Text style={styles.invoiceNumber}>#{item.invoiceNumber || 'N/A'}</Text>
          <View style={[styles.statusBadge, getStatusColor(item.status)]}>
            <Text style={styles.statusText}>{item.status || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.invoiceDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Company:</Text>
            <Text style={styles.detailValue}>{item.companyId?.companyName || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GST:</Text>
            <Text style={styles.detailValue}>{item.companyId?.gstNo || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Machine:</Text>
            <Text style={styles.detailValue}>
              {firstProduct?.machineId?.modelName || item.machineId?.modelName || 'N/A'} / {firstProduct?.machineId?.serialNo || item.machineId?.serialNo || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice Date:</Text>
            <Text style={styles.detailValue}>
              {dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Grand Total:</Text>
            <Text style={styles.detailValue}>
              ₹{Number(item.grandTotal || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid / TDS:</Text>
            <Text style={styles.detailValue}>
              ₹{Number(item.paymentAmount || 0).toFixed(2)} / ₹{Number(item.tdsAmount || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Mode:</Text>
            <Text style={styles.detailValue}>{item.modeOfPayment || 'N/A'}</Text>
          </View>
          {item.bankName ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank Name:</Text>
              <Text style={styles.detailValue}>{item.bankName}</Text>
            </View>
          ) : null}
          {item.chequeDate ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cheque Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(item.chequeDate).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
          {item.transactionDetails ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction:</Text>
              <Text style={styles.detailValue}>{item.transactionDetails}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.downloadRow}>
          <TouchableOpacity style={styles.pdfBtn} onPress={() => handleDownloadInvoicePdf(item)}>
            <Icon name="picture-as-pdf" size={16} color="#019ee3" />
            <Text style={styles.pdfBtnText}>Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pdfBtn} onPress={() => handleDownloadPaymentCopy(item)}>
            <Icon name="receipt" size={16} color="#019ee3" />
            <Text style={styles.pdfBtnText}>Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pdfBtn} onPress={() => handleDownloadSignedCopy(item)}>
            <Icon name="attachment" size={16} color="#019ee3" />
            <Text style={styles.pdfBtnText}>Signed</Text>
          </TouchableOpacity>
          {reportType !== 'quotation' ? (
            <TouchableOpacity style={styles.pdfBtn} onPress={() => handleEditPayment(item)}>
              <Icon name="edit" size={16} color="#6a1b9a" />
              <Text style={[styles.pdfBtnText, { color: '#6a1b9a' }]}>Pay</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return { backgroundColor: '#d4edda', borderColor: '#28a745' };
      case 'Unpaid':
        return { backgroundColor: '#f8d7da', borderColor: '#dc3545' };
      case 'Pending':
      case 'Progress':
        return { backgroundColor: '#fff3cd', borderColor: '#ffc107' };
      default:
        return { backgroundColor: '#e9ecef', borderColor: '#6c757d' };
    }
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

  if (loading && rentalInvoices.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (error && rentalInvoices.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchRentalInvoices()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rental Invoices Report</Text>
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
              <Text style={styles.exportButtonText}>Export GSTR Excel</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsCount}>
        <Text style={styles.resultsCountText}>
          Total: {totalCount} invoice{totalCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Invoices List */}
      <FlatList
        data={rentalInvoices}
        renderItem={({ item, index }) => renderInvoice({ item, index })}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => fetchRentalInvoices()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="description" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No rental invoices found</Text>
          </View>
        }
        contentContainerStyle={rentalInvoices.length === 0 ? styles.emptyListContent : undefined}
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
              <Text style={styles.filterLabel}>Invoice Number</Text>
              <TextInput
                style={styles.filterInput}
                value={invoiceNumberFilter}
                onChangeText={setInvoiceNumberFilter}
                placeholder="Enter invoice number"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.filterInputGroup}>
              <Text style={styles.filterLabel}>Payment Status</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setPaymentStatusPickerVisible(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {paymentStatusFilter || '--select Status--'}
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

      {/* Payment Status Picker Modal */}
      <Modal
        visible={paymentStatusPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentStatusPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPaymentStatusPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Payment Status</Text>
            <FlatList
              data={[
                { value: '', label: 'All' },
                { value: 'Paid', label: 'Paid' },
                { value: 'Unpaid', label: 'Unpaid' },
                { value: 'TDS', label: 'TDS' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setPaymentStatusFilter(item.value);
                    setPaymentStatusPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setPaymentStatusPickerVisible(false)}
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
  invoiceCard: {
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
  signedCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  signedCopyBtnText: {
    color: '#019ee3',
    fontWeight: '600',
    fontSize: 14,
  },
  downloadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#cfe8f5',
    backgroundColor: '#f3faff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pdfBtnText: {
    color: '#019ee3',
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  invoiceNumber: {
    fontSize: 18,
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
  invoiceDetails: {
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

export default RentalInvoiceReportScreen;
