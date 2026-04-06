import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { getApiBaseUrl } from '../services/api';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

type Props = {
  token: string;
  companyId?: string;
  companyName?: string;
  selectedEmails: string[];
  onChange: (emails: string[]) => void;
};

export function PaymentContactEmailsField({
  token,
  companyId,
  companyName,
  selectedEmails,
  onChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [manualEmail, setManualEmail] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!companyId || !token) {
        setContacts([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await axios.get(`${getApiBaseUrl()}/company/get/${companyId}`, {
          headers: { Authorization: token },
        });
        if (!cancelled && data?.success && Array.isArray(data.company?.contactPersons)) {
          setContacts(data.company.contactPersons);
        }
      } catch {
        if (!cancelled) setContacts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [companyId, token]);

  const withEmail = contacts.filter((c) => (c?.email || '').trim());

  const toggle = (email: string) => {
    const e = email.trim();
    if (!e) return;
    if (selectedEmails.includes(e)) {
      onChange(selectedEmails.filter((x) => x !== e));
    } else {
      onChange([...new Set([...selectedEmails, e])]);
    }
  };

  const addManual = () => {
    const e = manualEmail.trim();
    if (!e || !e.includes('@')) return;
    onChange([...new Set([...selectedEmails, e])]);
    setManualEmail('');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Contact persons (email)</Text>
      {companyName ? <Text style={styles.sub}>Company: {companyName}</Text> : null}
      {loading ? <ActivityIndicator color="#019ee3" style={{ marginVertical: 8 }} /> : null}
      {withEmail.map((cp, idx) => {
        const em = (cp.email || '').trim();
        const selected = selectedEmails.includes(em);
        return (
          <TouchableOpacity key={`${em}-${idx}`} style={styles.row} onPress={() => toggle(em)}>
            <Icon name={selected ? 'check-box' : 'check-box-outline-blank'} size={22} color="#019ee3" />
            <Text style={styles.rowText} numberOfLines={2}>
              {cp.name || 'Contact'} — {em}
            </Text>
          </TouchableOpacity>
        );
      })}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={manualEmail}
          onChangeText={setManualEmail}
          placeholder="Type email, then Add"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addManual}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      {selectedEmails.length > 0 ? (
        <Text style={styles.selected} numberOfLines={4}>
          Selected: {selectedEmails.join(', ')}
        </Text>
      ) : (
        <Text style={styles.hint}>Optional — multi-select for payment notifications.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  sub: { fontSize: 12, color: '#666', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  rowText: { flex: 1, fontSize: 13, color: '#222' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  addBtn: { backgroundColor: '#019ee3', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  selected: { marginTop: 8, fontSize: 12, color: '#333' },
  hint: { marginTop: 8, fontSize: 12, color: '#888' },
});
