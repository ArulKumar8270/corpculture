import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { usePermissions } from '../hooks/usePermissions';
import { clearAuth } from '../store/slices/authSlice';
import { clearPermissions } from '../store/slices/permissionsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  screen?: string;
  permissionKey: string;
  children?: MenuItem[];
}

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  menuItems?: MenuItem[];
}

const CustomDrawerContent = (props: CustomDrawerContentProps) => {
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const dispatch = useDispatch();
  
  // Debug: Log token status
  useEffect(() => {
    if (__DEV__) {
      console.log('CustomDrawerContent - Auth state:', {
        user: user ? 'User exists' : 'User missing',
        token: token ? 'Token exists' : 'Token missing',
        tokenLength: token?.length,
        isAuthenticated,
      });
    }
  }, [user, token, isAuthenticated]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    account: false,
    dashboard: false,
    sales: false,
    service: false,
    rental: false,
    vendor: false,
    reports: false,
    otherSettings: true,
  });

  // Helper to check if user is admin (handle both number and string)
  const isAdmin = user?.role === 1 || Number(user?.role) === 1;

  // Expand dashboard and all nested sections by default for admins
  useEffect(() => {
    if (isAdmin) {
      setExpandedSections(prev => ({
        ...prev,
        dashboard: true,
        sales: true,
        service: true,
        rental: true,
        vendor: true,
        reports: true,
        account: true,
        otherSettings: true,
      }));
    }
  }, [isAdmin]);

  const getRoleName = (role: number) => {
    switch (role) {
      case 0: return 'Customer';
      case 1: return 'Admin';
      case 3: return 'Employee';
      default: return 'User';
    }
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const navigateToScreen = (screen: string) => {
    // In drawer content, props.navigation is the drawer navigator
    // Screens are registered as Drawer.Screen entries, so we can navigate directly
    const navigation = props.navigation as any;
    
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
    };
    
    try {
      // Check if this is a nested screen
      const parentStack = nestedScreens[screen];
      if (parentStack) {
        // Navigate to parent stack first, then to nested screen
        navigation.navigate(parentStack, {
          screen: screen,
        });
      } else {
        // Navigate directly to drawer screen
        navigation.navigate(screen);
      }
      props.navigation.closeDrawer();
    } catch (error: any) {
      console.error('Navigation error for screen:', screen, error);
      
      // Log available screens for debugging
      try {
        const state = navigation.getState();
        const availableScreens = state?.routes?.map((r: any) => r.name) || [];
        console.log('Available drawer screens:', availableScreens);
        console.log('Trying to navigate to:', screen);
      } catch (stateError) {
        console.error('Could not get navigation state:', stateError);
      }
      
      // Try using CommonActions as fallback
      try {
        const parentStack = nestedScreens[screen];
        if (parentStack) {
          navigation.dispatch(
            CommonActions.navigate({
              name: parentStack,
              params: {
                screen: screen,
              },
            })
          );
        } else {
          navigation.dispatch(
            CommonActions.navigate({
              name: screen,
            })
          );
        }
        props.navigation.closeDrawer();
      } catch (dispatchError) {
        console.error('CommonActions also failed:', dispatchError);
        // Close drawer anyway
        props.navigation.closeDrawer();
      }
    }
  };

  // Account Settings Section
  const renderAccountSettings = () => {
    // Always show for admins, otherwise check permission
    if (!isAdmin && !hasPermission('accountSettings', 'view')) {
      return null;
    }

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('account')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="person" size={20} color="#019ee3" />
            <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          </View>
          <MaterialIcons
            name={expandedSections.account ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        {expandedSections.account && (
          <View style={styles.subMenu}>
            {(isAdmin || hasPermission('accountSettings', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('Profile')}
              >
                <Text style={styles.menuItemText}>Profile Information</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Sales Section (nested under Dashboard)
  const renderSalesSection = () => {
    // Always show for admins, otherwise check permission
    if (!isAdmin && !hasPermission('sales', 'view')) return null;

    return (
      <View style={styles.nestedSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('sales')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="shopping-bag" size={20} color="#019ee3" />
            <Text style={styles.sectionTitle}>Sales</Text>
          </View>
          <MaterialIcons
            name={expandedSections.sales ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        {expandedSections.sales && (
          <View style={styles.subMenu}>
            {(isAdmin || hasPermission('salesAllProducts', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('Products')}
              >
                <Text style={styles.menuItemText}>Products</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('salesOrders', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('Orders')}
              >
                <Text style={styles.menuItemText}>Orders</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('salesCommission', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('Commission')}
              >
                <Text style={styles.menuItemText}>Partners</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('sales', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('OldInvoices')}
              >
                <Text style={styles.menuItemText}>Old Invoices</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Service Section (nested under Dashboard)
  const renderServiceSection = () => {
    // Always show for admins, otherwise check permission
    if (!isAdmin && !hasPermission('service', 'view')) return null;

    return (
      <View style={styles.nestedSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('service')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="build" size={20} color="#019ee3" />
            <Text style={styles.sectionTitle}>Service</Text>
          </View>
          <MaterialIcons
            name={expandedSections.service ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        {expandedSections.service && (
          <View style={styles.subMenu}>
            {(isAdmin || hasPermission('serviceEnquiries', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('ServiceEnquiries')}
              >
                <Text style={styles.menuItemText}>Enquiries</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('serviceProductList', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('ServiceProductList')}
              >
                <Text style={styles.menuItemText}>Products</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('serviceInvoice', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('ServiceInvoiceList')}
              >
                <Text style={styles.menuItemText}>Invoices</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('serviceQuotation', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('ServiceQuotationList')}
              >
                <Text style={styles.menuItemText}>Quotations</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('serviceReport', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('ServiceReports')}
              >
                <Text style={styles.menuItemText}>Reports</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('servicePartner', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('ServicePartners')}
              >
                <Text style={styles.menuItemText}>Partners</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Rental Section (nested under Dashboard)
  const renderRentalSection = () => {
    // Always show for admins, otherwise check permission
    if (!isAdmin && !hasPermission('rental', 'view')) return null;

    return (
      <View style={styles.nestedSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('rental')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="home-work" size={20} color="#019ee3" />
            <Text style={styles.sectionTitle}>Rental</Text>
          </View>
          <MaterialIcons
            name={expandedSections.rental ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        {expandedSections.rental && (
          <View style={styles.subMenu}>
            {(isAdmin || hasPermission('rentalEnquiries', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('RentalEnquiries')}
              >
                <Text style={styles.menuItemText}>Enquiries</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('rentalAllProducts', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('RentalProductList')}
              >
                <Text style={styles.menuItemText}>Products</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('rentalInvoice', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('RentalInvoiceList')}
              >
                <Text style={styles.menuItemText}>Invoices</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('rentalQuotation', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('RentalQuotationList')}
              >
                <Text style={styles.menuItemText}>Quotations</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('rentalReport', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('RentalReports')}
              >
                <Text style={styles.menuItemText}>Reports</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('rentalPartners', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('RentalPartners')}
              >
                <Text style={styles.menuItemText}>Partners</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Vendor Section (nested under Dashboard)
  const renderVendorSection = () => {
    // Always show for admins, otherwise check permission
    if (!isAdmin && !hasPermission('vendor', 'view')) return null;

    return (
      <View style={styles.nestedSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('vendor')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="store" size={20} color="#019ee3" />
            <Text style={styles.sectionTitle}>Vendors</Text>
          </View>
          <MaterialIcons
            name={expandedSections.vendor ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        {expandedSections.vendor && (
          <View style={styles.subMenu}>
            {(isAdmin || hasPermission('vendorList', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('VendorList')}
              >
                <Text style={styles.menuItemText}>Vendors List</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('vendorProducts', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('VendorProductList')}
              >
                <Text style={styles.menuItemText}>Vendor Products</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('vendorPurchaseList', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('PurchaseList')}
              >
                <Text style={styles.menuItemText}>Material List</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Reports Section (nested under Dashboard)
  const renderReportsSection = () => {
    // Always show for admins, otherwise check permission
    if (!isAdmin && !hasPermission('reports', 'view')) return null;

    return (
      <View style={styles.nestedSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('reports')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="assessment" size={20} color="#019ee3" />
            <Text style={styles.sectionTitle}>Reports</Text>
          </View>
          <MaterialIcons
            name={expandedSections.reports ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        {expandedSections.reports && (
          <View style={styles.subMenu}>
            {(isAdmin || hasPermission('reportsCompanyReport', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('CompanyReports')}
              >
                <Text style={styles.menuItemText}>Over all Company Details</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('reportsService', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('ServiceReportsSummary')}
              >
                <Text style={styles.menuItemText}>Service Over all Details</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('reportsRental', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('RentalReportsSummary')}
              >
                <Text style={styles.menuItemText}>Rental Over all Details</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('reportsEmployeeList', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('EmployeeList')}
              >
                <Text style={styles.menuItemText}>Employees</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('reportsUserList', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('UserManagement')}
              >
                <Text style={styles.menuItemText}>Users</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Admin Dashboard Section
  const renderAdminDashboard = () => {
    // Always show for admins, otherwise check permission
    if (!isAdmin && !hasPermission('adminDashboard', 'view')) return null;

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('dashboard')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="dashboard" size={20} color="#019ee3" />
            <Text style={styles.sectionTitle}>ADMIN DASHBOARD</Text>
          </View>
          <MaterialIcons
            name={expandedSections.dashboard ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        {expandedSections.dashboard && (
          <View style={styles.subMenu}>
            {renderSalesSection()}
            {renderServiceSection()}
            {renderRentalSection()}
            {renderVendorSection()}
            {renderReportsSection()}
          </View>
        )}
      </View>
    );
  };

  // Other Settings Section
  const renderOtherSettings = () => {
    // Always show for admins, otherwise check permission
    if (!isAdmin && !hasPermission('otherSettings', 'view')) return null;

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('otherSettings')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="settings" size={20} color="#019ee3" />
            <Text style={styles.sectionTitle}>OTHER SETTINGS</Text>
          </View>
          <MaterialIcons
            name={expandedSections.otherSettings ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        {expandedSections.otherSettings && (
          <View style={styles.subMenu}>
            {(isAdmin || hasPermission('otherSettingsAllCompany', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('CompanyList')}
              >
                <Text style={styles.menuItemText}>Company</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('otherSettingsGst', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('GSTManagement')}
              >
                <Text style={styles.menuItemText}>GST</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('otherSettingsMenuSetting', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('MenuSettings')}
              >
                <Text style={styles.menuItemText}>Menu setting</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('salesAllCategory', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('CategoryManagement')}
              >
                <Text style={styles.menuItemText}>Category</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('otherSettingsCredit', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('CreditSettings')}
              >
                <Text style={styles.menuItemText}>Credit</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || hasPermission('otherSettingsGift', 'view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateToScreen('GiftSettings')}
              >
                <Text style={styles.menuItemText}>Gift</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.role}>{getRoleName(user?.role || 0)}</Text>
      </View>

      {/* Menu Sections */}
      <DrawerContentScrollView {...props} style={styles.scrollView}>
        {renderAccountSettings()}
        {renderAdminDashboard()}
        {renderOtherSettings()}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('auth');
              dispatch(clearAuth());
              dispatch(clearPermissions());
              Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been logged out successfully',
              });
              props.navigation.navigate('Login' as never);
            } catch (error) {
              console.error('Logout error:', error);
            }
          }}
        >
          <MaterialIcons name="power-settings-new" size={20} color="#019ee3" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#019ee3',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  nestedSection: {
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
  },
  subMenu: {
    backgroundColor: '#fff',
  },
  menuItem: {
    padding: 12,
    paddingLeft: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 10,
  },
});

export default CustomDrawerContent;
