import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { getApiBaseUrl } from '../../../services/api';

const ROWS_PER_PAGE = 10;

const ActivityLogReportScreen = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [employeePickerVisible, setEmployeePickerVisible] = useState(false);

  const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE) || 1;

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/employee/all`, {
        headers: { Authorization: token || '' },
      });
      if (data?.success) setEmployees(data.employees || []);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchLogs = useCallback(
    async (pageNum: number = 0) => {
      if (!token) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(pageNum + 1),
          limit: String(ROWS_PER_PAGE),
        });
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        if (employeeId) params.append('employeeId', employeeId);
        if (statusFilter) params.append('status', statusFilter);

        const { data } = await axios.get(
          `${getApiBaseUrl()}/employee-activity-log/admin/all?${params.toString()}`,
          { headers: { Authorization: token } }
        );
        if (data?.success) {
          setActivityLogs(data.activityLogs || []);
          setTotalCount(data.totalCount || 0);
        } else {
          Toast.show({ type: 'error', text1: data?.message || 'Failed to fetch logs' });
        }
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: err.response?.data?.message || 'Failed to fetch activity logs',
        });
      } finally {
        setLoading(false);
      }
    },
    [token, fromDate, toDate, employeeId, statusFilter]
  );

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [fetchEmployees])
  );

  useEffect(() => {
    if (token) fetchLogs(page);
  }, [page, fetchLogs, token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs(page);
    setRefreshing(false);
  };

  const handleFilter = () => {
    setPage(0);
    fetchLogs(0);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setEmployeeId('');
    setStatusFilter('');
    setPage(0);
    fetchLogs(0);
    setShowFilters(false);
  };

  const handleStatusUpdate = (logId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    Alert.alert(
      'Update Status',
      `Set status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              setUpdatingId(logId);
              const { data } = await axios.put(
                `${getApiBaseUrl()}/employee-activity-log/admin/status/${logId}`,
                { status: newStatus },
                { headers: { Authorization: token || '' } }
              );
              if (data?.success) {
                setActivityLogs((prev) =>
                  prev.map((l) => (l._id === logId ? data.activityLog : l))
                );
                Toast.show({ type: 'success', text1: 'Status updated' });
              } else {
                Toast.show({ type: 'error', text1: data?.message || 'Failed to update' });
              }
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: err.response?.data?.message || 'Failed to update status',
              });
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (d: any) => {
    if (!d) return 'N/A';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: any }) => {
    const empName = item.employeeId?.name || item.userId?.name || 'N/A';
    const fromName = item.fromCompany?.companyName || item.fromCompanyName || 'N/A';
    const toName = item.toCompany?.companyName || item.toCompanyName || 'N/A';
    const isUpdating = updatingId === item._id;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Date</Text>
          <Text style={styles.cardValue}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Employee</Text>
          <Text style={styles.cardValue}>{empName}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>From</Text>
          <Text style={styles.cardValue}>{fromName}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>To</Text>
          <Text style={styles.cardValue}>{toName}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>KM</Text>
          <Text style={styles.cardValue}>{item.km ?? 'N/A'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Status</Text>
          <TouchableOpacity
            style={[styles.statusChip, item.status === 'PAID' ? styles.statusPaid : styles.statusUnpaid]}
            onPress={() => handleStatusUpdate(item._id, item.status)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.statusChipText}>{item.status || 'UNPAID'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
        <Icon name="filter-list" size={24} color="#019ee3" />
        <Text style={styles.filterToggleText}>Filters</Text>
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.label}>From Date</Text>
          <TextInput
            style={styles.input}
            value={fromDate}
            onChangeText={setFromDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
          <Text style={styles.label}>To Date</Text>
          <TextInput
            style={styles.input}
            value={toDate}
            onChangeText={setToDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
          <Text style={styles.label}>Employee</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setEmployeePickerVisible(true)}
          >
            <Text style={styles.pickerText}>
              {employeeId
                ? employees.find((e) => e._id === employeeId)?.name || employeeId
                : 'All'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
          {employeePickerVisible && (
            <View style={styles.pickerList}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setEmployeeId('');
                  setEmployeePickerVisible(false);
                }}
              >
                <Text>All</Text>
              </TouchableOpacity>
              {employees.map((e) => (
                <TouchableOpacity
                  key={e._id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setEmployeeId(e._id);
                    setEmployeePickerVisible(false);
                  }}
                >
                  <Text>{e.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {['', 'PAID', 'UNPAID'].map((s) => (
              <TouchableOpacity
                key={s || 'all'}
                style={[styles.statusFilterChip, statusFilter === s && styles.statusFilterChipSelected]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={statusFilter === s ? styles.statusFilterChipTextSelected : undefined}>
                  {s || 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.filterBtn} onPress={handleFilter}>
              <Text style={styles.filterBtnText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterBtn, styles.clearBtn]} onPress={handleClearFilters}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#019ee3" />
        </View>
      ) : (
        <FlatList
          data={activityLogs}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#019ee3']} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No activity logs found</Text>
            </View>
          }
        />
      )}

      {totalCount > 0 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <Text style={styles.pageBtnText}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            Page {page + 1} of {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
            onPress={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            <Text style={styles.pageBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterToggleText: { marginLeft: 8, fontSize: 16, color: '#019ee3' },
  filterPanel: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: { fontSize: 12, fontWeight: '600', color: '#666', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  pickerText: { fontSize: 14, color: '#333' },
  pickerList: { marginTop: 4, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', maxHeight: 150 },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statusRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  statusFilterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  statusFilterChipSelected: { backgroundColor: '#019ee3' },
  statusFilterChipTextSelected: { color: '#fff' },
  filterActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#019ee3',
    alignItems: 'center',
  },
  filterBtnText: { color: '#fff', fontWeight: '600' },
  clearBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#019ee3' },
  clearBtnText: { color: '#019ee3', fontWeight: '600' },
  listContent: { padding: 12, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardLabel: { fontSize: 12, color: '#666' },
  cardValue: { fontSize: 14, color: '#333', flex: 1, textAlign: 'right' },
  statusChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  statusPaid: { backgroundColor: 'green' },
  statusUnpaid: { backgroundColor: '#f0ad4e' },
  statusChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#666' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pageBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#019ee3', borderRadius: 8 },
  pageBtnDisabled: { backgroundColor: '#ccc', opacity: 0.8 },
  pageBtnText: { color: '#fff', fontWeight: '600' },
  pageInfo: { fontSize: 14, color: '#333' },
});

export default ActivityLogReportScreen;
