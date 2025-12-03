import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setEnquiries, setLoading } from '../../store/slices/serviceSlice';
import { serviceEnquiryService } from '../../services/api';

const ServiceListScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { enquiries, isLoading } = useSelector((state: RootState) => state.service);

  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    dispatch(setLoading(true));
    try {
      const response = await serviceEnquiryService.getAssignedEnquiries('current-user-id');
      dispatch(setEnquiries(response.data.enquiries || []));
    } catch (error) {
      console.error('Error loading enquiries:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const renderEnquiry = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ServiceDetail' as never, { enquiryId: item._id } as never)}
    >
      <Text style={styles.companyName}>{item.companyName}</Text>
      <Text style={styles.contactPerson}>{item.contactPerson}</Text>
      <Text style={styles.phone}>{item.phone}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={enquiries}
        renderItem={renderEnquiry}
        keyExtractor={(item) => item._id}
        refreshing={isLoading}
        onRefresh={loadEnquiries}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  companyName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  contactPerson: { fontSize: 14, color: '#666', marginBottom: 3 },
  phone: { fontSize: 14, color: '#666', marginBottom: 3 },
  status: { fontSize: 14, color: '#007AFF', marginTop: 5 },
});

export default ServiceListScreen;

