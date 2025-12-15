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

const RentalManagementScreen = () => {
  const navigation = useNavigation();
  const { hasPermission } = usePermissions();
  const { user } = useSelector((state: RootState) => state.auth);

  const allRentalMenu = [
    {
      id: 'enquiries',
      title: 'Rental Enquiries',
      icon: 'inbox',
      screen: 'RentalEnquiries' as never,
      permissionKey: 'rentalEnquiries',
    },
    {
      id: 'products',
      title: 'Rental Products',
      icon: 'inventory',
      screen: 'RentalProductList' as never,
      permissionKey: 'rentalAllProducts',
    },
    {
      id: 'invoices',
      title: 'Rental Invoices',
      icon: 'receipt',
      screen: 'RentalInvoiceList' as never,
      permissionKey: 'rentalInvoice',
    },
    {
      id: 'quotations',
      title: 'Rental Quotations',
      icon: 'description',
      screen: 'RentalQuotationList' as never,
      permissionKey: 'rentalQuotation',
    },
    {
      id: 'reports',
      title: 'Rental Reports',
      icon: 'assessment',
      screen: 'RentalReports' as never,
      permissionKey: 'rentalReport',
    },
    {
      id: 'partners',
      title: 'Rental Partners',
      icon: 'people',
      screen: 'RentalPartners' as never,
      permissionKey: 'rentalPartners',
    },
  ];

  // Filter menu items based on permissions (admins see all)
  const rentalMenu = user?.role === 1
    ? allRentalMenu
    : allRentalMenu.filter(item => hasPermission(item.permissionKey, 'view'));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rental Management</Text>
      </View>

      <View style={styles.menuContainer}>
        {rentalMenu.map((item) => (
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

export default RentalManagementScreen;

