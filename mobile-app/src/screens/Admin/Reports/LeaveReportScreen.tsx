import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
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
import ReportPagination from '../../../components/ReportPagination';

const LeaveReportScreen = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [employeePickerVisible, setEmployeePickerVisible] = useState(false);
  const [detailLeave, setDetailLeave] = useState<any | null>(null);
  const [officeFields, setOfficeFields] = useState({
    managerRemarks: '',
    hrRemarks: '',
    reportingManagerName: '',
    reportingManagerSignDate: '',
    hrApproverName: '',
    hrApproverSignDate: '',
  });

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

  const fetchLeaves = useCallback(
    async (pageNum: number = 0) => {
      if (!token) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(pageNum + 1),
          limit: String(rowsPerPage),
        });
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        if (employeeId) params.append('employeeId', employeeId);
        if (statusFilter) params.append('status', statusFilter);

        const { data } = await axios.get(
          `${getApiBaseUrl()}/employee-leave/admin/all?${params.toString()}`,
          { headers: { Authorization: token } }
        );
        if (data?.success) {
          setLeaves(data.leaves || []);
          setTotalCount(data.totalCount || 0);
        } else {
          Toast.show({ type: 'error', text1: data?.message || 'Failed to fetch leaves' });
        }
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: err.response?.data?.message || 'Failed to fetch leave applications',
        });
      } finally {
        setLoading(false);
      }
    },
    [token, fromDate, toDate, employeeId, statusFilter, rowsPerPage]
  );

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [fetchEmployees])
  );

  useEffect(() => {
    if (token) fetchLeaves(page);
  }, [page, fetchLeaves, token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaves(page);
    setRefreshing(false);
  };

  const handleFilter = () => {
    setPage(0);
    fetchLeaves(0);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setEmployeeId('');
    setStatusFilter('');
    setPage(0);
    fetchLeaves(0);
    setShowFilters(false);
  };

  const buildOfficePayload = () => ({
    managerRemarks: officeFields.managerRemarks,
    hrRemarks: officeFields.hrRemarks,
    reportingManagerName: officeFields.reportingManagerName,
    ...(officeFields.reportingManagerSignDate
      ? { reportingManagerSignDate: officeFields.reportingManagerSignDate }
      : {}),
    hrApproverName: officeFields.hrApproverName,
    ...(officeFields.hrApproverSignDate
      ? { hrApproverSignDate: officeFields.hrApproverSignDate }
      : {}),
  });

  const openLeaveDetail = (row: any) => {
    setDetailLeave(row);
    setOfficeFields({
      managerRemarks: row.managerRemarks || '',
      hrRemarks: row.hrRemarks || '',
      reportingManagerName: row.reportingManagerName || '',
      reportingManagerSignDate: row.reportingManagerSignDate
        ? String(row.reportingManagerSignDate).slice(0, 10)
        : '',
      hrApproverName: row.hrApproverName || '',
      hrApproverSignDate: row.hrApproverSignDate
        ? String(row.hrApproverSignDate).slice(0, 10)
        : '',
    });
  };

  const handleStatusUpdate = (
    leaveId: string,
    newStatus: 'Approved' | 'Rejected',
    withOffice = false
  ) => {
    Alert.alert(
      'Update Status',
      `Set status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              setUpdatingId(leaveId);
              const body = withOffice
                ? { status: newStatus, ...buildOfficePayload() }
                : { status: newStatus };
              const { data } = await axios.put(
                `${getApiBaseUrl()}/employee-leave/admin/status/${leaveId}`,
                body,
                { headers: { Authorization: token || '' } }
              );
              if (data?.success) {
                setLeaves((prev) =>
                  prev.map((l) => (l._id === leaveId ? data.leave : l))
                );
                setDetailLeave((prev) => (prev?._id === leaveId ? data.leave : prev));
                setDetailLeave(null);
                Toast.show({ type: 'success', text1: 'Leave record updated' });
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
    return new Date(d).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    if (status === 'Approved') return '#28a745';
    if (status === 'Rejected') return '#dc3545';
    return '#f0ad4e';
  };

  const renderItem = ({ item }: { item: any }) => {
    const empName = item.employeeId?.name || item.userId?.name || 'N/A';
    const isUpdating = updatingId === item._id;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Employee</Text>
          <Text style={styles.cardValue}>{empName}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Type</Text>
          <Text style={styles.cardValue}>{item.leaveType}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>From – To</Text>
          <Text style={styles.cardValue}>
            {formatDate(item.leaveFrom)} – {formatDate(item.leaveTo)}
          </Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Days</Text>
          <Text style={styles.cardValue}>{item.totalDays}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Reason</Text>
          <Text style={[styles.cardValue, styles.reasonText]} numberOfLines={2}>
            {item.reason || 'N/A'}
          </Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Contact</Text>
          <Text style={styles.cardValue}>{item.contactDuringLeave || item.phone || 'N/A'}</Text>
        </View>
        <TouchableOpacity style={styles.viewBtn} onPress={() => openLeaveDetail(item)}>
          <Icon name="visibility" size={16} color="#019ee3" />
          <Text style={styles.viewBtnText}>View Details</Text>
        </TouchableOpacity>
        {item.status === 'Pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleStatusUpdate(item._id, 'Approved')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>Approve</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleStatusUpdate(item._id, 'Rejected')}
              disabled={isUpdating}
            >
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        {item.status !== 'Pending' && (
          <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusChipText}>{item.status}</Text>
          </View>
        )}
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
            {['', 'Pending', 'Approved', 'Rejected'].map((s) => (
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
          data={leaves}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#019ee3']} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No leave applications found</Text>
            </View>
          }
        />
      )}

      <ReportPagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
      />

      <Modal visible={!!detailLeave} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Leave Details</Text>
              <TouchableOpacity onPress={() => setDetailLeave(null)}>
                <Icon name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 480 }}>
              <Text style={styles.modalLine}>
                Employee: {detailLeave?.employeeId?.name || detailLeave?.userId?.name || 'N/A'}
              </Text>
              <Text style={styles.modalLine}>Type: {detailLeave?.leaveType || 'N/A'}</Text>
              <Text style={styles.modalLine}>
                Dates: {formatDate(detailLeave?.leaveFrom)} – {formatDate(detailLeave?.leaveTo)}
              </Text>
              <Text style={styles.modalLine}>Days: {detailLeave?.totalDays ?? 'N/A'}</Text>
              <Text style={styles.modalLine}>Reason: {detailLeave?.reason || 'N/A'}</Text>
              <Text style={styles.modalLine}>
                Contact: {detailLeave?.contactDuringLeave || detailLeave?.phone || 'N/A'}
              </Text>
              <Text style={styles.modalLine}>Company: {detailLeave?.companyName || 'N/A'}</Text>
              <Text style={styles.modalLine}>Status: {detailLeave?.status || 'N/A'}</Text>

              <Text style={styles.officeHeading}>Office use (RM / HR)</Text>
              <Text style={styles.label}>Manager Remarks</Text>
              <TextInput
                style={styles.input}
                value={officeFields.managerRemarks}
                onChangeText={(t) => setOfficeFields((o) => ({ ...o, managerRemarks: t }))}
                placeholder="Manager remarks"
              />
              <Text style={styles.label}>Reporting Manager Name</Text>
              <TextInput
                style={styles.input}
                value={officeFields.reportingManagerName}
                onChangeText={(t) => setOfficeFields((o) => ({ ...o, reportingManagerName: t }))}
                placeholder="RM name"
              />
              <Text style={styles.label}>RM Sign Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={officeFields.reportingManagerSignDate}
                onChangeText={(t) => setOfficeFields((o) => ({ ...o, reportingManagerSignDate: t }))}
                placeholder="YYYY-MM-DD"
              />
              <Text style={styles.label}>HR Remarks</Text>
              <TextInput
                style={styles.input}
                value={officeFields.hrRemarks}
                onChangeText={(t) => setOfficeFields((o) => ({ ...o, hrRemarks: t }))}
                placeholder="HR remarks"
              />
              <Text style={styles.label}>HR Approver Name</Text>
              <TextInput
                style={styles.input}
                value={officeFields.hrApproverName}
                onChangeText={(t) => setOfficeFields((o) => ({ ...o, hrApproverName: t }))}
                placeholder="HR name"
              />
              <Text style={styles.label}>HR Sign Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={officeFields.hrApproverSignDate}
                onChangeText={(t) => setOfficeFields((o) => ({ ...o, hrApproverSignDate: t }))}
                placeholder="YYYY-MM-DD"
              />
            </ScrollView>

            {detailLeave?.status === 'Pending' ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleStatusUpdate(detailLeave._id, 'Approved', true)}
                >
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleStatusUpdate(detailLeave._id, 'Rejected', true)}
                >
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, { marginTop: 12 }]}
                onPress={() => {
                  if (!detailLeave?._id) return;
                  handleStatusUpdate(
                    detailLeave._id,
                    detailLeave.status === 'Rejected' ? 'Rejected' : 'Approved',
                    true
                  );
                }}
              >
                <Text style={styles.actionBtnText}>Save Office Fields</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  statusRow: { flexDirection: 'row', marginTop: 8, gap: 8, flexWrap: 'wrap' },
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
  reasonText: { textAlign: 'left' },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 4,
  },
  viewBtnText: { color: '#019ee3', fontWeight: '600', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#019ee3' },
  modalLine: { fontSize: 14, color: '#333', marginBottom: 6 },
  officeHeading: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  actionRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  approveBtn: { backgroundColor: '#28a745' },
  rejectBtn: { backgroundColor: '#dc3545' },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  statusChip: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
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

export default LeaveReportScreen;
