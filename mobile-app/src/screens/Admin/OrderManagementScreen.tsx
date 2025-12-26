import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';
import { getApiBaseUrl } from '../../services/api';

const OrderManagementScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Advanced filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [buyerNameFilter, setBuyerNameFilter] = useState('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Order assignment
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [employeePickerVisible, setEmployeePickerVisible] = useState(false);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, rowsPerPage, orderStatusFilter, employeeIdFilter, buyerNameFilter, fromDate, toDate, searchQuery]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: searchQuery || '',
        fromDate: fromDate || '',
        toDate: toDate || '',
        buyerName: buyerNameFilter || '',
        employeeId: employeeIdFilter || '',
        orderStatus: orderStatusFilter || '',
        page: (page + 1).toString(), // Backend expects 1-indexed
        limit: rowsPerPage.toString(),
      }).toString();

      const API_BASE_URL = getApiBaseUrl();
      const response = await axios.get(
        `${API_BASE_URL}/user/admin-orders?${queryParams}`,
        {
          headers: {
            Authorization: token,
          },
          timeout: 30000,
        }
      );

      if (response?.data?.orders) {
        setOrders(response.data.orders || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setOrders([]);
        setTotalCount(0);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load orders',
      });
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await axios.get(
        `${API_BASE_URL}/employee/all`,
        {
          headers: {
            Authorization: token,
          },
          timeout: 30000,
        }
      );
      setEmployees(response.data.employees || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleApplyFilters = () => {
    setPage(0);
    setFiltersVisible(false);
    // Orders will reload automatically via useEffect when filters change
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setBuyerNameFilter('');
    setEmployeeIdFilter('');
    setOrderStatusFilter('');
    setStatusFilter('');
    setPage(0);
    // Orders will reload automatically via useEffect when filters change
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleAssignOrders = async () => {
    if (selectedOrderIds.length === 0) {
      Alert.alert('Error', 'Please select at least one order to assign.');
      return;
    }
    if (!selectedEmployeeId) {
      Alert.alert('Error', 'Please select an employee.');
      return;
    }

    try {
      await axios.patch(
        `${getApiBaseUrl()}/user/update/aassign-orders`,
        {
          orderId: selectedOrderIds,
          employeeId: selectedEmployeeId,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Orders assigned successfully!',
      });
      setSelectedOrderIds([]);
      setSelectedEmployeeId('');
      loadOrders();
    } catch (error: any) {
      console.error('Error assigning orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to assign orders',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return '#34C759';
      case 'processing':
      case 'shipped':
        return '#007AFF';
      case 'pending':
        return '#FF9500';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const salesEmployees = employees.filter((emp) => emp.employeeType === 'Sales');

  const renderOrder = ({ item }: { item: any }) => {
    const handleOrderPress = () => {
      (navigation as any).navigate('OrderUpdate', { orderId: item._id });
    };
    
    const handleCheckboxPress = (e: any) => {
      e.stopPropagation();
      handleOrderSelect(item._id);
    };
    
    return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={handleOrderPress}
      activeOpacity={0.7}
    >
      {hasPermission('salesOrders') && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleCheckboxPress}
          activeOpacity={1}
        >
          <Icon
            name={selectedOrderIds.includes(item._id) ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={selectedOrderIds.includes(item._id) ? '#007AFF' : '#999'}
          />
        </TouchableOpacity>
      )}
      <View style={styles.orderContent}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId} numberOfLines={1}>
            {item._id?.slice(-8) || 'N/A'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus || item.status) }]}>
            <Text style={styles.statusText}>{item.orderStatus || item.status || 'Pending'}</Text>
          </View>
        </View>
        <View style={styles.orderInfoRow}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{item.user?.name || item.buyerName || 'N/A'}</Text>
        </View>
        {item.employeeId && (
          <View style={styles.orderInfoRow}>
            <Text style={styles.label}>Assigned:</Text>
            <TouchableOpacity
              onPress={() => {
                if (item.employeeId?._id) {
                  (navigation as any).navigate('EmployeeDetails', { id: item.employeeId._id });
                }
              }}
            >
              <Text style={[styles.value, styles.linkText]}>
                {item.employeeId?.name || 'N/A'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.orderInfoRow}>
          <Text style={styles.label}>Products:</Text>
          <Text style={styles.value}>
            {item.products?.length || 0} item{item.products?.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.orderInfoRow}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={[styles.value, styles.amountText]}>
            ₹{item.amount || item.totalAmount || 0}
          </Text>
        </View>
        <View style={styles.orderInfoRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity onPress={() => setFiltersVisible(true)}>
          <Icon name="filter-list" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders by ID, Customer, Address..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => {
            setPage(0);
            // Orders will reload automatically via useEffect
          }}
        />
        <TouchableOpacity onPress={handleApplyFilters} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Assignment Controls - Filter Style */}
      {hasPermission('salesOrders') && selectedOrderIds.length > 0 && (
        <View style={styles.assignmentContainer}>
          <View style={styles.assignmentHeader}>
            <Text style={styles.assignmentLabel}>
              Assign Selected ({selectedOrderIds.length}):
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedOrderIds([])}
              style={styles.clearSelectionButton}
            >
              <Icon name="close" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.employeeFilterContainer}
            contentContainerStyle={styles.employeeFilterContent}
          >
            {salesEmployees.map((employee) => (
              <TouchableOpacity
                key={employee._id}
                style={[
                  styles.employeeFilterChip,
                  selectedEmployeeId === employee._id && styles.employeeFilterChipSelected,
                ]}
                onPress={() => setSelectedEmployeeId(employee._id)}
              >
                <Text
                  style={[
                    styles.employeeFilterChipText,
                    selectedEmployeeId === employee._id && styles.employeeFilterChipTextSelected,
                  ]}
                >
                  {employee.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[
              styles.assignButton,
              (selectedOrderIds.length === 0 || !selectedEmployeeId) && styles.assignButtonDisabled,
            ]}
            onPress={handleAssignOrders}
            disabled={selectedOrderIds.length === 0 || !selectedEmployeeId}
          >
            <Icon name="person-add" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.assignButtonText}>
              Assign to {selectedEmployeeId ? salesEmployees.find((e) => e._id === selectedEmployeeId)?.name : 'Employee'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Status Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, orderStatusFilter === status && styles.filterChipSelected]}
              onPress={() => {
                setOrderStatusFilter(status);
                setStatusFilter(status);
                setPage(0);
                // Orders will reload automatically via useEffect
              }}
          >
            <Text
              style={[
                styles.filterChipText,
                orderStatusFilter === status && styles.filterChipTextSelected,
              ]}
            >
              {status || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <>
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item) => item._id}
            refreshing={loading}
            onRefresh={loadOrders}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="receipt" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No orders found</Text>
                <Text style={styles.emptySubtext}>Check your search or filters</Text>
              </View>
            }
          />
          {/* Pagination */}
          {totalCount > 0 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, page === 0 && styles.paginationButtonDisabled]}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <Icon name="chevron-left" size={24} color={page === 0 ? '#ccc' : '#007AFF'} />
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                Page {page + 1} of {Math.ceil(totalCount / rowsPerPage)}
              </Text>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  page >= Math.ceil(totalCount / rowsPerPage) - 1 && styles.paginationButtonDisabled,
                ]}
                onPress={() => setPage((p) => Math.min(Math.ceil(totalCount / rowsPerPage) - 1, p + 1))}
                disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
              >
                <Icon
                  name="chevron-right"
                  size={24}
                  color={page >= Math.ceil(totalCount / rowsPerPage) - 1 ? '#ccc' : '#007AFF'}
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Advanced Filters Modal */}
      <Modal visible={filtersVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setFiltersVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>From Date</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="YYYY-MM-DD"
                  value={fromDate}
                  onChangeText={setFromDate}
                />
              </View>
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>To Date</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="YYYY-MM-DD"
                  value={toDate}
                  onChangeText={setToDate}
                />
              </View>
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Buyer Name</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Filter by buyer name"
                  value={buyerNameFilter}
                  onChangeText={setBuyerNameFilter}
                />
              </View>
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Employee</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    setFiltersVisible(false);
                    setEmployeePickerVisible(true);
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {employeeIdFilter
                      ? salesEmployees.find((e) => e._id === employeeIdFilter)?.name || 'All Employees'
                      : 'All Employees'}
                  </Text>
                  <Icon name="arrow-drop-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Order Status</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    setFiltersVisible(false);
                    setStatusPickerVisible(true);
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {orderStatusFilter || 'All Statuses'}
                  </Text>
                  <Icon name="arrow-drop-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Employee Picker Modal */}
      <Modal visible={employeePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Employee</Text>
              <TouchableOpacity onPress={() => setEmployeePickerVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={styles.pickerOption}
                onPress={() => {
                  setEmployeeIdFilter('');
                  setEmployeePickerVisible(false);
                }}
              >
                <Text style={styles.pickerOptionText}>All Employees</Text>
                {!employeeIdFilter && <Icon name="check" size={20} color="#007AFF" />}
              </TouchableOpacity>
              {salesEmployees.map((employee) => (
                <TouchableOpacity
                  key={employee._id}
                  style={styles.pickerOption}
                  onPress={() => {
                    setEmployeeIdFilter(employee._id);
                    setEmployeePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>
                    {employee.name} ({employee.employeeType})
                  </Text>
                  {employeeIdFilter === employee._id && <Icon name="check" size={20} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Picker Modal */}
      <Modal visible={statusPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setStatusPickerVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {['', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.pickerOption}
                  onPress={() => {
                    setOrderStatusFilter(status);
                    setStatusFilter(status);
                    setStatusPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{status || 'All Statuses'}</Text>
                  {orderStatusFilter === status && <Icon name="check" size={20} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  assignmentContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignmentLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  clearSelectionButton: {
    padding: 4,
  },
  employeeFilterContainer: {
    marginBottom: 12,
    maxHeight: 50,
  },
  employeeFilterContent: {
    paddingRight: 15,
  },
  employeeFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeFilterChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  employeeFilterChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  employeeFilterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  assignButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  assignButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 40,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
    height: 40,
  },
  filterChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  loader: {
    marginTop: 50,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  orderContent: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationButton: {
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  filterInputGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default OrderManagementScreen;
