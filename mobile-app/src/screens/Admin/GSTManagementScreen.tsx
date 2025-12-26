import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';
import { getApiBaseUrl } from '../../services/api';

const GSTManagementScreen = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [gstList, setGstList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gstType, setGstType] = useState('');
  const [gstPercentage, setGstPercentage] = useState('');
  const [editingGst, setEditingGst] = useState<any>(null);
  const [gstTypePickerVisible, setGstTypePickerVisible] = useState(false);

  const gstTypesOptions = ['SGST', 'CGST', 'IGST'];

  useFocusEffect(
    useCallback(() => {
      fetchGstList();
    }, [token])
  );

  const fetchGstList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${getApiBaseUrl()}/gst`,
        {
          headers: { Authorization: token || '' },
          timeout: 30000,
        }
      );
      if (response.data?.success) {
        setGstList(response.data.gst || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch GST list',
        });
      }
    } catch (error: any) {
      console.error('Error fetching GST list:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching GST list',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!gstType || !gstPercentage) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      if (editingGst) {
        // Update existing GST
        const response = await axios.put(
          `${getApiBaseUrl()}/gst/${editingGst._id}`,
          {
            gstType,
            gstPercentage: parseFloat(gstPercentage),
          },
          {
            headers: { Authorization: token || '' },
          }
        );
        if (response.data?.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: response.data.message || 'GST updated successfully',
          });
          setEditingGst(null);
          setGstType('');
          setGstPercentage('');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: response.data?.message || 'Failed to update GST.',
          });
        }
      } else {
        // Create new GST
        const response = await axios.post(
          `${getApiBaseUrl()}/gst`,
          {
            gstType,
            gstPercentage: parseFloat(gstPercentage),
          },
          {
            headers: { Authorization: token || '' },
          }
        );
        if (response.data?.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: response.data.message || 'GST added successfully',
          });
          setGstType('');
          setGstPercentage('');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: response.data?.message || 'Failed to add GST.',
          });
        }
      }
      fetchGstList();
    } catch (error: any) {
      console.error('Error submitting GST:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong.',
      });
    }
  };

  const handleEdit = (gst: any) => {
    setEditingGst(gst);
    setGstType(gst.gstType);
    setGstPercentage(gst.gstPercentage.toString());
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete GST',
      'Are you sure you want to delete this GST entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${getApiBaseUrl()}/gst/${id}`,
                {
                  headers: { Authorization: token || '' },
                }
              );
              if (response.data?.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: response.data.message || 'GST deleted successfully',
                });
                fetchGstList();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: response.data?.message || 'Failed to delete GST.',
                });
              }
            } catch (error: any) {
              console.error('Error deleting GST:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong while deleting GST.',
              });
            }
          },
        },
      ]
    );
  };

  const handleCancelEdit = () => {
    setEditingGst(null);
    setGstType('');
    setGstPercentage('');
  };

  const renderGst = ({ item, index }: { item: any; index: number }) => {
    const canEdit = hasPermission('otherSettingsGst', 'edit') || user?.role === 1;

    return (
      <View style={styles.gstCard}>
        <View style={styles.gstInfo}>
          <Text style={styles.serialNumber}>#{index + 1}</Text>
          <Text style={styles.gstType}>{item.gstType || 'N/A'}</Text>
          <Text style={styles.gstPercentage}>{item.gstPercentage}%</Text>
        </View>
        {canEdit && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(item)}
            >
              <Icon name="edit" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item._id)}
            >
              <Icon name="delete" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const canEdit = hasPermission('otherSettingsGst', 'edit') || user?.role === 1;

  if (loading && gstList.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GST Management</Text>
      </View>

      {canEdit && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingGst ? 'Edit GST Entry' : 'Add New GST Entry'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GST Type *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setGstTypePickerVisible(true)}
            >
              <Text style={styles.pickerButtonText}>
                {gstType || 'Select a GST Type'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GST % *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter GST %"
              value={gstPercentage}
              onChangeText={setGstPercentage}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.submitButton, styles.updateButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {editingGst ? 'Update GST' : 'Add GST'}
              </Text>
            </TouchableOpacity>
            {editingGst && (
              <TouchableOpacity
                style={[styles.submitButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Existing GST Entries</Text>
      </View>

      <FlatList
        data={gstList}
        renderItem={({ item, index }) => renderGst({ item, index })}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={fetchGstList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No GST entries found</Text>
          </View>
        }
        contentContainerStyle={gstList.length === 0 ? styles.emptyListContent : undefined}
      />

      {/* GST Type Picker Modal */}
      <Modal
        visible={gstTypePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGstTypePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGstTypePickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select GST Type</Text>
            <FlatList
              data={gstTypesOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setGstType(item);
                    setGstTypePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setGstTypePickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  formCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  submitButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#019ee3',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  listHeader: {
    padding: 15,
    paddingBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  gstCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gstInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serialNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 40,
  },
  gstType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  gstPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#019ee3',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    padding: 20,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default GSTManagementScreen;
