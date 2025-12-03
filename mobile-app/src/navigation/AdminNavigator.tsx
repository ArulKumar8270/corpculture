import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import AdminDashboardScreen from '../screens/Admin/DashboardScreen';
import ProductManagementScreen from '../screens/Admin/ProductManagementScreen';
import OrderManagementScreen from '../screens/Admin/OrderManagementScreen';
import ServiceMonitoringScreen from '../screens/Admin/ServiceMonitoringScreen';
import RentalManagementScreen from '../screens/Admin/RentalManagementScreen';
import EmployeeListScreen from '../screens/Admin/EmployeeListScreen';
import CommissionScreen from '../screens/Admin/CommissionScreen';
import ProfileScreen from '../screens/Common/ProfileScreen';

const Drawer = createDrawerNavigator();

const AdminNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={({ route }) => ({
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
          } else if (route.name === 'Employees') {
            iconName = 'people';
          } else if (route.name === 'Commission') {
            iconName = 'attach-money';
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
      <Drawer.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Drawer.Screen name="Products" component={ProductManagementScreen} />
      <Drawer.Screen name="Orders" component={OrderManagementScreen} />
      <Drawer.Screen name="Services" component={ServiceMonitoringScreen} />
      <Drawer.Screen name="Rentals" component={RentalManagementScreen} />
      <Drawer.Screen name="Employees" component={EmployeeListScreen} />
      <Drawer.Screen name="Commission" component={CommissionScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;

