import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { companyService } from '../../services/api';
import Toast from 'react-native-toast-message';

const CreateRentalEnquiryScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    companyId: '',
    contactPerson: '',
    phone: '',
    email: '',
    rentalProduct: '',
    startDate: '',
    endDate: '',
    deliveryAddress: '',
    notes: '',
    installationRequired: false,
    sendQuotation: false,
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await companyService.getCompanies();
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.companyId || !formData.contactPerson || !formData.phone) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Rental enquiry created successfully',
      });
      navigation.goBack();
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Company *</Text>
      <TextInput
        style={styles.input}
        placeholder="Select company"
        value={formData.companyId}
        onChangeText={(text) => setFormData({ ...formData, companyId: text })}
      />

      <Text style={styles.label}>Contact Person *</Text>
      <TextInput
        style={styles.input}
        placeholder="Contact person name"
        value={formData.contactPerson}
        onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
      />

      <Text style={styles.label}>Phone *</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email address"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Rental Product</Text>
      <TextInput
        style={styles.input}
        placeholder="Product name"
        value={formData.rentalProduct}
        onChangeText={(text) => setFormData({ ...formData, rentalProduct: text })}
      />

      <Text style={styles.label}>Start Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={formData.startDate}
        onChangeText={(text) => setFormData({ ...formData, startDate: text })}
      />

      <Text style={styles.label}>End Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={formData.endDate}
        onChangeText={(text) => setFormData({ ...formData, endDate: text })}
      />

      <Text style={styles.label}>Delivery Address</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Delivery address"
        value={formData.deliveryAddress}
        onChangeText={(text) => setFormData({ ...formData, deliveryAddress: text })}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Additional notes"
        value={formData.notes}
        onChangeText={(text) => setFormData({ ...formData, notes: text })}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit Enquiry</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateRentalEnquiryScreen;

