import React, { useState } from 'react';
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
import Toast from 'react-native-toast-message';

const CreateServiceEnquiryScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyId: '',
    contactPerson: '',
    phone: '',
    email: '',
    serviceType: '',
    description: '',
    priority: 'Medium',
    preferredDate: '',
    address: '',
    installationRequired: false,
    sendQuotation: false,
  });

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
        text2: 'Service enquiry created successfully',
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

      <Text style={styles.label}>Service Type</Text>
      <TextInput
        style={styles.input}
        placeholder="Repair, Maintenance, etc."
        value={formData.serviceType}
        onChangeText={(text) => setFormData({ ...formData, serviceType: text })}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Service description"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Priority</Text>
      <TextInput
        style={styles.input}
        placeholder="High, Medium, Low"
        value={formData.priority}
        onChangeText={(text) => setFormData({ ...formData, priority: text })}
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
    height: 100,
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

export default CreateServiceEnquiryScreen;

