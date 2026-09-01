import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../../store/slices/authSlice';
import { cleanupPushNotificationsOnLogout } from '../../services/pushNotifications';
import { clearPermissions } from '../../store/slices/permissionsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { userService } from '../../services/api';
import { RootState } from '../../store';

const DeactivateScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrashAccount = () => {
    if (!email.trim() || !phone.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing details',
        text2: 'Please confirm your email and mobile number',
      });
      return;
    }

    Alert.alert(
      'Move Account to Trash',
      'Are you sure you want to move your account to trash? You will be logged out and can be restored by an administrator.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await userService.deactivateUser({ email: email.trim(), phone: phone.trim() });

              if (response.data?.success) {
                await cleanupPushNotificationsOnLogout();
                await AsyncStorage.removeItem('authToken');
                await AsyncStorage.removeItem('auth');
                dispatch(clearAuth());
                dispatch(clearPermissions());
                Toast.show({
                  type: 'success',
                  text1: 'Account moved to trash',
                  text2: response.data?.message || 'Your account has been moved to trash successfully',
                });
                // @ts-ignore
                navigation.navigate('Login');
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: response.data?.message || 'Failed to move account to trash',
                });
              }
            } catch (error: any) {
              console.error('Trash account error:', error);
              const errorType = error.response?.data?.errorType;
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2:
                  errorType === 'phoneMismatch'
                    ? error.response?.data?.message || 'Mobile number does not match'
                    : error.response?.data?.message || 'Failed to move account to trash. Please try again.',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Move Account to Trash</Text>
      <Text style={styles.description}>
        If you move your account to trash, you will lose access to all your data and services until an administrator restores it.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Confirm your email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm your mobile number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleTrashAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Move to Trash</Text>
        )}
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
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DeactivateScreen;
