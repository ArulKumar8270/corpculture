import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const EmployeeDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useSelector((state: RootState) => state.auth);
  const employeeId = (route.params as any)?.id || (route.params as any)?.employeeId;

  const [employee, setEmployee] = useState<any>(null);
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails();
    }
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const [employeeRes, ordersRes] = await Promise.allSettled([
        axios.get(`${process.env.EXPO_PUBLIC_API_URL}/employee/get/${employeeId}`, {
          headers: { Authorization: token || '' },
        }),
        axios.get(`${process.env.EXPO_PUBLIC_API_URL}/user/ordersByEmpId/${employeeId}`, {
          headers: { Authorization: token || '' },
        }),
      ]);

      if (employeeRes.status === 'fulfilled' && employeeRes.value.data?.employee) {
        setEmployee(employeeRes.value.data.employee);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.orders) {
        setAssignedOrders(ordersRes.value.data.orders);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load employee details',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Employee not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employee Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{employee.name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{employee.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{employee.phone || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Employee Type:</Text>
          <Text style={styles.value}>{employee.employeeType || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Designation:</Text>
          <Text style={styles.value}>{employee.designation || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>
            {employee.department?.name || employee.department || 'N/A'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Salary:</Text>
          <Text style={styles.value}>{employee.salary ? `₹${employee.salary}` : 'N/A'}</Text>
        </View>
      </View>

      {assignedOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Orders ({assignedOrders.length})</Text>
          {assignedOrders.map((order, index) => (
            <View key={index} style={styles.orderCard}>
              <Text style={styles.orderText}>Order ID: {order._id || order.orderId}</Text>
              <Text style={styles.orderText}>Status: {order.status || 'N/A'}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => {
          // @ts-ignore
          navigation.navigate('AddEmployee', { employeeId: employee._id });
        }}
      >
        <Icon name="edit" size={20} color="#fff" />
        <Text style={styles.editButtonText}>Edit Employee</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  orderCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  orderText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmployeeDetailsScreen;
