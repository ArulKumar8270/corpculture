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

// RentalQuotationListScreen uses the same implementation as RentalInvoiceListScreen
// but with invoiceType='quotation' by default
const RentalQuotationListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  // Force invoiceType to 'quotation' for this screen
  const invoiceType = 'quotation';

  const [rentalEntries, setRentalEntries] = useState<any[]>([]);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
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
      console.error('Error fetching rental quotations:', error);
      console.error('Error response:', error.response?.data);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load rental quotations',
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
      invoiceType: 'quotation',
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
      
      const fileName = `quotation_${entry._id}_${Date.now()}.${fileExtension}`;

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
            text2: 'Signed quotation uploaded successfully!',
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to upload quotation',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteInvoiceLink = async (entry: any, linkToDelete: string) => {
    Alert.alert(
      'Delete Quotation Link',
      'Are you sure you want to delete this quotation link?',
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
                text2: 'Quotation link deleted successfully!',
              });
              fetchRentalEntries();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete quotation link',
              });
            } finally {
              setDeletingLink(null);
            }
          },
        },
      ]
    );
  };

  const onMoveToInvoice = async (entry: any) => {
    try {
      const payload = {
        invoiceType: 'invoice',
        // Invoice number is now generated by the backend from global settings
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
        // Invoice count is now incremented automatically by the backend
        // No need to call increment-invoice endpoint
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

  // REMOVED: handleUpdateInvoiceCount function
  // Invoice count is now incremented automatically by the backend
  // No need to call increment-invoice endpoint

  const onSendInvoice = async (entry: any) => {
    setSendingInvoice(entry._id);
    try {
      await axios.post('https://n8n.nicknameinfo.net/webhook/f8d3ad37-a38e-4a38-a06e-09c74fdc3b91', {
        invoiceId: entry._id,
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
      setSendingInvoice(null);
    }
  };

  const filteredEntries = rentalEntries.filter((entry) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const companyNameMatch = entry.companyId?.companyName?.toLowerCase().includes(lowerCaseSearchTerm);
    const statusMatch = entry.paymentAmountType?.toLowerCase().includes(lowerCaseSearchTerm);
    const dateMatch = entry.createdAt
      ? new Date(entry.createdAt).toISOString().split('T')[0].includes(lowerCaseSearchTerm)
      : false;

    return companyNameMatch || statusMatch || dateMatch;
  });

  const renderEntry = ({ item }: { item: any }) => {
    const isExpanded = expandedEntries.has(item._id);
    const isUploadingThis = uploading === item._id;
    const isDeletingThis = deletingLink === item._id;
    const isSendingThis = sendingInvoice === item._id;

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
                <Text style={styles.warningText}>Quotation Upload Pending</Text>
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
            {/* Quotation Links */}
            {item.invoiceLink && item.invoiceLink.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quotation Links</Text>
                {item.invoiceLink.map((link: string, index: number) => (
                  <View key={index} style={styles.linkRow}>
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() => Linking.openURL(link)}
                    >
                      <Icon name="link" size={18} color="#007AFF" />
                      <Text style={styles.linkText}>Quotation {index + 1}</Text>
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
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rental Quotations</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Quotations (Company, Payment Mode, Status, Date)"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchRentalEntries}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="description" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No rental quotations found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// Reuse styles from RentalInvoiceListScreen
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
});

export default RentalQuotationListScreen;

