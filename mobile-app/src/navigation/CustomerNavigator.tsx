import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/Sales/HomeScreen';
import ProductsScreen from '../screens/Sales/ProductsScreen';
import ProductDetailScreen from '../screens/Sales/ProductDetailScreen';
import CartScreen from '../screens/Sales/CartScreen';
import OrdersScreen from '../screens/Sales/OrdersScreen';
import OrderDetailScreen from '../screens/Sales/OrderDetailScreen';
import ProfileScreen from '../screens/Common/ProfileScreen';
import CreateRentalEnquiryScreen from '../screens/Sales/CreateRentalEnquiryScreen';
import CreateServiceEnquiryScreen from '../screens/Sales/CreateServiceEnquiryScreen';
import CreateCompanyScreen from '../screens/Sales/CreateCompanyScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="CreateRentalEnquiry"
      component={CreateRentalEnquiryScreen}
      options={{ title: 'Create Rental Enquiry' }}
    />
    <Stack.Screen
      name="CreateServiceEnquiry"
      component={CreateServiceEnquiryScreen}
      options={{ title: 'Create Service Enquiry' }}
    />
    <Stack.Screen
      name="CreateCompany"
      component={CreateCompanyScreen}
      options={{ title: 'Create Company' }}
    />
  </Stack.Navigator>
);

const ProductsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProductsMain"
      component={ProductsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Product Details' }}
    />
  </Stack.Navigator>
);

const CustomerNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Products') {
            iconName = 'shopping-bag';
          } else if (route.name === 'Cart') {
            iconName = 'shopping-cart';
          } else if (route.name === 'Orders') {
            iconName = 'receipt';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Products" component={ProductsStack} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default CustomerNavigator;

