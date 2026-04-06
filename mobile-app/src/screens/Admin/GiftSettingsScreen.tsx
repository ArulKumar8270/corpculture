import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

/**
 * Web links to /admin/settings/gift but no dedicated gift catalog screen ships in client.
 * Gift-related access is permission-driven (otherSettingsGift) via Menu Settings.
 */
const GiftSettingsScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Icon name="card-giftcard" size={48} color="#019ee3" style={{ alignSelf: 'center', marginBottom: 16 }} />
      <Text style={styles.title}>Gift settings</Text>
      <Text style={styles.body}>
        There is no separate gift catalog on mobile. Configure which roles can access gift-related
        areas using Menu Settings (permission key: otherSettingsGift), same as the web admin.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('MenuSettings' as never)}
      >
        <Text style={styles.btnText}>Open Menu Settings</Text>
        <Icon name="chevron-right" size={22} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 24 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#019ee3',
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default GiftSettingsScreen;
