import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
  ScrollView,
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

const EmployeeBenefitsReportScreen = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState<any | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [employeePickerVisible, setEmployeePickerVisible] = useState(false);

  const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE) || 1;
  const employeeId = employeeFilter?._id || '';

  const calcAmount = (b: any) => {
    const qty = Number(b?.quantity || 0);
    const rate = Number(b?.productId?.employeeCommission ?? b?.productId?.commission ?? 0);
    if (!Number.isFinite(qty) || !Number.isFinite(rate)) return 0;
    return qty * rate;
  };

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

  const fetchBenefits = useCallback(
    async (pageNum: number = 0, empId: string = employeeId) => {
      if (!token) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(pageNum + 1),
          limit: String(ROWS_PER_PAGE),
          _ts: String(Date.now()),
        });
        if (empId) params.append('employeeId', empId);

        const { data } = await axios.get(
          `${getApiBaseUrl()}/employee-benefits?${params.toString()}`,
          {
            headers: {
              Authorization: token,
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }
        );
        if (data?.success) {
          setBenefits(data.benefits || []);
          setTotalCount(data.totalCount || 0);
        } else {
          Toast.show({ type: 'error', text1: data?.message || 'Failed to fetch benefits' });
        }
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: err.response?.data?.message || 'Failed to fetch benefits',
        });
      } finally {
        setLoading(false);
      }
    },
    [token, employeeId]
  );

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
      fetchBenefits(0, employeeId);
    }, [fetchEmployees])
  );

  useEffect(() => {
    if (token) fetchBenefits(page, employeeId);
  }, [page, fetchBenefits, token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBenefits(page, employeeId);
    setRefreshing(false);
  };

  const applyFilter = () => {
    setPage(0);
    fetchBenefits(0, employeeId);
  };

  const clearFilter = () => {
    setEmployeeFilter(null);
    setPage(0);
    fetchBenefits(0, '');
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardDate}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
      </Text>
      <Text style={styles.cardTitle}>{item.employeeId?.name || '—'}</Text>
      <Text style={styles.cardRow}>
        Invoice: {item.invoiceId?.invoiceNumber || item.invoiceNumber || '—'}
      </Text>
      <Text style={styles.cardRow}>
        Product: {item.productId?.productName || item.productId?.name || '—'}
      </Text>
      <Text style={styles.cardRow}>Qty: {item.quantity ?? '—'}</Text>
      <Text style={styles.cardAmount}>₹{calcAmount(item).toFixed(2)}</Text>
      {item.reInstall ? (
        <Text style={styles.cardMeta}>Re-Install: {String(item.reInstall)}</Text>
      ) : null}
      {item.otherProducts ? (
        <Text style={styles.cardMeta}>Other: {String(item.otherProducts)}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employee Benefits Report</Text>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setEmployeePickerVisible(true)}
        >
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {employeeFilter?.name || 'All employees'}
          </Text>
          <Icon name="arrow-drop-down" size={22} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
          <Text style={styles.applyBtnText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearBtn} onPress={clearFilter}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#019ee3" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={benefits}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={benefits.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No benefits found.</Text>
          }
        />
      )}

      <View style={styles.pagination}>
        <TouchableOpacity
          disabled={page <= 0}
          onPress={() => setPage((p) => Math.max(0, p - 1))}
          style={[styles.pageBtn, page <= 0 && styles.pageBtnDisabled]}
        >
          <Icon name="chevron-left" size={28} color={page <= 0 ? '#ccc' : '#019ee3'} />
        </TouchableOpacity>
        <Text style={styles.pageText}>
          Page {page + 1} of {totalPages} ({totalCount} total)
        </Text>
        <TouchableOpacity
          disabled={page + 1 >= totalPages}
          onPress={() => setPage((p) => p + 1)}
          style={[styles.pageBtn, page + 1 >= totalPages && styles.pageBtnDisabled]}
        >
          <Icon name="chevron-right" size={28} color={page + 1 >= totalPages ? '#ccc' : '#019ee3'} />
        </TouchableOpacity>
      </View>

      <Modal visible={employeePickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select employee</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setEmployeeFilter(null);
                  setEmployeePickerVisible(false);
                }}
              >
                <Text>All employees</Text>
              </TouchableOpacity>
              {employees.map((emp) => (
                <TouchableOpacity
                  key={emp._id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setEmployeeFilter(emp);
                    setEmployeePickerVisible(false);
                  }}
                >
                  <Text>{emp.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setEmployeePickerVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#019ee3',
    padding: 16,
    backgroundColor: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterButtonText: { flex: 1, fontSize: 14, color: '#333' },
  applyBtn: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyBtnText: { color: '#fff', fontWeight: '600' },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#019ee3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearBtnText: { color: '#019ee3', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
  },
  cardDate: { fontSize: 12, color: '#888', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 6 },
  cardRow: { fontSize: 14, color: '#555', marginBottom: 2 },
  cardAmount: { fontSize: 16, fontWeight: '700', color: '#019ee3', marginTop: 6 },
  cardMeta: { fontSize: 12, color: '#777', marginTop: 4 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pageBtn: { padding: 4 },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { marginHorizontal: 12, fontSize: 14, color: '#333' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#333' },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalClose: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#019ee3',
    borderRadius: 8,
  },
  modalCloseText: { color: '#fff', fontWeight: '600' },
});

export default EmployeeBenefitsReportScreen;
