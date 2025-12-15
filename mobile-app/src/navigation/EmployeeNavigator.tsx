import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import CustomDrawerContent from '../components/CustomDrawerContent';
import 'react-native-reanimated';

// Screens
import EmployeeDashboardScreen from '../screens/Employee/DashboardScreen';
import ProfileScreen from '../screens/Common/ProfileScreen';
import AddressScreen from '../screens/Common/AddressScreen';
import PanCardScreen from '../screens/Common/PanCardScreen';
import DeactivateScreen from '../screens/Common/DeactivateScreen';

// Product Management
import ProductManagementScreen from '../screens/Admin/ProductManagementScreen';
import ProductCreateScreen from '../screens/Admin/ProductCreateScreen';

// Order Management
import OrderManagementScreen from '../screens/Admin/OrderManagementScreen';
import OrderUpdateScreen from '../screens/Admin/OrderUpdateScreen';

// Service Management
import ServiceMonitoringScreen from '../screens/Admin/ServiceMonitoringScreen';
import ServiceEnquiriesScreen from '../screens/Admin/ServiceEnquiriesScreen';
import ServiceProductListScreen from '../screens/Admin/ServiceProductListScreen';
import AddServiceProductScreen from '../screens/Admin/AddServiceProductScreen';
import ServiceInvoiceListScreen from '../screens/Admin/ServiceInvoiceListScreen';
import AddServiceInvoiceScreen from '../screens/Admin/AddServiceInvoiceScreen';
import ServiceQuotationListScreen from '../screens/Admin/ServiceQuotationListScreen';
import ServiceReportsScreen from '../screens/Admin/ServiceReportsScreen';
import AddServiceReportScreen from '../screens/Admin/AddServiceReportScreen';

// Rental Reports
import RentalReportsScreen from '../screens/Admin/RentalReportsScreen';
import AddRentalReportScreen from '../screens/Admin/AddRentalReportScreen';

// Rental Management
import RentalManagementScreen from '../screens/Admin/RentalManagementScreen';
import RentalProductListScreen from '../screens/Admin/RentalProductListScreen';
import AddRentalProductScreen from '../screens/Admin/AddRentalProductScreen';
import RentalInvoiceListScreen from '../screens/Rental/RentalInvoiceListScreen';
import AddRentalInvoiceScreen from '../screens/Admin/AddRentalInvoiceScreen';
import RentalEnquiriesScreen from '../screens/Admin/RentalEnquiriesScreen';
import RentalQuotationListScreen from '../screens/Rental/RentalQuotationListScreen';

// Vendor Management
import VendorListScreen from '../screens/Admin/VendorListScreen';
import VendorCreateScreen from '../screens/Admin/VendorCreateScreen';
import VendorProductListScreen from '../screens/Admin/VendorProductListScreen';
import AddVendorProductScreen from '../screens/Admin/AddVendorProductScreen';

// Purchase Management
import PurchaseListScreen from '../screens/Admin/PurchaseListScreen';
import PurchaseRegisterScreen from '../screens/Admin/PurchaseRegisterScreen';

// Settings
import SettingsScreen from '../screens/Admin/SettingsScreen';
import CategoryManagementScreen from '../screens/Admin/CategoryManagementScreen';
import UserManagementScreen from '../screens/Admin/UserManagementScreen';
import GSTManagementScreen from '../screens/Admin/GSTManagementScreen';
import CompanyListScreen from '../screens/Admin/CompanyListScreen';
import AddCompanyScreen from '../screens/Admin/AddCompanyScreen';
import OldInvoicesListScreen from '../screens/Admin/OldInvoicesListScreen';
import MenuSettingScreen from '../screens/Admin/MenuSettingScreen';

// Commission
import CommissionScreen from '../screens/Admin/CommissionScreen';

// Reports
import ReportsDashboardScreen from '../screens/Admin/Reports/ReportsDashboardScreen';
import CompanyReportsScreen from '../screens/Admin/Reports/CompanyReportsScreen';
import ServiceReportsSummaryScreen from '../screens/Admin/Reports/ServiceReportsSummaryScreen';
import RentalReportsSummaryScreen from '../screens/Admin/Reports/RentalReportsSummaryScreen';
import SalesReportsSummaryScreen from '../screens/Admin/Reports/SalesReportsSummaryScreen';
import RentalInvoiceReportScreen from '../screens/Admin/Reports/RentalInvoiceReportScreen';
import ServiceEnquiriesReportScreen from '../screens/Admin/Reports/ServiceEnquiriesReportScreen';
import ServiceInvoicesReportScreen from '../screens/Admin/Reports/ServiceInvoicesReportScreen';
import ServiceReportsReportScreen from '../screens/Admin/Reports/ServiceReportsReportScreen';
import EmployeeListScreen from '../screens/Admin/EmployeeListScreen';

import { View, Text, StyleSheet } from 'react-native';


const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>{title}</Text>
    <Text style={styles.placeholderSubtext}>Coming Soon</Text>
  </View>
);

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
  },
});

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Product Stack
const ProductStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#333',
      headerLeftContainerStyle: {
        paddingLeft: 10,
      },
    }}
  >
    <Stack.Screen name="ProductList" component={ProductManagementScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ProductCreate" component={ProductCreateScreen} options={{ title: 'Create/Edit Product' }} />
  </Stack.Navigator>
);

// Order Stack
const OrderStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#333',
      headerLeftContainerStyle: {
        paddingLeft: 10,
      },
    }}
  >
    <Stack.Screen name="OrderList" component={OrderManagementScreen} options={{ headerShown: false }} />
    <Stack.Screen name="OrderUpdate" component={OrderUpdateScreen} options={{ title: 'Update Order' }} />
  </Stack.Navigator>
);

// Service Stack
const ServiceStack = () => (
  <Stack.Navigator
    initialRouteName="ServiceMain"
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#333',
      headerLeftContainerStyle: {
        paddingLeft: 10,
      },
    }}
  >
    <Stack.Screen name="ServiceMain" component={ServiceMonitoringScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ServiceEnquiries" component={ServiceEnquiriesScreen} options={{ title: 'Service Enquiries', headerShown: true }} />
    <Stack.Screen name="ServiceProductList" component={ServiceProductListScreen} options={{ title: 'Service Products', headerShown: true }} />
    <Stack.Screen name="AddServiceProduct" component={AddServiceProductScreen} options={{ title: 'Add/Edit Product', headerShown: true }} />
    <Stack.Screen name="ServiceInvoiceList" component={ServiceInvoiceListScreen} options={{ title: 'Service Invoices', headerShown: true }} />
    <Stack.Screen name="AddServiceInvoice" component={AddServiceInvoiceScreen} options={{ title: 'Add/Edit Invoice', headerShown: true }} />
    <Stack.Screen name="ServiceQuotationList" component={ServiceQuotationListScreen} options={{ title: 'Service Quotations', headerShown: true }} />
    <Stack.Screen name="AddServiceQuotation" component={AddServiceInvoiceScreen} options={{ title: 'Add/Edit Quotation', headerShown: true }} />
    <Stack.Screen name="ServiceReports" component={ServiceReportsScreen} options={{ title: 'Service Reports', headerShown: true }} />
    <Stack.Screen name="AddServiceReport" component={AddServiceReportScreen} options={{ title: 'Add Service Report', headerShown: true }} />
    <Stack.Screen name="ServicePartners" component={() => <PlaceholderScreen title="Service Partners" />} options={{ title: 'Service Partners', headerShown: true }} />
  </Stack.Navigator>
);

// Rental Stack
const RentalStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#333',
      headerLeftContainerStyle: {
        paddingLeft: 10,
      },
    }}
  >
    <Stack.Screen name="RentalMain" component={RentalManagementScreen} options={{ headerShown: false }} />
    <Stack.Screen name="RentalProductList" component={RentalProductListScreen} options={{ title: 'Rental Products' }} />
    <Stack.Screen name="AddRentalProduct" component={AddRentalProductScreen} options={{ title: 'Add/Edit Rental Product' }} />
    <Stack.Screen name="RentalInvoiceList" component={RentalInvoiceListScreen} options={{ title: 'Rental Invoices' }} />
    <Stack.Screen name="AddRentalInvoice" component={AddRentalInvoiceScreen} options={{ title: 'Add/Edit Rental Invoice' }} />
    <Stack.Screen name="RentalEnquiries" component={RentalEnquiriesScreen} options={{ title: 'Rental Enquiries' }} />
    <Stack.Screen name="RentalQuotationList" component={RentalQuotationListScreen} options={{ title: 'Rental Quotations' }} />
    <Stack.Screen name="RentalReports" component={RentalReportsScreen} options={{ title: 'Rental Reports' }} />
    <Stack.Screen name="AddRentalReport" component={AddRentalReportScreen} options={{ title: 'Add/Edit Rental Report' }} />
    <Stack.Screen name="RentalPartners" component={() => <PlaceholderScreen title="Rental Partners" />} options={{ title: 'Rental Partners' }} />
  </Stack.Navigator>
);

// Vendor Stack
const VendorStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#333',
      headerLeftContainerStyle: {
        paddingLeft: 10,
      },
    }}
  >
    <Stack.Screen name="VendorList" component={VendorListScreen} options={{ headerShown: false }} />
    <Stack.Screen name="VendorCreate" component={VendorCreateScreen} options={{ title: 'Create/Edit Vendor' }} />
    <Stack.Screen name="VendorProductList" component={VendorProductListScreen} options={{ title: 'Vendor Products' }} />
    <Stack.Screen name="AddVendorProduct" component={AddVendorProductScreen} options={{ title: 'Create/Edit Vendor Product' }} />
  </Stack.Navigator>
);

// Purchase Stack
const PurchaseStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#333',
      headerLeftContainerStyle: {
        paddingLeft: 10,
      },
    }}
  >
    <Stack.Screen name="PurchaseList" component={PurchaseListScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PurchaseRegister" component={PurchaseRegisterScreen} options={{ title: 'Register Purchase' }} />
  </Stack.Navigator>
);

// Settings Stack
const SettingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#333',
      headerLeftContainerStyle: {
        paddingLeft: 10,
      },
    }}
  >
    <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} options={{ title: 'Categories' }} />
    <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Users' }} />
    <Stack.Screen name="GSTManagement" component={GSTManagementScreen} options={{ title: 'GST Management' }} />
    <Stack.Screen name="CompanyList" component={CompanyListScreen} options={{ title: 'Companies' }} />
    <Stack.Screen name="AddCompany" component={AddCompanyScreen} options={{ title: 'Add/Edit Company' }} />
    <Stack.Screen name="OldInvoicesList" component={OldInvoicesListScreen} options={{ title: 'Old Invoices' }} />
    <Stack.Screen name="MenuSettings" component={MenuSettingScreen} options={{ title: 'Menu Settings' }} />
    <Stack.Screen name="CreditSettings" component={() => <PlaceholderScreen title="Credit Settings" />} options={{ title: 'Credit Settings' }} />
    <Stack.Screen name="GiftSettings" component={() => <PlaceholderScreen title="Gift Settings" />} options={{ title: 'Gift Settings' }} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#333',
      headerLeftContainerStyle: {
        paddingLeft: 10,
      },
    }}
  >
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Address" component={AddressScreen} options={{ title: 'Address' }} />
    <Stack.Screen name="PanCard" component={PanCardScreen} options={{ title: 'PAN Card' }} />
    <Stack.Screen name="Deactivate" component={DeactivateScreen} options={{ title: 'Deactivate Account' }} />
  </Stack.Navigator>
);

// Reports Stack
const ReportsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#333',
      headerLeftContainerStyle: {
        paddingLeft: 10,
      },
    }}
  >
    <Stack.Screen name="ReportsDashboard" component={ReportsDashboardScreen} options={{ title: 'Reports Dashboard' }} />
    <Stack.Screen name="CompanyReports" component={CompanyReportsScreen} options={{ title: 'Company Reports' }} />
    <Stack.Screen name="ServiceReportsSummary" component={ServiceReportsSummaryScreen} options={{ title: 'Service Reports Summary' }} />
    <Stack.Screen name="RentalReportsSummary" component={RentalReportsSummaryScreen} options={{ title: 'Rental Reports Summary' }} />
    <Stack.Screen name="SalesReportsSummary" component={SalesReportsSummaryScreen} options={{ title: 'Sales Reports Summary' }} />
    <Stack.Screen name="RentalInvoiceReport" component={RentalInvoiceReportScreen} options={{ title: 'Rental Invoice Report' }} />
    <Stack.Screen name="ServiceEnquiriesReport" component={ServiceEnquiriesReportScreen} options={{ title: 'Service Enquiries Report' }} />
    <Stack.Screen name="ServiceInvoicesReport" component={ServiceInvoicesReportScreen} options={{ title: 'Service Invoices Report' }} />
    <Stack.Screen name="ServiceReportsReport" component={ServiceReportsReportScreen} options={{ title: 'Service Reports Report' }} />
    <Stack.Screen name="EmployeeList" component={EmployeeListScreen} options={{ title: 'Employees' }} />
  </Stack.Navigator>
);

const EmployeeNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
        drawerActiveTintColor: '#007AFF',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#333',
        headerLeftContainerStyle: {
          paddingLeft: 10,
        },
        drawerIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Products') {
            iconName = 'inventory';
          } else if (route.name === 'Orders') {
            iconName = 'shopping-cart';
          } else if (route.name === 'Services') {
            iconName = 'build';
          } else if (route.name === 'Rentals') {
            iconName = 'receipt-long';
          } else if (route.name === 'Commission') {
            iconName = 'account-balance-wallet';
          } else if (route.name === 'VendorList') {
            iconName = 'store';
          } else if (route.name === 'PurchaseList') {
            iconName = 'list-alt';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'Reports') {
            iconName = 'assessment';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Drawer.Screen name="Dashboard" component={EmployeeDashboardScreen} />
      <Drawer.Screen name="Products" component={ProductStack} />
      <Drawer.Screen name="Orders" component={OrderStack} />
      <Drawer.Screen name="Services" component={ServiceStack} />
      <Drawer.Screen name="Rentals" component={RentalStack} />
      <Drawer.Screen name="Commission" component={CommissionScreen} />
      <Drawer.Screen name="VendorList" component={VendorStack} />
      <Drawer.Screen name="PurchaseList" component={PurchaseStack} />
      <Drawer.Screen name="Settings" component={SettingsStack} />
      <Drawer.Screen name="Profile" component={ProfileStack} />
      <Drawer.Screen name="Reports" component={ReportsStack} />
    </Drawer.Navigator>
  );
};

export default EmployeeNavigator;

