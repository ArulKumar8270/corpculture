import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { getApiBaseUrl } from '../services/api';
import { listEnquiryDeliveryAddresses } from '../utils/enquiryDeliveryAddresses';

export type EnquiryCompanyValues = {
  phone: string;
  companyName: string;
  companyId: string;
  contactPerson: string;
  email: string;
  address: string;
  location: string;
};

type Props = {
  values: EnquiryCompanyValues;
  errors?: Record<string, string>;
  onChange: (patch: Partial<EnquiryCompanyValues>) => void;
};

const EnquiryCompanyFields = ({ values, errors = {}, onChange }: Props) => {
  const [fetchedCompanies, setFetchedCompanies] = useState<any[]>([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchCompaniesByPhone = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setFetchedCompanies([]);
      return;
    }

    setIsFetching(true);
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/company/getByPhone/${phoneNumber}`
      );
      if (response.data?.success && Array.isArray(response.data.company) && response.data.company.length) {
        setFetchedCompanies(response.data.company);
      } else {
        setFetchedCompanies([]);
      }
    } catch {
      setFetchedCompanies([]);
    } finally {
      setIsFetching(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    onChange({ phone: cleaned });
    if (cleaned.length >= 9) {
      fetchCompaniesByPhone(cleaned);
    } else {
      setFetchedCompanies([]);
      setDeliveryAddresses([]);
    }
  };

  const handleCompanySelect = (company: any) => {
    const options = listEnquiryDeliveryAddresses(company);
    const selectedLocation = options[0] || '';
    setDeliveryAddresses(options);
    setFetchedCompanies([]);
    onChange({
      companyName: company.companyName || '',
      companyId: company._id || '',
      contactPerson: company.contactPersons?.[0]?.name || '',
      email: company.contactPersons?.[0]?.email || '',
      address: selectedLocation || company.billingAddress || '',
      location: selectedLocation,
    });
  };

  return (
    <>
      <Text style={styles.label}>Phone *</Text>
      <TextInput
        style={[styles.input, errors.phone && styles.inputError]}
        placeholder="Enter at least 9 digits"
        value={values.phone}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        maxLength={10}
      />
      {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}
      {isFetching ? <ActivityIndicator size="small" color="#007AFF" style={styles.loader} /> : null}

      {fetchedCompanies.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>Existing Companies:</Text>
          {fetchedCompanies.map((company: any) => (
            <TouchableOpacity
              key={company._id}
              style={styles.suggestionItem}
              onPress={() => handleCompanySelect(company)}
            >
              <Text style={styles.suggestionText}>
                {company.companyName}
                {company.contactPersons?.[0]?.mobile
                  ? ` (${company.contactPersons[0].mobile})`
                  : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Company Name *</Text>
      <TextInput
        style={[styles.input, errors.companyName && styles.inputError]}
        placeholder="Enter company name"
        value={values.companyName}
        onChangeText={(text) => onChange({ companyName: text })}
      />
      {errors.companyName ? <Text style={styles.error}>{errors.companyName}</Text> : null}

      <Text style={styles.label}>Contact Person *</Text>
      <TextInput
        style={[styles.input, errors.contactPerson && styles.inputError]}
        placeholder="Contact person name"
        value={values.contactPerson}
        onChangeText={(text) => onChange({ contactPerson: text })}
      />
      {errors.contactPerson ? <Text style={styles.error}>{errors.contactPerson}</Text> : null}

      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email address"
        value={values.email}
        onChangeText={(text) => onChange({ email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

      <Text style={styles.label}>Location Detail *</Text>
      {deliveryAddresses.length > 0 ? (
        <View style={styles.picker}>
          {deliveryAddresses.map((option, index) => (
            <TouchableOpacity
              key={`${option}-${index}`}
              style={[
                styles.option,
                values.location === option && styles.optionSelected,
              ]}
              onPress={() => onChange({ location: option, address: option })}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TextInput
          style={[styles.input, errors.location && styles.inputError]}
          placeholder="Enter location / delivery address"
          value={values.location}
          onChangeText={(text) => onChange({ location: text, address: text })}
        />
      )}
      {errors.location ? <Text style={styles.error}>{errors.location}</Text> : null}
    </>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 8,
  },
  loader: {
    marginVertical: 8,
  },
  suggestions: {
    marginTop: 6,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 5,
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionSelected: {
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
});

export default EnquiryCompanyFields;
