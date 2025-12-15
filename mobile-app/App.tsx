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

const App = () => {
  useEffect(() => {
    // Check for stored auth data on app start
    const loadStoredAuth = async () => {
      try {
        const authData = await AsyncStorage.getItem('auth');
        if (authData) {
          const { user, token } = JSON.parse(authData);
          console.log('App - Loading stored auth:', {
            user: user ? 'User exists' : 'User missing',
            token: token ? 'Token exists' : 'Token missing',
            tokenLength: token?.length,
          });
          store.dispatch(setAuth({ user, token }));
          console.log('App - setAuth dispatched from stored auth');
          
          // Fetch user permissions
          if (user._id) {
            store.dispatch(fetchUserPermissions(user._id) as any);
          }
        } else {
          console.log('App - No stored auth data found');
        }
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

