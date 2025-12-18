import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  employeeType: string;
  designation?: string;
  department?: {
    _id: string;
    name: string;
  };
}

const EmployeeListScreen = () => {
  const navigation = useNavigation();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [token])
  );

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/employee/all`, {
        headers: { Authorization: token || '' },
      });
      if (response.data?.employees) {
        setEmployees(response.data.employees);
      }
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch employees',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employeeId: string) => {
    (navigation as any).navigate('AddEmployee', { employeeId });
  };

  const handleDeleteEmployee = (employeeId: string) => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to delete this employee? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/employee/delete/${employeeId}`, {
                headers: { Authorization: token || '' },
              });
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Employee deleted successfully',
              });
              fetchEmployees();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete employee',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredEmployees = employees.filter((employee) => {
    const query = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      employee.phone.toLowerCase().includes(query) ||
      employee.employeeType.toLowerCase().includes(query) ||
      (employee.designation && employee.designation.toLowerCase().includes(query))
    );
  });

  const isAdmin = user?.role === 1 || Number(user?.role) === 1;

  const renderEmployee = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      style={styles.employeeCard}
      onPress={() => (navigation as any).navigate('EmployeeDetails', { employeeId: item._id })}
    >
      <View style={styles.employeeHeader}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.name}</Text>
          <Text style={styles.employeeEmail}>{item.email}</Text>
        </View>
        {(isAdmin || hasPermission('reportsEmployeeList', 'edit') || hasPermission('reportsEmployeeList', 'delete')) && (
          <View style={styles.actions}>
            {(isAdmin || hasPermission('reportsEmployeeList', 'edit')) && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditEmployee(item._id)}
              >
                <Icon name="edit" size={20} color="#019ee3" />
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('reportsEmployeeList', 'delete')) && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteEmployee(item._id)}
              >
                <Icon name="delete" size={20} color="#dc3545" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View style={styles.employeeDetails}>
        <View style={styles.detailRow}>
          <Icon name="phone" size={16} color="#666" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="work" size={16} color="#666" />
          <Text style={styles.detailText}>{item.employeeType}</Text>
        </View>
        {item.department && (
          <View style={styles.detailRow}>
            <Icon name="business" size={16} color="#666" />
            <Text style={styles.detailText}>{item.department.name}</Text>
          </View>
        )}
        {item.designation && (
          <View style={styles.detailRow}>
            <Icon name="badge" size={16} color="#666" />
            <Text style={styles.detailText}>{item.designation}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && employees.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employees</Text>
        {(isAdmin || hasPermission('reportsEmployeeList', 'create')) && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => (navigation as any).navigate('AddEmployee')}
          >
            <Icon name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchEmployees}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No employees found matching your search' : 'No employees found'}
            </Text>
          </View>
        }
      />
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#019ee3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    padding: 15,
    paddingTop: 0,
  },
  employeeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  employeeDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default EmployeeListScreen;

