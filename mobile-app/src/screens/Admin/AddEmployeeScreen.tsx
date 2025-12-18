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
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

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
    pincode: '',
    employeeType: '',
    designation: '',
    idCradNo: '',
    department: '',
    salary: '',
    image: '',
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [employeeTypeModalVisible, setEmployeeTypeModalVisible] = useState(false);
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
          pincode: data.employee.pincode || '',
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

  const handleImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        const formDataUpload = new FormData();
        formDataUpload.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        setLoading(true);
        try {
          const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/auth/upload-file`,
            formDataUpload,
            {
              headers: {
                Authorization: token || '',
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          if (response.data?.success && response.data?.fileUrl) {
            setFormData({ ...formData, image: response.data.fileUrl });
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Image uploaded successfully',
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to upload image',
            });
          }
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.response?.data?.message || 'Error uploading image',
          });
        } finally {
          setLoading(false);
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.employeeType) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        // Update existing employee
        const response = await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/employee/update/${employeeId}`,
          {
            ...formData,
            salary: formData.salary ? Number(formData.salary) : undefined,
            image: formData.image || undefined,
          },
          {
            headers: { Authorization: token || '' },
          }
        );

        if (response.data?.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Employee updated successfully',
          });
          (navigation as any).navigate('EmployeeList');
        }
      } else {
        // Register new user first, then create employee
        try {
          const registerResponse = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/auth/register`,
            {
              ...formData,
              password: formData.phone,
              role: 3,
            },
            {
              headers: { Authorization: token || '' },
            }
          );

          const registerUser = registerResponse.data?.user;

          if (registerUser?._id) {
            const employeeCreateResponse = await axios.post(
              `${process.env.EXPO_PUBLIC_API_URL}/employee/create`,
              {
                ...formData,
                password: formData.phone,
                userId: registerUser._id,
                salary: formData.salary ? Number(formData.salary) : undefined,
                image: formData.image || undefined,
              },
              {
                headers: { Authorization: token || '' },
              }
            );

            if (employeeCreateResponse.data?.success) {
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Employee added successfully',
              });
              (navigation as any).navigate('EmployeeList');
            }
          }
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.response?.data?.message || 'Failed to add employee. Please try again.',
          });
        }
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

  const selectedDepartment = categories.find((cat) => cat._id === formData.department);

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
          style={[styles.input, isEditMode && styles.inputDisabled]}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isEditMode}
        />

        <Text style={styles.label}>Phone *</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          placeholder="Enter address"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Pincode</Text>
        <TextInput
          style={styles.input}
          value={formData.pincode}
          onChangeText={(text) => setFormData({ ...formData, pincode: text.replace(/[^0-9]/g, '').slice(0, 6) })}
          placeholder="Enter pincode"
          keyboardType="numeric"
          maxLength={6}
        />

        <Text style={styles.label}>Employee Type *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setEmployeeTypeModalVisible(true)}
        >
          <Text style={formData.employeeType ? styles.inputText : styles.placeholderText}>
            {formData.employeeType || 'Select Employee Type'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" style={styles.dropdownIcon} />
        </TouchableOpacity>

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
        <TouchableOpacity
          style={styles.input}
          onPress={() => setDepartmentModalVisible(true)}
        >
          <Text style={selectedDepartment ? styles.inputText : styles.placeholderText}>
            {selectedDepartment?.name || 'Select Department'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" style={styles.dropdownIcon} />
        </TouchableOpacity>

        <Text style={styles.label}>Salary</Text>
        <TextInput
          style={styles.input}
          value={formData.salary}
          onChangeText={(text) => setFormData({ ...formData, salary: text.replace(/[^0-9.]/g, '') })}
          placeholder="Enter salary"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Employee Photo</Text>
        <View style={styles.imageContainer}>
          {formData.image ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: formData.image }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setFormData({ ...formData, image: '' })}
              >
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="camera-alt" size={32} color="#999" />
            </View>
          )}
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleImageUpload}
            disabled={loading}
          >
            <Icon name="photo-camera" size={20} color="#019ee3" />
            <Text style={styles.uploadButtonText}>
              {formData.image ? 'Change Photo' : 'Upload Photo'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.imageHint}>Supported formats: JPG, PNG (Max 5MB)</Text>

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

      {/* Employee Type Picker Modal */}
      <Modal
        visible={employeeTypeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEmployeeTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEmployeeTypeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Employee Type</Text>
            <FlatList
              data={employeeTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, employeeType: item });
                    setEmployeeTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setEmployeeTypeModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Department Picker Modal */}
      <Modal
        visible={departmentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDepartmentModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDepartmentModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Department</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, department: item._id });
                    setDepartmentModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyModal}>
                  <Text style={styles.emptyModalText}>No departments available</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setDepartmentModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#019ee3',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#999',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#019ee3',
    gap: 8,
  },
  uploadButtonText: {
    color: '#019ee3',
    fontSize: 14,
    fontWeight: '600',
  },
  imageHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#019ee3',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  emptyModal: {
    padding: 20,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 14,
    color: '#999',
  },
  modalCancelButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default AddEmployeeScreen;
