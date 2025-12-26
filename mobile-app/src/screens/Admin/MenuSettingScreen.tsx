import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';

// Menu structure matching the client
const menuStructure = [
  {
    name: 'Account Settings',
    key: 'accountSettings',
    permissions: ['view', 'edit'],
    subItems: [{ name: 'Profile Information', key: 'profileInformation', permissions: ['view', 'edit'] }],
  },
  {
    name: 'Admin Dashboard',
    key: 'adminDashboard',
    permissions: ['view'],
    subItems: [
      {
        name: 'Sales',
        key: 'sales',
        permissions: ['view', 'add', 'edit', 'delete'],
        subItems: [
          { name: 'All Products', key: 'salesAllProducts', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'All Category', key: 'salesAllCategory', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Orders', key: 'salesOrders', permissions: ['view', 'edit'] },
          { name: 'Commission', key: 'salesCommission', permissions: ['view', 'add', 'edit', 'delete'] },
        ],
      },
      {
        name: 'Service',
        key: 'service',
        permissions: ['view', 'add', 'edit', 'delete'],
        subItems: [
          { name: 'Service Enquiries', key: 'serviceEnquiries', permissions: ['view', 'edit'] },
          { name: 'All Products', key: 'serviceProductList', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Invoice', key: 'serviceInvoice', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Quotation', key: 'serviceQuotation', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Reports', key: 'serviceReport', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Partners', key: 'servicePartner', permissions: ['view', 'add', 'edit', 'delete'] },
        ],
      },
      {
        name: 'Rental',
        key: 'rental',
        permissions: ['view', 'add', 'edit', 'delete'],
        subItems: [
          { name: 'Rental Enquiries', key: 'rentalEnquiries', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'All Products', key: 'rentalAllProducts', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Invoice', key: 'rentalInvoice', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Quotation', key: 'rentalQuotation', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Reports', key: 'rentalReport', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Partners', key: 'rentalPartners', permissions: ['view', 'add', 'edit', 'delete'] },
        ],
      },
      {
        name: 'Vendor',
        key: 'vendor',
        permissions: ['view', 'add', 'edit', 'delete'],
        subItems: [
          { name: 'Vendors', key: 'vendorList', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Products', key: 'vendorProducts', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Material List', key: 'vendorPurchaseList', permissions: ['view', 'add', 'edit', 'delete'] },
        ],
      },
      {
        name: 'Reports',
        key: 'reports',
        permissions: ['view'],
        subItems: [
          { name: 'Company Details', key: 'reportsCompanyReport', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Service Details', key: 'reportsService', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Rental Details', key: 'reportsRental', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Sales Details', key: 'reportsSales', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Employee', key: 'reportsEmployeeList', permissions: ['view', 'add', 'edit', 'delete'] },
          { name: 'Users', key: 'reportsUserList', permissions: ['view', 'add', 'edit', 'delete'] },
        ],
      },
    ],
  },
  {
    name: 'Other Settings',
    key: 'otherSettings',
    permissions: ['view'],
    subItems: [
      { name: 'All Company', key: 'otherSettingsAllCompany', permissions: ['view', 'add', 'edit', 'delete'] },
      { name: 'GST', key: 'otherSettingsGst', permissions: ['view', 'add', 'edit', 'delete'] },
      { name: 'Menu setting', key: 'otherSettingsMenuSetting', permissions: ['view', 'edit'] },
      { name: 'Credit', key: 'otherSettingsCredit', permissions: ['view', 'add', 'edit', 'delete'] },
      { name: 'Gift', key: 'otherSettingsGift', permissions: ['view', 'add', 'edit', 'delete'] },
    ],
  },
];

const MenuSettingScreen = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rolePickerVisible, setRolePickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRoles();
    }, [token])
  );

  useEffect(() => {
    if (selectedRole) {
      fetchPermissionsForRole(selectedRole);
    } else {
      setPermissions({});
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/employee/all`,
        {
          headers: { Authorization: token || '' },
          timeout: 30000,
        }
      );
      if (response.data?.success) {
        setRoles(response.data.employees || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch roles.',
        });
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching roles.',
      });
      setRoles([]);
    }
  };

  const fetchPermissionsForRole = async (roleId: string) => {
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/permissions/user/${roleId}`,
        {
          headers: { Authorization: token || '' },
          timeout: 30000,
        }
      );
      if (response.data?.success) {
        // Initialize all permissions to false
        const initializedPerms: Record<string, Record<string, boolean>> = {};
        const traverseMenu = (items: any[]) => {
          items.forEach((item) => {
            initializedPerms[item.key] = {};
            (item.permissions || []).forEach((perm: string) => {
              initializedPerms[item.key][perm] = false;
            });
            if (item.subItems) {
              traverseMenu(item.subItems);
            }
          });
        };
        traverseMenu(menuStructure);

        // Overlay fetched permissions
        response.data.permissions.forEach((permEntry: any) => {
          if (initializedPerms[permEntry.key]) {
            permEntry.actions.forEach((action: string) => {
              if (initializedPerms[permEntry.key][action] !== undefined) {
                initializedPerms[permEntry.key][action] = true;
              }
            });
          }
        });

        setPermissions(initializedPerms);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to fetch permissions.',
        });
        initializePermissions();
      }
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while fetching permissions.',
      });
      initializePermissions();
    }
  };

  const initializePermissions = () => {
    const initial: Record<string, Record<string, boolean>> = {};
    const traverseMenu = (items: any[]) => {
      items.forEach((item) => {
        initial[item.key] = {};
        (item.permissions || []).forEach((perm: string) => {
          initial[item.key][perm] = false;
        });
        if (item.subItems) {
          traverseMenu(item.subItems);
        }
      });
    };
    traverseMenu(menuStructure);
    setPermissions(initial);
  };

  const handlePermissionChange = (menuKey: string, permissionType: string) => (value: boolean) => {
    setPermissions((prevPermissions) => ({
      ...prevPermissions,
      [menuKey]: {
        ...prevPermissions[menuKey],
        [permissionType]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a role first.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.put(
        `${getApiBaseUrl()}/permissions/batch-update`,
        { userId: selectedRole, permissions },
        {
          headers: { Authorization: token || '' },
          timeout: 30000,
        }
      );
      if (response.data?.success) {
        setIsLoading(false);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || 'Permissions updated successfully!',
        });
      } else {
        setIsLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Failed to update permissions.',
        });
      }
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong while updating permissions.',
      });
    }
  };

  const renderPermissions = (items: any[], level = 0) => {
    return items.map((item) => (
      <View key={item.key} style={[styles.permissionSection, level > 0 && styles.nestedSection]}>
        <Text style={[styles.sectionTitle, level === 0 && styles.mainSectionTitle]}>
          {item.name}
        </Text>
        <View style={styles.permissionRow}>
          {(item.permissions || []).map((perm: string) => {
            const canEdit = hasPermission('otherSettingsGst', 'edit') || user?.role === 1;
            return (
              <View key={`${item.key}-${perm}`} style={styles.permissionItem}>
                <Text style={styles.permissionLabel}>
                  {perm.charAt(0).toUpperCase() + perm.slice(1)}
                </Text>
                <Switch
                  value={permissions[item.key]?.[perm] || false}
                  onValueChange={handlePermissionChange(item.key, perm)}
                  disabled={!selectedRole || !canEdit}
                  trackColor={{ false: '#e0e0e0', true: '#019ee3' }}
                  thumbColor={permissions[item.key]?.[perm] ? '#fff' : '#f4f3f4'}
                />
              </View>
            );
          })}
        </View>
        {item.subItems && item.subItems.length > 0 && (
          <View style={styles.subItemsContainer}>
            {renderPermissions(item.subItems, level + 1)}
          </View>
        )}
      </View>
    ));
  };

  const selectedRoleName = roles.find((r) => r.userId === selectedRole)?.name || '';

  const canEdit = hasPermission('otherSettingsGst', 'edit') || user?.role === 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu Settings (Role Permissions)</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Select Role</Text>
        <TouchableOpacity
          style={[styles.pickerButton, !canEdit && styles.pickerButtonDisabled]}
          onPress={() => canEdit && setRolePickerVisible(true)}
          disabled={!canEdit}
        >
          <Text style={styles.pickerButtonText}>
            {selectedRoleName || '--select Role--'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        {selectedRole && (
          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsTitle}>
              Permissions for {selectedRoleName}
            </Text>
            <ScrollView style={styles.permissionsScroll}>
              {renderPermissions(menuStructure)}
            </ScrollView>
            {canEdit && (
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Permissions</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {!selectedRole && (
          <Text style={styles.placeholderText}>
            Please select a role to view and edit its menu permissions.
          </Text>
        )}
      </View>

      {/* Role Picker Modal */}
      <Modal
        visible={rolePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRolePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRolePickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Role</Text>
            <FlatList
              data={roles}
              keyExtractor={(item) => item.userId || item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedRole(item.userId || item._id);
                    setRolePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setRolePickerVisible(false)}
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
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    marginBottom: 20,
  },
  pickerButtonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  permissionsContainer: {
    marginTop: 10,
  },
  permissionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  permissionsScroll: {
    maxHeight: 400,
  },
  permissionSection: {
    marginBottom: 20,
  },
  nestedSection: {
    marginLeft: 20,
    marginTop: 10,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  mainSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 10,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#666',
  },
  subItemsContainer: {
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
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
    maxHeight: '70%',
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

export default MenuSettingScreen;
