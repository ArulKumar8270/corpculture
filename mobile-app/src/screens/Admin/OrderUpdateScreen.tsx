import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { adminService } from '../../services/api';
import Toast from 'react-native-toast-message';

const OrderUpdateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadOrder();
    loadEmployees();
  }, []);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await adminService.getOrder(orderId);
      setOrder(response.data.order);
      setStatus(response.data.order.status || '');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load order',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await adminService.getEmployees();
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!status) {
      Alert.alert('Error', 'Please select a status');
      return;
    }

    setLoading(true);
    try {
      await adminService.updateOrder(orderId, { status });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order status updated successfully',
      });
      // Navigate back to OrderList screen explicitly
      (navigation as any).navigate('OrderList');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update order',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOrder = async () => {
    if (!employeeId) {
      Alert.alert('Error', 'Please select an employee');
      return;
    }

    setLoading(true);
    try {
      await adminService.assignOrder({ orderId, employeeId });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order assigned successfully',
      });
      // Navigate back to OrderList screen explicitly
      (navigation as any).navigate('OrderList');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to assign order',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>Order ID: {order._id}</Text>
        <Text style={styles.orderDate}>
          Date: {new Date(order.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.orderTotal}>Total: ₹{order.totalAmount || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        <View style={styles.statusContainer}>
          {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusButton, status === s && styles.statusButtonSelected]}
              onPress={() => setStatus(s)}
            >
              <Text
                style={[styles.statusButtonText, status === s && styles.statusButtonTextSelected]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleUpdateStatus}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Status</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assign to Employee</Text>
        <View style={styles.employeeContainer}>
          {employees.map((emp) => (
            <TouchableOpacity
              key={emp._id}
              style={[
                styles.employeeButton,
                employeeId === emp._id && styles.employeeButtonSelected,
              ]}
              onPress={() => setEmployeeId(emp._id)}
            >
              <Text
                style={[
                  styles.employeeButtonText,
                  employeeId === emp._id && styles.employeeButtonTextSelected,
                ]}
              >
                {emp.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleAssignOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Assign Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  orderInfo: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  statusButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  statusButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#333',
  },
  statusButtonTextSelected: {
    color: '#fff',
  },
  employeeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  employeeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  employeeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  employeeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  employeeButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderUpdateScreen;

