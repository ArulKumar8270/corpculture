import React, { useState, useCallback } from 'react';
import {
  View,
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

const PanCardScreen = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [panNumber, setPanNumber] = useState(user?.pan?.number || '');
  const [panName, setPanName] = useState(user?.pan?.name || '');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPanNumber(user?.pan?.number || '');
      setPanName(user?.pan?.name || '');
    }, [user?.pan?.number, user?.pan?.name])
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
    const num = panNumber.trim().toUpperCase();
    const name = panName.trim();
    if (num && num.length !== 10) {
      Toast.show({ type: 'error', text1: 'PAN should be 10 characters' });
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.post(
        `${getApiBaseUrl()}/auth/update-details`,
        {
          _id: user._id,
          pan: { number: num || undefined, name: name || undefined },
        },
        { headers: { Authorization: token }, timeout: 30000 }
      );
      if (data?.success) {
        const next = data.user
          ? { ...user, ...data.user }
          : { ...user, pan: { number: num, name } };
        dispatch(updateUser(data.user ? data.user : { pan: { number: num, name } }));
        await persistAuth(next);
        Toast.show({ type: 'success', text1: 'PAN details saved' });
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
          Enter details as per your PAN card. Only store what you are comfortable sharing on your
          account.
        </Text>
        <Text style={styles.label}>PAN number</Text>
        <TextInput
          style={styles.input}
          value={panNumber}
          onChangeText={(t) => setPanNumber(t.toUpperCase())}
          placeholder="e.g. ABCDE1234F"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          maxLength={10}
        />
        <Text style={styles.label}>Name on PAN</Text>
        <TextInput
          style={styles.input}
          value={panName}
          onChangeText={setPanName}
          placeholder="As on card"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save PAN details</Text>
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
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: '#019ee3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default PanCardScreen;
