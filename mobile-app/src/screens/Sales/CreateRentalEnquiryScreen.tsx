import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import { useFrontHomeSettings } from '../../hooks/useFrontHomeSettings';
import EnquiryCompanyFields, {
  EnquiryCompanyValues,
} from '../../components/EnquiryCompanyFields';

const CreateRentalEnquiryScreen = () => {
  const navigation = useNavigation();
  const { serviceCategories, rentalDefaultImage } = useFrontHomeSettings();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [complaint, setComplaint] = useState('');
  const [customerType, setCustomerType] = useState('New');
  const [form, setForm] = useState<EnquiryCompanyValues>({
    phone: '',
    companyName: '',
    companyId: '',
    contactPerson: '',
    email: '',
    address: '',
    location: '',
  });

  const offers = serviceCategories?.length ? serviceCategories : [];

  const patchForm = (next: Partial<EnquiryCompanyValues>) => {
    setForm((prev) => ({ ...prev, ...next }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!selectedOffer) next.rentalType = 'Rental type is required';
    if (!form.phone) next.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone)) next.phone = 'Phone number must be 10 digits';
    if (!form.companyName) next.companyName = 'Company name is required';
    if (!form.contactPerson) next.contactPerson = 'Contact person is required';
    if (!form.email) next.email = 'Email is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) next.email = 'Invalid email';
    if (!form.location) next.location = 'Location is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${getApiBaseUrl()}/rental/create`, {
        customerType,
        phone: form.phone,
        companyName: form.companyName,
        companyId: form.companyId || null,
        customerComplaint: complaint,
        contactPerson: form.contactPerson,
        email: form.email,
        addressDetail: form.address || form.location,
        location: form.location,
        rentalType: selectedOffer.id,
        rentalTitle: selectedOffer.title,
        serviceImage: rentalDefaultImage || '',
        paymentMethod: 'cash',
      });
      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || 'Rental enquiry created successfully',
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to create enquiry',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to create enquiry',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Rental Type *</Text>
        {offers.map((offer: any) => (
          <TouchableOpacity
            key={offer.id}
            style={[
              styles.serviceChip,
              selectedOffer?.id === offer.id && styles.serviceChipSelected,
            ]}
            onPress={() => setSelectedOffer(offer)}
          >
            <Text
              style={[
                styles.serviceChipText,
                selectedOffer?.id === offer.id && styles.serviceChipTextSelected,
              ]}
            >
              {offer.title}
            </Text>
          </TouchableOpacity>
        ))}
        {errors.rentalType ? <Text style={styles.error}>{errors.rentalType}</Text> : null}

        <Text style={styles.label}>Type of Customer *</Text>
        <View style={styles.radioRow}>
          {['New', 'Rework'].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.radioOption}
              onPress={() => setCustomerType(type)}
            >
              <View style={styles.radioCircle}>
                {customerType === type ? <View style={styles.radioInner} /> : null}
              </View>
              <Text>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <EnquiryCompanyFields values={form} errors={errors} onChange={patchForm} />

        <Text style={styles.label}>Customer Complaint Box (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter complaint or description"
          value={complaint}
          onChangeText={setComplaint}
          multiline
          numberOfLines={4}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
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
    height: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 8,
  },
  serviceChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  serviceChipSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  serviceChipText: {
    fontSize: 15,
    color: '#333',
  },
  serviceChipTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
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
