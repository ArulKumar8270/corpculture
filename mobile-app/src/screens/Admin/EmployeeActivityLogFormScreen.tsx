import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { getApiBaseUrl } from '../../services/api';

const CALL_TYPES = [
  'NEW SERVICE CALLS',
  'PENDING CALLS',
  'REWORK CALLS',
  'DELIVERY CALLS',
  'CHEQUE COLLATION',
  'BILL SIGNATURE',
];

const EmployeeActivityLogFormScreen = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const route = useRoute();
  const editLogId = (route.params as any)?.editLogId as string | undefined;
  const isEdit = !!editLogId;
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [fromCompany, setFromCompany] = useState<any>(null);
  const [toCompany, setToCompany] = useState<any>(null);
  const [companyPicker, setCompanyPicker] = useState<'from' | 'to' | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    km: '',
    inTime: '',
    outTime: '',
    callType: '',
    status: 'UNPAID' as 'PAID' | 'UNPAID',
    remarks: '',
  });

  const companiesById = useMemo(() => {
    const map: Record<string, any> = {};
    (companies || []).forEach((c) => {
      if (c?._id) map[String(c._id)] = c;
    });
    return map;
  }, [companies]);

  useFocusEffect(
    useCallback(() => {
      if (token) fetchCompanies();
    }, [token])
  );

  const fetchLogForEdit = useCallback(async () => {
    if (!token || !editLogId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/employee-activity-log/admin/${editLogId}`, {
        headers: { Authorization: token || '' },
      });
      if (!data?.success || !data?.activityLog) {
        Toast.show({ type: 'error', text1: data?.message || 'Failed to load activity log' });
        return;
      }
      const log = data.activityLog;
      const fromId = (log.fromCompany?._id || log.fromCompany)?.toString();
      const toId = (log.toCompany?._id || log.toCompany)?.toString();
      setFromCompany(fromId ? companiesById[fromId] || null : null);
      setToCompany(toId ? companiesById[toId] || null : null);
      setForm((prev) => ({
        ...prev,
        date: log?.date ? new Date(log.date).toISOString().split('T')[0] : prev.date,
        km: log?.km != null ? String(log.km) : '',
        inTime: log?.inTime || '',
        outTime: log?.outTime || '',
        callType: log?.callType || '',
        status: log?.status === 'PAID' ? 'PAID' : 'UNPAID',
        remarks: log?.remarks || '',
      }));
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Failed to load activity log',
      });
    } finally {
      setLoading(false);
    }
  }, [token, editLogId, companiesById]);

  useEffect(() => {
    if (isEdit && companies.length > 0) {
      fetchLogForEdit();
    }
  }, [isEdit, companies.length, fetchLogForEdit]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/company/all?limit=500`, {
        headers: { Authorization: token || '' },
      });
      if (data?.success) {
        setCompanies(data.companies || []);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to fetch companies',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.date) {
      Toast.show({ type: 'error', text1: 'Please select a date' });
      return;
    }
    if (!fromCompany || !toCompany) {
      Toast.show({ type: 'error', text1: 'Please select both From Company and To Company' });
      return;
    }
    try {
      setLoading(true);
      const payload = {
        date: form.date,
        fromCompany: fromCompany._id,
        fromCompanyName: fromCompany.companyName || '',
        fromAddressLine: (fromCompany.billingAddress || '').trim() || undefined,
        fromPincode: fromCompany.pincode ? String(fromCompany.pincode) : undefined,
        toCompany: toCompany._id,
        toCompanyName: toCompany.companyName || '',
        toAddressLine: (toCompany.billingAddress || '').trim() || undefined,
        toPincode: toCompany.pincode ? String(toCompany.pincode) : undefined,
        km: form.km ? Number(form.km) : 0,
        inTime: form.inTime || undefined,
        outTime: form.outTime || undefined,
        callType: form.callType || undefined,
        status: form.status,
        remarks: form.remarks || undefined,
      };

      const url = isEdit
        ? `${getApiBaseUrl()}/employee-activity-log/admin/update/${editLogId}`
        : `${getApiBaseUrl()}/employee-activity-log/create`;

      const { data } = isEdit
        ? await axios.put(url, payload, { headers: { Authorization: token || '' } })
        : await axios.post(url, payload, { headers: { Authorization: token || '' } });
      if (data?.success) {
        Toast.show({ type: 'success', text1: isEdit ? 'Activity log updated' : 'Activity log created successfully' });
        if (!isEdit) {
          setForm({
            date: new Date().toISOString().split('T')[0],
            km: '',
            inTime: '',
            outTime: '',
            callType: '',
            status: 'UNPAID',
            remarks: '',
          });
          setFromCompany(null);
          setToCompany(null);
        }
      } else {
        Toast.show({ type: 'error', text1: data?.message || 'Failed to create activity log' });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Failed to create activity log',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company: any) => {
    if (companyPicker === 'from') setFromCompany(company);
    else if (companyPicker === 'to') setToCompany(company);
    setCompanyPicker(null);
  };

  if (loadingCompanies) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          value={form.date}
          onChangeText={(t) => setForm((f) => ({ ...f, date: t }))}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>From Company *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setCompanyPicker('from')}
        >
          <Text style={fromCompany ? styles.pickerText : styles.pickerPlaceholder}>
            {fromCompany?.companyName || 'Select company'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>To Company *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setCompanyPicker('to')}
        >
          <Text style={toCompany ? styles.pickerText : styles.pickerPlaceholder}>
            {toCompany?.companyName || 'Select company'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        {companyPicker && (
          <View style={styles.modalList}>
            {companies.map((c) => (
              <TouchableOpacity
                key={c._id}
                style={styles.modalItem}
                onPress={() => selectCompany(c)}
              >
                <Text style={styles.modalItemText}>{c.companyName}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => setCompanyPicker(null)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>KM</Text>
        <TextInput
          style={styles.input}
          value={form.km}
          onChangeText={(t) => setForm((f) => ({ ...f, km: t }))}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>In Time</Text>
        <TextInput
          style={styles.input}
          value={form.inTime}
          onChangeText={(t) => setForm((f) => ({ ...f, inTime: t }))}
          placeholder="e.g. 09:00"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Out Time</Text>
        <TextInput
          style={styles.input}
          value={form.outTime}
          onChangeText={(t) => setForm((f) => ({ ...f, outTime: t }))}
          placeholder="e.g. 18:00"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Call Type</Text>
        <View style={styles.chipRow}>
          {CALL_TYPES.map((ct) => (
            <TouchableOpacity
              key={ct}
              style={[styles.chip, form.callType === ct && styles.chipSelected]}
              onPress={() => setForm((f) => ({ ...f, callType: ct }))}
            >
              <Text style={[styles.chipText, form.callType === ct && styles.chipTextSelected]}>
                {ct}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setForm((f) => ({ ...f, status: 'UNPAID' }))}
          >
            <View style={[styles.radio, form.status === 'UNPAID' && styles.radioSelected]} />
            <Text>UNPAID</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setForm((f) => ({ ...f, status: 'PAID' }))}
          >
            <View style={[styles.radio, form.status === 'PAID' && styles.radioSelected]} />
            <Text>PAID</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Remarks</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.remarks}
          onChangeText={(t) => setForm((f) => ({ ...f, remarks: t }))}
          placeholder="Remarks"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerText: { fontSize: 16, color: '#333' },
  pickerPlaceholder: { fontSize: 16, color: '#999' },
  modalList: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginTop: 8, maxHeight: 200 },
  modalItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 16, color: '#333' },
  cancelText: { fontSize: 16, color: '#019ee3' },
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
  radioRow: { flexDirection: 'row', marginTop: 8 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#019ee3', marginRight: 8 },
  radioSelected: { backgroundColor: '#019ee3' },
  submitBtn: {
    backgroundColor: '#019ee3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default EmployeeActivityLogFormScreen;
