import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import LegalDocumentScreen from '../screens/Legal/LegalDocumentScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="LegalDocument"
        component={LegalDocumentScreen}
        options={({ route }: any) => ({
          headerShown: true,
          title:
            route.params?.documentType === 'terms'
              ? 'Terms & Conditions'
              : route.params?.documentType === 'refund'
                ? 'Refund & Return Policy'
                : 'Privacy Policy',
        })}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

