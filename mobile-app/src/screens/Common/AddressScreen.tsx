import React, { useState, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../../store';
import { updateUser } from '../../store/slices/authSlice';
import { getApiBaseUrl } from '../../services/api';

const AddressScreen = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setAddress(user?.address || '');
    }, [user?.address])
  );

  const persistAuth = async (nextUser: typeof user) => {
    if (!token || !nextUser) return;
    await AsyncStorage.setItem('auth', JSON.stringify({ user: nextUser, token }));
  };

  const handleSave = async () => {
    if (!user?._id || !token) {
      Toast.show({ type: 'error', text1: 'Not signed in' });
      return;
    }
    const trimmed = address.trim();
    if (!trimmed) {
      Toast.show({ type: 'error', text1: 'Enter an address' });
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.post(
        `${getApiBaseUrl()}/auth/update-details`,
        {
          _id: user._id,
          address: trimmed,
        },
        { headers: { Authorization: token }, timeout: 30000 }
      );
      if (data?.success) {
        const next = data.user ? { ...user, ...data.user } : { ...user, address: trimmed };
        dispatch(updateUser(data.user ? data.user : { address: trimmed }));
        await persistAuth(next);
        Toast.show({ type: 'success', text1: 'Address saved' });
      } else {
        Toast.show({ type: 'error', text1: data?.message || 'Save failed' });
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e?.response?.data?.message || e?.message || 'Could not save',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.hint}>
          This address is stored on your account and used where the app or checkout requires it.
        </Text>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Street, area, city, state, PIN"
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save address</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: '#019ee3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default AddressScreen;
