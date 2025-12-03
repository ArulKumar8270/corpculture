import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setDashboardStats, setLoading } from '../../store/slices/adminSlice';
import { adminService } from '../../services/api';

const AdminDashboardScreen = () => {
  const dispatch = useDispatch();
  const { dashboardStats } = useSelector((state: RootState) => state.admin);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    dispatch(setLoading(true));
    try {
      const response = await adminService.getDashboardStats();
      dispatch(setDashboardStats(response.data.stats));
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      {dashboardStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardStats.totalServices}</Text>
            <Text style={styles.statLabel}>Total Services</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardStats.totalInvoices}</Text>
            <Text style={styles.statLabel}>Total Invoices</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{dashboardStats.totalRevenue}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardStats.pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#007AFF', marginBottom: 5 },
  statLabel: { fontSize: 14, color: '#666' },
});

export default AdminDashboardScreen;

