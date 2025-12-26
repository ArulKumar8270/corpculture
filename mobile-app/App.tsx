import 'react-native-gesture-handler'; // Must be at the very top
import 'react-native-reanimated'; // Ensure Reanimated is loaded before drawer
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuth } from './src/store/slices/authSlice';
import { fetchUserPermissions } from './src/store/slices/permissionsSlice';
import {
  setCompanyEnabled,
  setSelectedCompany,
} from './src/store/slices/companySlice';

const App = () => {
  useEffect(() => {
    // Check for stored auth data on app start
    const loadStoredAuth = async () => {
      try {
        const authData = await AsyncStorage.getItem('auth');
        if (authData) {
          const { user, token } = JSON.parse(authData);
          store.dispatch(setAuth({ user, token }));
          
          // Fetch user permissions
          if (user._id) {
            store.dispatch(fetchUserPermissions(user._id) as any);
          }
        } else {
          console.log('App - No stored auth data found');
        }

        // Load company settings
        const loadCompanySettings = async () => {
          try {
            const storedCompanyEnabled = await AsyncStorage.getItem('isCompanyEnabled');
            const storedSelectedCompany = await AsyncStorage.getItem('selectedCompany');
            if (storedCompanyEnabled) {
              store.dispatch(setCompanyEnabled(JSON.parse(storedCompanyEnabled)));
            }
            if (storedSelectedCompany) {
              store.dispatch(setSelectedCompany(storedSelectedCompany));
            }
          } catch (error) {
            console.error('Error loading company settings:', error);
          }
        };
        loadCompanySettings();
      } catch (error) {
        console.error('Error loading stored auth:', error);
      }
    };

    loadStoredAuth();
  }, []);

  return (
    <Provider store={store}>
      <AppNavigator />
      <Toast />
    </Provider>
  );
};

export default App;

