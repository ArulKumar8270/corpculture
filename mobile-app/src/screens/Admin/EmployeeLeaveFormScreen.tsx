import React, { useState, useEffect, useCallback } from 'react';
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
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { getApiBaseUrl } from '../../services/api';

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Other'];

const EmployeeLeaveFormScreen = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'Casual Leave',
    leaveTypeOther: '',
    leaveFrom: '',
    leaveTo: '',
    totalDays: '',
    reason: '',
    contactDuringLeave: '',
  });

  useFocusEffect(
    useCallback(() => {
      if (token) fetchMyLeaves();
    }, [token])
  );

  useEffect(() => {
    if (form.leaveFrom && form.leaveTo) {
      const from = new Date(form.leaveFrom);
      const to = new Date(form.leaveTo);
      if (to >= from) {
        const days = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        setForm((f) => ({ ...f, totalDays: String(days) }));
      }
    }
  }, [form.leaveFrom, form.leaveTo]);

  const fetchMyLeaves = async () => {
    try {
      setLoadingLeaves(true);
      const { data } = await axios.get(
        `${getApiBaseUrl()}/employee-leave/my-leaves?limit=100`,
        { headers: { Authorization: token || '' } }
      );
      if (data?.success) setLeaves(data.leaves || []);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load leave applications',
        text2: err.response?.data?.message,
      });
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.leaveFrom || !form.leaveTo || !form.totalDays || !form.reason) {
      Toast.show({ type: 'error', text1: 'Please fill date range, total days and reason' });
      return;
    }
    if (form.leaveType === 'Other' && !form.leaveTypeOther.trim()) {
      Toast.show({ type: 'error', text1: 'Please specify leave type (Other)' });
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        leaveType: form.leaveType,
        leaveFrom: form.leaveFrom,
        leaveTo: form.leaveTo,
        totalDays: Number(form.totalDays),
        reason: form.reason.trim(),
        contactDuringLeave: form.contactDuringLeave.trim() || undefined,
      };
      if (form.leaveType === 'Other') payload.leaveTypeOther = form.leaveTypeOther;

      const { data } = await axios.post(
        `${getApiBaseUrl()}/employee-leave/create`,
        payload,
        { headers: { Authorization: token || '' } }
      );
      if (data?.success) {
        Toast.show({ type: 'success', text1: 'Leave application submitted successfully' });
        setForm({
          leaveType: 'Casual Leave',
          leaveTypeOther: '',
          leaveFrom: '',
          leaveTo: '',
          totalDays: '',
          reason: '',
          contactDuringLeave: '',
        });
        fetchMyLeaves();
      } else {
        Toast.show({ type: 'error', text1: data?.message || 'Failed to submit' });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Failed to submit leave application',
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Apply for Leave</Text>

      <Text style={styles.label}>Leave Type</Text>
      <View style={styles.chipRow}>
        {LEAVE_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, form.leaveType === t && styles.chipSelected]}
            onPress={() => setForm((f) => ({ ...f, leaveType: t }))}
          >
            <Text style={[styles.chipText, form.leaveType === t && styles.chipTextSelected]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {form.leaveType === 'Other' && (
        <>
          <Text style={styles.label}>Specify (Other)</Text>
          <TextInput
            style={styles.input}
            value={form.leaveTypeOther}
            onChangeText={(t) => setForm((f) => ({ ...f, leaveTypeOther: t }))}
            placeholder="Enter leave type"
            placeholderTextColor="#999"
          />
        </>
      )}

      <Text style={styles.label}>From Date *</Text>
      <TextInput
        style={styles.input}
        value={form.leaveFrom}
        onChangeText={(t) => setForm((f) => ({ ...f, leaveFrom: t }))}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>To Date *</Text>
      <TextInput
        style={styles.input}
        value={form.leaveTo}
        onChangeText={(t) => setForm((f) => ({ ...f, leaveTo: t }))}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Total Days</Text>
      <TextInput
        style={styles.input}
        value={form.totalDays}
        onChangeText={(t) => setForm((f) => ({ ...f, totalDays: t }))}
        placeholder="Auto from dates"
        keyboardType="numeric"
        placeholderTextColor="#999"
        editable={false}
      />

      <Text style={styles.label}>Reason *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.reason}
        onChangeText={(t) => setForm((f) => ({ ...f, reason: t }))}
        placeholder="Reason for leave"
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Contact During Leave</Text>
      <TextInput
        style={styles.input}
        value={form.contactDuringLeave}
        onChangeText={(t) => setForm((f) => ({ ...f, contactDuringLeave: t }))}
        placeholder="Phone or email"
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>My Leave Applications</Text>
      {loadingLeaves ? (
        <ActivityIndicator size="small" color="#019ee3" style={{ marginVertical: 16 }} />
      ) : (
        leaves.map((leave) => (
          <View key={leave._id} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Type</Text>
              <Text style={styles.cardValue}>{leave.leaveType}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>From - To</Text>
              <Text style={styles.cardValue}>
                {formatDate(leave.leaveFrom)} – {formatDate(leave.leaveTo)}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Days</Text>
              <Text style={styles.cardValue}>{leave.totalDays}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Status</Text>
              <View style={[styles.statusChip, { backgroundColor: getStatusColor(leave.status) }]}>
                <Text style={styles.statusChipText}>{leave.status}</Text>
              </View>
            </View>
          </View>
        ))
      )}
      {!loadingLeaves && leaves.length === 0 && (
        <Text style={styles.emptyText}>No leave applications yet</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#019ee3', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginRight: 6,
    marginBottom: 6,
  },
  chipSelected: { backgroundColor: '#019ee3' },
  chipText: { fontSize: 12, color: '#333' },
  chipTextSelected: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#019ee3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#019ee3',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardLabel: { fontSize: 12, color: '#666' },
  cardValue: { fontSize: 14, color: '#333' },
  statusChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 16 },
});

export default EmployeeLeaveFormScreen;
