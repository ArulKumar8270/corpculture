import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { clearAuth } from '../../store/slices/authSlice';
import { clearPermissions } from '../../store/slices/permissionsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import axios from 'axios';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  // Payment update states
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceType, setInvoiceType] = useState<'rental' | 'service'>('rental');
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [rentalInvoices, setRentalInvoices] = useState<any[]>([]);
  const [serviceInvoices, setServiceInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modeOfPaymentPickerVisible, setModeOfPaymentPickerVisible] = useState(false);
  const [amountTypePickerVisible, setAmountTypePickerVisible] = useState(false);
  const [pendingInvoicePickerVisible, setPendingInvoicePickerVisible] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState({
    modeOfPayment: '',
    bankName: '',
    transactionDetails: '',
    chequeDate: '',
    transferDate: '',
    companyNamePayment: '',
    otherPaymentMode: '',
    paymentAmount: '',
    paymentAmountType: '',
    grandTotal: 0,
  });
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [companyPendingInvoices, setCompanyPendingInvoices] = useState<any[]>([]);
  const [selectedPendingInvoiceId, setSelectedPendingInvoiceId] = useState<string | null>(null);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('auth');
    dispatch(clearAuth());
    dispatch(clearPermissions());
    Toast.show({
      type: 'success',
      text1: 'Logged Out',
      text2: 'You have been logged out successfully',
    });
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 0:
        return 'Customer';
      case 1:
        return 'Admin';
      case 3:
        return 'Employee';
      default:
        return 'User';
    }
  };

  // Fetch companies with pending invoices
  const fetchCompaniesWithInvoices = async () => {
    if (user?.role !== 3) return;
    
    try {
      setLoading(true);
      const [rentalRes, serviceRes] = await Promise.all([
        axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/rental-payment/assignedTo/${user?._id}/invoice`,
          {},
          { headers: { Authorization: token || '' } }
        ).catch(() => ({ data: { success: false, entries: [] } })),
        axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/assignedTo/${user?._id}/invoice`,
          { headers: { Authorization: token || '' } }
        ).catch(() => ({ data: { success: false, serviceInvoices: [] } })),
      ]);

      const rentalEntries = rentalRes.data?.success ? (rentalRes.data.entries || []) : [];
      const serviceEntries = serviceRes.data?.success ? (serviceRes.data.serviceInvoices || []) : [];

      setRentalInvoices(rentalEntries);
      setServiceInvoices(serviceEntries);

      // Group by company
      const companyMap = new Map();
      
      rentalEntries.forEach((entry: any) => {
        const companyId = entry.companyId?._id || entry.companyId;
        const companyName = entry.companyId?.companyName || 'Unknown';
        if (companyId) {
          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, {
              _id: companyId,
              companyName,
              rentalInvoices: [],
              serviceInvoices: [],
            });
          }
          companyMap.get(companyId).rentalInvoices.push(entry);
        }
      });

      serviceEntries.forEach((entry: any) => {
        const companyId = entry.companyId?._id || entry.companyId;
        const companyName = entry.companyId?.companyName || 'Unknown';
        if (companyId) {
          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, {
              _id: companyId,
              companyName,
              rentalInvoices: [],
              serviceInvoices: [],
            });
          }
          companyMap.get(companyId).serviceInvoices.push(entry);
        }
      });

      setCompanies(Array.from(companyMap.values()));
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load invoices',
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 3) {
        fetchCompaniesWithInvoices();
      }
    }, [user?.role, token])
  );

  const handleOpenPaymentModal = (invoice: any, type: 'rental' | 'service') => {
    setSelectedInvoice(invoice);
    setInvoiceType(type);
    let initialPaymentAmount = 0;
    let initialPaymentAmountType = '';

    if (invoice.tdsAmount > 0) {
      initialPaymentAmount = invoice.tdsAmount;
      initialPaymentAmountType = 'TDS';
    } else if (invoice.pendingAmount > 0) {
      initialPaymentAmount = invoice.pendingAmount;
      initialPaymentAmountType = 'Pending';
    }

    setPaymentForm({
      modeOfPayment: invoice.modeOfPayment || '',
      bankName: invoice.bankName || '',
      transactionDetails: invoice.transactionDetails || '',
      chequeDate: invoice.chequeDate ? new Date(invoice.chequeDate).toISOString().split('T')[0] : '',
      transferDate: invoice.transferDate ? new Date(invoice.transferDate).toISOString().split('T')[0] : '',
      companyNamePayment: invoice.companyNamePayment || '',
      otherPaymentMode: invoice.otherPaymentMode || '',
      paymentAmount: initialPaymentAmount.toString(),
      paymentAmountType: initialPaymentAmountType,
      grandTotal: invoice.grandTotal || 0,
    });
    setBalanceAmount(0);
    setPendingAmount(0);
    setCompanyPendingInvoices([]);
    setSelectedPendingInvoiceId(null);
    setPaymentModalVisible(true);
  };

  const handlePaymentAmountChange = async (value: string) => {
    setPaymentForm({ ...paymentForm, paymentAmount: value });
    const amount = parseFloat(value) || 0;

    if (amount < selectedInvoice?.grandTotal) {
      const pending = selectedInvoice?.grandTotal - amount;
      setPendingAmount(pending);
      setBalanceAmount(0);
    } else {
      const balance = amount - selectedInvoice?.grandTotal;
      setBalanceAmount(balance);
      setPendingAmount(0);

      if (balance > 0) {
        try {
          const endpoint = invoiceType === 'rental' 
            ? '/rental-payment/all'
            : '/service-invoice/all';
          const responseKey = invoiceType === 'rental' ? 'entries' : 'serviceInvoices';
          
          const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}${endpoint}`,
            {
              companyId: selectedInvoice?.companyId?._id || selectedInvoice?.companyId,
              tdsAmount: { $eq: null },
              status: { $ne: 'Paid' },
            },
            {
              headers: {
                Authorization: token || '',
              },
            }
          );
          const filteredInvoices = (response.data?.[responseKey] || []).filter(
            (inv: any) => inv._id !== selectedInvoice?._id
          );
          setCompanyPendingInvoices(filteredInvoices);
        } catch (error) {
          console.error('Error fetching pending invoices:', error);
        }
      }
    }
  };

  const handleSavePaymentDetails = async () => {
    if (!selectedInvoice) return;

    try {
      const paymentAmount = parseFloat(paymentForm.paymentAmount) || 0;
      
      const payload: any = {
        modeOfPayment: paymentForm.modeOfPayment,
        bankName: paymentForm.bankName,
        transactionDetails: paymentForm.transactionDetails,
        chequeDate: paymentForm.chequeDate,
        transferDate: paymentForm.transferDate,
        companyNamePayment: paymentForm.companyNamePayment,
        otherPaymentMode: paymentForm.otherPaymentMode,
        paymentAmountType: paymentForm.paymentAmountType,
        paymentAmount: paymentForm?.paymentAmount ? parseFloat(paymentForm.paymentAmount) : 0,
        tdsAmount: 0,
        pendingAmount: 0,
        status: 'Paid',
      };

      if (paymentForm.paymentAmountType === 'TDS') {
        payload.tdsAmount = pendingAmount || 0;
      } else if (paymentForm.paymentAmountType === 'Pending') {
        payload.pendingAmount = pendingAmount || 0;
      }

      const invoiceId = selectedPendingInvoiceId || selectedInvoice._id;
      const endpoint = invoiceType === 'rental'
        ? `/rental-payment/${invoiceId}`
        : `/service-invoice/update/${invoiceId}`;
      
      const res = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}${endpoint}`,
        payload,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );

      if (res.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Payment details updated successfully!',
        });
        setPaymentModalVisible(false);
        fetchCompaniesWithInvoices();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update payment details',
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon name="person" size={50} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.role}>{getRoleName(user?.role || 0)}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Icon name="email" size={20} color="#666" />
          <Text style={styles.infoText}>{user?.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="phone" size={20} color="#666" />
          <Text style={styles.infoText}>{user?.phone || 'N/A'}</Text>
        </View>
      </View>

      {/* Payment Update Section for Employees */}
      {user?.role === 3 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Updates</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
          ) : companies.length === 0 ? (
            <Text style={styles.emptyText}>No pending invoices</Text>
          ) : (
            companies.map((company) => (
              <View key={company._id} style={styles.companyCard}>
                <Text style={styles.companyName}>{company.companyName}</Text>
                
                {/* Rental Invoices */}
                {company.rentalInvoices.length > 0 && (
                  <View style={styles.invoiceGroup}>
                    <Text style={styles.invoiceGroupTitle}>Rental Invoices ({company.rentalInvoices.length})</Text>
                    {company.rentalInvoices.map((invoice: any) => (
                      <TouchableOpacity
                        key={invoice._id}
                        style={styles.invoiceItem}
                        onPress={() => handleOpenPaymentModal(invoice, 'rental')}
                      >
                        <View style={styles.invoiceItemLeft}>
                          <Text style={styles.invoiceNumber}>
                            {invoice.invoiceNumber || 'N/A'}
                          </Text>
                          <Text style={styles.invoiceAmount}>
                            ₹{invoice.grandTotal || 0}
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#999" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Service Invoices */}
                {company.serviceInvoices.length > 0 && (
                  <View style={styles.invoiceGroup}>
                    <Text style={styles.invoiceGroupTitle}>Service Invoices ({company.serviceInvoices.length})</Text>
                    {company.serviceInvoices.map((invoice: any) => (
                      <TouchableOpacity
                        key={invoice._id}
                        style={styles.invoiceItem}
                        onPress={() => handleOpenPaymentModal(invoice, 'service')}
                      >
                        <View style={styles.invoiceItemLeft}>
                          <Text style={styles.invoiceNumber}>
                            {invoice.invoiceNumber || 'N/A'}
                          </Text>
                          <Text style={styles.invoiceAmount}>
                            ₹{invoice.grandTotal || 0}
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#999" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color="#FF3B30" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPaymentModalVisible(false)}
        >
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Payment Details</Text>

            {/* Mode of Payment */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Mode Of Payment</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setModeOfPaymentPickerVisible(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {paymentForm.modeOfPayment || '--select Payment Mode--'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Payment Mode Specific Fields */}
            {paymentForm.modeOfPayment === 'CHEQUE' && (
              <>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Cheque Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.transactionDetails}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, transactionDetails: text })
                    }
                    placeholder="Enter Cheque Number"
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Cheque Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.chequeDate}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, chequeDate: text })
                    }
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.bankName}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, bankName: text })
                    }
                    placeholder="Enter Bank Name"
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Company Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.companyNamePayment}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, companyNamePayment: text })
                    }
                    placeholder="Enter Company Name"
                  />
                </View>
              </>
            )}

            {paymentForm.modeOfPayment === 'BANK TRANSFER' && (
              <>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Transaction ID</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.transactionDetails}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, transactionDetails: text })
                    }
                    placeholder="Enter Transaction ID"
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Transfer Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.transferDate}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, transferDate: text })
                    }
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.bankName}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, bankName: text })
                    }
                    placeholder="Enter Bank Name"
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Company Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.companyNamePayment}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, companyNamePayment: text })
                    }
                    placeholder="Enter Company Name"
                  />
                </View>
              </>
            )}

            {paymentForm.modeOfPayment === 'UPI' && (
              <>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>UPI ID</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.transactionDetails}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, transactionDetails: text })
                    }
                    placeholder="Enter UPI ID"
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Company Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.companyNamePayment}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, companyNamePayment: text })
                    }
                    placeholder="Enter Company Name"
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Transfer Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={paymentForm.transferDate}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, transferDate: text })
                    }
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </>
            )}

            {paymentForm.modeOfPayment === 'OTHERS' && (
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Other Payment Mode</Text>
                <TextInput
                  style={styles.modalInput}
                  value={paymentForm.otherPaymentMode}
                  onChangeText={(text) =>
                    setPaymentForm({ ...paymentForm, otherPaymentMode: text })
                  }
                  placeholder="Enter Other Payment Mode"
                />
              </View>
            )}

            {/* Payment Amount */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Amount</Text>
              <TextInput
                style={styles.modalInput}
                value={paymentForm.paymentAmount}
                onChangeText={handlePaymentAmountChange}
                placeholder="Enter Amount"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Balance Amount Display */}
            {balanceAmount > 0 && companyPendingInvoices.length > 0 && (
              <>
                <Text style={styles.balanceText}>
                  Previous Invoice Balance - Rs {balanceAmount.toFixed(2)}
                </Text>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Select Pending Invoice</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setPendingInvoicePickerVisible(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {selectedPendingInvoiceId
                        ? (() => {
                            const selectedInv = companyPendingInvoices.find(
                              (inv) => inv._id === selectedPendingInvoiceId
                            );
                            return selectedInv
                              ? `${new Date(selectedInv.createdAt || selectedInv.invoiceDate).toLocaleDateString()} - Rs ${selectedInv.grandTotal?.toFixed(2) || '0.00'}`
                              : 'Select Invoice';
                          })()
                        : '--select Invoice--'}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Amount Type Selector */}
            {pendingAmount > 0 && (
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Amount Type</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setAmountTypePickerVisible(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {paymentForm.paymentAmountType || '--select Amount Type--'}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={() => {
                  handleSavePaymentDetails();
                  if (balanceAmount > 0) {
                    setTimeout(() => {
                      handleSavePaymentDetails();
                    }, 1000);
                  }
                }}
              >
                <Text style={styles.modalSaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

      {/* Mode Of Payment Picker Modal */}
      <Modal
        visible={modeOfPaymentPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModeOfPaymentPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModeOfPaymentPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Payment Mode</Text>
            <FlatList
              data={[
                { value: '', label: '--select Payment Mode--' },
                { value: 'CHEQUE', label: 'CHEQUE' },
                { value: 'BANK TRANSFER', label: 'BANK TRANSFER' },
                { value: 'CASH', label: 'CASH' },
                { value: 'UPI', label: 'UPI' },
                { value: 'OTHERS', label: 'OTHERS' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    if (item.value) {
                      setPaymentForm({ ...paymentForm, modeOfPayment: item.value });
                    }
                    setModeOfPaymentPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setModeOfPaymentPickerVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Amount Type Picker Modal */}
      <Modal
        visible={amountTypePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAmountTypePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAmountTypePickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Amount Type</Text>
            <FlatList
              data={[
                { value: '', label: '--select Amount Type--' },
                { value: 'TDS', label: 'TDS Amount' },
                { value: 'Pending', label: 'Pending Amount' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    if (item.value) {
                      setPaymentForm({ ...paymentForm, paymentAmountType: item.value });
                    }
                    setAmountTypePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setAmountTypePickerVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pending Invoice Picker Modal */}
      <Modal
        visible={pendingInvoicePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPendingInvoicePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPendingInvoicePickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Pending Invoice</Text>
            <FlatList
              data={companyPendingInvoices.filter(
                (inv) => inv._id !== selectedInvoice?._id
              )}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedPendingInvoiceId(item._id);
                    setPendingInvoicePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>
                    {new Date(item.createdAt || item.invoiceDate).toLocaleDateString()} - Rs{' '}
                    {item.grandTotal?.toFixed(2) || '0.00'}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.pickerEmptyContainer}>
                  <Text style={styles.pickerEmptyText}>No pending invoices</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setPendingInvoicePickerVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 30,
    alignItems: 'center',
    paddingTop: 50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  loader: {
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    padding: 20,
    textAlign: 'center',
  },
  companyCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  invoiceGroup: {
    marginTop: 10,
  },
  invoiceGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
  },
  invoiceItemLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  invoiceAmount: {
    fontSize: 14,
    color: '#007AFF',
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
  },
  modalContentContainer: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputGroup: {
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  balanceText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 10,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#e0e0e0',
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  modalSaveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '70%',
    width: '90%',
    alignSelf: 'center',
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
  pickerEmptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  pickerEmptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default ProfileScreen;

