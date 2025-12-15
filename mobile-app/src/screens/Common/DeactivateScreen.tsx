import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../../store/slices/authSlice';
import { clearPermissions } from '../../store/slices/permissionsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const DeactivateScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Account',
      'Are you sure you want to deactivate your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call API to deactivate account
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('auth');
              dispatch(clearAuth());
              dispatch(clearPermissions());
              Toast.show({
                type: 'success',
                text1: 'Account Deactivated',
                text2: 'Your account has been deactivated successfully',
              });
              // @ts-ignore
              navigation.navigate('Login');
            } catch (error) {
              console.error('Deactivation error:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to deactivate account. Please try again.',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deactivate Account</Text>
      <Text style={styles.description}>
        If you deactivate your account, you will lose access to all your data and services.
        This action cannot be undone.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleDeactivate}>
        <Text style={styles.buttonText}>Deactivate Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DeactivateScreen;
