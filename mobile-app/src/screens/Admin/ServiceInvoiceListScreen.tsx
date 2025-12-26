import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

const ServiceInvoiceListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const invoiceType = (route.params as any)?.invoiceType || 'invoice';

  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deletingLink, setDeletingLink] = useState<string | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);

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
  const [modeOfPaymentPickerVisible, setModeOfPaymentPickerVisible] = useState(false);
  const [amountTypePickerVisible, setAmountTypePickerVisible] = useState(false);
  const [pendingInvoicePickerVisible, setPendingInvoicePickerVisible] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchInvoicesCount();
  }, [invoiceType, token]);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let response;
      if (user?.role === 3) {
        response = await axios.get(
          `${getApiBaseUrl()}/service-invoice/assignedTo/${user?._id}/${invoiceType}`,
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      } else {
        response = await axios.post(
          `${getApiBaseUrl()}/service-invoice/all`,
          { invoiceType, tdsAmount: { $eq: null }, status: { $ne: 'Paid' } },
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      }

      if (response.data?.success) {
        setInvoices(response.data.serviceInvoices || []);
      } else {
        setInvoices([]);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load invoices',
      });
      setInvoices([]);
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

  const filterInvoices = () => {
    // Filtering is handled in renderInvoice
  };

  const toggleExpand = (invoiceId: string) => {
    const newExpanded = new Set(expandedInvoices);
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId);
    } else {
      newExpanded.add(invoiceId);
    }
    setExpandedInvoices(newExpanded);
  };

  const handleEdit = (invoice: any) => {
    (navigation as any).navigate('AddServiceInvoice', {
      invoiceId: invoice._id,
      invoiceType,
    });
  };

  const handleUploadSignedInvoice = async (invoice: any) => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your media library');
        return;
      }

      // Pick image or document - allow both images and videos
      // Note: expo-image-picker doesn't support PDFs, only images and videos
      // Use MediaType (not MediaTypeOptions) as per deprecation warning
      const MediaType = (ImagePicker as any).MediaType;
      const mediaTypes = MediaType?.All 
        ? MediaType.All
        : MediaType?.Images && MediaType?.Videos
        ? [MediaType.Images, MediaType.Videos]
        : MediaType?.Images || 'images';
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setUploading(invoice._id);
      
      // Determine file type and name
      const fileExtension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      // Get MIME type - prefer mimeType, then type, then infer from extension
      let mimeType = 'image/jpeg'; // default
      if (asset.mimeType) {
        mimeType = asset.mimeType;
      } else if (asset.type) {
        mimeType = asset.type;
      } else {
        // Infer from extension
        if (fileExtension === 'png') mimeType = 'image/png';
        else if (fileExtension === 'pdf') mimeType = 'application/pdf';
        else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
      }
      
      const fileName = `invoice_${invoice._id}_${Date.now()}.${fileExtension}`;

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: mimeType,
        name: fileName,
      } as any);

      // Upload file first
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
          timeout: 30000, // 30 second timeout
        }
      );

      if (uploadRes.data?.fileUrl) {
        // Get old invoice links
        const oldInvoiceLink = invoice.invoiceLink || [];
        
        // Update invoice with new link and set status to InvoiceSent
        const serviceRes = await axios.put(
          `${getApiBaseUrl()}/service-invoice/update/${invoice._id}`,
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
          // Refresh the invoice list
          fetchInvoices();
        } else {
          throw new Error(serviceRes.data?.message || 'Failed to update invoice');
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

  const handleDeleteInvoiceLink = async (invoice: any, linkToDelete: string) => {
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
              setDeletingLink(invoice._id);
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

              const updatedLinks = invoice.invoiceLink.filter((link: string) => link !== linkToDelete);
              await axios.put(
                `${getApiBaseUrl()}/service-invoice/update/${invoice._id}`,
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
              fetchInvoices();
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

  const handleOpenPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    let initialPaymentAmount = 0;
    let initialPaymentAmountType = '';

    // Initialize paymentAmount and paymentAmountType based on existing invoice data
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
          const response = await axios.post(
            `${getApiBaseUrl()}/service-invoice/all`,
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
          // Filter out the current invoice from pending invoices
          const filteredInvoices = (response.data?.serviceInvoices || []).filter(
            (inv: any) => inv._id !== selectedInvoice?._id
          );
          setCompanyPendingInvoices(filteredInvoices);
        } catch (error) {
          console.error('Error fetching pending invoices:', error);
        }
      }
    }
  };

  const handleSavePaymentDetails = async (balanceAmountParam?: number, tsdBalance?: number) => {
    if (!selectedInvoice) return;

    try {
      const paymentAmount = parseFloat(paymentForm.paymentAmount) || 0;
      const balance = balanceAmountParam !== undefined ? balanceAmountParam : balanceAmount;
      
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
        tdsAmount: 0, // Default to 0, will be updated if type is TDS
        pendingAmount: 0, // Default to 0, will be updated if type is Pending
        status:
          balance >= paymentForm?.grandTotal ||
          paymentAmount >= paymentForm?.grandTotal ||
          paymentForm.paymentAmountType === 'TDS'
            ? 'Paid'
            : 'Unpaid',
      };

      // Conditionally set tdsAmount or pendingAmount based on selected type
      if (paymentForm.paymentAmountType === 'TDS') {
        payload.tdsAmount = pendingAmount || 0;
      } else if (paymentForm.paymentAmountType === 'Pending') {
        payload.pendingAmount = pendingAmount || 0;
      }

      const invoiceId = selectedPendingInvoiceId || selectedInvoice._id;
      const res = await axios.put(
        `${getApiBaseUrl()}/service-invoice/update/${invoiceId}`,
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
        fetchInvoices();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update payment details',
      });
    }
  };

  const onMoveToInvoice = async (invoice: any) => {
    try {
      const payload = {
        invoiceType: 'invoice',
        invoiceNumber: invoiceCount,
      };

      const res = await axios.put(
        `${getApiBaseUrl()}/service-invoice/update/${invoice._id}`,
        payload,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );

      if (res.data?.success) {
        await axios.put(
          `${getApiBaseUrl()}/common-details/increment-invoice`,
          { invoiceCount },
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: res.data.message || 'Moved to invoice successfully!',
        });
        fetchInvoices();
        fetchInvoicesCount();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to move to invoice',
      });
    }
  };

  const onSendInvoice = async (invoice: any) => {
    setSendingInvoice(invoice._id);
    try {
      await axios.post('https://n8n.nicknameinfo.net/webhook/f8d3ad37-a38e-4a38-a06e-09c74fdc3b91', {
        invoiceId: invoice._id,
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

  const filteredInvoices = invoices.filter((invoice) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      invoice?.invoiceNumber?.toLowerCase()?.includes(lowerCaseSearchTerm) ||
      invoice.companyId?.companyName?.toLowerCase().includes(lowerCaseSearchTerm) ||
      invoice.modeOfPayment?.toLowerCase().includes(lowerCaseSearchTerm) ||
      invoice?.status?.toLowerCase().includes(lowerCaseSearchTerm) ||
      new Date(invoice.invoiceDate).toLocaleDateString().toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const renderInvoice = ({ item }: { item: any }) => {
    const isExpanded = expandedInvoices.has(item._id);
    const isUploadingThis = uploading === item._id;
    const isDeletingThis = deletingLink === item._id;
    const isSendingThis = sendingInvoice === item._id;

    return (
      <View style={styles.invoiceCard}>
        <TouchableOpacity
          style={styles.invoiceHeader}
          onPress={() => toggleExpand(item._id)}
        >
          <View style={styles.invoiceHeaderLeft}>
            {invoiceType === 'invoice' && (
              <Text style={styles.invoiceNumber}>{item.invoiceNumber || 'N/A'}</Text>
            )}
            <View>
              <Text style={styles.companyName}>
                {item.companyId?.companyName || 'N/A'}
              </Text>
              <Text style={styles.deliveryAddress}>{item.deliveryAddress || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.invoiceHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
            </View>
            <Icon
              name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.invoiceDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Mode:</Text>
            <Text style={styles.detailValue}>{item.modeOfPayment || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Grand Total:</Text>
            <Text style={styles.detailValue}>₹{item.grandTotal?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.invoiceDate).toLocaleDateString()}
            </Text>
          </View>
          {item.assignedTo && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned To:</Text>
              <Text style={styles.detailValue}>
                {item.assignedTo?.name || item.assignedTo || 'N/A'}
              </Text>
            </View>
          )}
          {item.invoiceLink?.length === 0 && (
            <View style={styles.warningBadge}>
              <Icon name="warning" size={16} color="#FF3B30" />
              <Text style={styles.warningText}>Invoice Upload Pending</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {hasPermission('serviceInvoice', 'edit') && (
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
                    {hasPermission('serviceInvoice', 'edit') && (
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
            {item.products && item.products.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Products</Text>
                {item.products.map((product: any, index: number) => (
                  <View key={index} style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {product.productId?.productName?.productName?.productName ||
                          product.productName ||
                          'N/A'}
                      </Text>
                      <Text style={styles.productDetails}>
                        SKU: {product.productId?.sku || product.sku || 'N/A'} | HSN:{' '}
                        {product.productId?.hsn || product.hsn || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.productAmounts}>
                      <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
                      <Text style={styles.productRate}>Rate: ₹{product.rate?.toFixed(2)}</Text>
                      <Text style={styles.productTotal}>
                        Total: ₹{product.totalAmount?.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
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
          Service {invoiceType === 'invoice' ? 'Invoices' : 'Quotations'}
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
          data={filteredInvoices}
          renderItem={renderInvoice}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchInvoices}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No service {invoiceType === 'invoice' ? 'invoices' : 'quotations'} found
              </Text>
            </View>
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
                              ? `${new Date(selectedInv.invoiceDate).toLocaleDateString()} - Rs ${selectedInv.grandTotal?.toFixed(2) || '0.00'}`
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
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerButtonText}>
                    {paymentForm.paymentAmountType || '--select Amount Type--'}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} color="#666" />
                </View>
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
                    {new Date(item.invoiceDate).toLocaleDateString()} - Rs{' '}
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
  loader: {
    marginTop: 50,
  },
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  invoiceHeaderLeft: {
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
  deliveryAddress: {
    fontSize: 14,
    color: '#666',
  },
  invoiceHeaderRight: {
    alignItems: 'flex-end',
    gap: 10,
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
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 5,
  },
  invoiceDetails: {
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
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  productDetails: {
    fontSize: 12,
    color: '#666',
  },
  productAmounts: {
    alignItems: 'flex-end',
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  productRate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
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

export default ServiceInvoiceListScreen;
