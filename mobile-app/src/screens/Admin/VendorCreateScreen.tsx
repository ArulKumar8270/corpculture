import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const VendorCreateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const vendorId = params?.vendor_id || params?.vendorId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    mobileNumber: '',
    mailId: '',
    personName: '',
  });

  useFocusEffect(
    useCallback(() => {
      if (vendorId) {
        fetchVendor();
      } else {
        resetForm();
      }
    }, [vendorId])
  );

  const fetchVendor = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/vendors/${vendorId}`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.data?.success) {
        const vendor = response.data.vendor;
        setFormData({
          companyName: vendor.companyName || '',
          companyAddress: vendor.companyAddress || '',
          city: vendor.city || '',
          state: vendor.state || '',
          pincode: vendor.pincode || '',
          gstNumber: vendor.gstNumber || '',
          mobileNumber: vendor.mobileNumber || '',
          mailId: vendor.mailId || '',
          personName: vendor.personName || '',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch vendor details.',
        });
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error fetching vendor:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching vendor details.',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      companyAddress: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: '',
      mobileNumber: '',
      mailId: '',
      personName: '',
    });
  };

  const handleSubmit = async () => {
    // Basic validation
    if (
      !formData.companyName ||
      !formData.companyAddress ||
      !formData.city ||
      !formData.state ||
      !formData.pincode ||
      !formData.mobileNumber ||
      !formData.mailId ||
      !formData.personName
    ) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (vendorId) {
        // Update existing vendor
        response = await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/vendors/${vendorId}`,
          formData,
          {
            headers: { Authorization: token || '' },
          }
        );
      } else {
        // Create new vendor
        response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/vendors`,
          formData,
          {
            headers: { Authorization: token || '' },
          }
        );
      }

      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || `Vendor ${vendorId ? 'updated' : 'registered'} successfully!`,
        });
        if (!vendorId) {
          resetForm();
        }
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || `Failed to ${vendorId ? 'update' : 'register'} vendor.`,
        });
      }
    } catch (error: any) {
      console.error(`Error ${vendorId ? 'updating' : 'registering'} vendor:`, error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && vendorId) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {vendorId ? 'Edit Vendor' : 'Vendor Register'}
        </Text>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.viewButtonText}>View Vendors</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company Name *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.companyName}
              onChangeText={(text) => setFormData({ ...formData, companyName: text })}
              placeholder="Enter company name"
              placeholderTextColor="#999"
            />
            <Icon name="event" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company Address *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.companyAddress}
              onChangeText={(text) => setFormData({ ...formData, companyAddress: text })}
              placeholder="Enter company address"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
            <Icon name="home" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="Enter city"
              placeholderTextColor="#999"
            />
            <Icon name="label" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              placeholder="Enter state"
              placeholderTextColor="#999"
            />
            <Icon name="home" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pincode *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.pincode}
              onChangeText={(text) => setFormData({ ...formData, pincode: text })}
              placeholder="Enter pincode"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Icon name="receipt" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.gstNumber}
              onChangeText={(text) => setFormData({ ...formData, gstNumber: text })}
              placeholder="Enter GST number"
              placeholderTextColor="#999"
            />
            <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.mobileNumber}
              onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
              placeholder="Enter mobile number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            <Icon name="phone" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mail Id *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.mailId}
              onChangeText={(text) => setFormData({ ...formData, mailId: text })}
              placeholder="Enter email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Icon name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Person Name *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.personName}
              onChangeText={(text) => setFormData({ ...formData, personName: text })}
              placeholder="Enter person name"
              placeholderTextColor="#999"
            />
            <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {vendorId ? 'Update' : 'Register'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  viewButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  submitButton: {
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default VendorCreateScreen;
