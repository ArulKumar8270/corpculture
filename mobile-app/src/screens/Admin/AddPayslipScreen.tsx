import React, { useEffect, useState, useMemo, useLayoutEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

const defaultEarnings = {
  basic: 0,
  petrolAllowance: 0,
  bikeAllowance: 0,
  byBenefit: 0,
  foodAllowance: 0,
  incentives: 0,
};
const defaultDeductions = { taxPayable: 0, advanceAmount: 0 };
const defaultRatings = { timing: 0, leave: 0, workFb: 0, incentive: 0, firmFb: 0 };

function parseMoney(v: unknown): number {
  if (v == null || v === '') return 0;
  const s = typeof v === 'string' ? v.replace(/,/g, '') : String(v);
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function formatPayPeriod(ymd: string) {
  if (!ymd) return '';
  const d = new Date(ymd + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/** Reverse server "MMM YYYY" (e.g. Apr 2026) to first-of-month YYYY-MM-DD for the date field. */
function payPeriodLabelToYmd(payPeriod: string, payDateFallback: string) {
  const fb = payDateFallback ? new Date(payDateFallback) : new Date();
  const fallbackYmd = `${fb.getFullYear()}-${String(fb.getMonth() + 1).padStart(2, '0')}-01`;
  if (!payPeriod || typeof payPeriod !== 'string') return fallbackYmd;
  const m = payPeriod.trim().match(/^([A-Za-z]{3,})\s+(\d{4})$/);
  if (!m) return fallbackYmd;
  const d = new Date(`${m[1]} 1, ${m[2]}`);
  if (Number.isNaN(d.getTime())) return fallbackYmd;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function cleanAuthHeader(raw: string | null | undefined) {
  if (!raw) return '';
  return String(raw)
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^"(.*)"$/, '$1')
    .trim();
}

const AddPayslipScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const payslipId = route.params?.payslipId as string | undefined;
  const { token } = useSelector((s: RootState) => s.auth);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeIdNo, setEmployeeIdNo] = useState('');
  const [designation, setDesignation] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const today = new Date();
  const defaultPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultPay = today.toISOString().split('T')[0];
  const [payPeriodDate, setPayPeriodDate] = useState(defaultPeriod);
  const [payDate, setPayDate] = useState(defaultPay);
  const [paidDays, setPaidDays] = useState('31');
  const [lopDays, setLopDays] = useState('0');
  const [earnings, setEarnings] = useState({ ...defaultEarnings });
  const [deductions, setDeductions] = useState({ ...defaultDeductions });
  const [ratings, setRatings] = useState({ ...defaultRatings });
  const [totalKm, setTotalKm] = useState(0);
  const [kmLoading, setKmLoading] = useState(false);
  const [petrolPricePerKm, setPetrolPricePerKm] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [initializingEdit, setInitializingEdit] = useState(!!payslipId);
  const employeeCompSyncSeq = useRef(0);
  const employeesRef = useRef<any[]>([]);

  const auth = useMemo(() => cleanAuthHeader(token), [token]);
  const apiBase = useMemo(() => String(getApiBaseUrl() || '').replace(/\/$/, ''), []);

  useLayoutEffect(() => {
    navigation.setOptions({ title: payslipId ? 'Edit Payslip' : 'Add Payslip' });
  }, [navigation, payslipId]);

  useEffect(() => {
    const run = async () => {
      if (!auth) return;
      try {
        const { data } = await axios.get(`${apiBase}/employee/all`, {
          headers: { Authorization: auth },
        });
        if (data?.success) setEmployees(data.employees || []);
      } catch {
        Toast.show({ type: 'error', text1: 'Failed to load employees' });
      }
    };
    run();
  }, [auth, apiBase]);

  employeesRef.current = employees;

  const selectedEmployeeCompKey = useMemo(() => {
    const e = employees.find((x) => String(x?._id ?? '') === String(employeeId));
    if (!e || !employeeId) return '';
    return `${employeeId}:${parseMoney(e.salary)}:${parseMoney(e.bikeAllowance ?? e.bike_allowance)}`;
  }, [employees, employeeId]);

  useEffect(() => {
    if (!employeeId) return;
    const list = employeesRef.current;
    const empFromList = list.find((e) => String(e?._id ?? '') === String(employeeId));

    const seq = ++employeeCompSyncSeq.current;

    const applyFromEmployee = (emp: any) => {
      if (!emp || seq !== employeeCompSyncSeq.current) return;
      setEmployeeName(emp.name || '');
      setEmployeeIdNo(emp.idCradNo || emp.employeeIdNo || '');
      const des = Array.isArray(emp.designation) ? emp.designation[0] : emp.designation || '';
      setDesignation(des || '');
      setDateOfJoining(emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : '');
      const basic = parseMoney(emp.salary);
      const bike = parseMoney(emp.bikeAllowance ?? emp.bike_allowance);
      setEarnings((prev) => ({
        ...prev,
        basic,
        bikeAllowance: bike,
      }));
    };

    (async () => {
      if (!auth) {
        if (empFromList) applyFromEmployee(empFromList);
        return;
      }
      try {
        const { data } = await axios.get(
          `${apiBase}/employee/get/${encodeURIComponent(employeeId)}`,
          { headers: { Authorization: auth }, params: { _: Date.now() } }
        );
        if (seq !== employeeCompSyncSeq.current) return;
        if (data?.success && data.employee) {
          applyFromEmployee(data.employee);
          return;
        }
      } catch {
        /* fallback */
      }
      if (seq !== employeeCompSyncSeq.current) return;
      if (empFromList) applyFromEmployee(empFromList);
    })();
  }, [employeeId, auth, apiBase, employees.length, selectedEmployeeCompKey]);

  const hydrateFromPayslip = useCallback((p: any) => {
    const empRef = p?.employeeId;
    const empId =
      typeof empRef === 'object' && empRef?._id != null
        ? String(empRef._id)
        : empRef != null
          ? String(empRef)
          : '';
    setEmployeeId(empId);
    setEmployeeName(p?.employeeName || '');
    setEmployeeIdNo(p?.employeeIdNo != null ? String(p.employeeIdNo) : '');
    setDesignation(p?.designation != null ? String(p.designation) : '');
    const doj = p?.dateOfJoining ? new Date(p.dateOfJoining).toISOString().split('T')[0] : '';
    setDateOfJoining(doj);
    const pd = p?.payDate ? new Date(p.payDate).toISOString().split('T')[0] : '';
    setPayPeriodDate(payPeriodLabelToYmd(String(p?.payPeriod || ''), pd));
    setPayDate(pd || new Date().toISOString().split('T')[0]);
    setPaidDays(String(p?.paidDays ?? 31));
    setLopDays(String(p?.lopDays ?? 0));
    setEarnings({ ...defaultEarnings, ...(p?.earnings || {}) });
    setDeductions({ ...defaultDeductions, ...(p?.deductions || {}) });
    setRatings({ ...defaultRatings, ...(p?.ratings || {}) });
  }, []);

  useEffect(() => {
    if (!payslipId || !auth) {
      setInitializingEdit(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setInitializingEdit(true);
        const { data } = await axios.get(`${apiBase}/payslip/${payslipId}`, {
          headers: { Authorization: auth },
        });
        if (cancelled) return;
        if (data?.success && data.payslip) {
          hydrateFromPayslip(data.payslip);
        } else {
          Toast.show({ type: 'error', text1: data?.message || 'Payslip not found' });
          navigation.goBack();
        }
      } catch (e: any) {
        if (!cancelled) {
          Toast.show({
            type: 'error',
            text1: e?.response?.data?.message || 'Failed to load payslip',
          });
          navigation.goBack();
        }
      } finally {
        if (!cancelled) setInitializingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payslipId, auth, apiBase, navigation, hydrateFromPayslip]);

  useEffect(() => {
    let cancelled = false;
    const fetchKm = async () => {
      if (!auth || !employeeId || !payPeriodDate || !payDate) {
        setTotalKm(0);
        setEarnings((p) => ({ ...p, petrolAllowance: 0 }));
        return;
      }
      try {
        setKmLoading(true);
        setTotalKm(0);
        const params = new URLSearchParams({
          page: '1',
          limit: '1000',
          employeeId,
          fromDate: payPeriodDate,
          toDate: payDate,
        });
        const { data } = await axios.get(
          `${apiBase}/employee-activity-log/admin/all?${params.toString()}`,
          { headers: { Authorization: auth } }
        );
        if (cancelled) return;
        const logs = Array.isArray(data?.activityLogs) ? data.activityLogs : [];
        const sum = logs.reduce((s: number, l: any) => s + (Number(l?.km) || 0), 0);
        setTotalKm(sum);
      } catch {
        if (!cancelled) setTotalKm(0);
      } finally {
        if (!cancelled) setKmLoading(false);
      }
    };
    fetchKm();
    return () => {
      cancelled = true;
    };
  }, [auth, apiBase, employeeId, payPeriodDate, payDate]);

  useEffect(() => {
    const fetchPetrolPrice = async () => {
      if (!auth) return;
      try {
        const { data } = await axios.get(`${apiBase}/common-details`, {
          headers: { Authorization: auth },
        });
        if (data?.success) {
          const v = Number(data?.commonDetails?.petrolPricePerKm || 0);
          setPetrolPricePerKm(Number.isFinite(v) ? v : 0);
        } else {
          setPetrolPricePerKm(0);
        }
      } catch {
        setPetrolPricePerKm(0);
      }
    };
    fetchPetrolPrice();
  }, [auth, apiBase]);

  useEffect(() => {
    const km = Number(totalKm || 0);
    const price = Number(petrolPricePerKm || 0);
    const amount =
      Number.isFinite(km) && Number.isFinite(price) && km > 0 && price > 0 ? km * price : 0;
    setEarnings((p) => ({ ...p, petrolAllowance: amount }));
  }, [totalKm, petrolPricePerKm]);

  const grossEarnings = useMemo(
    () => Object.values(earnings).reduce((a, b) => a + b, 0),
    [earnings]
  );
  const totalDeductions = useMemo(
    () => Object.values(deductions).reduce((a, b) => a + b, 0),
    [deductions]
  );
  const netPay = grossEarnings - totalDeductions;

  const submit = async () => {
    if (!employeeId || !payPeriodDate || !payDate) {
      Toast.show({ type: 'error', text1: 'Select employee, pay period and pay date' });
      return;
    }
    const payPeriod = formatPayPeriod(payPeriodDate);
    if (!auth) {
      Toast.show({ type: 'error', text1: 'Not signed in' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        employeeId,
        employeeName,
        employeeIdNo,
        designation,
        dateOfJoining: dateOfJoining || undefined,
        payPeriod,
        payDate,
        paidDays: Number(paidDays) || 0,
        lopDays: Number(lopDays) || 0,
        earnings,
        deductions,
        ratings,
      };
      if (payslipId) {
        const { data } = await axios.put(`${apiBase}/payslip/${payslipId}`, payload, {
          headers: { Authorization: auth },
        });
        if (data?.success) {
          Toast.show({ type: 'success', text1: 'Payslip updated' });
          navigation.navigate('AdminPayslipList');
        } else {
          Toast.show({ type: 'error', text1: data?.message || 'Failed to update' });
        }
      } else {
        const { data } = await axios.post(`${apiBase}/payslip/create`, payload, {
          headers: { Authorization: auth },
        });
        if (data?.success) {
          Toast.show({ type: 'success', text1: 'Payslip created' });
          navigation.navigate('AdminPayslipList');
        } else {
          Toast.show({ type: 'error', text1: data?.message || 'Failed' });
        }
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.response?.data?.message || (payslipId ? 'Failed to update payslip' : 'Failed to create payslip'),
      });
    } finally {
      setLoading(false);
    }
  };

  const earningKeys = Object.keys(defaultEarnings) as (keyof typeof defaultEarnings)[];
  const ratingKeys = Object.keys(defaultRatings) as (keyof typeof defaultRatings)[];

  if (initializingEdit) {
    return (
      <View style={styles.initWrap}>
        <ActivityIndicator size="large" color="#019ee3" />
        <Text style={styles.initText}>Loading payslip…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.section}>Employee</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setPickerOpen(true)}>
          <Text style={styles.selectBtnText}>
            {employeeId
              ? employees.find((e) => e._id === employeeId)?.name || 'Selected'
              : 'Select employee'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        <Field label="Name" value={employeeName} onChangeText={setEmployeeName} />
        <Field label="Employee ID No" value={employeeIdNo} onChangeText={setEmployeeIdNo} />
        <Field label="Designation" value={designation} onChangeText={setDesignation} />
        <Field label="Date of joining (YYYY-MM-DD)" value={dateOfJoining} onChangeText={setDateOfJoining} />

        <Text style={styles.section}>Pay</Text>
        <Field label="Pay period (YYYY-MM-DD)" value={payPeriodDate} onChangeText={setPayPeriodDate} />
        <Field label="Pay date (YYYY-MM-DD)" value={payDate} onChangeText={setPayDate} />
        <View style={styles.kmBox}>
          <Text style={styles.kmTitle}>Total KM (activity logs)</Text>
          <Text style={styles.kmVal}>
            {kmLoading ? 'Loading…' : `${Number(totalKm).toLocaleString('en-IN')} km`}
          </Text>
        </View>
        <Field label="Paid days" value={paidDays} onChangeText={setPaidDays} keyboard="numeric" />
        <Field label="LOP days" value={lopDays} onChangeText={setLopDays} keyboard="numeric" />

        <Text style={styles.section}>Earnings</Text>
        {earningKeys.map((key) => (
          <Field
            key={key}
            label={key.replace(/([A-Z])/g, ' $1').trim()}
            value={String(earnings[key])}
            onChangeText={(v) =>
              setEarnings((p) => ({ ...p, [key]: Number(v) || 0 }))
            }
            keyboard="decimal-pad"
            editable={key !== 'petrolAllowance' && key !== 'bikeAllowance'}
            helper={
              key === 'bikeAllowance'
                ? 'From employee profile (update in Add/Edit Employee)'
                : key === 'petrolAllowance'
                  ? petrolPricePerKm > 0
                    ? `Auto: ${Number(totalKm).toLocaleString('en-IN')} km × ₹${petrolPricePerKm}/KM`
                    : `Total KM: ${Number(totalKm).toLocaleString('en-IN')} km (set Petrol Price ₹/KM in Settings)`
                  : undefined
            }
          />
        ))}

        <Text style={styles.section}>Deductions</Text>
        <Field
          label="Tax payable"
          value={String(deductions.taxPayable)}
          onChangeText={(v) =>
            setDeductions((p) => ({ ...p, taxPayable: Number(v) || 0 }))
          }
          keyboard="decimal-pad"
        />
        <Field
          label="Advance amount"
          value={String(deductions.advanceAmount)}
          onChangeText={(v) =>
            setDeductions((p) => ({ ...p, advanceAmount: Number(v) || 0 }))
          }
          keyboard="decimal-pad"
          helper="Advance recovery / deduction from salary"
        />

        <Text style={styles.section}>Ratings (0–5)</Text>
        {ratingKeys.map((key) => (
          <Field
            key={key}
            label={key}
            value={String(ratings[key])}
            onChangeText={(v) =>
              setRatings((p) => ({ ...p, [key]: Number(v) || 0 }))
            }
            keyboard="decimal-pad"
          />
        ))}

        <Text style={styles.summary}>
          Gross ₹{grossEarnings.toLocaleString('en-IN')} · Deductions ₹
          {totalDeductions.toLocaleString('en-IN')} · Net ₹{netPay.toLocaleString('en-IN')}
        </Text>

        <TouchableOpacity style={styles.submit} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{payslipId ? 'Save changes' : 'Submit payslip'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ModalEmployeePicker
        visible={pickerOpen}
        employees={employees}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => {
          setEmployeeId(id);
          setPickerOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
};

function Field({
  label,
  value,
  onChangeText,
  keyboard,
  helper,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboard?: 'numeric' | 'decimal-pad';
  helper?: string;
  editable?: boolean;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard || 'default'}
        editable={editable}
      />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

function ModalEmployeePicker({
  visible,
  employees,
  onClose,
  onSelect,
}: {
  visible: boolean;
  employees: any[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerModal} onStartShouldSetResponder={() => true}>
          <Text style={styles.pickerTitle}>Select employee</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {employees.map((emp) => (
              <TouchableOpacity
                key={emp._id}
                style={styles.pickerRow}
                onPress={() => onSelect(String(emp._id))}
              >
                <Text>
                  {emp.name} ({emp.email})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.cancelPick} onPress={onClose}>
            <Text style={styles.cancelPickText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  initWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  initText: { marginTop: 12, color: '#666' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  section: { fontSize: 16, fontWeight: '700', color: '#019ee3', marginTop: 16, marginBottom: 8 },
  label: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  inputDisabled: { backgroundColor: '#f0f0f0', color: '#555' },
  helper: { fontSize: 11, color: '#888', marginTop: 2 },
  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  selectBtnText: { fontSize: 15, color: '#222' },
  kmBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cfe8fc',
  },
  kmTitle: { fontWeight: '600', color: '#019ee3' },
  kmVal: { marginTop: 4, color: '#444' },
  summary: { fontSize: 15, fontWeight: '600', marginVertical: 16, color: '#222' },
  submit: {
    backgroundColor: '#019ee3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerModal: { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '80%' },
  pickerTitle: { fontWeight: '700', fontSize: 17, marginBottom: 12 },
  pickerRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cancelPick: { marginTop: 12, alignItems: 'center' },
  cancelPickText: { color: '#019ee3', fontWeight: '600' },
});

export default AddPayslipScreen;
