import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../../services/api';
import Toast from 'react-native-toast-message';

interface Company {
  _id: string;
  companyName: string;
  companyAddress: string;
  mobileNumber: string;
  serviceInvoiceCount: number;
  serviceQuotationCount: number;
  serviceReportCount: number;
  rentalInvoiceCount: number;
  rentalQuotationCount: number;
  rentalReportCount: number;
}

const CompanyReportsScreen = () => {
  const navigation = useNavigation();
  const { token } = useSelector((state: RootState) => state.auth);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reminder Modal States
  const [openReminderModal, setOpenReminderModal] = useState(false);
  const [currentCompanyIdForReminder, setCurrentCompanyIdForReminder] = useState<string | null>(null);
  const [reminderMail, setReminderMail] = useState('');
  const [ccMail, setCcMail] = useState('');
  const [selectedReminderDates, setSelectedReminderDates] = useState<string[]>([]);
  const [remainderType, setRemainderType] = useState('');
  const [fetchingReminderData, setFetchingReminderData] = useState(false);
  const [reminderTypePickerVisible, setReminderTypePickerVisible] = useState(false);
  const [reminderDatePickerVisible, setReminderDatePickerVisible] = useState(false);
  
  // Options for reminder dates (days of the month, 1 to 31)
  const reminderDateOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const reminderTypeOptions = [
    { value: 'ServiceInvoice', label: 'Service Invoice' },
    { value: 'RentalInvoice', label: 'Rental Invoice' },
    { value: 'SalesInvoice', label: 'Sales Invoice' },
    { value: 'Report', label: 'Report' },
    { value: 'Quotation', label: 'Quotation' },
    { value: 'Other', label: 'Other' },
  ];

  useFocusEffect(
    useCallback(() => {
      fetchCompanies();
    }, [token])
  );

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);

    if (!token) {
      setError('Authentication token not available. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/company/all`,
        {
          headers: { Authorization: token },
        }
      );

      if (response.data.success && Array.isArray(response.data.companies)) {
        const mappedCompanies: Company[] = response.data.companies.map((c: any) => ({
          _id: c._id,
          companyName: c.companyName,
          companyAddress: c.billingAddress || c.addressDetail || '',
          mobileNumber: c.mobileNumber || c.phone || 'N/A',
          serviceInvoiceCount: c.serviceInvoiceCount || 0,
          serviceQuotationCount: c.serviceQuotationCount || 0,
          serviceReportCount: c.serviceReportCount || 0,
          rentalInvoiceCount: c.rentalInvoiceCount || 0,
          rentalQuotationCount: c.rentalQuotationCount || 0,
          rentalReportCount: c.rentalReportCount || 0,
        }));
        setCompanies(mappedCompanies);
      } else {
        setCompanies([]);
        setError(response.data.message || 'Failed to fetch company data.');
      }
    } catch (err: any) {
      console.error('Error fetching companies:', err);
      setError('Failed to load company data.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load company data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewServiceInvoices = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'ServiceInvoicesReport',
      params: { companyId, type: 'invoice' },
    });
  };

  const handleViewServiceQuotations = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'ServiceInvoicesReport',
      params: { companyId, type: 'quotation' },
    });
  };

  const handleViewServiceReports = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'ServiceReportsReport',
      params: { companyId, type: 'service' },
    });
  };

  const handleViewRentalInvoices = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'RentalInvoiceReport',
      params: { companyId, type: 'invoice' },
    });
  };

  const handleViewRentalQuotations = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'RentalInvoiceReport',
      params: { companyId, type: 'quotation' },
    });
  };

  const handleViewRentalReports = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'ServiceReportsReport',
      params: { companyId, type: 'rental' },
    });
  };

  // Reminder Functions
  const handleOpenReminderModal = async (companyId: string, type: string) => {
    setCurrentCompanyIdForReminder(companyId);
    setRemainderType(type);
    setReminderMail('');
    setCcMail('');
    setSelectedReminderDates([]);
    setFetchingReminderData(true);

    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/remainders/company/${companyId}/${type}`,
        { headers: { Authorization: token } }
      );

      if (response.data.success && response.data.remainders) {
        const fetchedReminder = response.data.remainders;
        setReminderMail(fetchedReminder.remainderMail || '');
        setCcMail(fetchedReminder.ccMails?.join(', ') || '');
        setSelectedReminderDates(fetchedReminder.remainderDates?.map(String) || []);
      }
    } catch (error: any) {
      // If 404, it means no existing reminder, which is fine.
      if (error.response && error.response.status !== 404) {
        console.error('Error fetching existing reminder:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load existing reminder data.',
        });
      }
    } finally {
      setFetchingReminderData(false);
      setOpenReminderModal(true);
    }
  };

  const handleCloseReminderModal = () => {
    setOpenReminderModal(false);
    setCurrentCompanyIdForReminder(null);
    setReminderMail('');
    setCcMail('');
    setSelectedReminderDates([]);
    setRemainderType('');
    setFetchingReminderData(false);
  };

  const handleSaveReminder = async () => {
    if (!reminderMail) {
      Alert.alert('Error', 'Reminder Mail is required.');
      return;
    }
    if (selectedReminderDates.length === 0) {
      Alert.alert('Error', 'At least one Reminder Date is required.');
      return;
    }
    if (!remainderType) {
      Alert.alert('Error', 'Reminder Type is required.');
      return;
    }

    const ccMailsArray = ccMail
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email !== '');

    try {
      const response = await axios.post(
        `${getApiBaseUrl()}/remainders`,
        {
          companyId: currentCompanyIdForReminder,
          remainderType: remainderType,
          remainderMail: reminderMail,
          ccMails: ccMailsArray,
          remainderDates: selectedReminderDates.map(Number),
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || 'Reminder saved successfully',
        });
        handleCloseReminderModal();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data.message || 'Failed to save reminder.',
        });
      }
    } catch (error: any) {
      console.error('Error saving reminder:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Error saving reminder.',
      });
    }
  };

  const handleSetReminder = (companyId: string, type: string) => {
    handleOpenReminderModal(companyId, type);
  };

  const filteredCompanies = companies.filter((company) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const companyName = company.companyName?.toLowerCase() || '';
    const mobileNumber = company.mobileNumber?.toLowerCase() || '';

    return (
      companyName.includes(lowerCaseSearchTerm) ||
      mobileNumber.includes(lowerCaseSearchTerm)
    );
  });

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <View style={styles.companyCard}>
      <View style={styles.companyHeader}>
        <Text style={styles.companyName}>{item.companyName}</Text>
        <Text style={styles.companyAddress}>{item.companyAddress}</Text>
        <Text style={styles.companyMobile}>{item.mobileNumber}</Text>
      </View>

      <View style={styles.reportsSection}>
        <Text style={styles.sectionTitle}>Service Reports</Text>
        <View style={styles.reportRow}>
          <View style={styles.countButtonContainer}>
            <TouchableOpacity
              style={[
                styles.countButton,
                item.serviceInvoiceCount === 0 && styles.countButtonDisabled,
              ]}
              onPress={() => handleViewServiceInvoices(item._id)}
              disabled={item.serviceInvoiceCount === 0}
            >
              <Text
                style={[
                  styles.countButtonText,
                  item.serviceInvoiceCount === 0 && styles.countButtonTextDisabled,
                ]}
              >
                Invoices: {item.serviceInvoiceCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reminderIconButton}
              onPress={() => handleSetReminder(item._id, 'ServiceInvoice')}
            >
              <Icon name="notifications-active" size={20} color="#FF9500" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.serviceQuotationCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewServiceQuotations(item._id)}
            disabled={item.serviceQuotationCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.serviceQuotationCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Quotations: {item.serviceQuotationCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.serviceReportCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewServiceReports(item._id)}
            disabled={item.serviceReportCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.serviceReportCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Reports: {item.serviceReportCount}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Rental Reports</Text>
        <View style={styles.reportRow}>
          <View style={styles.countButtonContainer}>
            <TouchableOpacity
              style={[
                styles.countButton,
                item.rentalInvoiceCount === 0 && styles.countButtonDisabled,
              ]}
              onPress={() => handleViewRentalInvoices(item._id)}
              disabled={item.rentalInvoiceCount === 0}
            >
              <Text
                style={[
                  styles.countButtonText,
                  item.rentalInvoiceCount === 0 && styles.countButtonTextDisabled,
                ]}
              >
                Invoices: {item.rentalInvoiceCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reminderIconButton}
              onPress={() => handleSetReminder(item._id, 'RentalInvoice')}
            >
              <Icon name="notifications-active" size={20} color="#FF9500" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.rentalQuotationCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewRentalQuotations(item._id)}
            disabled={item.rentalQuotationCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.rentalQuotationCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Quotations: {item.rentalQuotationCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.rentalReportCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewRentalReports(item._id)}
            disabled={item.rentalReportCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.rentalReportCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Reports: {item.rentalReportCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={64} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCompanies}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Company Reports</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Company Name or Mobile Number"
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCompanies}
        renderItem={renderCompanyItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="business" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No companies found matching your search' : 'No company data found'}
            </Text>
          </View>
        }
      />

      {/* Reminder Modal */}
      <Modal
        visible={openReminderModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseReminderModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Reminder</Text>
              <TouchableOpacity onPress={handleCloseReminderModal}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {fetchingReminderData ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#019ee3" />
                <Text style={styles.modalLoadingText}>Loading reminder data...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Reminder Mail *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter reminder email"
                    value={reminderMail}
                    onChangeText={setReminderMail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Reminder Type *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setReminderTypePickerVisible(true)}
                  >
                    <Text style={[styles.pickerButtonText, !remainderType && styles.placeholderText]}>
                      {remainderType
                        ? reminderTypeOptions.find((opt) => opt.value === remainderType)?.label || remainderType
                        : 'Select Reminder Type'}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>CC Mail (comma-separated)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter CC emails separated by commas"
                    value={ccMail}
                    onChangeText={setCcMail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Reminder Dates *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setReminderDatePickerVisible(true)}
                  >
                    <Text style={[styles.pickerButtonText, selectedReminderDates.length === 0 && styles.placeholderText]}>
                      {selectedReminderDates.length > 0
                        ? selectedReminderDates.join(', ')
                        : 'Select Reminder Dates'}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color="#666" />
                  </TouchableOpacity>
                  {selectedReminderDates.length > 0 && (
                    <View style={styles.selectedDatesContainer}>
                      {selectedReminderDates.map((date, index) => (
                        <View key={index} style={styles.dateChip}>
                          <Text style={styles.dateChipText}>{date}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedReminderDates(selectedReminderDates.filter((d) => d !== date));
                            }}
                          >
                            <Icon name="close" size={16} color="#666" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelButton} onPress={handleCloseReminderModal}>
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSaveButton, fetchingReminderData && styles.modalSaveButtonDisabled]}
                    onPress={handleSaveReminder}
                    disabled={fetchingReminderData}
                  >
                    <Text style={styles.modalSaveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Reminder Type Picker Modal */}
      <Modal visible={reminderTypePickerVisible} animationType="slide" transparent>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Reminder Type</Text>
              <TouchableOpacity onPress={() => setReminderTypePickerVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {reminderTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.pickerOption}
                  onPress={() => {
                    setRemainderType(option.value);
                    setReminderTypePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{option.label}</Text>
                  {remainderType === option.value && <Icon name="check" size={20} color="#019ee3" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reminder Date Picker Modal */}
      <Modal visible={reminderDatePickerVisible} animationType="slide" transparent>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Reminder Dates (1-31)</Text>
              <TouchableOpacity onPress={() => setReminderDatePickerVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {reminderDateOptions.map((date) => {
                const isSelected = selectedReminderDates.includes(date);
                return (
                  <TouchableOpacity
                    key={date}
                    style={styles.pickerOption}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedReminderDates(selectedReminderDates.filter((d) => d !== date));
                      } else {
                        setSelectedReminderDates([...selectedReminderDates, date]);
                      }
                    }}
                  >
                    <Text style={styles.pickerOptionText}>Day {date}</Text>
                    {isSelected && <Icon name="check" size={20} color="#019ee3" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.pickerModalActions}>
              <TouchableOpacity
                style={styles.pickerModalClearButton}
                onPress={() => setSelectedReminderDates([])}
              >
                <Text style={styles.pickerModalClearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerModalDoneButton}
                onPress={() => setReminderDatePickerVisible(false)}
              >
                <Text style={styles.pickerModalDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
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
  companyCard: {
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
  companyHeader: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  companyMobile: {
    fontSize: 14,
    color: '#666',
  },
  reportsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#019ee3',
    marginBottom: 10,
  },
  reportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  countButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#019ee3',
    minWidth: 100,
  },
  reminderIconButton: {
    padding: 4,
  },
  countButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  countButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#019ee3',
    textAlign: 'center',
  },
  countButtonTextDisabled: {
    color: '#999',
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
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '90%',
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
  modalLoadingContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
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
  placeholderText: {
    color: '#999',
  },
  selectedDatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#019ee3',
    gap: 6,
  },
  dateChipText: {
    fontSize: 14,
    color: '#019ee3',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#019ee3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  pickerModalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  pickerModalClearButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerModalClearButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  pickerModalDoneButton: {
    flex: 1,
    backgroundColor: '#019ee3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerModalDoneButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CompanyReportsScreen;
