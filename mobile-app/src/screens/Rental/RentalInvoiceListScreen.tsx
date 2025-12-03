import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setInvoices, setLoading } from '../../store/slices/rentalSlice';
import { rentalInvoiceService } from '../../services/api';

const RentalInvoiceListScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { invoices, isLoading } = useSelector((state: RootState) => state.rental);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    dispatch(setLoading(true));
    try {
      const response = await rentalInvoiceService.getInvoices();
      dispatch(setInvoices(response.data.invoices || []));
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const renderInvoice = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RentalInvoiceDetail' as never, { invoiceId: item._id } as never)}
    >
      <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
      <Text style={styles.companyName}>{item.companyName}</Text>
      <Text style={styles.total}>Total: ₹{item.grandTotal}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('RentalInvoiceForm' as never)}
      >
        <Text style={styles.addButtonText}>+ Create Invoice</Text>
      </TouchableOpacity>
      <FlatList
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item._id}
        refreshing={isLoading}
        onRefresh={loadInvoices}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  invoiceNumber: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  companyName: { fontSize: 14, color: '#666', marginBottom: 3 },
  total: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginTop: 5 },
  status: { fontSize: 14, color: '#666', marginTop: 5 },
});

export default RentalInvoiceListScreen;

