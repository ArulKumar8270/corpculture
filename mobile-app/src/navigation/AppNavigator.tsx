import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import GuestNavigator from './GuestNavigator';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import EmployeeNavigator from './EmployeeNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const getNavigator = () => {
    // Allow unauthenticated users to access public screens (Home, Products, Cart)
    if (!isAuthenticated || !user) {
      return <GuestNavigator />;
    }

    // Role: 0 = Customer, 1 = Admin, 3 = Employee
    switch (user.role) {
      case 1:
        return <AdminNavigator />;
      case 3:
        return <EmployeeNavigator />;
      case 0:
      default:
        return <CustomerNavigator />;
    }
  };

  return <NavigationContainer>{getNavigator()}</NavigationContainer>;
};

export default AppNavigator;

