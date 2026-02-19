import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
// Using custom picker modal instead of @react-native-picker/picker

const ServiceEnquiriesScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [allServicesData, setAllServicesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(user?.role === 1 ? 'new' : 'assigned');
  const [employees, setEmployees] = useState<any[]>([]);
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [employeePickerVisible, setEmployeePickerVisible] = useState(false);
  const [selectedEnquiryForEmployee, setSelectedEnquiryForEmployee] = useState<any>(null);
  const [serviceTitleFilter, setServiceTitleFilter] = useState('');
  const [serviceTitlePickerVisible, setServiceTitlePickerVisible] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // Base filtered data by service title (for counts and list)
  const baseFiltered = React.useMemo(() => {
    let list = [...allServicesData];
    if (serviceTitleFilter) {
      list = list.filter((e: any) => e.serviceTitle === serviceTitleFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (e: any) =>
          e.companyName?.toLowerCase().includes(term) ||
          e.phone?.toLowerCase().includes(term) ||
          e.email?.toLowerCase().includes(term) ||
          e.serviceTitle?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [allServicesData, serviceTitleFilter, searchTerm]);

  const tabCounts = React.useMemo(
    () => ({
      new: baseFiltered.filter((e: any) => !e.employeeId).length,
      assigned: baseFiltered.filter((e: any) => !!e.employeeId && e.status !== 'Cancelled').length,
      w_u: baseFiltered.filter((e: any) => e.status === 'Cancelled').length,
      pending: baseFiltered.filter((e: any) => e.status === 'Pending').length,
      inProgress: baseFiltered.filter((e: any) => e.status === 'In Progress').length,
      completed: baseFiltered.filter((e: any) => e.status === 'Completed').length,
    }),
    [baseFiltered]
  );

  const enquiries = React.useMemo(() => {
    let list: any[] = [];
    switch (activeTab) {
      case 'new':
        list = baseFiltered.filter((e: any) => !e.employeeId);
        break;
      case 'assigned':
        list = baseFiltered.filter((e: any) => !!e.employeeId && e.status !== 'Cancelled');
        break;
      case 'w_u':
        list = baseFiltered.filter((e: any) => e.status === 'Cancelled');
        break;
      case 'pending':
        list = baseFiltered.filter((e: any) => e.status === 'Pending');
        break;
      case 'inProgress':
        list = baseFiltered.filter((e: any) => e.status === 'In Progress');
        break;
      case 'completed':
        list = baseFiltered.filter((e: any) => e.status === 'Completed');
        break;
      default:
        list = baseFiltered;
    }
    return list;
  }, [baseFiltered, activeTab]);

  const paginatedEnquiries = React.useMemo(() => {
    const start = page * rowsPerPage;
    return enquiries.slice(start, start + rowsPerPage);
  }, [enquiries, page]);

  const serviceTitles = React.useMemo(() => {
    const titles = allServicesData.map((e: any) => e.serviceTitle).filter(Boolean);
    return [...new Set(titles)].sort();
  }, [allServicesData]);

  useEffect(() => {
    if (token) {
      fetchAllServices();
      fetchEmployees();
    }
  }, [token]);

  useEffect(() => {
    setPage(0);
  }, [activeTab, serviceTitleFilter, searchTerm]);

  const fetchAllServices = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${getApiBaseUrl()}/service/${user?.role === 3 ? `assignedTo/${user?._id}` : 'all'}`,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
      console.log('data23452345', data);
      if (data?.success) {
        setAllServicesData(data.services || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data?.message || 'Failed to fetch service enquiries.',
        });
      }
    } catch (err: any) {
      console.error('Error fetching all service enquiries:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching service enquiries.',
      });
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const assignEmployeeToService = async (serviceId: string, employeeId: string) => {
    setUpdatingServiceId(serviceId);
    try {
      const { data } = await axios.put(
        `${getApiBaseUrl()}/service/update/${serviceId}`,
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
        fetchAllServices();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data?.message || 'Failed to assign employee.',
        });
      }
    } catch (err: any) {
      console.error('Error assigning employee:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while assigning employee.',
      });
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const updateStatusToService = async (serviceId: string, status: string) => {
    setUpdatingServiceId(serviceId);
    try {
      const { data } = await axios.put(
        `${getApiBaseUrl()}/service/update/${serviceId}`,
        { status },
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
      if (data?.success) {
        fetchAllServices();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Status updated successfully!',
        });
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while updating status.',
      });
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const handleAction = (action: string, service: any) => {
    setActionMenuVisible(false);
    const employeeName = employees.find(emp => emp.userId === service.employeeId)?.name || service.employeeId;
    const employeeId = service.employeeId; // Get the employee ID from service

    switch (action) {
      case 'invoice':
        (navigation as any).navigate('AddServiceInvoice', {
          employeeName,
          employeeId, // Pass employee ID for the payload
          invoiceType: 'invoice',
          serviceId: service._id,
          companyId: service.companyId,
        });
        break;
      case 'quotation':
        (navigation as any).navigate('AddServiceInvoice', {
          employeeName,
          employeeId, // Pass employee ID for the payload
          invoiceType: 'quotation',
          serviceId: service._id,
          companyId: service.companyId,
        });
        break;
      case 'report':
        // Ensure companyId is passed correctly - handle both string and object formats
        const companyId = typeof service?.companyId === 'object' ? service?.companyId?._id : service?.companyId;
        (navigation as any).navigate('AddServiceReport', {
          employeeName,
          employeeId, // Pass employee ID for the payload
          reportType: 'service',
          serviceId: service._id,
          companyId: companyId || service?.companyId,
        });
        break;
      case 'moveToUnwanted':
        Alert.alert(
          'Move to Unwanted',
          'Are you sure you want to move this service to unwanted tab?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Move',
              onPress: () => updateStatusToService(service._id, 'Cancelled'),
            },
          ]
        );
        break;
    }
  };

  const renderEnquiry = ({ item }: { item: any }) => (
    <View style={styles.enquiryCard}>
      <View style={styles.enquiryHeader}>
        <View style={styles.enquiryHeaderLeft}>
          <Text style={styles.companyName}>{item.companyName || 'N/A'}</Text>
          <Text style={styles.contactPerson}>{item.contactPerson || 'N/A'}</Text>
        </View>
        {hasPermission('serviceEnquiries', 'edit') && (
          <TouchableOpacity
            onPress={() => {
              setSelectedService(item);
              setSelectedServiceId(item._id);
              setActionMenuVisible(true);
            }}
          >
            <Icon name="more-vert" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.enquiryDetails}>
        <View style={styles.detailRow}>
          <Icon name="phone" size={16} color="#666" />
          <Text style={styles.detailText}>{item.phone || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="email" size={16} color="#666" />
          <Text style={styles.detailText}>{item.email || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.detailText}>{item.location || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="build" size={16} color="#666" />
          <Text style={styles.detailText}>{item.serviceTitle || item.serviceType || 'N/A'}</Text>
        </View>
        {item.serviceImage && (
          <TouchableOpacity
            style={styles.imageLink}
            onPress={() => {
              // Open image in browser or image viewer
              Alert.alert('Service Image', `Image URL: ${item.serviceImage}`);
            }}
          >
            <Icon name="image" size={16} color="#007AFF" />
            <Text style={styles.imageLinkText}>View Service Image</Text>
          </TouchableOpacity>
        )}
        {item.complaint && (
          <View style={styles.complaintContainer}>
            <Text style={styles.complaintLabel}>Complaint:</Text>
            <Text style={styles.complaintText}>{item.complaint}</Text>
          </View>
        )}
      </View>

      <View style={styles.employeeSection}>
        <Text style={styles.employeeLabel}>Assigned Employee:</Text>
        {updatingServiceId === item._id ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              if (user?.role === 1) {
                setSelectedEnquiryForEmployee(item);
                setEmployeePickerVisible(true);
              }
            }}
            disabled={user?.role !== 1}
          >
            <Text style={styles.pickerButtonText}>
              {item.employeeId
                ? employees.find(emp => emp.userId === item.employeeId)?.name || 'Selected'
                : '-- Select Employee --'}
            </Text>
            {user?.role === 1 && <Icon name="arrow-drop-down" size={24} color="#666" />}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.dateText}>
        Submitted: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Enquiries</Text>
      </View>

      {/* Search Field */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Company, Phone, Email, or Service Title"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Service Title Filter */}
      {user?.role === 1 && serviceTitles.length > 0 && (
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Service Title:</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setServiceTitlePickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {serviceTitleFilter || 'All'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      )}
      {serviceTitlePickerVisible && (
        <Modal
          visible={serviceTitlePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setServiceTitlePickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setServiceTitlePickerVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Service Title</Text>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setServiceTitleFilter('');
                  setServiceTitlePickerVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>All</Text>
              </TouchableOpacity>
              {serviceTitles.map((title: string) => (
                <TouchableOpacity
                  key={title}
                  style={styles.modalItem}
                  onPress={() => {
                    setServiceTitleFilter(title);
                    setServiceTitlePickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{title}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.modalItem, styles.modalCancel]}
                onPress={() => setServiceTitlePickerVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Tab Navigation */}
      {user?.role === 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContainer}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'new' && styles.activeTab]}
            onPress={() => setActiveTab('new')}
          >
            <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
              New ({tabCounts.new})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'assigned' && styles.activeTab]}
            onPress={() => setActiveTab('assigned')}
          >
            <Text style={[styles.tabText, activeTab === 'assigned' && styles.activeTabText]}>
              Assigned ({tabCounts.assigned})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'w_u' && styles.activeTab]}
            onPress={() => setActiveTab('w_u')}
          >
            <Text style={[styles.tabText, activeTab === 'w_u' && styles.activeTabText]}>
              Unwanted ({tabCounts.w_u})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Pending ({tabCounts.pending})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inProgress' && styles.activeTab]}
            onPress={() => setActiveTab('inProgress')}
          >
            <Text style={[styles.tabText, activeTab === 'inProgress' && styles.activeTabText]}>
              In Progress ({tabCounts.inProgress})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed ({tabCounts.completed})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Enquiries List */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={paginatedEnquiries}
          renderItem={renderEnquiry}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchAllServices}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No service enquiries found</Text>
            </View>
          }
          ListFooterComponent={
            enquiries.length > rowsPerPage ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <Text style={styles.pageBtnText}>Previous</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  Page {page + 1} of {Math.ceil(enquiries.length / rowsPerPage)}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    page >= Math.ceil(enquiries.length / rowsPerPage) - 1 && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(enquiries.length / rowsPerPage) - 1}
                >
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Action Menu Modal */}
      <Modal
        visible={actionMenuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Actions</Text>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleAction('invoice', selectedService)}
            >
              <Icon name="receipt" size={24} color="#007AFF" />
              <Text style={styles.modalItemText}>Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleAction('quotation', selectedService)}
            >
              <Icon name="description" size={24} color="#007AFF" />
              <Text style={styles.modalItemText}>Quotation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleAction('report', selectedService)}
            >
              <Icon name="assessment" size={24} color="#007AFF" />
              <Text style={styles.modalItemText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleAction('moveToUnwanted', selectedService)}
            >
              <Icon name="arrow-forward" size={24} color="#FF3B30" />
              <Text style={[styles.modalItemText, { color: '#FF3B30' }]}>Move To Unwanted Tab</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalItem, styles.modalCancel]}
              onPress={() => setActionMenuVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Employee Picker Modal */}
      <Modal
        visible={employeePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEmployeePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEmployeePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Employee</Text>
            <FlatList
              data={employees}
              keyExtractor={(item) => item.userId}
              renderItem={({ item: employee }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (selectedEnquiryForEmployee) {
                      assignEmployeeToService(selectedEnquiryForEmployee._id, employee.userId);
                    }
                    setEmployeePickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{employee.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No employees found</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={[styles.modalItem, styles.modalCancel]}
              onPress={() => setEmployeePickerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
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
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  tabScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  pageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#019ee3',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  pageBtnDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.8,
  },
  pageBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    color: '#333',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: '#019ee3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  loader: {
    marginTop: 50,
  },
  enquiryCard: {
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
  enquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  enquiryHeaderLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  contactPerson: {
    fontSize: 14,
    color: '#666',
  },
  enquiryDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  imageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  imageLinkText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  complaintContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  complaintLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  complaintText: {
    fontSize: 14,
    color: '#333',
  },
  employeeSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  employeeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
    padding: 12,
    minHeight: 40,
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
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
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  modalCancel: {
    borderBottomWidth: 0,
    marginTop: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
});

export default ServiceEnquiriesScreen;

