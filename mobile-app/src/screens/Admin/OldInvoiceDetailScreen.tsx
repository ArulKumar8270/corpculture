import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { oldInvoiceService } from '../../services/api';

const PAYMENT_STATUSES = ['Paid', 'Unpaid', 'Partial', 'Pending'];

const formatCurrency = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN')}`;
};

const formatDate = (value: unknown) => {
  if (!value) return 'N/A';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const OldInvoiceDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const invoiceId = (route.params as any)?.invoiceId as string | undefined;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    paymentStatus: 'Unpaid',
    paymentMethod: '',
    paymentDate: '',
    paymentAmount: '',
    dueAmount: '',
    remainderDate: '',
    notes: '',
  });

  useEffect(() => {
    if (invoiceId) loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    if (!invoiceId) return;
    try {
      setLoading(true);
      const response = await oldInvoiceService.get(invoiceId);
      const inv = response?.data?.invoice;
      if (!inv) {
        Toast.show({ type: 'error', text1: 'Invoice not found' });
        navigation.goBack();
        return;
      }
      setInvoice(inv);
      setUpdateForm({
        paymentStatus: inv.paymentStatus || 'Unpaid',
        paymentMethod: inv.paymentMethod || '',
        paymentDate: inv.paymentDate
          ? new Date(inv.paymentDate).toISOString().split('T')[0]
          : '',
        paymentAmount: inv.paymentAmount != null ? String(inv.paymentAmount) : '',
        dueAmount: inv.dueAmount != null ? String(inv.dueAmount) : '',
        remainderDate:
          inv.remainderDate != null && inv.remainderDate !== ''
            ? String(inv.remainderDate)
            : '',
        notes: inv.notes || '',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load invoice',
      });
    } finally {
      setLoading(false);
    }
  };

  const onPaymentAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const paymentAmount = parseFloat(cleaned) || 0;
    const total = Number(invoice?.total) || 0;
    const dueAmount = Math.max(0, total - paymentAmount);
    setUpdateForm((prev) => ({
      ...prev,
      paymentAmount: cleaned,
      dueAmount: String(dueAmount),
    }));
  };

  const handleSavePayment = async () => {
    if (!invoiceId) return;
    try {
      setSaving(true);
      const updateData: any = {
        paymentStatus: updateForm.paymentStatus,
        paymentMethod: updateForm.paymentMethod || undefined,
        paymentDate: updateForm.paymentDate
          ? new Date(updateForm.paymentDate)
          : undefined,
        paymentAmount: parseFloat(updateForm.paymentAmount) || 0,
        dueAmount: parseFloat(updateForm.dueAmount) || 0,
        remainderDate: updateForm.remainderDate
          ? parseInt(updateForm.remainderDate, 10)
          : undefined,
        notes: updateForm.notes || undefined,
      };
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      const response = await oldInvoiceService.update(invoiceId, updateData);
      if (response?.data?.success !== false) {
        Toast.show({ type: 'success', text1: 'Payment details updated' });
        setEditing(false);
        await loadInvoice();
      } else {
        Toast.show({
          type: 'error',
          text1: response?.data?.message || 'Failed to update',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update invoice',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Invoice not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.invoiceNumber}>{invoice.invoiceNumber || 'N/A'}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{invoice.paymentStatus || 'Unpaid'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <DetailRow label="Customer" value={invoice.customerName || 'N/A'} />
        <DetailRow label="Product" value={invoice.productName || 'N/A'} />
        <DetailRow label="Date" value={formatDate(invoice.date)} />
        <DetailRow label="Total" value={formatCurrency(invoice.total || invoice.amount)} />
        <DetailRow label="Payment Method" value={invoice.paymentMethod || 'N/A'} />
        <DetailRow label="Payment Date" value={formatDate(invoice.paymentDate)} />
        <DetailRow label="Payment Amount" value={formatCurrency(invoice.paymentAmount)} />
        <DetailRow label="Due Amount" value={formatCurrency(invoice.dueAmount)} />
        {invoice.remainderDate != null && invoice.remainderDate !== '' && (
          <DetailRow
            label="Remainder (Days)"
            value={`${invoice.remainderDate} day${Number(invoice.remainderDate) !== 1 ? 's' : ''}`}
          />
        )}
        {invoice.notes ? <DetailRow label="Notes" value={invoice.notes} /> : null}
        {invoice.uploadedFileName ? (
          <DetailRow label="Uploaded File" value={invoice.uploadedFileName} />
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.editToggle}
        onPress={() => setEditing((e) => !e)}
      >
        <Icon name={editing ? 'close' : 'edit'} size={20} color="#019ee3" />
        <Text style={styles.editToggleText}>
          {editing ? 'Cancel Edit' : 'Update Payment'}
        </Text>
      </TouchableOpacity>

      {editing && (
        <View style={styles.editCard}>
          <Text style={styles.label}>Payment Status *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setStatusModalVisible(true)}
          >
            <Text style={styles.pickerText}>{updateForm.paymentStatus}</Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Payment Method</Text>
          <TextInput
            style={styles.input}
            value={updateForm.paymentMethod}
            onChangeText={(t) => setUpdateForm((p) => ({ ...p, paymentMethod: t }))}
            placeholder="e.g., Cash, UPI, Cheque"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Payment Date</Text>
          <TextInput
            style={styles.input}
            value={updateForm.paymentDate}
            onChangeText={(t) => setUpdateForm((p) => ({ ...p, paymentDate: t }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Payment Amount</Text>
          <TextInput
            style={styles.input}
            value={updateForm.paymentAmount}
            onChangeText={onPaymentAmountChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Due Amount</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={updateForm.dueAmount}
            editable={false}
            placeholder="0"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Remainder Date (Days)</Text>
          <TextInput
            style={styles.input}
            value={updateForm.remainderDate}
            onChangeText={(t) =>
              setUpdateForm((p) => ({ ...p, remainderDate: t.replace(/[^0-9]/g, '') }))
            }
            keyboardType="numeric"
            placeholder="e.g. 7"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={updateForm.notes}
            onChangeText={(t) => setUpdateForm((p) => ({ ...p, notes: t }))}
            placeholder="Notes"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveDisabled]}
            onPress={handleSavePayment}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Payment Details</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Status</Text>
            <FlatList
              data={PAYMENT_STATUSES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setUpdateForm((p) => ({ ...p, paymentStatus: item }));
                    setStatusModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceNumber: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  detailLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
  detailValue: { fontSize: 14, color: '#333', flex: 1, textAlign: 'right' },
  editToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  editToggleText: { color: '#019ee3', fontSize: 15, fontWeight: '600' },
  editCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputDisabled: { backgroundColor: '#f0f0f0', color: '#555' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerText: { fontSize: 16, color: '#333' },
  saveButton: {
    backgroundColor: '#019ee3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#019ee3',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalOptionText: { fontSize: 16, color: '#333' },
});

export default OldInvoiceDetailScreen;
