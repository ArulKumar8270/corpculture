import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import CompanyToggleHeader from '../components/CompanyToggleHeader';

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
import WishlistScreen from '../screens/Sales/WishlistScreen';
import ShippingScreen from '../screens/Sales/ShippingScreen';
import OrderSuccessScreen from '../screens/Sales/OrderSuccessScreen';
import OrderFailedScreen from '../screens/Sales/OrderFailedScreen';

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
      options={{
        title: 'Create Rental Enquiry',
        headerRight: () => <CompanyToggleHeader />,
      }}
    />
    <Stack.Screen
      name="CreateServiceEnquiry"
      component={CreateServiceEnquiryScreen}
      options={{
        title: 'Create Service Enquiry',
        headerRight: () => <CompanyToggleHeader />,
      }}
    />
    <Stack.Screen
      name="CreateCompany"
      component={CreateCompanyScreen}
      options={{
        title: 'Create Company',
        headerRight: () => <CompanyToggleHeader />,
      }}
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
      options={{
        title: 'Product Details',
        headerRight: () => <CompanyToggleHeader />,
      }}
    />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="OrdersMain"
      component={OrdersScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="OrderDetail"
      component={OrderDetailScreen}
      options={{
        title: 'Order Details',
        headerRight: () => <CompanyToggleHeader />,
      }}
    />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="CartMain"
      component={CartScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Shipping"
      component={ShippingScreen}
      options={{
        title: 'Shipping Details',
        headerRight: () => <CompanyToggleHeader />,
      }}
    />
    <Stack.Screen
      name="OrderSuccess"
      component={OrderSuccessScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="OrderFailed"
      component={OrderFailedScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Wishlist"
      component={WishlistScreen}
      options={{
        title: 'My Wishlist',
        headerRight: () => <CompanyToggleHeader />,
      }}
    />
  </Stack.Navigator>
);

const CompanyStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="CompanyMain"
      component={CreateCompanyScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const CustomerNavigator = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const showCompanyTab = user && user.role !== 1; // Show for non-admin users

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
          } else if (route.name === 'Company') {
            iconName = 'business';
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
      <Tab.Screen name="Cart" component={CartStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      {/* {showCompanyTab && (
        <Tab.Screen 
          name="Company" 
          component={CompanyStack}
          options={{ title: 'Company' }}
        />
      )} */}
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default CustomerNavigator;

