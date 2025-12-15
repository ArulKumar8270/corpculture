import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuth } from '../../store/slices/authSlice';
import { fetchUserPermissions } from '../../store/slices/permissionsSlice';
import { authService } from '../../services/api';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    // Password length validation
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(email, password);
      
      // Only proceed if status is 200 (success)
      if (!response || response.status !== 200) {
        throw new Error('Invalid response from server');
      }

      // Check if response data is valid
      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      console.log('response23452345', response.data);

      const { user, token } = response.data;

      // Validate response data
      if (!user || !token) {
        throw new Error('Missing user data or token');
      }

      console.log('Login - Extracted user:', user);
      console.log('Login - Extracted token:', token ? 'Token exists' : 'Token missing');

      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem(
          'auth',
          JSON.stringify({ user, token })
        );
        console.log('Login - Saved to AsyncStorage successfully');
      } catch (storageError) {
        console.error('Error saving to storage:', storageError);
        Toast.show({
          type: 'error',
          text1: 'Storage Error',
          text2: 'Failed to save login credentials. Please try again.',
        });
        setLoading(false);
        return;
      }

      // Update Redux
      console.log('Login - Dispatching setAuth with user and token');
      dispatch(setAuth({ user, token }));
      console.log('Login - setAuth dispatched');

      // Fetch user permissions
      if (user._id) {
        try {
          dispatch(fetchUserPermissions(user._id) as any);
        } catch (permissionError) {
          console.error('Error fetching permissions:', permissionError);
          // Don't block login if permissions fail to load
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: `Welcome ${user.name || 'User'}!`,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      let errorTitle = 'Login Failed';

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const serverMessage = error.response.data?.message || error.response.data?.error;

        switch (status) {
          case 400:
            errorTitle = 'Invalid Request';
            errorMessage = serverMessage || 'Please check your email and password';
            break;
          case 401:
            errorTitle = 'Authentication Failed';
            errorMessage = serverMessage || 'Invalid email or password';
            break;
          case 403:
            errorTitle = 'Access Denied';
            errorMessage = serverMessage || 'Your account does not have access';
            break;
          case 404:
            errorTitle = 'Not Found';
            errorMessage = serverMessage || 'User account not found';
            break;
          case 429:
            errorTitle = 'Too Many Requests';
            errorMessage = 'Too many login attempts. Please try again later';
            break;
          case 500:
          case 502:
          case 503:
            errorTitle = 'Server Error';
            errorMessage = 'Server is temporarily unavailable. Please try again later';
            break;
          default:
            errorMessage = serverMessage || `Server error (${status}). Please try again`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorTitle = 'Network Error';
        errorMessage = 'Unable to connect to server. Please check your internet connection';
      } else if (error.message) {
        // Error in request setup
        errorMessage = error.message;
      }

      Toast.show({
        type: 'error',
        text1: errorTitle,
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Corpculture</Text>
      <Text style={styles.subtitle}>Login to your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Register' as never)}
        style={styles.linkButton}
      >
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('ForgotPassword' as never)}
        style={styles.linkButton}
      >
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default LoginScreen;

