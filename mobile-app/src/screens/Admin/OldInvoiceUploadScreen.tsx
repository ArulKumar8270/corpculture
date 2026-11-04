import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { oldInvoiceService } from '../../services/api';

const OldInvoiceUploadScreen = () => {
  const navigation = useNavigation();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType?: string | null;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'application/csv',
        ],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name || `old-invoices-${Date.now()}.xlsx`,
        mimeType: asset.mimeType,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to pick file',
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Toast.show({ type: 'error', text1: 'Please select a file to upload' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type:
          selectedFile.mimeType ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      } as any);

      const response = await oldInvoiceService.upload(formData);
      if (response?.data?.success) {
        const imported = response.data.imported ?? 0;
        const errors = response.data.errors ?? 0;
        Toast.show({
          type: 'success',
          text1: 'Upload complete',
          text2: `Imported ${imported} invoices. ${errors} row(s) had errors.`,
        });
        setSelectedFile(null);
        if ((navigation as any).canGoBack?.()) {
          navigation.goBack();
        } else {
          (navigation as any).navigate('OldInvoices');
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response?.data?.message || 'Failed to upload file',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Error uploading file',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Upload Old Invoices</Text>
      <Text style={styles.hint}>
        Select an Excel (.xlsx / .xls) or CSV file to import old invoices.
      </Text>

      <TouchableOpacity style={styles.pickButton} onPress={pickFile} disabled={uploading}>
        <Icon name="attach-file" size={22} color="#019ee3" />
        <Text style={styles.pickButtonText}>
          {selectedFile ? 'Change File' : 'Select File'}
        </Text>
      </TouchableOpacity>

      {selectedFile ? (
        <View style={styles.fileCard}>
          <Icon name="description" size={28} color="#019ee3" />
          <Text style={styles.fileName} numberOfLines={2}>
            {selectedFile.name}
          </Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <Icon name="close" size={22} color="#666" />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noFile}>No file selected</Text>
      )}

      <TouchableOpacity
        style={[styles.uploadButton, (!selectedFile || uploading) && styles.uploadDisabled]}
        onPress={handleUpload}
        disabled={!selectedFile || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="cloud-upload" size={22} color="#fff" />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  hint: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#019ee3',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  pickButtonText: { color: '#019ee3', fontSize: 16, fontWeight: '600' },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 10,
    marginBottom: 20,
  },
  fileName: { flex: 1, fontSize: 14, color: '#333' },
  noFile: { fontSize: 14, color: '#999', marginBottom: 20, textAlign: 'center' },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#019ee3',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  uploadDisabled: { opacity: 0.6 },
  uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default OldInvoiceUploadScreen;
