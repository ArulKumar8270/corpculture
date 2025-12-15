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
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  screen: string;
  permissionKey: string;
  permissionAction?: string;
  color?: string;
}

const EmployeeDashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();

  const isAdmin = user?.role === 1 || Number(user?.role) === 1;

  const navigateToScreen = (screen: string) => {
    // Map of nested screens to their parent stack
    const nestedScreens: { [key: string]: string } = {
      'CategoryManagement': 'Settings',
      'UserManagement': 'Settings',
      'GSTManagement': 'Settings',
      'CompanyList': 'Settings',
      'AddCompany': 'Settings',
      'OldInvoicesList': 'Settings',
      'MenuSettings': 'Settings',
      'CreditSettings': 'Settings',
      'GiftSettings': 'Settings',
      'ProductCreate': 'Products',
      'ProductList': 'Products',
      'OrderUpdate': 'Orders',
      'ServiceEnquiries': 'Services',
      'ServiceProductList': 'Services',
      'ServiceInvoiceList': 'Services',
      'ServiceQuotationList': 'Services',
      'ServiceReports': 'Services',
      'RentalEnquiries': 'Rentals',
      'RentalProductList': 'Rentals',
      'RentalInvoiceList': 'Rentals',
      'RentalQuotationList': 'Rentals',
      'RentalReports': 'Rentals',
      'RentalPartners': 'Rentals',
      'Address': 'Profile',
      'PanCard': 'Profile',
      'Deactivate': 'Profile',
      'CompanyReports': 'Reports',
      'ServiceReportsSummary': 'Reports',
      'RentalReportsSummary': 'Reports',
      'SalesReportsSummary': 'Reports',
      'RentalInvoiceReport': 'Reports',
      'ServiceEnquiriesReport': 'Reports',
      'ServiceInvoicesReport': 'Reports',
      'ServiceReportsReport': 'Reports',
      'EmployeeList': 'Reports',
      'ReportsDashboard': 'Reports',
    };
    
    // Direct drawer screens - navigate to stack with initial screen
    const directScreens: { [key: string]: { stack: string; initialScreen: string } } = {
      'Products': { stack: 'Products', initialScreen: 'ProductList' },
      'Orders': { stack: 'Orders', initialScreen: 'OrderList' },
      'Commission': { stack: 'Commission', initialScreen: 'Commission' },
      'VendorList': { stack: 'VendorList', initialScreen: 'VendorList' },
      'PurchaseList': { stack: 'PurchaseList', initialScreen: 'PurchaseList' },
    };
    
    const parentStack = nestedScreens[screen];
    if (parentStack) {
      // Navigate to parent stack first, then to nested screen
      (navigation as any).navigate(parentStack, {
        screen: screen,
      });
    } else if (directScreens[screen]) {
      // Navigate to drawer screen, which will show the stack with initial screen
      const { stack } = directScreens[screen];
      (navigation as any).navigate(stack);
    } else {
      // Try direct navigation as fallback
      try {
        (navigation as any).navigate(screen);
      } catch (error) {
        console.error(`Navigation error for screen: ${screen}`, error);
      }
    }
  };

  const canAccess = (permissionKey: string, action: string = 'view') => {
    return isAdmin || hasPermission(permissionKey, action);
  };

  // Account Settings
  const accountSettingsItems: MenuItem[] = [
    {
      id: 'profile',
      title: 'Profile Information',
      icon: 'person',
      screen: 'Profile',
      permissionKey: 'accountSettings',
      color: '#019ee3',
    },
  ];

  // Sales Section
  const salesItems: MenuItem[] = [
    {
      id: 'products',
      title: 'Products',
      icon: 'inventory',
      screen: 'Products',
      permissionKey: 'salesAllProducts',
      color: '#4CAF50',
    },
    {
      id: 'orders',
      title: 'Orders',
      icon: 'shopping-cart',
      screen: 'Orders',
      permissionKey: 'salesOrders',
      color: '#FF9800',
    },
    {
      id: 'commission',
      title: 'Partners',
      icon: 'account-balance-wallet',
      screen: 'Commission',
      permissionKey: 'salesCommission',
      color: '#2196F3',
    },
    {
      id: 'oldInvoices',
      title: 'Old Invoices',
      icon: 'description',
      screen: 'OldInvoicesList',
      permissionKey: 'sales',
      color: '#9E9E9E',
    },
  ];

  // Service Section
  const serviceItems: MenuItem[] = [
    {
      id: 'serviceEnquiries',
      title: 'Enquiries',
      icon: 'inbox',
      screen: 'ServiceEnquiries',
      permissionKey: 'serviceEnquiries',
      color: '#E91E63',
    },
    {
      id: 'serviceProducts',
      title: 'Products',
      icon: 'build',
      screen: 'ServiceProductList',
      permissionKey: 'serviceProductList',
      color: '#00BCD4',
    },
    {
      id: 'serviceInvoice',
      title: 'Invoices',
      icon: 'description',
      screen: 'ServiceInvoiceList',
      permissionKey: 'serviceInvoice',
      color: '#3F51B5',
    },
    {
      id: 'serviceQuotation',
      title: 'Quotations',
      icon: 'file-copy',
      screen: 'ServiceQuotationList',
      permissionKey: 'serviceQuotation',
      color: '#009688',
    },
    {
      id: 'serviceReport',
      title: 'Reports',
      icon: 'assessment',
      screen: 'ServiceReports',
      permissionKey: 'serviceReport',
      color: '#795548',
    },
    {
      id: 'servicePartners',
      title: 'Partners',
      icon: 'people',
      screen: 'ServicePartners',
      permissionKey: 'servicePartner',
      color: '#FF5722',
    },
  ];

  // Rental Section
  const rentalItems: MenuItem[] = [
    {
      id: 'rentalEnquiries',
      title: 'Enquiries',
      icon: 'home-work',
      screen: 'RentalEnquiries',
      permissionKey: 'rentalEnquiries',
      color: '#8BC34A',
    },
    {
      id: 'rentalProducts',
      title: 'Products',
      icon: 'inventory-2',
      screen: 'RentalProductList',
      permissionKey: 'rentalAllProducts',
      color: '#CDDC39',
    },
    {
      id: 'rentalInvoice',
      title: 'Invoices',
      icon: 'receipt-long',
      screen: 'RentalInvoiceList',
      permissionKey: 'rentalInvoice',
      color: '#FFC107',
    },
    {
      id: 'rentalQuotation',
      title: 'Quotations',
      icon: 'file-present',
      screen: 'RentalQuotationList',
      permissionKey: 'rentalQuotation',
      color: '#FF9800',
    },
    {
      id: 'rentalReport',
      title: 'Reports',
      icon: 'bar-chart',
      screen: 'RentalReports',
      permissionKey: 'rentalReport',
      color: '#F44336',
    },
    {
      id: 'rentalPartners',
      title: 'Partners',
      icon: 'group',
      screen: 'RentalPartners',
      permissionKey: 'rentalPartners',
      color: '#E91E63',
    },
  ];

  // Vendor Section
  const vendorItems: MenuItem[] = [
    {
      id: 'vendorList',
      title: 'Vendors List',
      icon: 'store',
      screen: 'VendorList',
      permissionKey: 'vendorList',
      color: '#673AB7',
    },
    {
      id: 'vendorProducts',
      title: 'Vendor Products',
      icon: 'inventory',
      screen: 'VendorProductList',
      permissionKey: 'vendorProducts',
      color: '#9C27B0',
    },
    {
      id: 'materialList',
      title: 'Material List',
      icon: 'list-alt',
      screen: 'PurchaseList',
      permissionKey: 'vendorPurchaseList',
      color: '#3F51B5',
    },
  ];

  // Reports Section
  const reportsItems: MenuItem[] = [
    {
      id: 'companyReport',
      title: 'Over all Company Details',
      icon: 'business',
      screen: 'CompanyReports',
      permissionKey: 'reportsCompanyReport',
      color: '#2196F3',
    },
    {
      id: 'serviceReport',
      title: 'Service Over all Details',
      icon: 'assessment',
      screen: 'ServiceReportsSummary',
      permissionKey: 'reportsService',
      color: '#00BCD4',
    },
    {
      id: 'rentalReport',
      title: 'Rental Over all Details',
      icon: 'home',
      screen: 'RentalReportsSummary',
      permissionKey: 'reportsRental',
      color: '#4CAF50',
    },
    {
      id: 'employeeReport',
      title: 'Employees',
      icon: 'people',
      screen: 'EmployeeList',
      permissionKey: 'reportsEmployeeList',
      color: '#9E9E9E',
    },
    {
      id: 'userReport',
      title: 'Users',
      icon: 'person',
      screen: 'UserManagement',
      permissionKey: 'reportsUserList',
      color: '#607D8B',
    },
  ];

  // Other Settings Section
  const otherSettingsItems: MenuItem[] = [
    {
      id: 'companyList',
      title: 'Company',
      icon: 'business',
      screen: 'CompanyList',
      permissionKey: 'otherSettingsAllCompany',
      color: '#2196F3',
    },
    {
      id: 'gst',
      title: 'GST',
      icon: 'receipt',
      screen: 'GSTManagement',
      permissionKey: 'otherSettingsGst',
      color: '#4CAF50',
    },
    {
      id: 'menuSetting',
      title: 'Menu setting',
      icon: 'settings',
      screen: 'MenuSettings',
      permissionKey: 'otherSettingsMenuSetting',
      color: '#9C27B0',
    },
    {
      id: 'category',
      title: 'Category',
      icon: 'category',
      screen: 'CategoryManagement',
      permissionKey: 'salesAllCategory',
      color: '#FF9800',
    },
    {
      id: 'credit',
      title: 'Credit',
      icon: 'credit-card',
      screen: 'CreditSettings',
      permissionKey: 'otherSettingsCredit',
      color: '#F44336',
    },
    {
      id: 'gift',
      title: 'Gift',
      icon: 'card-giftcard',
      screen: 'GiftSettings',
      permissionKey: 'otherSettingsGift',
      color: '#E91E63',
    },
  ];

  const renderMenuItem = (item: MenuItem) => {
    if (!canAccess(item.permissionKey, item.permissionAction)) {
      return null;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.menuCard, { borderLeftColor: item.color || '#019ee3' }]}
        onPress={() => navigateToScreen(item.screen)}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${item.color || '#019ee3'}20` }]}>
          <Icon name={item.icon as any} size={24} color={item.color || '#019ee3'} />
        </View>
        <Text style={styles.menuItemTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: MenuItem[], icon: string, sectionPermissionKey?: string) => {
    // Check section-level permission if provided (matches drawer behavior)
    // Always show for admins, otherwise check permission
    if (sectionPermissionKey && !canAccess(sectionPermissionKey, 'view')) {
      return null;
    }

    // Filter items by permission
    const visibleItems = items.filter((item) => canAccess(item.permissionKey, item.permissionAction));
    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name={icon as any} size={24} color="#019ee3" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.menuGrid}>
          {items.map((item) => renderMenuItem(item))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Account Settings */}
      {renderSection('Account Settings', accountSettingsItems, 'person')}

      {/* Sales Section */}
      {renderSection('Sales', salesItems, 'shopping-bag', 'sales')}

      {/* Service Section */}
      {renderSection('Service', serviceItems, 'build', 'service')}

      {/* Rental Section */}
      {renderSection('Rental', rentalItems, 'home-work', 'rental')}

      {/* Vendor Section */}
      {renderSection('Vendors', vendorItems, 'store', 'vendor')}

      {/* Reports Section */}
      {renderSection('Reports', reportsItems, 'assessment', 'reports')}

      {/* Other Settings */}
      {renderSection('Other Settings', otherSettingsItems, 'settings', 'otherSettings')}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  menuCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
  },
});

export default EmployeeDashboardScreen;

