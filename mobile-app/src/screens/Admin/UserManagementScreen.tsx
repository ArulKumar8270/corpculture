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
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';
import { getApiBaseUrl } from '../../services/api';

const UserManagementScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  
  // Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  useEffect(() => {
    if (token) {
      loadUsers();
      fetchCategories();
    }
  }, [token]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/auth/all-users`,
        {
          headers: {
            Authorization: token,
          },
          timeout: 30000,
        }
      );
      const usersData = response?.data?.users || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setUsers([]);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load users',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/category/all`,
        {
          headers: {
            Authorization: token,
          },
          timeout: 30000,
        }
      );
      if (response.data?.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const toggleExpand = (parentId: string) => {
    setExpandedParents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  const handleToggleCommission = async (userId: string, currentStatus: boolean, email: string) => {
    const newStatus = !currentStatus;
    try {
      const response = await axios.post(
        `${getApiBaseUrl()}/auth/update-details`,
        {
          _id: userId,
          isCommissionEnabled: newStatus ? 1 : 0,
          email: email,
        },
        {
          headers: {
            Authorization: token,
          },
          timeout: 30000,
        }
      );
      if (response.status === 200 && response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || 'Commission status updated successfully',
        });
        setUsers(
          users.map((u) => (u._id === userId ? { ...u, isCommissionEnabled: newStatus } : u))
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data.message || 'Failed to update commission status',
        });
      }
    } catch (error: any) {
      console.error('Error updating commission status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error updating commission status',
      });
    }
  };

  const handleOpenModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      commission: user.commission?.toString() || '0',
      panNumber: user.pan?.number || '',
      panName: user.pan?.name || '',
      isCommissionEnabled: user.isCommissionEnabled || false,
      commissionCategorys: user.commissionCategorys || [],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({});
    setIsUpdating(false);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const updatePayload = {
        _id: selectedUser._id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        commission: parseFloat(formData.commission) || 0,
        pan: {
          number: formData.panNumber,
          name: formData.panName,
        },
        isCommissionEnabled: formData.isCommissionEnabled,
        commissionCategorys: formData.commissionCategorys || [],
      };

      const response = await axios.post(
        `${getApiBaseUrl()}/auth/update-details`,
        updatePayload,
        {
          headers: {
            Authorization: token,
          },
          timeout: 30000,
        }
      );

      if (response.status === 200 && response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || 'User details updated successfully',
        });
        loadUsers();
        handleCloseModal();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data.message || 'Failed to update user details',
        });
      }
    } catch (error: any) {
      console.error('Error updating user details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Error updating user details',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeactivate = async (userId: string) => {
    Alert.alert(
      'Deactivate User',
      'Are you sure you want to deactivate this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(
                `${getApiBaseUrl()}/auth/deactivate-user`,
                { userId },
                {
                  headers: {
                    Authorization: token,
                  },
                }
              );
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'User deactivated successfully',
              });
              loadUsers();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to deactivate user',
              });
            }
          },
        },
      ]
    );
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 0:
        return 'Customer';
      case 1:
        return 'Admin';
      case 3:
        return 'Employee';
      default:
        return 'User';
    }
  };

  const filteredUsers = (users || []).filter((user) => {
    const query = searchQuery.toLowerCase();
    const roleString = user.role === 1 ? 'admin' : 'user';
    return (
      user?.name?.toLowerCase().includes(query) ||
      user?.email?.toLowerCase().includes(query) ||
      user?.phone?.toLowerCase().includes(query) ||
      roleString.includes(query) ||
      (user.pan?.number && user.pan.number.toLowerCase().includes(query)) ||
      (user.pan?.name && user.pan.name.toLowerCase().includes(query))
    );
  });

  const parentUsers = filteredUsers.filter(
    (u) => !u.parentId && u?.role !== 3 && u?.role !== 1
  );

  const renderUserItem = (user: any, isChild: boolean = false) => (
    <View style={[styles.userCard, isChild && styles.childUserCard]}>
      <View style={styles.userInfo}>
        {isChild && <View style={styles.childIndicator} />}
        <View style={styles.userHeaderRow}>
          <Text style={styles.userName}>{user.name || 'N/A'}</Text>
          {!isChild && filteredUsers.some((child) => String(child.parentId) === String(user._id)) && (
            <TouchableOpacity
              onPress={() => toggleExpand(user._id)}
              style={styles.expandButton}
            >
              <Icon
                name={expandedParents.has(user._id) ? 'expand-less' : 'expand-more'}
                size={24}
                color="#019ee3"
              />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.userEmail}>{user.email || 'N/A'}</Text>
        <Text style={styles.userPhone}>{user.phone || 'N/A'}</Text>
        {user.address && <Text style={styles.userAddress}>{user.address}</Text>}
        <View style={styles.userDetailsRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleName(user.role || 0)}</Text>
          </View>
          {user.commission !== undefined && (
            <Text style={styles.commissionText}>Commission: {user.commission?.toFixed(2) || '0.00'}</Text>
          )}
        </View>
        {user.pan?.number && (
          <Text style={styles.panText}>PAN: {user.pan.number} ({user.pan.name || 'N/A'})</Text>
        )}
        {user.createdAt && (
          <Text style={styles.createdText}>
            Created: {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      <View style={styles.actionButtons}>
        {!user.parentId && hasPermission('reportsUserList') && (
          <View style={styles.commissionToggleContainer}>
            <Text style={styles.commissionToggleLabel}>Commission</Text>
            <Switch
              value={user.isCommissionEnabled || false}
              onValueChange={() => handleToggleCommission(user._id, user.isCommissionEnabled, user.email)}
              disabled={!hasPermission('reportsUserList')}
            />
          </View>
        )}
        {hasPermission('reportsUserList') && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleOpenModal(user)}
          >
            <Icon name="edit" size={20} color="#007AFF" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deactivateButton}
          onPress={() => handleDeactivate(user._id)}
        >
          <Icon name="block" size={20} color="#FF3B30" />
          <Text style={styles.deactivateText}>Deactivate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderParentWithChildren = (parent: any) => {
    const children = filteredUsers.filter(
      (child) => String(child.parentId) === String(parent._id)
    );
    const isExpanded = expandedParents.has(parent._id);

    return (
      <View key={parent._id}>
        {renderUserItem(parent, false)}
        {isExpanded && children.map((child) => renderUserItem(child, true))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={parentUsers}
          renderItem={({ item }) => renderParentWithChildren(item)}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={loadUsers}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* Edit User Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User Details</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedUser && (
                <>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Name *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formData.name}
                      onChangeText={(value) => handleFormChange('name', value)}
                      placeholder="Enter name"
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Email *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formData.email}
                      onChangeText={(value) => handleFormChange('email', value)}
                      placeholder="Enter email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Phone *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formData.phone}
                      onChangeText={(value) => handleFormChange('phone', value)}
                      placeholder="Enter phone"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Address</Text>
                    <TextInput
                      style={[styles.modalInput, styles.textAreaInput]}
                      value={formData.address}
                      onChangeText={(value) => handleFormChange('address', value)}
                      placeholder="Enter address"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Commission</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formData.commission}
                      onChangeText={(value) => handleFormChange('commission', value)}
                      placeholder="Enter commission"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>PAN Number</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formData.panNumber}
                      onChangeText={(value) => handleFormChange('panNumber', value)}
                      placeholder="Enter PAN number"
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>PAN Name</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formData.panName}
                      onChangeText={(value) => handleFormChange('panName', value)}
                      placeholder="Enter PAN name"
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Commission Categories</Text>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setCategoryPickerVisible(true)}
                    >
                      <Text style={[styles.pickerButtonText, formData.commissionCategorys?.length === 0 && styles.placeholderText]}>
                        {formData.commissionCategorys?.length > 0
                          ? `${formData.commissionCategorys.length} category${formData.commissionCategorys.length > 1 ? 'ies' : 'y'} selected`
                          : 'Select Categories'}
                      </Text>
                      <Icon name="arrow-drop-down" size={24} color="#666" />
                    </TouchableOpacity>
                    {formData.commissionCategorys?.length > 0 && (
                      <View style={styles.selectedCategoriesContainer}>
                        {formData.commissionCategorys.map((catId: string) => {
                          const category = categories.find((c) => c._id === catId);
                          return (
                            <View key={catId} style={styles.categoryChip}>
                              <Text style={styles.categoryChipText}>{category?.name || catId}</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  handleFormChange(
                                    'commissionCategorys',
                                    formData.commissionCategorys.filter((id: string) => id !== catId)
                                  );
                                }}
                              >
                                <Icon name="close" size={16} color="#666" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Role</Text>
                    <TextInput
                      style={[styles.modalInput, styles.readOnlyInput]}
                      value={selectedUser.role === 1 ? 'Admin' : 'User'}
                      editable={false}
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Created At</Text>
                    <TextInput
                      style={[styles.modalInput, styles.readOnlyInput]}
                      value={
                        selectedUser.createdAt
                          ? new Date(selectedUser.createdAt).toLocaleDateString()
                          : '-'
                      }
                      editable={false}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={handleCloseModal}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, isUpdating && styles.modalSaveButtonDisabled]}
                onPress={handleUpdateUser}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={categoryPickerVisible} animationType="slide" transparent>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Categories</Text>
              <TouchableOpacity onPress={() => setCategoryPickerVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((category) => {
                const isSelected = formData.commissionCategorys?.includes(category._id);
                return (
                  <TouchableOpacity
                    key={category._id}
                    style={styles.pickerOption}
                    onPress={() => {
                      const currentCategories = formData.commissionCategorys || [];
                      if (isSelected) {
                        handleFormChange(
                          'commissionCategorys',
                          currentCategories.filter((id: string) => id !== category._id)
                        );
                      } else {
                        handleFormChange('commissionCategorys', [...currentCategories, category._id]);
                      }
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{category.name}</Text>
                    {isSelected && <Icon name="check" size={20} color="#019ee3" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.pickerModalActions}>
              <TouchableOpacity
                style={styles.pickerModalClearButton}
                onPress={() => {
                  handleFormChange('commissionCategorys', []);
                }}
              >
                <Text style={styles.pickerModalClearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerModalDoneButton}
                onPress={() => setCategoryPickerVisible(false)}
              >
                <Text style={styles.pickerModalDoneButtonText}>Done</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  loader: {
    marginTop: 50,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childUserCard: {
    marginLeft: 30,
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 3,
    borderLeftColor: '#019ee3',
  },
  childIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#019ee3',
    marginRight: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  expandButton: {
    padding: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  userDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
    gap: 10,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  commissionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  panText: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  createdText: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  commissionToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  commissionToggleLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    gap: 5,
  },
  editText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 6,
    gap: 5,
  },
  deactivateText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#019ee3',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    backgroundColor: '#e9ecef',
    color: '#666',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  selectedCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#019ee3',
    gap: 6,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#019ee3',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#019ee3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  pickerModalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  pickerModalClearButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerModalClearButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  pickerModalDoneButton: {
    flex: 1,
    backgroundColor: '#019ee3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerModalDoneButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default UserManagementScreen;
