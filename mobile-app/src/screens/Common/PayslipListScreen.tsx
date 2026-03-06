import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';

const formatMoney = (n: any) => {
  const num = Number(n);
  if (n == null || n === '' || Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

const PayslipListScreen = () => {
  const navigation = useNavigation();
  const { token } = useSelector((state: RootState) => state.auth);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayslips = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/payslip/my`, {
        headers: { Authorization: token || '' },
      });
      if (data?.success) {
        setPayslips(data.payslips || []);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: data?.message || 'Failed to load payslips' });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to load payslips',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchPayslips();
    }, [fetchPayslips])
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PayslipView' as never, { id: item._id } as never)}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        <Text style={styles.label}>Pay Period</Text>
        <Text style={styles.value}>{item.payPeriod || '-'}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Net Pay</Text>
        <Text style={styles.netPay}>{formatMoney(item.netPay)}</Text>
      </View>
      {item.payDate && (
        <View style={styles.cardRow}>
          <Text style={styles.label}>Pay Date</Text>
          <Text style={styles.value}>{new Date(item.payDate).toLocaleDateString('en-IN')}</Text>
        </View>
      )}
      <View style={styles.arrow}>
        <Icon name="chevron-right" size={24} color="#019ee3" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={payslips}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={payslips.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="receipt-long" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No payslips found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 24 },
  emptyList: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, color: '#333', fontWeight: '500' },
  netPay: { fontSize: 16, color: '#019ee3', fontWeight: '700' },
  arrow: { position: 'absolute', right: 12, top: '50%', marginTop: -12 },
});

export default PayslipListScreen;
