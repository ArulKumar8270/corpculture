import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { getApiBaseUrl } from '../../services/api';
import {
  formatSendDetailsToDetail,
  getTotalRentalInvoicePayment,
  getRentalProductLineDisplayTotal,
} from '../../utils/functions';

const RENTAL_INVOICE_DOWNLOAD_BASE_URL =
  'https://pub-bcab85dac0c64221ba6b6a756f991c46.r2.dev';

const RentalInvoiceDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const invoiceId = route.params?.id;
  const { token } = useSelector((state: RootState) => state.auth);
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!invoiceId || !token) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/rental-payment/${invoiceId}`, {
        headers: { Authorization: token },
      });
      if (data?.success) {
        setEntry(data.entry);
      } else {
        Toast.show({ type: 'error', text1: data?.message || 'Failed to load invoice' });
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.response?.data?.message || 'Failed to load invoice',
      });
    } finally {
      setLoading(false);
    }
  }, [invoiceId, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Invoice not found.</Text>
      </View>
    );
  }

  const grandTotal =
    Number(entry.grandTotal) ||
    (Array.isArray(entry.products)
      ? entry.products.reduce((sum: number, p: any) => sum + getRentalProductLineDisplayTotal(p), 0)
      : 0);
  const paid = getTotalRentalInvoicePayment(entry);
  const pdfUrl = `${RENTAL_INVOICE_DOWNLOAD_BASE_URL}/${entry._id}`;

  const Row = ({ label, value }: { label: string; value?: string }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {entry.invoiceType === 'quotation' ? 'Rental Quotation' : 'Rental Invoice'}
        </Text>
        <Text style={styles.subtitle}>{entry.invoiceNumber || entry._id}</Text>
      </View>

      <View style={styles.section}>
        <Row label="Company" value={entry.companyId?.companyName} />
        <Row
          label="Date"
          value={
            entry.invoiceDate || entry.entryDate || entry.createdAt
              ? new Date(entry.invoiceDate || entry.entryDate || entry.createdAt).toLocaleDateString()
              : undefined
          }
        />
        <Row label="Status" value={entry.status} />
        <Row label="Payment mode" value={entry.modeOfPayment} />
        <Row label="Grand total" value={`₹${grandTotal.toFixed(2)}`} />
        <Row label="Paid" value={`₹${paid.toFixed(2)}`} />
        <Row label="Send to" value={formatSendDetailsToDetail(entry.sendDetailsTo)} />
        {entry.remarks ? <Row label="Remarks" value={entry.remarks} /> : null}
      </View>

      {(entry.products || []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          {(entry.products || []).map((p: any, i: number) => (
            <View key={i} style={styles.productCard}>
              <Text style={styles.productName}>
                {p.machineId?.modelName || p.machineId?.productName || `Product ${i + 1}`}
              </Text>
              <Text style={styles.productMeta}>
                Serial: {p.machineId?.serialNo || '—'}
              </Text>
              <Text style={styles.productMeta}>
                Line total: ₹{getRentalProductLineDisplayTotal(p).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Linking.openURL(pdfUrl).catch(() => {
            Toast.show({ type: 'error', text1: 'Could not open invoice PDF' });
          })}
        >
          <Icon name="picture-as-pdf" size={20} color="#fff" />
          <Text style={styles.actionText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() =>
            (navigation as any).navigate('AddRentalInvoice', {
              id: entry._id,
              invoiceType: entry.invoiceType || 'invoice',
            })
          }
        >
          <Icon name="edit" size={20} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#888', fontSize: 16 },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#019ee3' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  section: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 14,
    borderRadius: 10,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#333' },
  row: { marginBottom: 10 },
  label: { fontSize: 12, color: '#888', marginBottom: 2 },
  value: { fontSize: 15, color: '#333' },
  productCard: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 10,
  },
  productName: { fontSize: 15, fontWeight: '600', color: '#333' },
  productMeta: { fontSize: 13, color: '#666', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#019ee3',
    paddingVertical: 12,
    borderRadius: 8,
  },
  editBtn: { backgroundColor: '#4CAF50' },
  actionText: { color: '#fff', fontWeight: '600' },
});

export default RentalInvoiceDetailScreen;
