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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

const ServiceQuotationListScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [quotationCount, setQuotationCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuotations, setExpandedQuotations] = useState<Set<string>>(new Set());
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [sendingQuotation, setSendingQuotation] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    modeOfPayment: '',
    bankName: '',
    transactionDetails: '',
    chequeDate: '',
    transferDate: '',
    companyNamePayment: '',
    otherPaymentMode: '',
  });

  useEffect(() => {
    fetchQuotations();
    fetchInvoicesCount();
  }, [token]);

  // Refresh quotations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchQuotations();
      fetchInvoicesCount();
    }, [token])
  );

  useEffect(() => {
    filterQuotations();
  }, [searchTerm]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      let response;
      if (user?.role === 3) {
        response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/assignedTo/${user?._id}/quotation`,
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      } else {
        response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/all`,
          { invoiceType: 'quotation' },
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      }

      if (response.data?.success) {
        setQuotations(response.data.serviceInvoices || []);
      } else {
        setQuotations([]);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load quotations',
      });
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoicesCount = async () => {
    try {
      const { data } = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/common-details`, {
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

  const handleUpdateInvoiceCount = async () => {
    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/common-details/increment-invoice`,
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

  const filterQuotations = () => {
    // Filtering is handled in renderQuotation
  };

  const toggleExpand = (quotationId: string) => {
    const newExpanded = new Set(expandedQuotations);
    if (newExpanded.has(quotationId)) {
      newExpanded.delete(quotationId);
    } else {
      newExpanded.add(quotationId);
    }
    setExpandedQuotations(newExpanded);
  };

  const handleEdit = (quotation: any) => {
    (navigation as any).navigate('AddServiceQuotation', {
      quotationId: quotation._id,
      invoiceType: 'quotation',
    });
  };

  const handleUploadSignedQuotation = async (quotation: any) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType?.Images || 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setUploading(quotation._id);
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `quotation_${quotation._id}_${Date.now()}.jpg`,
      } as any);

      const uploadRes = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/upload-file`,
        formData,
        {
          headers: {
            Authorization: token || '',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (uploadRes.data?.fileUrl) {
        const oldLinks = quotation.quotationLink || [];
        await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/update/${quotation._id}`,
          {
            quotationLink: [...oldLinks, uploadRes.data.fileUrl],
            status: 'InvoiceSent',
          },
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Signed quotation uploaded successfully!',
        });
        fetchQuotations();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to upload quotation',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleOpenPaymentModal = (quotation: any) => {
    setSelectedQuotation(quotation);
    setPaymentForm({
      modeOfPayment: quotation.modeOfPayment || '',
      bankName: quotation.bankName || '',
      transactionDetails: quotation.transactionDetails || '',
      chequeDate: quotation.chequeDate ? new Date(quotation.chequeDate).toISOString().split('T')[0] : '',
      transferDate: quotation.transferDate ? new Date(quotation.transferDate).toISOString().split('T')[0] : '',
      companyNamePayment: quotation.companyNamePayment || '',
      otherPaymentMode: quotation.otherPaymentMode || '',
    });
    setPaymentModalVisible(true);
  };

  const handleSavePaymentDetails = async () => {
    if (!selectedQuotation) return;

    try {
      const payload = {
        modeOfPayment: paymentForm.modeOfPayment,
        bankName: paymentForm.bankName,
        transactionDetails: paymentForm.transactionDetails,
        chequeDate: paymentForm.chequeDate,
        transferDate: paymentForm.transferDate,
        companyNamePayment: paymentForm.companyNamePayment,
        otherPaymentMode: paymentForm.otherPaymentMode,
      };

      const res = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/update/${selectedQuotation._id}`,
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
        fetchQuotations();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update payment details',
      });
    }
  };

  const onMoveToInvoice = async (quotation: any) => {
    try {
      const payload = {
        invoiceType: 'invoice',
        invoiceNumber: invoiceCount,
      };

      const res = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/service-invoice/update/${quotation._id}`,
        payload,
        {
          headers: {
            Authorization: token || '',
          },
        }
      );

      if (res.data?.success) {
        await handleUpdateInvoiceCount();
        fetchQuotations();
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

  const onSendQuotation = async (quotation: any) => {
    setSendingQuotation(quotation._id);
    try {
      await axios.post('https://n8n.nicknameinfo.net/webhook/f8d3ad37-a38e-4a38-a06e-09c74fdc3b91', {
        invoiceId: quotation._id,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Quotation sent successfully!',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send quotation',
      });
    } finally {
      setSendingQuotation(null);
    }
  };

  const filteredQuotations = quotations.filter((quotation) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      quotation.quotationNumber?.toLowerCase().includes(lowerCaseSearchTerm) ||
      quotation.companyId?.companyName?.toLowerCase().includes(lowerCaseSearchTerm) ||
      quotation.modeOfPayment?.toLowerCase().includes(lowerCaseSearchTerm) ||
      quotation.status?.toLowerCase().includes(lowerCaseSearchTerm) ||
      new Date(quotation.quotationDate || quotation.invoiceDate).toLocaleDateString().toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const renderQuotation = ({ item }: { item: any }) => {
    const isExpanded = expandedQuotations.has(item._id);
    const isUploadingThis = uploading === item._id;
    const isSendingThis = sendingQuotation === item._id;

    return (
      <View style={styles.quotationCard}>
        <TouchableOpacity
          style={styles.quotationHeader}
          onPress={() => toggleExpand(item._id)}
        >
          <View style={styles.quotationHeaderLeft}>
            <Text style={styles.quotationNumber}>
              {item.quotationNumber || item.invoiceNumber || 'N/A'}
            </Text>
            <View>
              <Text style={styles.companyName}>
                {item.companyId?.companyName || 'N/A'}
              </Text>
              <Text style={styles.deliveryAddress}>{item.deliveryAddress || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.quotationHeaderRight}>
            <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
            <Icon
              name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.quotationDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Mode:</Text>
            <Text style={styles.detailValue}>{item.modeOfPayment || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Grand Total:</Text>
            <Text style={styles.detailValue}>₹{item.grandTotal?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quotation Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.quotationDate || item.invoiceDate).toLocaleDateString()}
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
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {hasPermission('serviceQuotation', 'edit') && (
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
            onPress={() => onSendQuotation(item)}
            disabled={isSendingThis}
          >
            {isSendingThis ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="send" size={18} color="#fff" />
                <Text style={[styles.actionButtonText, styles.sendButtonText]}>Send Quotation</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.moveButton]}
            onPress={() => onMoveToInvoice(item)}
          >
            <Icon name="arrow-forward" size={18} color="#007AFF" />
            <Text style={styles.actionButtonText}>Move to Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.paymentButton]}
            onPress={() => handleOpenPaymentModal(item)}
          >
            <Icon name="payment" size={18} color="#007AFF" />
            <Text style={styles.actionButtonText}>Update Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.uploadButton]}
            onPress={() => handleUploadSignedQuotation(item)}
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
            {/* Quotation Links */}
            {item.quotationLink && item.quotationLink.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quotation Links</Text>
                {item.quotationLink.map((link: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(link)}
                  >
                    <Icon name="link" size={18} color="#007AFF" />
                    <Text style={styles.linkText}>Quotation {index + 1}</Text>
                  </TouchableOpacity>
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
      {/* <View style={styles.header}>
        <Text style={styles.title}>Service Quotations</Text>
        {hasPermission('serviceQuotation', 'edit') && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddServiceQuotation' as never)}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View> */}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Quotations (Quotation No., Company, Payment Mode, Status, Date)"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredQuotations}
          renderItem={renderQuotation}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchQuotations}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="description" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No service quotations found</Text>
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
              <View style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>
                  {paymentForm.modeOfPayment || '--select Payment Mode--'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color="#666" />
              </View>
            </View>

            {/* Payment Mode Specific Fields - Same as Invoice */}
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
                onPress={handleSavePaymentDetails}
              >
                <Text style={styles.modalSaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    color: '#019ee3',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
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
  quotationCard: {
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
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quotationHeaderLeft: {
    flex: 1,
  },
  quotationNumber: {
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
  quotationHeaderRight: {
    alignItems: 'flex-end',
    gap: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  quotationDetails: {
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
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
    gap: 8,
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
});

export default ServiceQuotationListScreen;
