import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

const EmployeeActivityLogListScreen = () => {
  const navigation = useNavigation<any>();
  const { token, user } = useSelector((s: RootState) => s.auth);
  const isAdmin = user?.role === 1 || Number(user?.role) === 1;

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      const { data } = await axios.get(
        `${getApiBaseUrl()}/employee-activity-log/my-logs?${params.toString()}`,
        { headers: { Authorization: token } }
      );
      if (data?.success) {
        setLogs(data.activityLogs || []);
        setTotalCount(data.totalCount || 0);
      } else {
        setLogs([]);
        setTotalCount(0);
        Toast.show({ type: 'error', text1: data?.message || 'Failed to load logs' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load petrol forms' });
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, page, fromDate, toDate, rowsPerPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const applyFilter = () => {
    setPage(0);
  };

  const clearFilter = () => {
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const formatD = (d: any) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  const renderItem = ({ item }: { item: any }) => {
    const fromName = item.fromCompany?.companyName || item.fromCompanyName || '—';
    const toName = item.toCompany?.companyName || item.toCompanyName || '—';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{formatD(item.date)}</Text>
          <Text style={styles.km}>{item.km != null ? `${item.km} km` : '—'}</Text>
        </View>
        <Text style={styles.line}>
          <Text style={styles.bold}>From: </Text>
          {fromName}
        </Text>
        <Text style={styles.line}>
          <Text style={styles.bold}>To: </Text>
          {toName}
        </Text>
        <Text style={styles.line}>
          In: {item.inTime || '—'} · Out: {item.outTime || '—'}
        </Text>
        <Text style={styles.line}>
          Call: {item.callType || '—'} · Status: {item.status || '—'}
        </Text>
        {item.remarks ? <Text style={styles.remarks}>{item.remarks}</Text> : null}
        {isAdmin ? (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              (navigation as any).navigate('Employees', {
                screen: 'ActivityLogForm',
                params: { editLogId: item._id },
              })
            }
          >
            <Text style={styles.editBtnText}>Edit (admin)</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My petrol forms</Text>
      <View style={styles.filters}>
        <TextInput
          style={styles.filterInput}
          placeholder="From YYYY-MM-DD"
          value={fromDate}
          onChangeText={setFromDate}
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.filterInput}
          placeholder="To YYYY-MM-DD"
          value={toDate}
          onChangeText={setToDate}
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.filterBtn} onPress={applyFilter}>
          <Text style={styles.filterBtnText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearBtn} onPress={clearFilter}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {loading && logs.length === 0 ? (
        <ActivityIndicator size="large" color="#019ee3" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLogs} />}
          ListEmptyComponent={<Text style={styles.empty}>No petrol forms found.</Text>}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <View style={styles.pager}>
        <TouchableOpacity
          style={[styles.pageBtn, page <= 0 && styles.pageBtnDis]}
          disabled={page <= 0}
          onPress={() => setPage((p) => Math.max(0, p - 1))}
        >
          <Icon name="chevron-left" size={24} color={page <= 0 ? '#ccc' : '#019ee3'} />
        </TouchableOpacity>
        <Text style={styles.pageInfo}>
          Page {page + 1} · {totalCount} total
        </Text>
        <TouchableOpacity
          style={[styles.pageBtn, (page + 1) * rowsPerPage >= totalCount && styles.pageBtnDis]}
          disabled={(page + 1) * rowsPerPage >= totalCount}
          onPress={() => setPage((p) => p + 1)}
        >
          <Icon name="chevron-right" size={24} color="#019ee3" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', padding: 16, color: '#019ee3' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filterInput: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    fontSize: 13,
  },
  filterBtn: { backgroundColor: '#019ee3', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  filterBtnText: { color: '#fff', fontWeight: '600' },
  clearBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  clearBtnText: { color: '#666' },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  date: { fontWeight: '700', color: '#222' },
  km: { color: '#019ee3', fontWeight: '600' },
  line: { fontSize: 13, color: '#444', marginBottom: 4 },
  bold: { fontWeight: '600' },
  remarks: { fontSize: 12, color: '#666', marginTop: 6, fontStyle: 'italic' },
  editBtn: { marginTop: 10, alignSelf: 'flex-start' },
  editBtnText: { color: '#019ee3', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  pageBtn: { padding: 8 },
  pageBtnDis: { opacity: 0.4 },
  pageInfo: { fontSize: 14, color: '#555' },
});

export default EmployeeActivityLogListScreen;
