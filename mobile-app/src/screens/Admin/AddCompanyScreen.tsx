import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';

const AddCompanyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const companyId = (route.params as any)?.companyId;
  const isEditMode = !!companyId;

  const [formData, setFormData] = useState({
    companyName: '',
    billingAddress: '',
    invoiceType: 'Corpculture Invoice',
    city: '',
    state: '',
    pincode: '',
    gstNo: '',
    customerType: 'New',
    customerComplaint: '',
    phone: '',
  });

  const [serviceDeliveryAddresses, setServiceDeliveryAddresses] = useState([{ address: '', pincode: '' }]);
  const [contactPersons, setContactPersons] = useState([{ name: '', mobile: '', email: '' }]);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const formSectionY = useRef(0);
  const billingAddressSectionY = useRef(0);
  const phoneSectionY = useRef(0);

  useEffect(() => {
    if (isEditMode && companyId) {
      fetchCompanyData();
    }
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToBillingAddress = () => {
    setTimeout(() => {
      const y = formSectionY.current + billingAddressSectionY.current - 120;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, 100);
  };
  const scrollToPhone = () => {
    setTimeout(() => {
      const y = formSectionY.current + phoneSectionY.current - 120;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, 100);
  };

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/company/get/${companyId}`, {
        headers: { Authorization: token || '' },
      });
      if (data?.success && data.company) {
        const company = data.company;
        setFormData({
          companyName: company.companyName || '',
          billingAddress: company.billingAddress || '',
          invoiceType: company.invoiceType || 'Corpculture Invoice',
          city: company.city || '',
          state: company.state || '',
          pincode: company.pincode || '',
          gstNo: company.gstNo || '',
          customerType: company.customerType || 'New',
          customerComplaint: company.customerComplaint || '',
          phone: company.phone || '',
        });
        setServiceDeliveryAddresses(
          company.serviceDeliveryAddresses?.length > 0
            ? company.serviceDeliveryAddresses.map((addr: any) =>
                typeof addr === 'string' ? { address: addr, pincode: '' } : addr
              )
            : [{ address: '', pincode: '' }]
        );
        setContactPersons(
          company.contactPersons?.length > 0
            ? company.contactPersons
            : [{ name: '', mobile: '', email: '' }]
        );
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load company data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.billingAddress) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setLoading(true);
      const url = isEditMode
        ? `${getApiBaseUrl()}/company/update/${companyId}`
        : `${getApiBaseUrl()}/company/create`;
      const method = isEditMode ? 'put' : 'post';

      const payload = {
        ...formData,
        serviceDeliveryAddresses,
        contactPersons,
      };

      const { data } = await axios[method](url, payload, {
        headers: { Authorization: token || '' },
      });

      if (data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: isEditMode ? 'Company updated successfully' : 'Company created successfully',
        });
        // Navigate back to CompanyList screen explicitly
        (navigation as any).navigate('CompanyList');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to save company',
      });
    } finally {
      setLoading(false);
    }
  };

  const addDeliveryAddress = () => {
    setServiceDeliveryAddresses([...serviceDeliveryAddresses, { address: '', pincode: '' }]);
  };

  const removeDeliveryAddress = (index: number) => {
    setServiceDeliveryAddresses(serviceDeliveryAddresses.filter((_, i) => i !== index));
  };

  const addContactPerson = () => {
    setContactPersons([...contactPersons, { name: '', mobile: '', email: '' }]);
  };

  const removeContactPerson = (index: number) => {
    setContactPersons(contactPersons.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.form} onLayout={(e) => { formSectionY.current = e.nativeEvent.layout.y; }}>
        <Text style={styles.label}>Company Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.companyName}
          onChangeText={(text) => setFormData({ ...formData, companyName: text })}
          placeholder="Enter company name"
        />

        <View onLayout={(e) => { billingAddressSectionY.current = e.nativeEvent.layout.y; }}>
          <Text style={styles.label}>Billing Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.billingAddress}
            onChangeText={(text) => setFormData({ ...formData, billingAddress: text })}
            placeholder="Enter billing address"
            multiline
            numberOfLines={3}
            onFocus={scrollToBillingAddress}
          />
        </View>

        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          value={formData.city}
          onChangeText={(text) => setFormData({ ...formData, city: text })}
          placeholder="Enter city"
        />

        <Text style={styles.label}>State</Text>
        <TextInput
          style={styles.input}
          value={formData.state}
          onChangeText={(text) => setFormData({ ...formData, state: text })}
          placeholder="Enter state"
        />

        <Text style={styles.label}>Pincode</Text>
        <TextInput
          style={styles.input}
          value={formData.pincode}
          onChangeText={(text) => setFormData({ ...formData, pincode: text })}
          placeholder="Enter pincode"
          keyboardType="numeric"
        />

        <Text style={styles.label}>GST No</Text>
        <TextInput
          style={styles.input}
          value={formData.gstNo}
          onChangeText={(text) => setFormData({ ...formData, gstNo: text })}
          placeholder="Enter GST number"
        />

        <View onLayout={(e) => { phoneSectionY.current = e.nativeEvent.layout.y; }}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            onFocus={scrollToPhone}
          />
        </View>

        <Text style={styles.label}>Invoice Type</Text>
        <TextInput
          style={styles.input}
          value={formData.invoiceType}
          onChangeText={(text) => setFormData({ ...formData, invoiceType: text })}
          placeholder="Enter invoice type"
        />

        <Text style={styles.sectionTitle}>Service Delivery Addresses</Text>
        {serviceDeliveryAddresses.map((addr, index) => (
          <View key={index} style={styles.addressRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={addr.address}
              onChangeText={(text) => {
                const newAddresses = [...serviceDeliveryAddresses];
                newAddresses[index].address = text;
                setServiceDeliveryAddresses(newAddresses);
              }}
              placeholder="Address"
            />
            <TextInput
              style={[styles.input, { width: 100, marginLeft: 10 }]}
              value={addr.pincode}
              onChangeText={(text) => {
                const newAddresses = [...serviceDeliveryAddresses];
                newAddresses[index].pincode = text;
                setServiceDeliveryAddresses(newAddresses);
              }}
              placeholder="Pincode"
              keyboardType="numeric"
            />
            {serviceDeliveryAddresses.length > 1 && (
              <TouchableOpacity
                onPress={() => removeDeliveryAddress(index)}
                style={styles.removeButton}
              >
                <Icon name="delete" size={20} color="#dc3545" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addDeliveryAddress} style={styles.addButton}>
          <Icon name="add" size={20} color="#019ee3" />
          <Text style={styles.addButtonText}>Add Address</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Contact Persons</Text>
        {contactPersons.map((person, index) => (
          <View key={index} style={styles.contactRow}>
            <TextInput
              style={styles.input}
              value={person.name}
              onChangeText={(text) => {
                const newPersons = [...contactPersons];
                newPersons[index].name = text;
                setContactPersons(newPersons);
              }}
              placeholder="Name"
            />
            <TextInput
              style={styles.input}
              value={person.mobile}
              onChangeText={(text) => {
                const newPersons = [...contactPersons];
                newPersons[index].mobile = text;
                setContactPersons(newPersons);
              }}
              placeholder="Mobile"
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              value={person.email}
              onChangeText={(text) => {
                const newPersons = [...contactPersons];
                newPersons[index].email = text;
                setContactPersons(newPersons);
              }}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {contactPersons.length > 1 && (
              <TouchableOpacity
                onPress={() => removeContactPerson(index)}
                style={styles.removeButton}
              >
                <Icon name="delete" size={20} color="#dc3545" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addContactPerson} style={styles.addButton}>
          <Icon name="add" size={20} color="#019ee3" />
          <Text style={styles.addButtonText}>Add Contact Person</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isEditMode ? 'Update Company' : 'Create Company'}</Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactRow: {
    marginBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
  },
  addButtonText: {
    color: '#019ee3',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 10,
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddCompanyScreen;
