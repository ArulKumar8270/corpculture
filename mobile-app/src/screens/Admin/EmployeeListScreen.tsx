import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getApiBaseUrl } from '../../services/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

let XLSX: any;
try {
  XLSX = require('xlsx');
} catch {
  // xlsx optional
}

const formatListField = (value: unknown): string => {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return value != null && value !== '' ? String(value) : '';
};

const formatDepartments = (department: unknown): string => {
  if (!department) return '';
  if (Array.isArray(department)) {
    return department
      .map((d) => (typeof d === 'object' && d !== null ? (d as { name?: string }).name : d))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof department === 'object' && department !== null) {
    return (department as { name?: string }).name || '';
  }
  return String(department);
};

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  employeeType: string | string[];
  designation?: string | string[];
  department?: {
    _id: string;
    name: string;
  };
  pincode?: string | string[];
  idCradNo?: string;
  salary?: number | string;
  bikeAllowance?: number | string;
  orderPriceFrom?: number | string;
  orderPriceTo?: number | string;
  hireDate?: string;
  parentName?: string;
  parentPhone?: string;
  parentAddress?: string;
  parentRelation?: string;
  image?: string;
  idProof?: string;
  userId?: { _id?: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

const EmployeeListScreen = () => {
  const navigation = useNavigation();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [token])
  );

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = getApiBaseUrl();
      const response = await axios.get(`${API_BASE_URL}/employee/all`, {
        headers: { Authorization: token || '' },
        timeout: 30000,
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
              const API_BASE_URL = getApiBaseUrl();
              await axios.delete(`${API_BASE_URL}/employee/delete/${employeeId}`, {
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
    const employeeType = formatListField(employee.employeeType).toLowerCase();
    const designation = formatListField(employee.designation).toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      employee.phone.toLowerCase().includes(query) ||
      employeeType.includes(query) ||
      designation.includes(query)
    );
  });

  const handleDownloadEmployeesExcel = async () => {
    if (!XLSX) {
      Toast.show({ type: 'error', text1: 'Excel export unavailable' });
      return;
    }
    if (!employees.length) {
      Toast.show({ type: 'error', text1: 'No employees to export.' });
      return;
    }
    try {
      setExportingExcel(true);
      const rows = employees.map((employee) => ({
        'Employee ID': String(employee._id ?? ''),
        Name: employee.name ?? '',
        Email: employee.email ?? '',
        Phone: employee.phone ?? '',
        Address: employee.address ?? '',
        'Pincode(s)': formatListField(employee.pincode),
        'Employee Type': formatListField(employee.employeeType),
        Designation: formatListField(employee.designation),
        'ID Card No': employee.idCradNo ?? '',
        Department: formatDepartments(employee.department),
        Salary: employee.salary ?? '',
        'Bike Allowance': employee.bikeAllowance ?? '',
        'Order Price From': employee.orderPriceFrom ?? '',
        'Order Price To': employee.orderPriceTo ?? '',
        'Hire Date': employee.hireDate
          ? new Date(employee.hireDate).toLocaleDateString()
          : '',
        'Parent Name': employee.parentName ?? '',
        'Parent Phone': employee.parentPhone ?? '',
        'Parent Address': employee.parentAddress ?? '',
        'Parent Relation': employee.parentRelation ?? '',
        'Image URL': employee.image ?? '',
        'ID Proof URL': employee.idProof ?? '',
        'User ID': employee.userId && typeof employee.userId === 'object'
          ? String(employee.userId._id ?? '')
          : String(employee.userId ?? ''),
        'Created At': employee.createdAt
          ? new Date(employee.createdAt).toLocaleString()
          : '',
        'Updated At': employee.updatedAt
          ? new Date(employee.updatedAt).toLocaleString()
          : '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const stamp = new Date().toISOString().slice(0, 10);
      const fileName = `all_employees_${stamp}.xlsx`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const base64 = btoa(
        new Uint8Array(excelBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      Toast.show({ type: 'success', text1: `Exported ${rows.length} employee(s) to Excel.` });
    } catch (err) {
      console.error('Excel export error:', err);
      Toast.show({ type: 'error', text1: 'Failed to export Excel.' });
    } finally {
      setExportingExcel(false);
    }
  };

  const paginatedEmployees = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredEmployees.slice(start, start + rowsPerPage);
  }, [filteredEmployees, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [rowsPerPage]);

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
          <Text style={styles.detailText}>{formatListField(item.employeeType)}</Text>
        </View>
        {item.department && (
          <View style={styles.detailRow}>
            <Icon name="business" size={16} color="#666" />
            <Text style={styles.detailText}>{item.department.name}</Text>
          </View>
        )}
        {formatListField(item.designation) ? (
          <View style={styles.detailRow}>
            <Icon name="badge" size={16} color="#666" />
            <Text style={styles.detailText}>{formatListField(item.designation)}</Text>
          </View>
        ) : null}
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.exportButton,
              (exportingExcel || !employees.length) && styles.exportButtonDisabled,
            ]}
            onPress={handleDownloadEmployeesExcel}
            disabled={exportingExcel || !employees.length}
          >
            {exportingExcel ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="download" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Excel</Text>
              </>
            )}
          </TouchableOpacity>
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
        data={paginatedEmployees}
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
        ListFooterComponent={
          <View style={styles.paginationWrapper}>
            {filteredEmployees.length > 0 && (
              <View style={styles.rowsPerPageRow}>
                <Text style={styles.rowsPerPageLabel}>Rows per page:</Text>
                <View style={styles.rowsPerPageOptions}>
                  {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.rowsPerPageBtn, rowsPerPage === opt && styles.rowsPerPageBtnActive]}
                      onPress={() => setRowsPerPage(opt)}
                    >
                      <Text style={[styles.rowsPerPageBtnText, rowsPerPage === opt && styles.rowsPerPageBtnTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {filteredEmployees.length > rowsPerPage ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <Text style={styles.pageBtnText}>Previous</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  Page {page + 1} of {Math.max(1, Math.ceil(filteredEmployees.length / rowsPerPage))}
                </Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= Math.ceil(filteredEmployees.length / rowsPerPage) - 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(filteredEmployees.length / rowsPerPage) - 1}
                >
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#019ee3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  exportButtonDisabled: {
    backgroundColor: '#9e9e9e',
    opacity: 0.8,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  paginationWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  rowsPerPageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowsPerPageLabel: { fontSize: 14, color: '#666', marginRight: 8 },
  rowsPerPageOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowsPerPageBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#e0e0e0' },
  rowsPerPageBtnActive: { backgroundColor: '#019ee3' },
  rowsPerPageBtnText: { fontSize: 14, color: '#333', fontWeight: '500' },
  rowsPerPageBtnTextActive: { color: '#fff' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  pageBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#019ee3', borderRadius: 8, marginHorizontal: 8 },
  pageBtnDisabled: { backgroundColor: '#ccc', opacity: 0.8 },
  pageBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pageInfo: { fontSize: 14, color: '#333' },
});

export default EmployeeListScreen;

