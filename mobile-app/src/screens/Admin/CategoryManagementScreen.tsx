import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { categoryService } from '../../services/api';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';

const CategoryManagementScreen = () => {
  const { hasPermission } = usePermissions();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', commission: '' });
  const [newCategoryErrors, setNewCategoryErrors] = useState<{ name?: string; commission?: string }>({});

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({ name: '', commission: '' });
  const [editCategoryErrors, setEditCategoryErrors] = useState<{ name?: string; commission?: string }>({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryService.getAll();
      setCategories(response.data.categories || []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load categories',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    let errors: { name?: string; commission?: string } = {};
    if (!newCategory.name.trim()) {
      errors.name = 'Category name is required';
    }
    if (!newCategory.commission || isNaN(Number(newCategory.commission))) {
      errors.commission = 'Commission is required and must be a number';
    }
    if (Object.keys(errors).length > 0) {
      setNewCategoryErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await categoryService.create({
        name: newCategory.name.trim(),
        commission: Number(newCategory.commission),
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Category created successfully',
      });
      setNewCategory({ name: '', commission: '' });
      setNewCategoryErrors({});
      setShowAddForm(false);
      loadCategories();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to create category',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setEditCategoryForm({
      name: category.name || '',
      commission: category.commission?.toString() || '',
    });
    setEditCategoryErrors({});
    setEditModalVisible(true);
  };

  const handleUpdateCategory = async () => {
    let errors: { name?: string; commission?: string } = {};
    if (!editCategoryForm.name.trim()) {
      errors.name = 'Category name is required';
    }
    if (!editCategoryForm.commission || isNaN(Number(editCategoryForm.commission))) {
      errors.commission = 'Commission is required and must be a number';
    }
    if (Object.keys(errors).length > 0) {
      setEditCategoryErrors(errors);
      return;
    }

    setEditLoading(true);
    try {
      await categoryService.update(editingCategory._id, {
        name: editCategoryForm.name.trim(),
        commission: Number(editCategoryForm.commission),
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Category updated successfully',
      });
      setEditModalVisible(false);
      setEditingCategory(null);
      setEditCategoryForm({ name: '', commission: '' });
      loadCategories();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update category',
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryService.delete(id);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Category deleted successfully',
              });
              loadCategories();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete category',
              });
            }
          },
        },
      ]
    );
  };

  const canManageCategories = hasPermission('salesAllCategory', 'edit');

  const renderCategory = ({ item }: { item: any }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryCommission}>
          Commission: {item.commission || 0}%
        </Text>
      </View>
      {canManageCategories && (
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Icon name="edit" size={20} color="#019ee3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item._id)}
          >
            <Icon name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        {canManageCategories && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setShowAddForm(!showAddForm);
              setNewCategory({ name: '', commission: '' });
              setNewCategoryErrors({});
            }}
          >
            <Icon name={showAddForm ? 'close' : 'add'} size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {showAddForm && canManageCategories && (
        <View style={styles.addForm}>
          <Text style={styles.label}>Category Name *</Text>
          <TextInput
            style={[styles.input, newCategoryErrors.name && styles.inputError]}
            placeholder="Enter category name"
            value={newCategory.name}
            onChangeText={(text) => {
              setNewCategory({ ...newCategory, name: text });
              setNewCategoryErrors({ ...newCategoryErrors, name: undefined });
            }}
            placeholderTextColor="#999"
          />
          {newCategoryErrors.name && (
            <Text style={styles.errorText}>{newCategoryErrors.name}</Text>
          )}

          <Text style={styles.label}>Commission (%) *</Text>
          <TextInput
            style={[styles.input, newCategoryErrors.commission && styles.inputError]}
            placeholder="Enter commission percentage"
            value={newCategory.commission}
            onChangeText={(text) => {
              setNewCategory({ ...newCategory, commission: text });
              setNewCategoryErrors({ ...newCategoryErrors, commission: undefined });
            }}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          {newCategoryErrors.commission && (
            <Text style={styles.errorText}>{newCategoryErrors.commission}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleAddCategory}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Category</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading && !showAddForm ? (
        <ActivityIndicator size="large" color="#019ee3" style={styles.loader} />
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={loadCategories}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="category" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No categories found</Text>
            </View>
          }
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setEditModalVisible(false);
          setEditingCategory(null);
          setEditCategoryForm({ name: '', commission: '' });
          setEditCategoryErrors({});
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Category</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingCategory(null);
                  setEditCategoryForm({ name: '', commission: '' });
                  setEditCategoryErrors({});
                }}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={[styles.input, editCategoryErrors.name && styles.inputError]}
                  placeholder="Enter category name"
                  value={editCategoryForm.name}
                  onChangeText={(text) => {
                    setEditCategoryForm({ ...editCategoryForm, name: text });
                    setEditCategoryErrors({ ...editCategoryErrors, name: undefined });
                  }}
                  placeholderTextColor="#999"
                />
                {editCategoryErrors.name && (
                  <Text style={styles.errorText}>{editCategoryErrors.name}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Commission (%) *</Text>
                <TextInput
                  style={[styles.input, editCategoryErrors.commission && styles.inputError]}
                  placeholder="Enter commission percentage"
                  value={editCategoryForm.commission}
                  onChangeText={(text) => {
                    setEditCategoryForm({ ...editCategoryForm, commission: text });
                    setEditCategoryErrors({ ...editCategoryErrors, commission: undefined });
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                {editCategoryErrors.commission && (
                  <Text style={styles.errorText}>{editCategoryErrors.commission}</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingCategory(null);
                  setEditCategoryForm({ name: '', commission: '' });
                  setEditCategoryErrors({});
                }}
                disabled={editLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, editLoading && styles.buttonDisabled]}
                onPress={handleUpdateCategory}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#019ee3',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#019ee3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addForm: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -5,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#019ee3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loader: {
    marginTop: 50,
  },
  categoryCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e6fbff',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  categoryCommission: {
    fontSize: 14,
    color: '#666',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
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
    maxHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
});

export default CategoryManagementScreen;
