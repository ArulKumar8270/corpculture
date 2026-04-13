import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import CustomDrawerContent from '../components/CustomDrawerContent';
import 'react-native-reanimated';

// Main Screens
import AdminDashboardScreen from '../screens/Admin/DashboardScreen';
import ProductManagementScreen from '../screens/Admin/ProductManagementScreen';
import OrderManagementScreen from '../screens/Admin/OrderManagementScreen';
import ServiceMonitoringScreen from '../screens/Admin/ServiceMonitoringScreen';
import RentalManagementScreen from '../screens/Admin/RentalManagementScreen';
import EmployeeListScreen from '../screens/Admin/EmployeeListScreen';
import CommissionScreen from '../screens/Admin/CommissionScreen';
import ProfileScreen from '../screens/Common/ProfileScreen';

// Product Management
import ProductCreateScreen from '../screens/Admin/ProductCreateScreen';

// Order Management
import OrderUpdateScreen from '../screens/Admin/OrderUpdateScreen';

// Service Management
import ServiceInvoiceListScreen from '../screens/Admin/ServiceInvoiceListScreen';
import ServiceQuotationListScreen from '../screens/Admin/ServiceQuotationListScreen';
import ServiceProductListScreen from '../screens/Admin/ServiceProductListScreen';
import ServiceEnquiriesScreen from '../screens/Admin/ServiceEnquiriesScreen';
import AddServiceProductScreen from '../screens/Admin/AddServiceProductScreen';
import AddServiceInvoiceScreen from '../screens/Admin/AddServiceInvoiceScreen';
import ServiceReportsScreen from '../screens/Admin/ServiceReportsScreen';

// Rental Management
import RentalProductListScreen from '../screens/Admin/RentalProductListScreen';
import RentalInvoiceListScreen from '../screens/Rental/RentalInvoiceListScreen';
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
import GlobalSettingsScreen from '../screens/Admin/GlobalSettingsScreen';
import CategoryManagementScreen from '../screens/Admin/CategoryManagementScreen';
import UserManagementScreen from '../screens/Admin/UserManagementScreen';
import GSTManagementScreen from '../screens/Admin/GSTManagementScreen';
import CompanyListScreen from '../screens/Admin/CompanyListScreen';
import OldInvoicesListScreen from '../screens/Admin/OldInvoicesListScreen';
import MenuSettingScreen from '../screens/Admin/MenuSettingScreen';
import AddCompanyScreen from '../screens/Admin/AddCompanyScreen';
import AdminPayslipListScreen from '../screens/Admin/AdminPayslipListScreen';
import AddPayslipScreen from '../screens/Admin/AddPayslipScreen';
import GiftSettingsScreen from '../screens/Admin/GiftSettingsScreen';
import AllOrdersAdminScreen from '../screens/Admin/AllOrdersAdminScreen';

// Profile & Common
import AddressScreen from '../screens/Common/AddressScreen';
import PanCardScreen from '../screens/Common/PanCardScreen';
import DeactivateScreen from '../screens/Common/DeactivateScreen';
import PayslipListScreen from '../screens/Common/PayslipListScreen';
import PayslipViewScreen from '../screens/Common/PayslipViewScreen';
import EmployeeActivityLogListScreen from '../screens/Common/EmployeeActivityLogListScreen';

// Employee Management
import AddEmployeeScreen from '../screens/Admin/AddEmployeeScreen';
import EmployeeDetailsScreen from '../screens/Admin/EmployeeDetailsScreen';

// Rental Management
import AddRentalProductScreen from '../screens/Admin/AddRentalProductScreen';
import AddRentalInvoiceScreen from '../screens/Admin/AddRentalInvoiceScreen';
import RentalEnquiriesScreen from '../screens/Admin/RentalEnquiriesScreen';

// Service Management
import AddServiceReportScreen from '../screens/Admin/AddServiceReportScreen';

// Rental Reports
import RentalReportsScreen from '../screens/Admin/RentalReportsScreen';
import AddRentalReportScreen from '../screens/Admin/AddRentalReportScreen';

// Reports
import CompanyReportsScreen from '../screens/Admin/Reports/CompanyReportsScreen';
import ServiceReportsSummaryScreen from '../screens/Admin/Reports/ServiceReportsSummaryScreen';
import RentalReportsSummaryScreen from '../screens/Admin/Reports/RentalReportsSummaryScreen';
import SalesReportsSummaryScreen from '../screens/Admin/Reports/SalesReportsSummaryScreen';
import ReportsDashboardScreen from '../screens/Admin/Reports/ReportsDashboardScreen';
import RentalInvoiceReportScreen from '../screens/Admin/Reports/RentalInvoiceReportScreen';
import ServiceEnquiriesReportScreen from '../screens/Admin/Reports/ServiceEnquiriesReportScreen';
import ServiceInvoicesReportScreen from '../screens/Admin/Reports/ServiceInvoicesReportScreen';
import ServiceReportsReportScreen from '../screens/Admin/Reports/ServiceReportsReportScreen';
import ActivityLogReportScreen from '../screens/Admin/Reports/ActivityLogReportScreen';
import LeaveReportScreen from '../screens/Admin/Reports/LeaveReportScreen';

// Employee HR
import EmployeeActivityLogFormScreen from '../screens/Admin/EmployeeActivityLogFormScreen';
import EmployeeLeaveFormScreen from '../screens/Admin/EmployeeLeaveFormScreen';

// Credit Management
import CreditManagementScreen from '../screens/Admin/CreditManagementScreen';

import { TouchableOpacity } from 'react-native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Product Stack
const ProductStack = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
  >
    <Stack.Screen name="ProductList" component={ProductManagementScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ProductCreate" component={ProductCreateScreen} options={{ title: 'Create/Edit Product' }} />
    <Stack.Screen name="ProductEdit" component={ProductCreateScreen} options={{ title: 'Edit Product' }} />
  </Stack.Navigator>
);

// Order Stack
const OrderStack = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
  >
    <Stack.Screen name="OrderList" component={OrderManagementScreen} options={{ headerShown: false }} />
    <Stack.Screen name="OrderUpdate" component={OrderUpdateScreen} options={{ title: 'Update Order' }} />
  </Stack.Navigator>
);

// Service Stack
const ServiceStack = () => (
  <Stack.Navigator
    initialRouteName="ServiceMain"
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
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
    <Stack.Screen name="ServicePartners" component={CommissionScreen} options={{ title: 'Partners (Service)', headerShown: true }} />
  </Stack.Navigator>
);

// Rental Stack
const RentalStack = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
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
    <Stack.Screen name="RentalPartners" component={CommissionScreen} options={{ title: 'Partners (Rental)' }} />
  </Stack.Navigator>
);

// Vendor Stack
const VendorStack = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
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
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
  >
    <Stack.Screen name="PurchaseList" component={PurchaseListScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PurchaseRegister" component={PurchaseRegisterScreen} options={{ title: 'Register Purchase' }} />
  </Stack.Navigator>
);

// Settings Stack
const SettingsStack = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
  >
    <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="GlobalSettings" component={GlobalSettingsScreen} options={{ title: 'Global Settings' }} />
    <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} options={{ title: 'Categories' }} />
    <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Users' }} />
    <Stack.Screen name="GSTManagement" component={GSTManagementScreen} options={{ title: 'GST Management' }} />
    <Stack.Screen name="CompanyList" component={CompanyListScreen} options={{ title: 'Companies' }} />
    <Stack.Screen name="AddCompany" component={AddCompanyScreen} options={{ title: 'Add/Edit Company' }} />
    <Stack.Screen name="OldInvoicesList" component={OldInvoicesListScreen} options={{ title: 'Old Invoices' }} />
    <Stack.Screen name="MenuSettings" component={MenuSettingScreen} options={{ title: 'Menu Settings' }} />
    <Stack.Screen name="CreditSettings" component={CreditManagementScreen} options={{ title: 'Credit Management' }} />
    <Stack.Screen name="GiftSettings" component={GiftSettingsScreen} options={{ title: 'Gift Settings' }} />
    <Stack.Screen
      name="AllOrdersAdmin"
      component={AllOrdersAdminScreen}
      options={{ title: 'All orders (admin)' }}
    />
    <Stack.Screen name="AdminPayslipList" component={AdminPayslipListScreen} options={{ title: 'Payslips (Admin)' }} />
    <Stack.Screen name="AddPayslip" component={AddPayslipScreen} options={{ title: 'Add Payslip' }} />
    <Stack.Screen name="AdminPayslipView" component={PayslipViewScreen} options={{ title: 'Payslip' }} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
  >
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Address" component={AddressScreen} options={{ title: 'Address' }} />
    <Stack.Screen name="PanCard" component={PanCardScreen} options={{ title: 'PAN Card' }} />
    <Stack.Screen name="Deactivate" component={DeactivateScreen} options={{ title: 'Deactivate Account' }} />
    <Stack.Screen name="Payslips" component={PayslipListScreen} options={{ title: 'My Payslips' }} />
    <Stack.Screen name="PayslipView" component={PayslipViewScreen} options={{ title: 'Payslip' }} />
    <Stack.Screen name="ActivityLogList" component={EmployeeActivityLogListScreen} options={{ title: 'My Petrol Forms' }} />
  </Stack.Navigator>
);

// Employee Stack
const EmployeeStack = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
  >
    <Stack.Screen name="EmployeeList" component={EmployeeListScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} options={{ title: 'Add/Edit Employee' }} />
    <Stack.Screen name="EmployeeDetails" component={EmployeeDetailsScreen} options={{ title: 'Employee Details' }} />
    <Stack.Screen name="ActivityLogForm" component={EmployeeActivityLogFormScreen} options={{ title: 'Petrol Form' }} />
    <Stack.Screen name="LeaveForm" component={EmployeeLeaveFormScreen} options={{ title: 'Leave Application' }} />
  </Stack.Navigator>
);

// Reports Stack
const ReportsStack = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
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
      ...stackBackToDashboardOptions({ navigation }),
    })}
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
    <Stack.Screen name="ActivityLogReport" component={ActivityLogReportScreen} options={{ title: 'Petrol Form Report' }} />
    <Stack.Screen name="LeaveReport" component={LeaveReportScreen} options={{ title: 'Leave Report' }} />
  </Stack.Navigator>
);

// Go to Dashboard on drawer (jumpTo switches without adding to history)
function goToDashboard(drawerNav: any) {
  if (!drawerNav) return;
  if (typeof (drawerNav as any).jumpTo === 'function') {
    (drawerNav as any).jumpTo('Dashboard');
  } else if (typeof drawerNav.navigate === 'function') {
    drawerNav.navigate('Dashboard');
  }
}

// Back from stack screens: get drawer by id then go to Dashboard
function BackToDashboardButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => goToDashboard(navigation.getParent?.('AdminDrawer') ?? navigation.getParent?.())}
      style={{ paddingLeft: 10, paddingRight: 10, paddingVertical: 8 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon name="arrow-back" size={24} color="#333" />
    </TouchableOpacity>
  );
}

// Back from drawer screens: current nav is the drawer
function DrawerBackToDashboardButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => goToDashboard(navigation)}
      style={{ paddingLeft: 10, paddingRight: 10, paddingVertical: 8 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon name="arrow-back" size={24} color="#333" />
    </TouchableOpacity>
  );
}

// Back to Dashboard for drawer screens (direct drawer items)
const backToDashboardScreenOptions = ({ route }: { navigation: any; route: any }) => ({
  headerLeft:
    route.name === 'Dashboard' ? undefined : () => <DrawerBackToDashboardButton />,
});

// For stacks nested in drawer: back goes to Dashboard
const stackBackToDashboardOptions = (_opts?: { navigation: any }) => ({
  headerLeft: () => <BackToDashboardButton />,
});

const AdminNavigator = () => {
  return (
    <Drawer.Navigator
      id="AdminDrawer"
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation, route }) => ({
        drawerType: 'slide',
        drawerStyle: {
          width: 280,
          backgroundColor: '#f5f5f5',
        },
        overlayColor: 'rgba(0, 0, 0, 0.5)',
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
        ...backToDashboardScreenOptions({ navigation, route }),
      })}
    >
      {/* Main Dashboard - Always accessible */}
      <Drawer.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen}
        options={{ headerShown: true }}
      />
      
      {/* Products */}
      <Drawer.Screen 
        name="Products" 
        component={ProductStack}
        options={{ headerShown: true }}
      />
      
      {/* Orders */}
      <Drawer.Screen 
        name="Orders" 
        component={OrderStack}
        options={{ headerShown: true }}
      />
      
      {/* Services */}
      <Drawer.Screen 
        name="Services" 
        component={ServiceStack}
        options={{ headerShown: true }}
      />
      
      {/* Rentals */}
      <Drawer.Screen 
        name="Rentals" 
        component={RentalStack}
        options={{ headerShown: true }}
      />
      
      {/* Employees */}
      <Drawer.Screen 
        name="Employees" 
        component={EmployeeStack}
        options={{ headerShown: true }}
      />
      
      {/* Commission */}
      <Drawer.Screen 
        name="Commission" 
        component={CommissionScreen}
        options={{ headerShown: true }}
      />
      
      {/* Vendors */}
      <Drawer.Screen 
        name="VendorList" 
        component={VendorStack}
        options={{ headerShown: true }}
      />
      
      {/* Purchases */}
      <Drawer.Screen 
        name="PurchaseList" 
        component={PurchaseStack}
        options={{ headerShown: true }}
      />
      
      {/* Settings */}
      <Drawer.Screen 
        name="Settings" 
        component={SettingsStack}
        options={{ headerShown: true }}
      />
      
      {/* Profile Stack */}
      <Drawer.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ headerShown: true }}
      />
      
      {/* Reports */}
      <Drawer.Screen 
        name="Reports" 
        component={ReportsStack}
        options={{ headerShown: true }}
      />
      
      {/* Old Invoices */}
      <Drawer.Screen 
        name="OldInvoices" 
        component={OldInvoicesListScreen}
        options={{ headerShown: true }}
      />
      
      {/* Service Sub-screens - Added as direct Drawer.Screen entries for reliable navigation */}
      <Drawer.Screen 
        name="ServiceEnquiries" 
        component={ServiceEnquiriesScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="ServiceProductList" 
        component={ServiceProductListScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="AddServiceProduct" 
        component={AddServiceProductScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="ServiceInvoiceList" 
        component={ServiceInvoiceListScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="AddServiceInvoice" 
        component={AddServiceInvoiceScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="ServiceQuotationList" 
        component={ServiceQuotationListScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="AddServiceQuotation" 
        component={AddServiceInvoiceScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="ServiceReports" 
        component={ServiceReportsScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="AddServiceReport" 
        component={AddServiceReportScreen}
        options={{ headerShown: true, title: 'Add Service Report' }}
      />
      <Drawer.Screen 
        name="ServicePartners" 
        component={CommissionScreen}
        options={{ headerShown: true }}
      />
      
      {/* Rental Sub-screens */}
      <Drawer.Screen 
        name="RentalEnquiries" 
        component={RentalEnquiriesScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="AddRentalProduct" 
        component={AddRentalProductScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="AddRentalInvoice" 
        component={AddRentalInvoiceScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="RentalProductList" 
        component={RentalProductListScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="RentalInvoiceList" 
        component={RentalInvoiceListScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="RentalQuotationList" 
        component={RentalQuotationListScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="RentalReports" 
        component={RentalReportsScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="RentalPartners" 
        component={CommissionScreen}
        options={{ headerShown: true }}
      />
      {/* Settings Sub-screens */}
      <Drawer.Screen 
        name="MenuSettings" 
        component={MenuSettingScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="AddCompany" 
        component={AddCompanyScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="CreditSettings" 
        component={CreditManagementScreen}
        options={{ headerShown: true }}
      />
      <Drawer.Screen 
        name="GiftSettings" 
        component={GiftSettingsScreen}
        options={{ headerShown: true, title: 'Gift Settings' }}
      />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;
