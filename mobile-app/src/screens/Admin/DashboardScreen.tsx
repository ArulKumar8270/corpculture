import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setDashboardStats, setLoading } from '../../store/slices/adminSlice';
import { adminService } from '../../services/api';
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

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { dashboardStats } = useSelector((state: RootState) => state.admin);
  const { user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 1 || Number(user?.role) === 1;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await adminService.getDashboardStats();
      dispatch(setDashboardStats(response.data.stats));
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
      'Address': 'Profile',
      'PanCard': 'Profile',
      'Deactivate': 'Profile',
      'ActivityLogForm': 'Employees',
      'LeaveForm': 'Employees',
      'ActivityLogReport': 'Reports',
      'LeaveReport': 'Reports',
    };
    
    const parentStack = nestedScreens[screen];
    if (parentStack) {
      // Navigate to parent stack first, then to nested screen
      (navigation as any).navigate(parentStack, {
        screen: screen,
      });
    } else {
      // Navigate directly
      (navigation as any).navigate(screen);
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
      title: 'All Products',
      icon: 'inventory',
      screen: 'Products',
      permissionKey: 'salesAllProducts',
      color: '#4CAF50',
    },
    {
      id: 'category',
      title: 'All Category',
      icon: 'category',
      screen: 'CategoryManagement',
      permissionKey: 'salesAllCategory',
      color: '#9C27B0',
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
      title: 'Commission',
      icon: 'account-balance-wallet',
      screen: 'Commission',
      permissionKey: 'salesCommission',
      color: '#2196F3',
    },
  ];

  // Service Section
  const serviceItems: MenuItem[] = [
    {
      id: 'serviceEnquiries',
      title: 'Service Enquiries',
      icon: 'inbox',
      screen: 'ServiceEnquiries',
      permissionKey: 'serviceEnquiries',
      color: '#E91E63',
    },
    {
      id: 'serviceProducts',
      title: 'All Products',
      icon: 'build',
      screen: 'ServiceProductList',
      permissionKey: 'serviceProductList',
      color: '#00BCD4',
    },
    {
      id: 'serviceInvoice',
      title: 'Invoice',
      icon: 'description',
      screen: 'ServiceInvoiceList',
      permissionKey: 'serviceInvoice',
      color: '#3F51B5',
    },
    {
      id: 'serviceQuotation',
      title: 'Quotation',
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
      title: 'Rental Enquiries',
      icon: 'home-work',
      screen: 'RentalEnquiries',
      permissionKey: 'rentalEnquiries',
      color: '#8BC34A',
    },
    {
      id: 'rentalProducts',
      title: 'All Products',
      icon: 'inventory-2',
      screen: 'RentalProductList',
      permissionKey: 'rentalAllProducts',
      color: '#CDDC39',
    },
    {
      id: 'rentalInvoice',
      title: 'Invoice',
      icon: 'receipt-long',
      screen: 'RentalInvoiceList',
      permissionKey: 'rentalInvoice',
      color: '#FFC107',
    },
    {
      id: 'rentalQuotation',
      title: 'Quotation',
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
      title: 'Vendors',
      icon: 'store',
      screen: 'VendorList',
      permissionKey: 'vendorList',
      color: '#673AB7',
    },
    {
      id: 'vendorProducts',
      title: 'Products',
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
      title: 'Company Details',
      icon: 'business',
      screen: 'CompanyReports',
      permissionKey: 'reportsCompanyReport',
      color: '#2196F3',
    },
    {
      id: 'serviceReport',
      title: 'Service Details',
      icon: 'assessment',
      screen: 'ServiceReportsSummary',
      permissionKey: 'reportsService',
      color: '#00BCD4',
    },
    {
      id: 'rentalReport',
      title: 'Rental Details',
      icon: 'home',
      screen: 'RentalReportsSummary',
      permissionKey: 'reportsRental',
      color: '#4CAF50',
    },
    {
      id: 'salesReport',
      title: 'Sales Details',
      icon: 'trending-up',
      screen: 'SalesReportsSummary',
      permissionKey: 'reportsSales',
      color: '#FF9800',
    },
    {
      id: 'employeeReport',
      title: 'Employee',
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
    {
      id: 'activityLogForm',
      title: 'Activity Log',
      icon: 'list-alt',
      screen: 'ActivityLogForm',
      permissionKey: 'accountSettings',
      color: '#5C6BC0',
    },
    {
      id: 'leaveForm',
      title: 'Leave Application',
      icon: 'event-busy',
      screen: 'LeaveForm',
      permissionKey: 'accountSettings',
      color: '#26A69A',
    },
    {
      id: 'reportsDashboard',
      title: 'Reports Dashboard',
      icon: 'dashboard',
      screen: 'ReportsDashboard',
      permissionKey: 'reports',
      color: '#795548',
    },
    {
      id: 'rentalInvoiceReport',
      title: 'Rental Invoice Report',
      icon: 'description',
      screen: 'RentalInvoiceReport',
      permissionKey: 'reportsRental',
      color: '#FF5722',
    },
    {
      id: 'serviceEnquiriesReport',
      title: 'Service Enquiries Report',
      icon: 'inbox',
      screen: 'ServiceEnquiriesReport',
      permissionKey: 'reportsService',
      color: '#E91E63',
    },
    {
      id: 'serviceInvoicesReport',
      title: 'Service Invoices Report',
      icon: 'receipt',
      screen: 'ServiceInvoicesReport',
      permissionKey: 'reportsService',
      color: '#3F51B5',
    },
    {
      id: 'serviceReportsReport',
      title: 'Service Reports Report',
      icon: 'assessment',
      screen: 'ServiceReportsReport',
      permissionKey: 'reportsService',
      color: '#009688',
    },
    {
      id: 'activityLogReport',
      title: 'Activity Log Report',
      icon: 'assessment',
      screen: 'ActivityLogReport',
      permissionKey: 'reports',
      color: '#5C6BC0',
    },
    {
      id: 'leaveReport',
      title: 'Leave Report',
      icon: 'event-note',
      screen: 'LeaveReport',
      permissionKey: 'reports',
      color: '#26A69A',
    },
  ];

  // Other Settings Section
  const otherSettingsItems: MenuItem[] = [
    {
      id: 'companyList',
      title: 'All Company',
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

  const renderSection = (title: string, items: MenuItem[], icon: string) => {
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
      {/* <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
      </View> */}

      {/* Stats Section */}
      {/* {dashboardStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="build" size={32} color="#019ee3" />
            <Text style={styles.statValue}>{dashboardStats.totalServices || 0}</Text>
            <Text style={styles.statLabel}>Total Services</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="receipt" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>{dashboardStats.totalInvoices || 0}</Text>
            <Text style={styles.statLabel}>Total Invoices</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="account-balance-wallet" size={32} color="#FF9800" />
            <Text style={styles.statValue}>₹{dashboardStats.totalRevenue || 0}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="pending" size={32} color="#F44336" />
            <Text style={styles.statValue}>{dashboardStats.pendingApprovals || 0}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
        </View>
      )} */}

      {/* Account Settings */}
      {renderSection('Account Settings', accountSettingsItems, 'person')}

      {/* Sales Section */}
      {renderSection('Sales', salesItems, 'shopping-bag')}

      {/* Service Section */}
      {renderSection('Service', serviceItems, 'build')}

      {/* Rental Section */}
      {renderSection('Rental', rentalItems, 'home-work')}

      {/* Vendor Section */}
      {renderSection('Vendors', vendorItems, 'store')}

      {/* Reports Section */}
      {renderSection('Reports', reportsItems, 'assessment')}

      {/* Other Settings */}
      {renderSection('Other Settings', otherSettingsItems, 'settings')}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#019ee3" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

export default AdminDashboardScreen;
