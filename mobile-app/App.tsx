import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuth } from './src/store/slices/authSlice';

const App = () => {
  useEffect(() => {
    // Check for stored auth data on app start
    const loadStoredAuth = async () => {
      try {
        const authData = await AsyncStorage.getItem('auth');
        if (authData) {
          const { user, token } = JSON.parse(authData);
          store.dispatch(setAuth({ user, token }));
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

