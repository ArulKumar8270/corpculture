import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
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

  const cleanAuthHeader = (raw: string | null | undefined) => {
    if (!raw) return '';
    return String(raw)
      .trim()
      .replace(/^Bearer\s+/i, '')
      .replace(/^"(.*)"$/, '$1')
      .trim();
  };

  const load = useCallback(async () => {
    const auth = cleanAuthHeader(token);
    if (!auth) {
      setPayslips([]);
      setLoading(false);
      return;
    }
    const base = String(getApiBaseUrl() || '').replace(/\/$/, '');
    try {
      setLoading(true);
      const { data } = await axios.get(`${base}/payslip/all`, {
        headers: { Authorization: auth },
      });
      if (data?.success) {
        setPayslips(Array.isArray(data.payslips) ? data.payslips : []);
      } else {
        setPayslips([]);
        Toast.show({
          type: 'error',
          text1: 'Payslips',
          text2: data?.message || 'Failed to load payslips.',
        });
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load payslips.';
      Toast.show({ type: 'error', text1: 'Payslips', text2: String(msg) });
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const formatDate = (d: any) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
  const formatMoney = (n: any) =>
    n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

  const deletePayslip = (id: string, label: string) => {
    const auth = cleanAuthHeader(token);
    if (!auth) return;
    Alert.alert('Delete payslip', `Remove payslip for ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const base = String(getApiBaseUrl() || '').replace(/\/$/, '');
          try {
            const { data } = await axios.delete(`${base}/payslip/${id}`, {
              headers: { Authorization: auth },
            });
            if (data?.success) {
              Toast.show({ type: 'success', text1: 'Payslip deleted' });
              load();
            } else {
              Toast.show({ type: 'error', text1: data?.message || 'Delete failed' });
            }
          } catch (e: any) {
            Toast.show({
              type: 'error',
              text1: e?.response?.data?.message || 'Delete failed',
            });
          }
        },
      },
    ]);
  };

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
          renderItem={({ item }) => {
            const name = item.employeeName || item.employeeId?.name || '—';
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <TouchableOpacity
                    style={styles.cardMain}
                    onPress={() =>
                      navigation.navigate('AdminPayslipView', { id: item._id, canManage: true })
                    }
                    activeOpacity={0.75}
                  >
                    <Text style={styles.empName}>{name}</Text>
                    <Text style={styles.row}>Period: {item.payPeriod}</Text>
                    <Text style={styles.row}>Pay date: {formatDate(item.payDate)}</Text>
                    <Text style={styles.net}>Net: {formatMoney(item.netPay)}</Text>
                    <Text style={styles.view}>View →</Text>
                  </TouchableOpacity>
                  {isAdmin ? (
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => navigation.navigate('AddPayslip', { payslipId: item._id })}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="edit" size={22} color="#019ee3" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => deletePayslip(item._id, name)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="delete-outline" size={22} color="#c62828" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
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
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardMain: { flex: 1, paddingRight: 4 },
  cardActions: { flexDirection: 'column', gap: 4, paddingTop: 2 },
  iconBtn: { padding: 6 },
  empName: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 6 },
  row: { fontSize: 13, color: '#666', marginBottom: 2 },
  net: { fontSize: 15, fontWeight: '600', color: '#019ee3', marginTop: 6 },
  view: { fontSize: 13, color: '#019ee3', marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#888', paddingHorizontal: 24 },
});

export default AdminPayslipListScreen;
