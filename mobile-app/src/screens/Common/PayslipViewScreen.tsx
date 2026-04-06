import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildPayslipHtml } from '../../utils/payslipPdfHtml';

const formatDate = (d: any) => {
  if (d == null || d === '') return '-';
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN');
  } catch {
    return '-';
  }
};

const formatMoney = (n: any) => {
  const num = Number(n);
  if (n == null || n === '' || Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

const STAR = '★';
const STAR_EMPTY = '☆';

const PayslipViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useSelector((state: RootState) => state.auth);
  const id = (route.params as any)?.id;
  const [payslip, setPayslip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchPayslip = useCallback(async () => {
    if (!id || !token) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/payslip/${id}`, {
        headers: { Authorization: token },
      });
      if (data?.success) setPayslip(data.payslip);
      else Toast.show({ type: 'error', text1: 'Error', text2: data?.message || 'Payslip not found' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to load payslip' });
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => {
      fetchPayslip();
    }, [fetchPayslip])
  );

  const sharePdf = async () => {
    if (!payslip) return;
    try {
      setPdfLoading(true);
      const html = buildPayslipHtml(payslip);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share payslip',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Sharing unavailable',
          text2: 'PDF was generated but this device cannot open the share sheet.',
        });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not create or share PDF' });
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (!payslip) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Payslip not found</Text>
      </View>
    );
  }

  const emp = payslip.employeeId;
  const gross = Number(payslip.grossEarnings) || 0;
  const ded = Number(payslip.totalDeductions) ?? Number(payslip.deductions?.taxPayable) ?? 0;
  const net = Number(payslip.netPay) ?? gross - ded;
  const earnings = payslip.earnings || {};
  const ratings = payslip.ratings || {};
  const empName = (payslip.employeeName ?? emp?.name ?? '').toString().trim() || '-';
  const empIdNo = (payslip.employeeIdNo ?? '').toString().trim() || '-';
  const desig = payslip.designation ?? (Array.isArray(emp?.designation) ? emp?.designation[0] : emp?.designation);
  const designationStr = (desig != null ? String(desig).trim() : '') || '-';

  const earningsRows = [
    ['Basic', earnings.basic],
    ['Petrol Allowance', earnings.petrolAllowance],
    ['Bike Allowance', earnings.bikeAllowance],
    ['By Benefit', earnings.byBenefit],
    ['Food Allowance', earnings.foodAllowance],
    ['Incentives', earnings.incentives],
  ];

  const ratingLabels = ['Timing', 'Leave', 'Work FB', 'Incentive', 'Firm FB'];
  const ratingKeys = ['timing', 'leave', 'workFb', 'incentive', 'firmFb'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.pdfButton}
        onPress={sharePdf}
        disabled={pdfLoading}
        activeOpacity={0.85}
      >
        {pdfLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="picture-as-pdf" size={22} color="#fff" />
            <Text style={styles.pdfButtonText}>Share PDF</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.logo}>corp culture</Text>
        <Text style={styles.title}>PAYSLIP</Text>
      </View>
      <Text style={styles.sectionTitle}>EMPLOYEE PAY SUMMARY</Text>

      <View style={styles.twoCol}>
        <View style={styles.leftCol}>
          <Text style={styles.detail}>Employee Name: {empName}</Text>
          <Text style={styles.detail}>Employee ID: {empIdNo}</Text>
          <Text style={styles.detail}>Designation: {designationStr}</Text>
          <Text style={styles.detail}>Date of Joining: {formatDate(payslip.dateOfJoining)}</Text>
          <Text style={styles.detail}>Pay Period: {(payslip.payPeriod ?? '').toString().trim() || '-'}</Text>
          <Text style={styles.detail}>Pay Date: {formatDate(payslip.payDate)}</Text>
        </View>
        <View style={styles.netPayBox}>
          <Text style={styles.netPayLabel}>Employee Net Pay</Text>
          <Text style={styles.netPayAmount}>{formatMoney(net)}</Text>
          <Text style={styles.paidDays}>Paid Days: {payslip.paidDays ?? 0} | LOP Days: {payslip.lopDays ?? 0}</Text>
          <View style={styles.ratingsRow}>
            {ratingKeys.map((key, i) => {
              const v = Math.min(5, Math.max(0, Number(ratings[key]) || 0));
              return (
                <View key={key} style={styles.ratingItem}>
                  <Text style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((j) => (j <= v ? STAR : STAR_EMPTY))}
                  </Text>
                  <Text style={styles.ratingLabel}>{ratingLabels[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.tableWrap}>
        <View style={styles.tableRow}>
          <Text style={[styles.th, styles.thLeft]}>EARNINGS</Text>
          <Text style={[styles.th, styles.thCenter]}>AMOUNT</Text>
          <Text style={[styles.th, styles.thCenter]}>YTD</Text>
          <Text style={[styles.th, styles.thLeft]}>DEDUCTION</Text>
          <Text style={[styles.th, styles.thCenter]}>AMOUNT</Text>
          <Text style={[styles.th, styles.thCenter]}>YTD</Text>
        </View>
        {earningsRows.map(([label, val], i) => (
          <View key={label} style={styles.tableRow}>
            <Text style={[styles.td, styles.tdLeft]}>{label}</Text>
            <Text style={[styles.td, styles.tdRight]}>{formatMoney(val)}</Text>
            <Text style={[styles.td, styles.tdCenter]}>-</Text>
            <Text style={[styles.td, styles.tdLeft]}>{i === 0 ? 'Tax Payable' : '\u00A0'}</Text>
            <Text style={[styles.td, styles.tdRight]}>
              {i === 0 ? formatMoney(payslip.deductions?.taxPayable ?? 0) : '\u00A0'}
            </Text>
            <Text style={[styles.td, styles.tdCenter]}>-</Text>
          </View>
        ))}
        <View style={[styles.tableRow, styles.tableRowBold]}>
          <Text style={[styles.td, styles.tdLeft]}>Gross Earnings</Text>
          <Text style={[styles.td, styles.tdRight]}>{formatMoney(gross)}</Text>
          <Text style={[styles.td, styles.tdCenter]}>-</Text>
          <Text style={[styles.td, styles.tdLeft]}>Total Deductions</Text>
          <Text style={[styles.td, styles.tdRight]}>{formatMoney(ded)}</Text>
          <Text style={[styles.td, styles.tdCenter]}>-</Text>
        </View>
      </View>

      <View style={styles.totalBlock}>
        <Text style={styles.totalTitle}>TOTAL NET PAYABLE</Text>
        <Text style={styles.totalAmount}>{formatMoney(net)}</Text>
      </View>

      <Text style={styles.footer}>
        This document is system generated by Corp Culture; therefore, a signature is not required.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#019ee3',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  pdfButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#666' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 12,
  },
  logo: { fontSize: 16, fontWeight: '600', color: '#333' },
  title: { fontSize: 18, fontWeight: '700', color: '#333' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  twoCol: { flexDirection: 'row', marginBottom: 16 },
  leftCol: { width: '42%' },
  detail: { fontSize: 12, color: '#444', marginBottom: 6 },
  netPayBox: {
    width: '56%',
    backgroundColor: '#e6fbff',
    borderWidth: 1,
    borderColor: '#b3e5fc',
    borderRadius: 8,
    padding: 12,
  },
  netPayLabel: { fontSize: 12, fontWeight: '700', color: '#333', marginBottom: 4 },
  netPayAmount: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 4 },
  paidDays: { fontSize: 11, color: '#555', marginBottom: 8 },
  ratingsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ratingItem: { alignItems: 'center' },
  stars: { fontSize: 10, color: '#333' },
  ratingLabel: { fontSize: 8, color: '#666', marginTop: 2 },
  tableWrap: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 16 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8, paddingHorizontal: 8 },
  tableRowBold: { backgroundColor: '#f5f5f5', fontWeight: '600' },
  th: { fontSize: 11, fontWeight: '700', flex: 1 },
  thLeft: { textAlign: 'left' },
  thCenter: { textAlign: 'center' },
  td: { fontSize: 11, flex: 1 },
  tdLeft: { textAlign: 'left' },
  tdRight: { textAlign: 'right' },
  tdCenter: { textAlign: 'center' },
  totalBlock: {
    backgroundColor: '#e6fbff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b3e5fc',
    marginBottom: 16,
  },
  totalTitle: { fontSize: 14, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 4 },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#019ee3', textAlign: 'center' },
  footer: { fontSize: 10, color: '#666', textAlign: 'center' },
});

export default PayslipViewScreen;
