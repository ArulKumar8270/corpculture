import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import EmployeeDashboardScreen from '../screens/Employee/DashboardScreen';
import ServiceListScreen from '../screens/Service/ServiceListScreen';
import ServiceDetailScreen from '../screens/Service/ServiceDetailScreen';
import CreateServiceScreen from '../screens/Service/CreateServiceScreen';
import RentalInvoiceListScreen from '../screens/Rental/RentalInvoiceListScreen';
import RentalInvoiceFormScreen from '../screens/Rental/RentalInvoiceFormScreen';
import RentalInvoiceDetailScreen from '../screens/Rental/RentalInvoiceDetailScreen';
import ProfileScreen from '../screens/Common/ProfileScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const ServiceStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ServiceList"
      component={ServiceListScreen}
      options={{ title: 'Service Requests' }}
    />
    <Stack.Screen
      name="ServiceDetail"
      component={ServiceDetailScreen}
      options={{ title: 'Service Details' }}
    />
    <Stack.Screen
      name="CreateService"
      component={CreateServiceScreen}
      options={{ title: 'Create Service' }}
    />
  </Stack.Navigator>
);

const RentalStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="RentalInvoiceList"
      component={RentalInvoiceListScreen}
      options={{ title: 'Rental Invoices' }}
    />
    <Stack.Screen
      name="RentalInvoiceForm"
      component={RentalInvoiceFormScreen}
      options={{ title: 'Create Invoice' }}
    />
    <Stack.Screen
      name="RentalInvoiceDetail"
      component={RentalInvoiceDetailScreen}
      options={{ title: 'Invoice Details' }}
    />
  </Stack.Navigator>
);

const EmployeeNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={({ route }) => ({
        drawerIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Services') {
            iconName = 'build';
          } else if (route.name === 'Rentals') {
            iconName = 'receipt-long';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        drawerActiveTintColor: '#007AFF',
      })}
    >
      <Drawer.Screen name="Dashboard" component={EmployeeDashboardScreen} />
      <Drawer.Screen name="Services" component={ServiceStack} />
      <Drawer.Screen name="Rentals" component={RentalStack} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

export default EmployeeNavigator;

