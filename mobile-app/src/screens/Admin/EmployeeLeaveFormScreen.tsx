import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { getApiBaseUrl } from '../../services/api';

const LEAVE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Casual Leave', label: 'Casual' },
  { value: 'Sick Leave', label: 'Sick' },
  { value: 'Earned Leave', label: 'Earned' },
  { value: 'Other', label: 'Other' },
];

const DECLARATION_BULLETS = [
  'I confirm that I have applied for this leave with prior approval.',
  'If leave is taken on Saturday / Monday, I confirm that this request is submitted at least 3–5 days in advance.',
  'I understand that unauthorized leave may result in salary deduction.',
  'I am aware that if leave is taken on Saturday and/or Monday without approval, Sunday will also be considered for deduction (up to 3 days salary deduction).',
  'I understand that leave benefits for the next month are applicable only if I have full attendance in the current month.',
];

const EmployeeLeaveFormScreen = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [employee, setEmployee] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    leaveType: 'Casual Leave',
    leaveTypeOther: '',
    leaveFrom: '',
    leaveTo: '',
    totalDays: '',
    reason: '',
    contactDuringLeave: '',
    declarationAccepted: false,
    employeeSignatureName: '',
  });

  useFocusEffect(
    useCallback(() => {
      if (token) fetchMyLeaves();
    }, [token])
  );

  useEffect(() => {
    const loadEmployee = async () => {
      if (!token || !user?._id) {
        setLoadingEmployee(false);
        return;
      }
      try {
        setLoadingEmployee(true);
        const { data } = await axios.get(`${getApiBaseUrl()}/employee/user/${user._id}`, {
          headers: { Authorization: token },
        });
        if (data?.success) setEmployee(data.employee);
      } catch {
        Toast.show({ type: 'error', text1: 'Could not load employee profile' });
      } finally {
        setLoadingEmployee(false);
      }
    };
    loadEmployee();
  }, [token, user?._id]);

  useEffect(() => {
    if (form.leaveFrom && form.leaveTo) {
      const from = new Date(form.leaveFrom);
      const to = new Date(form.leaveTo);
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to >= from) {
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

  const getDepartmentDisplay = () => {
    if (!employee?.department) return 'N/A';
    const d = employee.department;
    if (Array.isArray(d) && d.length > 0) {
      const names = d
        .map((x: any) => (typeof x === 'object' && x?.name ? x.name : typeof x === 'string' ? x : null))
        .filter(Boolean);
      return names.length ? names.join(', ') : 'N/A';
    }
    return typeof d === 'string' ? d : 'N/A';
  };

  const getDesignationDisplay = () => {
    if (!employee?.designation) return 'N/A';
    const des = employee.designation;
    if (Array.isArray(des)) {
      const filtered = des.map((x: any) => (x != null ? String(x).trim() : '')).filter((s: string) => s.length > 0);
      return filtered.length ? filtered.join(', ') : 'N/A';
    }
    if (typeof des === 'string') return des.trim() || 'N/A';
    return 'N/A';
  };

  const todayLabel = () => new Date().toLocaleDateString();

  const handleSubmit = async () => {
    if (!form.leaveFrom || !form.leaveTo || !form.totalDays || !form.reason.trim()) {
      Toast.show({ type: 'error', text1: 'Please fill dates, total days and reason' });
      return;
    }
    if (form.leaveType === 'Other' && !form.leaveTypeOther.trim()) {
      Toast.show({ type: 'error', text1: 'Please specify leave type (Other)' });
      return;
    }
    if (!form.declarationAccepted) {
      Toast.show({ type: 'error', text1: 'Please accept the special declarations (Section 4)' });
      return;
    }
    if (!form.employeeSignatureName.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your name as signature (Section 5)' });
      return;
    }

    try {
      setLoading(true);
      const payload: Record<string, unknown> = {
        leaveType: form.leaveType,
        leaveFrom: form.leaveFrom,
        leaveTo: form.leaveTo,
        totalDays: Number(form.totalDays),
        reason: form.reason.trim(),
        contactDuringLeave: form.contactDuringLeave.trim() || '',
        companyName: form.companyName.trim(),
        declarationAccepted: true,
        employeeSignatureName: form.employeeSignatureName.trim(),
      };
      if (form.leaveType === 'Other') payload.leaveTypeOther = form.leaveTypeOther.trim();

      const { data } = await axios.post(
        `${getApiBaseUrl()}/employee-leave/create`,
        payload,
        { headers: { Authorization: token || '' } }
      );
      if (data?.success) {
        Toast.show({ type: 'success', text1: 'Leave application submitted successfully' });
        setForm({
          companyName: '',
          leaveType: 'Casual Leave',
          leaveTypeOther: '',
          leaveFrom: '',
          leaveTo: '',
          totalDays: '',
          reason: '',
          contactDuringLeave: '',
          declarationAccepted: false,
          employeeSignatureName: '',
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

  const leaveTypeLabel = (row: any) =>
    row.leaveType === 'Other' ? row.leaveTypeOther || 'Other' : row.leaveType;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>Employee Leave Application Form</Text>
        <Text style={styles.hint}>
          Complete Sections 1–5 and submit. Section 6 is completed by Reporting Manager / HR.
        </Text>

        <Text style={styles.sectionTitle}>Company Name</Text>
        <TextInput
          style={styles.input}
          value={form.companyName}
          onChangeText={(t) => setForm((f) => ({ ...f, companyName: t }))}
          placeholder="Optional"
          placeholderTextColor="#999"
        />

        <Text style={styles.sectionTitle}>1. Employee Details</Text>
        {loadingEmployee ? (
          <ActivityIndicator size="small" color="#019ee3" style={{ marginVertical: 8 }} />
        ) : (
          <View style={styles.readonlyBlock}>
            <ReadRow label="Employee Name" value={employee?.name ?? user?.name ?? '—'} />
            <ReadRow label="Employee ID" value={employee?.idCradNo ?? '—'} />
            <ReadRow label="Department" value={getDepartmentDisplay()} />
            <ReadRow label="Designation" value={getDesignationDisplay()} />
          </View>
        )}

        <Text style={styles.sectionTitle}>2. Leave Details</Text>
        <Text style={styles.label}>Leave Type</Text>
        <View style={styles.chipRow}>
          {LEAVE_TYPE_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, form.leaveType === t.value && styles.chipSelected]}
              onPress={() => setForm((f) => ({ ...f, leaveType: t.value }))}
            >
              <Text style={[styles.chipText, form.leaveType === t.value && styles.chipTextSelected]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.leaveType === 'Other' && (
          <>
            <Text style={styles.label}>Other (specify)</Text>
            <TextInput
              style={styles.input}
              value={form.leaveTypeOther}
              onChangeText={(t) => setForm((f) => ({ ...f, leaveTypeOther: t }))}
              placeholder="Describe leave type"
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

        <Text style={styles.label}>Total No. of Days</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={form.totalDays}
          placeholder="Auto from dates"
          placeholderTextColor="#999"
          editable={false}
        />

        <Text style={styles.sectionTitle}>3. Reason for Leave</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.reason}
          onChangeText={(t) => setForm((f) => ({ ...f, reason: t }))}
          placeholder="Reason"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Contact During Leave (optional)</Text>
        <TextInput
          style={styles.input}
          value={form.contactDuringLeave}
          onChangeText={(t) => setForm((f) => ({ ...f, contactDuringLeave: t }))}
          placeholder="Phone or email"
          placeholderTextColor="#999"
        />

        <Text style={styles.sectionTitle}>4. Special Declaration (Mandatory)</Text>
        <View style={styles.bulletBox}>
          {DECLARATION_BULLETS.map((line) => (
            <Text key={line} style={styles.bulletItem}>
              • {line}
            </Text>
          ))}
        </View>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setForm((f) => ({ ...f, declarationAccepted: !f.declarationAccepted }))}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.declarationAccepted }}
        >
          <View style={[styles.checkbox, form.declarationAccepted && styles.checkboxOn]}>
            {form.declarationAccepted ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>
            I confirm that I have read and accept all of the above declarations.
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>5. Employee Signature</Text>
        <Text style={styles.label}>Signature (type your full name)</Text>
        <TextInput
          style={styles.input}
          value={form.employeeSignatureName}
          onChangeText={(t) => setForm((f) => ({ ...f, employeeSignatureName: t }))}
          placeholder="Your full name"
          placeholderTextColor="#999"
        />
        <ReadRow label="Date" value={todayLabel()} />

        <View style={styles.officeBox}>
          <Text style={styles.sectionTitle}>6. For Office Use Only</Text>
          <Text style={styles.officeNote}>
            Leave status, remarks, reporting manager and HR approval are recorded here after you submit. Track
            status under &quot;My Leave Applications&quot; below.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Leave Application</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>My Leave Applications</Text>
        {loadingLeaves ? (
          <ActivityIndicator size="small" color="#019ee3" style={{ marginVertical: 16 }} />
        ) : (
          leaves.map((leave) => (
            <View key={leave._id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Type</Text>
                <Text style={styles.cardValue}>{leaveTypeLabel(leave)}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>From – To</Text>
                <Text style={styles.cardValue}>
                  {formatDate(leave.leaveFrom)} – {formatDate(leave.leaveTo)}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Days</Text>
                <Text style={styles.cardValue}>{leave.totalDays}</Text>
              </View>
              {leave.companyName ? (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Company</Text>
                  <Text style={styles.cardValue}>{leave.companyName}</Text>
                </View>
              ) : null}
              {leave.employeeSignatureName ? (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Signed</Text>
                  <Text style={styles.cardValue} numberOfLines={1}>
                    {leave.employeeSignatureName}
                  </Text>
                </View>
              ) : null}
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
    </KeyboardAvoidingView>
  );
};

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readRow}>
      <Text style={styles.readLabel}>{label}</Text>
      <Text style={styles.readValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  mainTitle: { fontSize: 18, fontWeight: '700', color: '#019ee3', marginBottom: 6 },
  hint: { fontSize: 13, color: '#666', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#222', marginTop: 16, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: { backgroundColor: '#f0f0f0', color: '#555' },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
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
  readonlyBlock: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  readRow: { marginBottom: 10 },
  readLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  readValue: { fontSize: 15, color: '#111', fontWeight: '500' },
  bulletBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  bulletItem: { fontSize: 13, color: '#333', marginBottom: 8, lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#019ee3',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: '#019ee3' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkLabel: { flex: 1, fontSize: 14, color: '#222', lineHeight: 20 },
  officeBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bbb',
    backgroundColor: '#fafafa',
  },
  officeNote: { fontSize: 13, color: '#555', lineHeight: 20 },
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
  cardValue: { fontSize: 14, color: '#333', flex: 1, textAlign: 'right' },
  statusChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 16 },
});

export default EmployeeLeaveFormScreen;
