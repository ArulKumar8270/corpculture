import React, { useEffect, useState, useCallback } from 'react';
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
  Linking,
  Image,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

const RentalInvoiceListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const invoiceType = (route.params as any)?.invoiceType || 'invoice';

  const [rentalEntries, setRentalEntries] = useState<any[]>([]);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deletingLink, setDeletingLink] = useState<string | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    modeOfPayment: 'CASH',
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
  const [modeOfPaymentPickerVisible, setModeOfPaymentPickerVisible] = useState(false);
  const [amountTypePickerVisible, setAmountTypePickerVisible] = useState(false);
  const [pendingInvoicePickerVisible, setPendingInvoicePickerVisible] = useState(false);

  useEffect(() => {
    fetchRentalEntries();
    fetchInvoicesCount();
  }, [invoiceType, token]);

  useFocusEffect(
    useCallback(() => {
      fetchRentalEntries();
      fetchInvoicesCount();
    }, [token, invoiceType])
  );

  useEffect(() => {
    filterEntries();
  }, [searchTerm]);

  const fetchRentalEntries = async () => {
    try {
      setLoading(true);
      let response;
      if (user?.role === 3) {
        // Backend route is POST, not GET
        response = await axios.post(
          `${getApiBaseUrl()}/rental-payment/assignedTo/${user?._id}/${invoiceType}`,
          {},
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      } else {
        response = await axios.post(
          `${getApiBaseUrl()}/rental-payment/all`,
          { invoiceType, tdsAmount: { $eq: null }, status: { $ne: 'Paid' } },
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      }

      if (response.data?.success) {
        setRentalEntries(response.data.entries || []);
      } else {
        setRentalEntries([]);
      }
    } catch (error: any) {
      console.error('Error fetching rental entries:', error);
      console.error('Error response:', error.response?.data);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load rental entries',
      });
      setRentalEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoicesCount = async () => {
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/common-details`, {
        headers: {
          Authorization: token || '',
        },
      });
      if (data?.success) {
        setInvoiceCount(data.commonDetails?.invoiceCount + 1 || 1);
      }
    } catch (error) {
      console.error('Error fetching invoice count:', error);
    }
  };

  const filterEntries = () => {
    // Filtering is handled in renderEntry
  };

  const toggleExpand = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const handleEdit = (entry: any) => {
    (navigation as any).navigate('AddRentalInvoice', {
      id: entry._id,
      invoiceType,
    });
  };

  const handleUploadSignedInvoice = async (entry: any) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType?.All 
          || [(ImagePicker as any).MediaType?.Images, (ImagePicker as any).MediaType?.Videos].filter(Boolean)
          || 'images',
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setUploading(entry._id);
      
      const fileExtension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      let mimeType = 'image/jpeg';
      if (asset.mimeType) {
        mimeType = asset.mimeType;
      } else if (asset.type) {
        mimeType = asset.type;
      } else if (fileExtension === 'png') {
        mimeType = 'image/png';
      } else if (fileExtension === 'pdf') {
        mimeType = 'application/pdf';
      }
      
      const fileName = `invoice_${entry._id}_${Date.now()}.${fileExtension}`;

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: mimeType,
        name: fileName,
      } as any);

      const apiUrl = getApiBaseUrl();
      if (!apiUrl) {
        throw new Error('API URL is not configured');
      }

      const uploadRes = await axios.post(
        `${apiUrl}/auth/upload-file`,
        formData,
        {
          headers: {
            Authorization: token || '',
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      if (uploadRes.data?.fileUrl) {
        const oldInvoiceLink = entry.invoiceLink || [];
        
        const serviceRes = await axios.put(
          `${apiUrl}/rental-payment/${entry._id}`,
          {
            invoiceLink: [...oldInvoiceLink, uploadRes.data.fileUrl],
            status: 'InvoiceSent',
          },
          {
            headers: {
              Authorization: token || '',
            },
          }
        );

        if (serviceRes.data?.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Signed invoice uploaded successfully!',
          });
          fetchRentalEntries();
        } else {
          throw new Error(serviceRes.data?.message || 'Failed to update entry');
        }
      } else {
        throw new Error('File upload failed - no file URL returned');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        apiUrl: getApiBaseUrl(),
      });
      
      let errorMessage = 'Failed to upload invoice';
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteInvoiceLink = async (entry: any, linkToDelete: string) => {
    Alert.alert(
      'Delete Invoice Link',
      'Are you sure you want to delete this invoice link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingLink(entry._id);
              const fileName = linkToDelete.split('/').pop();
              await axios.post(
                `${getApiBaseUrl()}/auth/delete-file/${fileName}`,
                {},
                {
                  headers: {
                    Authorization: token || '',
                  },
                }
              );

              const updatedLinks = entry.invoiceLink.filter((link: string) => link !== linkToDelete);
              await axios.put(
                `${getApiBaseUrl()}/rental-payment/${entry._id}`,
                { invoiceLink: updatedLinks },
                {
                  headers: {
                    Authorization: token || '',
                  },
                }
              );

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Invoice link deleted successfully!',
              });
              fetchRentalEntries();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete invoice link',
              });
            } finally {
              setDeletingLink(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenPaymentModal = (entry: any) => {
    setSelectedEntry(entry);
    let initialPaymentAmount = 0;
    let initialPaymentAmountType = '';

    if (entry.tdsAmount > 0) {
      initialPaymentAmount = entry.tdsAmount;
      initialPaymentAmountType = 'TDS';
    } else if (entry.pendingAmount > 0) {
      initialPaymentAmount = entry.pendingAmount;
      initialPaymentAmountType = 'Pending';
    }

    setPaymentForm({
      modeOfPayment: entry.modeOfPayment || 'CASH',
      bankName: entry.bankName || '',
      transactionDetails: entry.transactionDetails || '',
      chequeDate: entry.chequeDate ? new Date(entry.chequeDate).toISOString().split('T')[0] : '',
      transferDate: entry.transferDate ? new Date(entry.transferDate).toISOString().split('T')[0] : '',
      companyNamePayment: entry.companyNamePayment || '',
      otherPaymentMode: entry.otherPaymentMode || '',
      paymentAmount: initialPaymentAmount.toString(),
      paymentAmountType: initialPaymentAmountType,
      grandTotal: entry.grandTotal || 0,
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

    if (amount < selectedEntry?.grandTotal) {
      const pending = selectedEntry?.grandTotal - amount;
      setPendingAmount(pending);
      setBalanceAmount(0);
    } else {
      const balance = amount - selectedEntry?.grandTotal;
      setBalanceAmount(balance);
      setPendingAmount(0);

      if (balance > 0) {
        try {
          const response = await axios.post(
            `${getApiBaseUrl()}/rental-payment/all`,
            {
              companyId: selectedEntry?.companyId?._id || selectedEntry?.companyId,
              tdsAmount: { $eq: null },
              status: { $ne: 'Paid' },
            },
            {
              headers: {
                Authorization: token || '',
              },
            }
          );
          // Filter out the current invoice
          const filteredInvoices = (response.data?.entries || []).filter(
            (inv: any) => inv._id !== selectedEntry?._id
          );
          setCompanyPendingInvoices(filteredInvoices);
        } catch (error) {
          console.error('Error fetching pending invoices:', error);
        }
      }
    }
  };

  const resetForm = useCallback((companyId?: string) => {
    const companyIdToUse = companyId && companyId !== 'null' ? companyId : '';
    setPaymentForm({
      modeOfPayment: 'CASH',
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
    setBalanceAmount(0);
    setPendingAmount(0);
    setCompanyPendingInvoices([]);
    setSelectedPendingInvoiceId(null);
  }, []);

  const handleSavePaymentDetails = async (balanceAmountParam?: number) => {
    if (!selectedEntry) return;

    try {
      const paymentAmount = parseFloat(paymentForm.paymentAmount) || 0;
      const grandTotal = parseFloat(String(selectedEntry?.grandTotal || paymentForm.grandTotal)) || 0;
      
      // Calculate status based on payment amount and balance
      let status = 'Paid';
      if (balanceAmountParam && selectedPendingInvoiceId) {
        status = 'Unpaid';
      } else if (paymentAmount >= grandTotal || paymentForm.paymentAmountType === 'TDS') {
        status = 'Paid';
      } else {
        status = 'Unpaid';
      }
      
      const payload: any = {
        modeOfPayment: paymentForm.modeOfPayment,
        bankName: paymentForm.bankName,
        transactionDetails: paymentForm.transactionDetails,
        chequeDate: paymentForm.chequeDate,
        transferDate: paymentForm.transferDate,
        companyNamePayment: paymentForm.companyNamePayment,
        otherPaymentMode: paymentForm.otherPaymentMode,
        paymentAmountType: paymentForm.paymentAmountType,
        paymentAmount: balanceAmountParam 
          ? balanceAmountParam 
          : (paymentAmount >= grandTotal ? grandTotal : paymentAmount),
        tdsAmount: 0,
        pendingAmount: 0,
        status: status,
      };

      if (paymentForm.paymentAmountType === 'TDS') {
        payload.tdsAmount = pendingAmount || 0;
      } else if (paymentForm.paymentAmountType === 'Pending') {
        payload.pendingAmount = pendingAmount || 0;
      }

      const invoiceId = balanceAmountParam ? selectedPendingInvoiceId : (selectedPendingInvoiceId || selectedEntry._id);
      
      if (invoiceId) {
        const res = await axios.put(
          `${getApiBaseUrl()}/rental-payment/${invoiceId}`,
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
            text2: res.data.message || 'Payment details updated successfully!',
          });
          setPaymentModalVisible(false);
          fetchRentalEntries();
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: res.data?.message || 'Failed to update payment details',
          });
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update payment details',
      });
    }
  };

  const handleUpdateInvoiceCount = async () => {
    try {
      await axios.put(
        `${getApiBaseUrl()}/common-details/increment-invoice`,
        {
          invoiceCount: invoiceCount,
        },
        {
          headers: {
            Authorization: token || '',
          },
        }
      );
    } catch (error) {
      console.error('Error updating invoice count:', error);
    }
  };

  const onMoveToInvoice = async (entry: any) => {
    try {
      const payload = {
        invoiceType: 'invoice',
        invoiceNumber: invoiceCount,
      };

      const res = await axios.put(
        `${getApiBaseUrl()}/rental-payment/${entry._id}`,
        payload,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );

      if (res.data?.success) {
        await handleUpdateInvoiceCount();
        fetchRentalEntries();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: res.data.message || 'Moved to invoice successfully!',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: res.data?.message || 'Failed to update move quotation details.',
        });
      }
    } catch (error: any) {
      console.error('Error updating status details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong while updating status details.',
      });
    }
  };

  const onSendInvoice = async (entry: any) => {
    setSendingInvoice(entry._id);
    try {
      await axios.post('https://n8n.nicknameinfo.net/webhook/f8d3ad37-a38e-4a38-a06e-09c74fdc3b91', {
        invoiceId: entry._id,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Invoice sent successfully!',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send invoice',
      });
    } finally {
      setSendingInvoice(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return '#34C759';
      case 'Unpaid':
        return '#FF3B30';
      case 'Pending':
      case 'Progress':
        return '#FF9500';
      default:
        return '#999';
    }
  };

  const filteredEntries = rentalEntries.filter((entry) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const invoiceNumberMatch =
      invoiceType === 'invoice' &&
      entry?.invoiceNumber?.toString().toLowerCase().includes(lowerCaseSearchTerm);
    const companyNameMatch = entry.companyId?.companyName?.toLowerCase().includes(lowerCaseSearchTerm);
    const statusMatch = entry.paymentAmountType?.toLowerCase().includes(lowerCaseSearchTerm);
    const dateMatch = entry.createdAt
      ? new Date(entry.createdAt).toISOString().split('T')[0].includes(lowerCaseSearchTerm)
      : false;

    return invoiceNumberMatch || companyNameMatch || statusMatch || dateMatch;
  });

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // Pagination handlers
  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
  };

  // Get paginated data
  const paginatedEntries = filteredEntries.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderEntry = ({ item }: { item: any }) => {
    const isExpanded = expandedEntries.has(item._id);
    const isUploadingThis = uploading === item._id;
    const isDeletingThis = deletingLink === item._id;
    const isSendingThis = sendingInvoice === item._id;

    // Get first product for display (for backward compatibility with single product)
    const firstProduct = item.products && item.products.length > 0 
      ? item.products[0] 
      : item.machineId ? { machineId: item.machineId } : null;

    return (
      <View style={styles.entryCard}>
        <TouchableOpacity
          style={styles.entryHeader}
          onPress={() => toggleExpand(item._id)}
        >
          <View style={styles.entryHeaderLeft}>
            {invoiceType === 'invoice' && (
              <Text style={styles.invoiceNumber}>{item.invoiceNumber || 'N/A'}</Text>
            )}
            <View>
              <Text style={styles.companyName}>
                {item.companyId?.companyName || 'N/A'}
              </Text>
              <Text style={styles.serialNo}>
                Serial No: {firstProduct?.machineId?.serialNo || item.machineId?.serialNo || 'N/A'}
              </Text>
              <Text style={styles.modelName}>
                Model: {firstProduct?.machineId?.modelName || item.machineId?.modelName || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.entryHeaderRight}>
            {item.invoiceLink?.length === 0 && (
              <View style={styles.warningBadge}>
                <Icon name="warning" size={16} color="#FF3B30" />
                <Text style={styles.warningText}>Invoice Upload Pending</Text>
              </View>
            )}
            <Icon
              name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.entryDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Send Details To:</Text>
            <Text style={styles.detailValue}>{item.sendDetailsTo || 'N/A'}</Text>
          </View>
          {item.assignedTo && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned To:</Text>
              <Text style={styles.detailValue}>
                {item.assignedTo?.name || item.assignedTo || 'N/A'}
              </Text>
            </View>
          )}
          {item.grandTotal && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Grand Total:</Text>
              <Text style={[styles.detailValue, { fontWeight: 'bold', color: '#1976d2' }]}>
                ₹{parseFloat(String(item.grandTotal)).toFixed(2)}
              </Text>
            </View>
          )}
          {item.status && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[
                styles.statusBadge,
                item.status === 'Paid' ? styles.statusPaid :
                item.status === 'Unpaid' ? styles.statusUnpaid :
                styles.statusPending
              ]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          )}
          {item.countImageUpload?.url && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Count Image:</Text>
              <TouchableOpacity onPress={() => Linking.openURL(item.countImageUpload.url)}>
                <Image
                  source={{ uri: item.countImageUpload.url }}
                  style={styles.countImage}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {hasPermission('rentalInvoice', 'edit') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(item)}
            >
              <Icon name="edit" size={18} color="#007AFF" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton]}
            onPress={() => onSendInvoice(item)}
            disabled={isSendingThis}
          >
            {isSendingThis ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="send" size={18} color="#fff" />
                <Text style={[styles.actionButtonText, styles.sendButtonText]}>
                  Send {invoiceType === 'quotation' ? 'Quotation' : 'Invoice'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {invoiceType === 'quotation' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.moveButton]}
              onPress={() => onMoveToInvoice(item)}
            >
              <Icon name="arrow-forward" size={18} color="#007AFF" />
              <Text style={styles.actionButtonText}>Move to Invoice</Text>
            </TouchableOpacity>
          )}
          {!item?.tdsAmount && invoiceType !== 'quotation' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.paymentButton]}
              onPress={() => handleOpenPaymentModal(item)}
            >
              <Icon name="payment" size={18} color="#007AFF" />
              <Text style={styles.actionButtonText}>Update Payment</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.uploadButton]}
            onPress={() => handleUploadSignedInvoice(item)}
            disabled={isUploadingThis}
          >
            {isUploadingThis ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="upload-file" size={18} color="#fff" />
                <Text style={[styles.actionButtonText, styles.uploadButtonText]}>
                  Upload Signed Copy
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Invoice Links */}
            {item.invoiceLink && item.invoiceLink.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {invoiceType === 'invoice' ? 'Invoice' : 'Quotation'} Links
                </Text>
                {item.invoiceLink.map((link: string, index: number) => (
                  <View key={index} style={styles.linkRow}>
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() => Linking.openURL(link)}
                    >
                      <Icon name="link" size={18} color="#007AFF" />
                      <Text style={styles.linkText}>
                        {invoiceType === 'invoice' ? 'Invoice' : 'Quotation'} {index + 1}
                      </Text>
                    </TouchableOpacity>
                    {hasPermission('rentalInvoice', 'edit') && (
                      <TouchableOpacity
                        onPress={() => handleDeleteInvoiceLink(item, link)}
                        disabled={isDeletingThis}
                      >
                        {isDeletingThis ? (
                          <ActivityIndicator size="small" color="#FF3B30" />
                        ) : (
                          <Icon name="delete" size={20} color="#FF3B30" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Products */}
            {(item.products || (item.machineId && [{ machineId: item.machineId }])).map((product: any, index: number) => {
              const machine = product.machineId || product;
              const machineObj = typeof machine === 'object' ? machine : null;
              
              return (
                <View key={index} style={styles.productSection}>
                  <Text style={styles.productTitle}>Product {index + 1}</Text>
                  <View style={styles.productRow}>
                    <Text style={styles.productLabel}>Serial No:</Text>
                    <Text style={styles.productValue}>{product.serialNo || machineObj?.serialNo || 'N/A'}</Text>
                  </View>
                  <View style={styles.productRow}>
                    <Text style={styles.productLabel}>Model:</Text>
                    <Text style={styles.productValue}>{machineObj?.modelName || 'N/A'}</Text>
                  </View>
                  {product.productTotal && (
                    <View style={styles.productRow}>
                      <Text style={styles.productLabel}>Product Total:</Text>
                      <Text style={[styles.productValue, { fontWeight: 'bold' }]}>
                        ₹{parseFloat(String(product.productTotal)).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  
                  {/* Configurations */}
                  {product.a3Config && (
                    <View style={styles.configSection}>
                      <Text style={styles.configTitle}>A3 Configuration</Text>
                      {product.a3Config.bwOldCount > 0 && (
                        <View style={styles.configRow}>
                          <Text style={styles.configLabel}>B/W Old: {product.a3Config.bwOldCount}</Text>
                          <Text style={styles.configLabel}>B/W New: {product.a3Config.bwNewCount || 0}</Text>
                        </View>
                      )}
                      {product.a3Config.colorOldCount > 0 && (
                        <View style={styles.configRow}>
                          <Text style={styles.configLabel}>Color Old: {product.a3Config.colorOldCount}</Text>
                          <Text style={styles.configLabel}>Color New: {product.a3Config.colorNewCount || 0}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {product.a4Config && (
                    <View style={styles.configSection}>
                      <Text style={styles.configTitle}>A4 Configuration</Text>
                      {product.a4Config.bwOldCount > 0 && (
                        <View style={styles.configRow}>
                          <Text style={styles.configLabel}>B/W Old: {product.a4Config.bwOldCount}</Text>
                          <Text style={styles.configLabel}>B/W New: {product.a4Config.bwNewCount || 0}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            
            {/* Grand Total */}
            {item.grandTotal && (
              <View style={styles.grandTotalSection}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalValue}>
                  ₹{parseFloat(String(item.grandTotal)).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Rental {invoiceType === 'invoice' ? 'Invoices' : 'Quotations'}
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${invoiceType === 'invoice' ? 'Invoices' : 'Quotations'} (Company, Payment Mode, Status, Date)`}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={paginatedEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchRentalEntries}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="description" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No rental {invoiceType === 'invoice' ? 'invoices' : 'quotations'} found
              </Text>
            </View>
          }
          ListFooterComponent={
            filteredEntries.length > 0 ? (
              <View style={styles.paginationContainer}>
                <View style={styles.paginationControls}>
                  <TouchableOpacity
                    style={[styles.paginationButton, page === 0 && styles.paginationButtonDisabled]}
                    onPress={() => handleChangePage(page - 1)}
                    disabled={page === 0}
                  >
                    <Text style={[styles.paginationButtonText, page === 0 && styles.paginationButtonTextDisabled]}>
                      Previous
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.paginationText}>
                    Page {page + 1} of {Math.ceil(filteredEntries.length / rowsPerPage) || 1}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      page >= Math.ceil(filteredEntries.length / rowsPerPage) - 1 && styles.paginationButtonDisabled
                    ]}
                    onPress={() => handleChangePage(page + 1)}
                    disabled={page >= Math.ceil(filteredEntries.length / rowsPerPage) - 1}
                  >
                    <Text
                      style={[
                        styles.paginationButtonText,
                        page >= Math.ceil(filteredEntries.length / rowsPerPage) - 1 && styles.paginationButtonTextDisabled
                      ]}
                    >
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.rowsPerPageContainer}>
                  <Text style={styles.rowsPerPageLabel}>Rows per page: </Text>
                  <TouchableOpacity
                    style={styles.rowsPerPageButton}
                    onPress={() => {
                      const options = [5, 10, 25, 50];
                      const currentIndex = options.indexOf(rowsPerPage);
                      const nextIndex = (currentIndex + 1) % options.length;
                      handleChangeRowsPerPage(options[nextIndex]);
                    }}
                  >
                    <Text style={styles.rowsPerPageText}>{rowsPerPage}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* Payment Details Modal */}
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
            <Text style={styles.modalTitle}>
              Payment Details (RS: {paymentForm?.grandTotal || selectedEntry?.grandTotal || '0.00'})
            </Text>

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
                      handleSavePaymentDetails(balanceAmount);
                    }, 2000);
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
                (inv) => inv._id !== selectedEntry?._id
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  paginationContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paginationButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#019ee3',
    borderRadius: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#999',
  },
  paginationText: {
    fontSize: 14,
    color: '#333',
  },
  rowsPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowsPerPageLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  rowsPerPageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  rowsPerPageText: {
    fontSize: 14,
    color: '#019ee3',
    fontWeight: '600',
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
  loader: {
    marginTop: 50,
  },
  entryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  entryHeaderLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  serialNo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  modelName: {
    fontSize: 14,
    color: '#666',
  },
  entryHeaderRight: {
    alignItems: 'flex-end',
    gap: 10,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 5,
  },
  entryDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  countImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 5,
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  sendButton: {
    backgroundColor: '#28a745',
  },
  moveButton: {
    backgroundColor: '#e3f2fd',
  },
  paymentButton: {
    backgroundColor: '#e3f2fd',
  },
  uploadButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
  },
  sendButtonText: {
    color: '#fff',
  },
  uploadButtonText: {
    color: '#fff',
  },
  expandedContent: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
  },
  productSection: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  productLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  productValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  configSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  configTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  configRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  configLabel: {
    fontSize: 11,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: '#c8e6c9',
  },
  statusUnpaid: {
    backgroundColor: '#ffcdd2',
  },
  statusPending: {
    backgroundColor: '#fff9c4',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    marginTop: 10,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
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

export default RentalInvoiceListScreen;
