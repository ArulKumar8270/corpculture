import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

const AdminPayslipListScreen = () => {
  const navigation = useNavigation<any>();
  const { token, user } = useSelector((s: RootState) => s.auth);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 1 || Number(user?.role) === 1;

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/payslip/all`, {
        headers: { Authorization: token },
      });
      if (data?.success) setPayslips(data.payslips || []);
      else setPayslips([]);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load payslips' });
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [token])
  );

  const formatDate = (d: any) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
  const formatMoney = (n: any) =>
    n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payslips</Text>
        {isAdmin ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddPayslip')}
          >
            <Icon name="add" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#019ee3" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={payslips}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No payslips yet. Add one for an employee.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AdminPayslipView', { id: item._id })}
            >
              <Text style={styles.empName}>{item.employeeName || item.employeeId?.name || '—'}</Text>
              <Text style={styles.row}>Period: {item.payPeriod}</Text>
              <Text style={styles.row}>Pay date: {formatDate(item.payDate)}</Text>
              <Text style={styles.net}>Net: {formatMoney(item.netPay)}</Text>
              <Text style={styles.view}>View →</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#019ee3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  empName: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 6 },
  row: { fontSize: 13, color: '#666', marginBottom: 2 },
  net: { fontSize: 15, fontWeight: '600', color: '#019ee3', marginTop: 6 },
  view: { fontSize: 13, color: '#019ee3', marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#888', paddingHorizontal: 24 },
});

export default AdminPayslipListScreen;
