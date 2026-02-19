import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { usePermissions } from '../../hooks/usePermissions';
import { getApiBaseUrl } from '../../services/api';

const PREDEFINED_MAILS = [
  'noreply@corpculture.com',
  'support@corpculture.com',
  'invoices@corpculture.com',
  'admin@corpculture.com',
];

const GlobalSettingsScreen = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingInvoiceFormat, setSavingInvoiceFormat] = useState(false);
  const [globalInvoiceFormat, setGlobalInvoiceFormat] = useState('');
  const [fromMail, setFromMail] = useState('');
  const [mailInputType, setMailInputType] = useState<'select' | 'custom'>('select');
  const [customMail, setCustomMail] = useState('');
  const [mailPickerVisible, setMailPickerVisible] = useState(false);

  const canEdit = hasPermission('otherSettingsSettings', 'edit') || user?.role === 1;

  useFocusEffect(
    useCallback(() => {
      if (token) fetchSettings();
    }, [token])
  );

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/common-details`, {
        headers: { Authorization: token || '' },
      });
      if (data?.success) {
        const savedMail = data.commonDetails?.fromMail || '';
        setGlobalInvoiceFormat(data.commonDetails?.globalInvoiceFormat || '');
        setFromMail(savedMail);
        setCustomMail(PREDEFINED_MAILS.includes(savedMail) ? '' : savedMail);
        setMailInputType(PREDEFINED_MAILS.includes(savedMail) ? 'select' : 'custom');
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoiceFormat = async () => {
    if (!canEdit) {
      Toast.show({ type: 'error', text1: 'You do not have permission to update settings' });
      return;
    }
    try {
      setSavingInvoiceFormat(true);
      const { data } = await axios.put(
        `${getApiBaseUrl()}/common-details`,
        {
          globalInvoiceFormat: globalInvoiceFormat.trim(),
          fromMail: mailInputType === 'select' ? fromMail : customMail,
        },
        { headers: { Authorization: token || '' } }
      );
      if (data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Global Invoice Format updated successfully',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: data?.message || 'Failed to update invoice format',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to update invoice format',
      });
    } finally {
      setSavingInvoiceFormat(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!canEdit) {
      Toast.show({ type: 'error', text1: 'You do not have permission to update settings' });
      return;
    }
    try {
      setSaving(true);
      const mail = mailInputType === 'select' ? fromMail : customMail;
      const { data } = await axios.put(
        `${getApiBaseUrl()}/common-details`,
        {
          globalInvoiceFormat: globalInvoiceFormat.trim(),
          fromMail: mail,
        },
        { headers: { Authorization: token || '' } }
      );
      if (data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Settings updated successfully',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: data?.message || 'Failed to update settings',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to update settings',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Global Settings</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Global Invoice Format</Text>
          <TextInput
            style={styles.input}
            value={globalInvoiceFormat}
            onChangeText={setGlobalInvoiceFormat}
            placeholder="e.g. CC1001 or CC/26-27/00001"
            placeholderTextColor="#999"
            editable={canEdit}
          />
          <Text style={styles.helper}>Invoice format pattern. Can be changed yearly.</Text>
          {canEdit && (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSaveInvoiceFormat}
              disabled={savingInvoiceFormat}
            >
              {savingInvoiceFormat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Format</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>From Mail</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => {
              setMailInputType('select');
              setFromMail('');
            }}
          >
            <View style={[styles.radio, mailInputType === 'select' && styles.radioSelected]} />
            <Text style={styles.radioLabel}>Select from list</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => {
              setMailInputType('custom');
              setFromMail('');
            }}
          >
            <View style={[styles.radio, mailInputType === 'custom' && styles.radioSelected]} />
            <Text style={styles.radioLabel}>Custom email</Text>
          </TouchableOpacity>
        </View>

        {mailInputType === 'select' ? (
          <>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setMailPickerVisible(true)}
              disabled={!canEdit}
            >
              <Text style={fromMail ? styles.pickerButtonText : styles.pickerPlaceholder}>
                {fromMail || '-- Select Mail --'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {mailPickerVisible && (
              <View style={styles.pickerList}>
                {PREDEFINED_MAILS.map((mail) => (
                  <TouchableOpacity
                    key={mail}
                    style={styles.pickerItem}
                    onPress={() => {
                      setFromMail(mail);
                      setMailPickerVisible(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{mail}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => setMailPickerVisible(false)}
                >
                  <Text style={styles.pickerItemTextCancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <TextInput
            style={styles.input}
            value={customMail}
            onChangeText={setCustomMail}
            placeholder="Enter custom email address"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={canEdit}
          />
        )}

        {canEdit && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, styles.saveAllButton]}
            onPress={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Settings</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#019ee3',
    marginBottom: 16,
  },
  row: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  helper: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPrimary: {
    backgroundColor: '#019ee3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  radioRow: { flexDirection: 'row', marginBottom: 12 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#019ee3',
    marginRight: 8,
  },
  radioSelected: { backgroundColor: '#019ee3' },
  radioLabel: { fontSize: 14, color: '#333' },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  pickerButtonText: { fontSize: 16, color: '#333' },
  pickerPlaceholder: { fontSize: 16, color: '#999' },
  pickerList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemText: { fontSize: 16, color: '#333' },
  pickerItemTextCancel: { fontSize: 16, color: '#019ee3' },
  saveAllButton: { marginTop: 24 },
});

export default GlobalSettingsScreen;
