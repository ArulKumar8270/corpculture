import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../../services/api';
import Toast from 'react-native-toast-message';

interface ReportData {
  id: string;
  name: string;
  count: number;
  screen: string;
  type?: string;
  supportsSerialFilter?: boolean;
}

const RentalReportsSummaryScreen = () => {
  const navigation = useNavigation();
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serialNoFilter, setSerialNoFilter] = useState('');
  const [reportData, setReportData] = useState<ReportData[]>([]);

  const fetchRentalReportsCount = useCallback(async (serialNo = '') => {
    const params = new URLSearchParams({ page: '1', limit: '1', reportType: 'Rental_Report' });
    if (serialNo.trim()) params.set('serialNo', serialNo.trim());
    const { data } = await axios.get(`${getApiBaseUrl()}/report/Rental_Report?${params.toString()}`, {
      headers: { Authorization: token || '' },
    });
    return data?.totalCount ?? 0;
  }, [token]);

  const fetchSummaryData = useCallback(async (serialNo = '') => {
    setLoading(true);
    setError(null);

    if (!token) {
      setError('Authentication token not available. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const [
        rentalInvoicesRes,
        rentalQuotationsRes,
        rentalEnquiriesRes,
      ] = await Promise.allSettled([
        axios.post(
          `${getApiBaseUrl()}/rental-payment/all/`,
          { invoiceType: 'invoice' },
          { headers: { Authorization: token } }
        ),
        axios.post(
          `${getApiBaseUrl()}/rental-payment/all/`,
          { invoiceType: 'quotation' },
          { headers: { Authorization: token } }
        ),
        axios.get(`${getApiBaseUrl()}/rental/all`, {
          headers: { Authorization: token },
        }),
      ]);

      const rentalReportsCount = await fetchRentalReportsCount(serialNo);

      const newReportData: ReportData[] = [
        {
          id: 'rentalInvoices',
          name: 'Rental Invoices',
          count: rentalInvoicesRes.status === 'fulfilled' && rentalInvoicesRes.value.data.success
            ? rentalInvoicesRes.value.data.totalCount ?? 0
            : 0,
          screen: 'RentalInvoiceReport',
          type: 'invoice',
        },
        {
          id: 'rentalQuotations',
          name: 'Rental Quotations',
          count: rentalQuotationsRes.status === 'fulfilled' && rentalQuotationsRes.value.data.success
            ? rentalQuotationsRes.value.data.totalCount ?? 0
            : 0,
          screen: 'RentalInvoiceReport',
          type: 'quotation',
        },
        {
          id: 'rentalReports',
          name: 'Rental Reports',
          count: rentalReportsCount,
          screen: 'ServiceReportsReport',
          type: 'rental',
          supportsSerialFilter: true,
        },
        {
          id: 'rentalEnquiries',
          name: 'Rental Enquiries',
          count: rentalEnquiriesRes.status === 'fulfilled' && rentalEnquiriesRes.value.data.success
            ? rentalEnquiriesRes.value.data.totalCount ?? 0
            : 0,
          screen: 'ServiceEnquiriesReport',
          type: 'rental',
        },
      ];

      setReportData(newReportData);
    } catch (err: any) {
      console.error('Error loading rental overview data:', err);
      setError('Failed to load rental overview data.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load rental overview data.',
      });
    } finally {
      setLoading(false);
    }
  }, [token, fetchRentalReportsCount]);

  useFocusEffect(
    useCallback(() => {
      if (token) fetchSummaryData('');
    }, [token, fetchSummaryData])
  );

  const handleApplySerialFilter = () => {
    fetchSummaryData(serialNoFilter);
  };

  const handleClearSerialFilter = () => {
    setSerialNoFilter('');
    fetchSummaryData('');
  };

  const handleViewDetails = (item: ReportData) => {
    if (item.count === 0) {
      Toast.show({
        type: 'info',
        text1: 'Info',
        text2: 'No data available for this report.',
      });
      return;
    }

    (navigation as any).navigate('Reports', {
      screen: item.screen,
      params: {
        ...(item.type ? { type: item.type } : {}),
        ...(item.supportsSerialFilter && serialNoFilter.trim()
          ? { serialNo: serialNoFilter.trim() }
          : {}),
      },
    });
  };

  const renderReportItem = ({ item }: { item: ReportData }) => (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => handleViewDetails(item)}
      disabled={item.count === 0}
    >
      <View style={styles.reportItemContent}>
        <Text style={styles.reportItemName}>{item.name}</Text>
        <View style={[styles.countBadge, item.count === 0 && styles.countBadgeDisabled]}>
          <Text style={[styles.countText, item.count === 0 && styles.countTextDisabled]}>
            {item.count}
          </Text>
        </View>
      </View>
      {item.count > 0 && (
        <Icon name="chevron-right" size={24} color="#019ee3" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={64} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchSummaryData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rental Reports Summary</Text>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Serial No Filter</Text>
        <TextInput
          style={styles.filterInput}
          value={serialNoFilter}
          onChangeText={setSerialNoFilter}
          placeholder="Filter rental reports by serial no"
          placeholderTextColor="#999"
          autoCapitalize="characters"
        />
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApplySerialFilter}>
            <Text style={styles.applyButtonText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearSerialFilter}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={reportData}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="description" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No rental summary data found</Text>
          </View>
        }
      />
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
    padding: 20,
  },
  header: {
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
  filterSection: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 12,
    marginBottom: 4,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#019ee3',
    marginBottom: 10,
  },
  filterInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  filterActions: {
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
    fontWeight: '700',
  },
  listContent: {
    padding: 15,
  },
  reportItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  countBadgeDisabled: {
    backgroundColor: '#e0e0e0',
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  countTextDisabled: {
    color: '#999',
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
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginTop: 15,
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
});

export default RentalReportsSummaryScreen;
