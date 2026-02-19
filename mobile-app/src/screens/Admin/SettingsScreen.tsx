import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { usePermissions } from '../../hooks/usePermissions';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { hasPermission } = usePermissions();
  const { user } = useSelector((state: RootState) => state.auth);

  const allSettingsMenu = [
    {
      id: 'globalSettings',
      title: 'Global Settings',
      icon: 'settings',
      screen: 'GlobalSettings' as never,
      permissionKey: 'otherSettingsSettings',
    },
    {
      id: 'company',
      title: 'Company Management',
      icon: 'business',
      screen: 'CompanyList' as never,
      permissionKey: 'otherSettingsAllCompany',
    },
    {
      id: 'gst',
      title: 'GST Management',
      icon: 'receipt',
      screen: 'GSTManagement' as never,
      permissionKey: 'otherSettingsGst',
    },
    {
      id: 'menu',
      title: 'Menu Settings',
      icon: 'menu',
      screen: 'MenuSettings' as never,
      permissionKey: 'otherSettingsMenuSetting',
    },
    {
      id: 'oldInvoices',
      title: 'Old Invoices',
      icon: 'description',
      screen: 'OldInvoicesList' as never,
      permissionKey: 'otherSettings', // Using parent permission
    },
  ];

  // Filter menu items based on permissions (admins see all)
  const settingsMenu = user?.role === 1
    ? allSettingsMenu
    : allSettingsMenu.filter(item => hasPermission(item.permissionKey, 'view'));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.menuContainer}>
        {settingsMenu.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.menuItemLeft}>
              <Icon name={item.icon} size={24} color="#007AFF" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
  menuContainer: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
});

export default SettingsScreen;

