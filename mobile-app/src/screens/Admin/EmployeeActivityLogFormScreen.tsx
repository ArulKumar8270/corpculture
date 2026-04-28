import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
  FlatList,
  Pressable,
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
  const preselectedFromCompanyId = (route.params as any)?.preselectedFromCompanyId as string | undefined;
  const isEdit = !!editLogId;
  const [editLogRaw, setEditLogRaw] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [fromCompany, setFromCompany] = useState<any>(null);
  const [toCompany, setToCompany] = useState<any>(null);
  const [companyPicker, setCompanyPicker] = useState<'from' | 'to' | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [petrolPricePerKm, setPetrolPricePerKm] = useState(0);

  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => (c.companyName || '').toLowerCase().includes(q));
  }, [companies, companySearch]);
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

  useEffect(() => {
    const fetchPetrolPrice = async () => {
      if (!token) return;
      try {
        const { data } = await axios.get(`${getApiBaseUrl()}/common-details`, {
          headers: { Authorization: token || '' },
        });
        if (data?.success) {
          const v = Number(data?.commonDetails?.petrolPricePerKm || 0);
          setPetrolPricePerKm(Number.isFinite(v) ? v : 0);
        }
      } catch {
        setPetrolPricePerKm(0);
      }
    };
    fetchPetrolPrice();
  }, [token]);

  const calcAmount = (km: unknown) => {
    const n = Number(km);
    if (!Number.isFinite(n)) return 0;
    return n * petrolPricePerKm;
  };

  const normalizeTime = (t: unknown) => {
    if (!t) return '';
    const raw = String(t).trim();
    if (!raw) return '';
    const s = raw.replace('.', ':');
    const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!m) return raw;
    const hh = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const isKmChangedOnEdit = () => {
    if (!isEdit) return false;
    const cur = Number(form.km);
    const orig = Number(editLogRaw?.km);
    if (!Number.isFinite(cur) || !Number.isFinite(orig)) return false;
    return cur !== orig;
  };

  const amountForCurrentKm = () => {
    const v = calcAmount(form.km);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };

  const getAmountDisplay = () => {
    if (isEdit && isKmChangedOnEdit()) {
      return petrolPricePerKm > 0 && form.km !== '' ? amountForCurrentKm().toFixed(2) : '';
    }
    if (isEdit) {
      const stored = Number(editLogRaw?.petrolAmount);
      if (Number.isFinite(stored)) return stored.toFixed(2);
    }
    return petrolPricePerKm > 0 && form.km !== '' ? amountForCurrentKm().toFixed(2) : '';
  };

  const getAmountHint = () => {
    if (isEdit) {
      if (isKmChangedOnEdit()) {
        return petrolPricePerKm > 0 ? `Updated as KM × ₹${petrolPricePerKm}/KM` : 'Set Petrol Price (₹/KM) in Settings';
      }
      return 'Saved amount from DB';
    }
    return petrolPricePerKm > 0 ? `KM × ₹${petrolPricePerKm}/KM` : 'Set Petrol Price (₹/KM) in Settings';
  };

  const petrolAmountForPayload = () => {
    if (petrolPricePerKm > 0 && form.km !== '') return amountForCurrentKm();
    const stored = Number(editLogRaw?.petrolAmount);
    if (isEdit && Number.isFinite(stored) && stored >= 0) return stored;
    return 0;
  };

  const fetchLogForEdit = useCallback(async () => {
    if (!token || !editLogId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/employee-activity-log/admin/${editLogId}`, {
        headers: { Authorization: token || '' },
      });
      if (!data?.success || !data?.activityLog) {
        Toast.show({ type: 'error', text1: data?.message || 'Failed to load petrol form' });
        return;
      }
      const log = data.activityLog;
      setEditLogRaw(log);
      const fromId = (log.fromCompany?._id || log.fromCompany)?.toString();
      const toId = (log.toCompany?._id || log.toCompany)?.toString();
      setFromCompany(
        fromId
          ? companiesById[fromId] || { _id: fromId, companyName: log.fromCompanyName || '—' }
          : log.fromCompanyName
            ? { _id: 'from_legacy', companyName: log.fromCompanyName }
            : null
      );
      setToCompany(
        toId
          ? companiesById[toId] || { _id: toId, companyName: log.toCompanyName || '—' }
          : log.toCompanyName
            ? { _id: 'to_legacy', companyName: log.toCompanyName }
            : null
      );
      setForm((prev) => ({
        ...prev,
        date: log?.date ? new Date(log.date).toISOString().split('T')[0] : prev.date,
        km: log?.km != null ? String(log.km) : '',
        inTime: normalizeTime(log?.inTime),
        outTime: normalizeTime(log?.outTime),
        callType: log?.callType || '',
        status: log?.status === 'PAID' ? 'PAID' : 'UNPAID',
        remarks: log?.remarks || '',
      }));
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Failed to load petrol form',
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

  useEffect(() => {
    if (isEdit) return;
    if (!preselectedFromCompanyId) return;
    const c = companiesById[String(preselectedFromCompanyId)];
    if (c?._id) {
      setFromCompany(c);
    }
  }, [isEdit, preselectedFromCompanyId, companiesById]);

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
        petrolAmount: petrolAmountForPayload(),
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
        Toast.show({ type: 'success', text1: isEdit ? 'Petrol form updated' : 'Petrol form created successfully' });
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
        Toast.show({ type: 'error', text1: data?.message || 'Failed to create petrol form' });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Failed to create petrol form',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company: any) => {
    if (companyPicker === 'from') setFromCompany(company);
    else if (companyPicker === 'to') setToCompany(company);
    setCompanyPicker(null);
    setCompanySearch('');
  };

  const openCompanyPicker = (which: 'from' | 'to') => {
    setCompanySearch('');
    setCompanyPicker(which);
  };

  const closeCompanyPicker = () => {
    setCompanyPicker(null);
    setCompanySearch('');
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
          onPress={() => openCompanyPicker('from')}
        >
          <Text style={fromCompany ? styles.pickerText : styles.pickerPlaceholder}>
            {fromCompany?.companyName || 'Select company'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>To Company *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => openCompanyPicker('to')}
        >
          <Text style={toCompany ? styles.pickerText : styles.pickerPlaceholder}>
            {toCompany?.companyName || 'Select company'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>KM</Text>
        <TextInput
          style={styles.input}
          value={form.km}
          onChangeText={(t) => setForm((f) => ({ ...f, km: t }))}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={getAmountDisplay()}
          editable={false}
          placeholder={getAmountHint()}
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

      <Modal
        visible={!!companyPicker}
        transparent
        animationType="fade"
        onRequestClose={closeCompanyPicker}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeCompanyPicker} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {companyPicker === 'from' ? 'From company' : 'To company'}
            </Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search companies…"
              placeholderTextColor="#999"
              value={companySearch}
              onChangeText={setCompanySearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <FlatList
              data={filteredCompanies}
              keyExtractor={(item) => String(item._id)}
              style={styles.modalListScroll}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectCompany(item)}
                >
                  <Text style={styles.modalItemText} numberOfLines={2}>
                    {item.companyName}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.modalEmpty}>No companies match your search.</Text>
              }
            />
            <TouchableOpacity style={styles.modalCancelBtn} onPress={closeCompanyPicker}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  inputDisabled: { backgroundColor: '#f0f0f0', color: '#555' },
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
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  modalListScroll: { flexGrow: 0, maxHeight: 360 },
  modalItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 16, color: '#333' },
  modalEmpty: { padding: 20, textAlign: 'center', color: '#888', fontSize: 15 },
  modalCancelBtn: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  cancelText: { fontSize: 16, color: '#019ee3', fontWeight: '600' },
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
