import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const AddEmployeeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const employeeId = (route.params as any)?.employeeId;
  const isEditMode = !!employeeId;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    employeeType: '',
    designation: '',
    idCradNo: '',
    department: '',
    salary: '',
    image: '',
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const employeeTypes = ['Service', 'Sales', 'Rentals'];

  useEffect(() => {
    fetchCategories();
    if (isEditMode && employeeId) {
      fetchEmployee(employeeId);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/category/all`, {
        headers: { Authorization: token || '' },
      });
      if (data?.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/employee/get/${id}`, {
        headers: { Authorization: token || '' },
      });
      if (data?.employee) {
        setFormData({
          name: data.employee.name || '',
          email: data.employee.email || '',
          phone: data.employee.phone || '',
          address: data.employee.address || '',
          employeeType: data.employee.employeeType || '',
          designation: data.employee.designation || '',
          idCradNo: data.employee.idCradNo || '',
          department: data.employee.department?._id || data.employee.department || '',
          salary: data.employee.salary?.toString() || '',
          image: data.employee.image || '',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load employee data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
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
        ? `${process.env.EXPO_PUBLIC_API_URL}/employee/update/${employeeId}`
        : `${process.env.EXPO_PUBLIC_API_URL}/employee/create`;
      const method = isEditMode ? 'put' : 'post';

      const { data } = await axios[method](url, formData, {
        headers: { Authorization: token || '' },
      });

      if (data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: isEditMode ? 'Employee updated successfully' : 'Employee created successfully',
        });
        // Navigate back to EmployeeList screen explicitly
        (navigation as any).navigate('EmployeeList');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to save employee',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter employee name"
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone *</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          placeholder="Enter address"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Employee Type</Text>
        <TextInput
          style={styles.input}
          value={formData.employeeType}
          onChangeText={(text) => setFormData({ ...formData, employeeType: text })}
          placeholder="Service, Sales, or Rentals"
        />

        <Text style={styles.label}>Designation</Text>
        <TextInput
          style={styles.input}
          value={formData.designation}
          onChangeText={(text) => setFormData({ ...formData, designation: text })}
          placeholder="Enter designation"
        />

        <Text style={styles.label}>ID Card No</Text>
        <TextInput
          style={styles.input}
          value={formData.idCradNo}
          onChangeText={(text) => setFormData({ ...formData, idCradNo: text })}
          placeholder="Enter ID card number"
        />

        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          value={formData.department}
          onChangeText={(text) => setFormData({ ...formData, department: text })}
          placeholder="Enter department"
        />

        <Text style={styles.label}>Salary</Text>
        <TextInput
          style={styles.input}
          value={formData.salary}
          onChangeText={(text) => setFormData({ ...formData, salary: text })}
          placeholder="Enter salary"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isEditMode ? 'Update Employee' : 'Create Employee'}</Text>
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

export default AddEmployeeScreen;
