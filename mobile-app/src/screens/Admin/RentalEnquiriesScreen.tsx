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
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';

const RentalEnquiriesScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [allRentalsData, setAllRentalsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [updatingRentalId, setUpdatingRentalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'assigned' | 'w_u' | 'pending' | 'inProgress' | 'completed'>(
    user?.role === 1 ? 'new' : 'assigned'
  );
  const [tabCounts, setTabCounts] = useState({
    new: 0,
    assigned: 0,
    invoiced: 0,
    quotation: 0,
    report: 0,
    w_u: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenuVisible, setActionMenuVisible] = useState<string | null>(null);
  const [employeePickerVisible, setEmployeePickerVisible] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchAllRentals();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllRentals();
      fetchEmployees();
    }, [token])
  );

  useEffect(() => {
    filterAndCountRentals();
  }, [allRentalsData, activeTab]);

  const fetchEmployees = async () => {
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/employee/all`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAllRentals = async () => {
    try {
      setLoading(true);
      const endpoint =
        user?.role === 3
          ? `rental/assignedTo/${user?._id}`
          : 'rental/all';
      const { data } = await axios.get(`${getApiBaseUrl()}/${endpoint}`, {
        headers: {
          Authorization: token || '',
        },
      });

      if (data?.success) {
        setAllRentalsData(data.rental || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data?.message || 'Failed to fetch rental enquiries',
        });
      }
    } catch (error: any) {
      console.error('Error fetching rental enquiries:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fetch rental enquiries',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndCountRentals = () => {
    let currentFilteredRentals = allRentalsData;

    // Calculate counts for all tabs
    const newCounts = {
      new: 0,
      assigned: 0,
      invoiced: 0,
      quotation: 0,
      report: 0,
      w_u: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    currentFilteredRentals.forEach((enquiry) => {
      if (!enquiry.employeeId) {
        newCounts.new++;
      }
      if (enquiry.employeeId && enquiry.status !== 'Cancelled') {
        newCounts.assigned++;
      }
      if (enquiry.status === 'Cancelled') {
        newCounts.w_u++;
      }
      if (enquiry.status === 'Pending') {
        newCounts.pending++;
      }
      if (enquiry.status === 'In Progress') {
        newCounts.inProgress++;
      }
      if (enquiry.status === 'Completed') {
        newCounts.completed++;
      }
    });
    setTabCounts(newCounts);

    // Filter by activeTab
    let finalFilteredRentals: any[] = [];
    switch (activeTab) {
      case 'new':
        finalFilteredRentals = currentFilteredRentals.filter((enquiry) => !enquiry.employeeId);
        break;
      case 'assigned':
        finalFilteredRentals = currentFilteredRentals.filter(
          (enquiry) => !!enquiry.employeeId && enquiry.status !== 'Cancelled'
        );
        break;
      case 'w_u':
        finalFilteredRentals = currentFilteredRentals.filter((enquiry) => enquiry.status === 'Cancelled');
        break;
      case 'pending':
        finalFilteredRentals = currentFilteredRentals.filter((enquiry) => enquiry.status === 'Pending');
        break;
      case 'inProgress':
        finalFilteredRentals = currentFilteredRentals.filter((enquiry) => enquiry.status === 'In Progress');
        break;
      case 'completed':
        finalFilteredRentals = currentFilteredRentals.filter((enquiry) => enquiry.status === 'Completed');
        break;
      default:
        finalFilteredRentals = currentFilteredRentals;
        break;
    }
    setEnquiries(finalFilteredRentals);
  };

  const assignEmployeeToRental = async (rentalId: string, employeeId: string) => {
    setUpdatingRentalId(rentalId);
    try {
      const { data } = await axios.put(
        `${getApiBaseUrl()}/rental/update/${rentalId}`,
        { employeeId },
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
      if (data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Employee assigned successfully!',
        });
        setAllRentalsData((prevAllRentals) =>
          prevAllRentals.map((enquiry) =>
            enquiry._id === rentalId ? { ...enquiry, employeeId: employeeId } : enquiry
          )
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data?.message || 'Failed to assign employee',
        });
      }
    } catch (error: any) {
      console.error('Error assigning employee:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to assign employee',
      });
    } finally {
      setUpdatingRentalId(null);
    }
  };

  const updateStatusToRental = async (rentalId: string, status: string) => {
    setUpdatingRentalId(rentalId);
    try {
      const { data } = await axios.put(
        `${getApiBaseUrl()}/rental/update/${rentalId}`,
        { status },
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
      if (data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Status updated successfully!',
        });
        setAllRentalsData((prevAllRentals) =>
          prevAllRentals.map((enquiry) => (enquiry._id === rentalId ? { ...enquiry, status } : enquiry))
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data?.message || 'Failed to update status',
        });
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update status',
      });
    } finally {
      setUpdatingRentalId(null);
    }
  };

  const handleInvoice = (enquiry: any) => {
    const employee = employees.find((emp) => emp.userId === enquiry.employeeId);
    const employeeName = employee?.name || enquiry.employeeId;
    const employeeUserId = employee?.userId || enquiry.employeeId;
    // Ensure companyId is passed correctly - handle both string and object formats
    const companyId = typeof enquiry?.companyId === 'object' ? enquiry?.companyId?._id : enquiry?.companyId;
    (navigation as any).navigate('AddRentalInvoice', {
      employeeName,
      employeeId: employeeUserId,
      invoiceType: 'invoice',
      rentalId: enquiry._id,
      companyId: companyId || enquiry?.companyId,
    });
    setActionMenuVisible(null);
  };

  const handleQuotation = (enquiry: any) => {
    const employee = employees.find((emp) => emp.userId === enquiry.employeeId);
    const employeeName = employee?.name || enquiry.employeeId;
    const employeeUserId = employee?.userId || enquiry.employeeId;
    // Ensure companyId is passed correctly - handle both string and object formats
    const companyId = typeof enquiry?.companyId === 'object' ? enquiry?.companyId?._id : enquiry?.companyId;
    (navigation as any).navigate('AddRentalInvoice', {
      employeeName,
      employeeId: employeeUserId,
      invoiceType: 'quotation',
      rentalId: enquiry._id,
      companyId: companyId || enquiry?.companyId,
    });
    setActionMenuVisible(null);
  };

  const handleReport = (enquiry: any) => {
    const employee = employees.find((emp) => emp.userId === enquiry.employeeId);
    const employeeName = employee?.name || enquiry.employeeId;
    const employeeUserId = employee?.userId || enquiry.employeeId;
    // Ensure companyId is passed correctly - handle both string and object formats
    const companyId = typeof enquiry?.companyId === 'object' ? enquiry?.companyId?._id : enquiry?.companyId;
    // Navigate to report screen - pass employeeId for assignedTo field
    (navigation as any).navigate('AddRentalReport', {
      employeeName,
      employeeId: employeeUserId, // Pass employee ID for assignedTo
      reportType: 'rental',
      rentalId: enquiry._id,
      companyId: companyId || enquiry?.companyId,
    });
    setActionMenuVisible(null);
  };

  const handleMoveToUnwanted = (enquiry: any) => {
    updateStatusToRental(enquiry._id, 'Cancelled');
    setActionMenuVisible(null);
  };

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const term = searchTerm.toLowerCase();
    return (
      (enquiry.companyName && enquiry.companyName.toLowerCase().includes(term)) ||
      (enquiry.phone && enquiry.phone.toLowerCase().includes(term)) ||
      (enquiry.email && enquiry.email.toLowerCase().includes(term)) ||
      (enquiry.rentalTitle && enquiry.rentalTitle.toLowerCase().includes(term))
    );
  });

  const renderEnquiry = ({ item }: { item: any }) => {
    const isUpdating = updatingRentalId === item._id;
    const isActionMenuOpen = actionMenuVisible === item._id;

    return (
      <View style={styles.enquiryCard}>
        {/* Header with Company Name and Action Menu */}
        <View style={styles.enquiryHeader}>
          <View style={styles.enquiryHeaderLeft}>
            <Text style={styles.enquiryTitle}>{item.companyName || 'N/A'}</Text>
            <Text style={styles.enquirySubtitle}>{item.rentalTitle || 'N/A'}</Text>
          </View>
          {hasPermission('rentalEnquiries', 'edit') && (
            <TouchableOpacity
              style={styles.actionMenuButton}
              onPress={() => setActionMenuVisible(isActionMenuOpen ? null : item._id)}
            >
              <Icon name="more-vert" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Menu */}
        {isActionMenuOpen && (
          <View style={styles.actionMenu}>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => handleInvoice(item)}
            >
              <Icon name="receipt" size={20} color="#007AFF" />
              <Text style={styles.actionMenuText}>Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => handleQuotation(item)}
            >
              <Icon name="description" size={20} color="#007AFF" />
              <Text style={styles.actionMenuText}>Quotation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => handleReport(item)}
            >
              <Icon name="bar-chart" size={20} color="#007AFF" />
              <Text style={styles.actionMenuText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => handleMoveToUnwanted(item)}
            >
              <Icon name="arrow-forward" size={20} color="#FF3B30" />
              <Text style={[styles.actionMenuText, styles.actionMenuTextDanger]}>
                Move To Unwanted Tab
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Details */}
        <View style={styles.enquiryDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned Employee:</Text>
            {isUpdating ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <View style={styles.employeePicker}>
                <TouchableOpacity
                  style={styles.employeePickerButton}
                  onPress={() => {
                    // Show employee picker modal
                    setEmployeePickerVisible(item._id);
                  }}
                  disabled={user?.role !== 1}
                >
                  <Text style={styles.employeePickerText}>
                    {item.employeeId
                      ? employees.find((emp) => emp.userId === item.employeeId)?.name || item.employeeId
                      : '-- Select Employee --'}
                  </Text>
                  {user?.role === 1 && <Icon name="arrow-drop-down" size={20} color="#666" />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer Type:</Text>
            <Text style={styles.detailValue}>{item.customerType || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{item.phone || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact Person:</Text>
            <Text style={styles.detailValue}>{item.contactPerson || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{item.email || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>{item.address || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.location || 'N/A'}</Text>
          </View>

          {item.complaint && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Complaint:</Text>
              <Text style={styles.detailValue}>{item.complaint}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rental Type:</Text>
            <Text style={styles.detailValue}>{item.rentalType || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted At:</Text>
            <Text style={styles.detailValue}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rental Enquiries</Text>
      </View>

      {/* Search Field */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Company Name, Phone, Email, or Rental Title"
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {user?.role === 1 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'new' && styles.tabActive]}
              onPress={() => setActiveTab('new')}
            >
              <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
                New Rental Requests ({tabCounts.new})
              </Text>
            </TouchableOpacity>
          )}
          {user?.role === 1 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'assigned' && styles.tabActive]}
              onPress={() => setActiveTab('assigned')}
            >
              <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>
                Assigned ({tabCounts.assigned})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Enquiries List */}
      <FlatList
        data={filteredEnquiries}
        renderItem={renderEnquiry}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No rental enquiries found</Text>
          </View>
        }
        contentContainerStyle={filteredEnquiries.length === 0 ? styles.emptyListContent : undefined}
        refreshing={loading}
        onRefresh={fetchAllRentals}
      />

      {/* Employee Picker Modal */}
      <Modal
        visible={employeePickerVisible !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEmployeePickerVisible(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEmployeePickerVisible(null)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Employee</Text>
            <FlatList
              data={[{ userId: '', name: '-- Select Employee --' }, ...employees]}
              keyExtractor={(item) => item.userId || 'none'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    if (employeePickerVisible) {
                      assignEmployeeToRental(employeePickerVisible, item.userId);
                      setEmployeePickerVisible(null);
                    }
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setEmployeePickerVisible(null)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
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
  searchWrapper: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  tabWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
  },
  tabContent: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#019ee3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  enquiryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  enquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  enquiryHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  enquiryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  enquirySubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionMenuButton: {
    padding: 5,
  },
  actionMenu: {
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 10,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginBottom: 5,
    backgroundColor: '#fff',
    gap: 10,
  },
  actionMenuText: {
    fontSize: 16,
    color: '#007AFF',
  },
  actionMenuTextDanger: {
    color: '#FF3B30',
  },
  enquiryDetails: {
    padding: 16,
    backgroundColor: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    alignItems: 'flex-start',
    minHeight: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
    lineHeight: 20,
  },
  employeePicker: {
    flex: 2,
    alignItems: 'flex-end',
  },
  employeePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
    maxWidth: '100%',
  },
  employeePickerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  emptyListContent: {
    flexGrow: 1,
  },
});

export default RentalEnquiriesScreen;
