import React, { useRef, useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { RootNavigationProvider } from '../context/RootNavigationContext';

import GuestNavigator from './GuestNavigator';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import EmployeeNavigator from './EmployeeNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const navigationRef = useRef<any>(null);

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

  // Android (and consistent back): from any screen, back goes to previous screen; at stack root, go to Dashboard
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBack = () => {
      const root = navigationRef.current?.getRootState();
      if (!root?.routes?.length) return false;

      const currentRoute = root.routes[root.index];
      const nestedState = currentRoute.state as { routes?: any[]; index?: number } | undefined;
      const stackRoutes = nestedState?.routes;
      const canGoBackInStack = stackRoutes && stackRoutes.length > 1;

      if (canGoBackInStack) {
        navigationRef.current?.dispatch(CommonActions.goBack());
        return true;
      }

      const hasDashboard = root.routes.some((r: any) => r.name === 'Dashboard');
      if (!hasDashboard || currentRoute.name === 'Dashboard') return false;

      navigationRef.current?.dispatch(
        CommonActions.navigate({ name: 'Dashboard' })
      );
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [isAuthenticated, user?.role]);

  return (
    <RootNavigationProvider value={navigationRef}>
      <NavigationContainer ref={navigationRef}>
        {getNavigator()}
      </NavigationContainer>
    </RootNavigationProvider>
  );
};

export default AppNavigator;

