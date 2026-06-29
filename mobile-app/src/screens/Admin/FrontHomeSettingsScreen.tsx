import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  RefreshControl,
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
import { FrontHomeSettings } from '../../types/frontHomeSettings';

const FrontHomeSettingsScreen = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FrontHomeSettings | null>(null);

  const canEdit =
    hasPermission('otherSettingsFrontHome', 'edit') || user?.role === 1 || Number(user?.role) === 1;

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${getApiBaseUrl()}/front-home-settings`, {
        headers: { Authorization: token || '' },
      });
      if (data?.success) setSettings(data.settings);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load front home settings' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) load();
    }, [token])
  );

  const patch = (path: string, value: unknown) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as FrontHomeSettings;
      const keys = path.split('.');
      let cur: Record<string, unknown> = next as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]] as Record<string, unknown>;
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    if (!canEdit || !settings) return;
    try {
      setSaving(true);
      const { data } = await axios.put(
        `${getApiBaseUrl()}/front-home-settings`,
        { settings },
        { headers: { Authorization: token || '' } }
      );
      if (data?.success) {
        setSettings(data.settings);
        Toast.show({ type: 'success', text1: 'Front home settings saved' });
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.response?.data?.message || 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!canEdit) return;
    try {
      setSaving(true);
      const { data } = await axios.post(
        `${getApiBaseUrl()}/front-home-settings/reset`,
        null,
        { headers: { Authorization: token || '' } }
      );
      if (data?.success) {
        setSettings(data.settings);
        Toast.show({ type: 'success', text1: 'Reset to defaults' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Reset failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (!settings) return null;

  const s = settings;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Front Home Settings</Text>
        {canEdit && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={reset} disabled={saving}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.hint}>
        Changes apply to the mobile home screen and web storefront. Use the web admin for full banner slide and list editing.
      </Text>

      <Section title="Theme">
        <Field label="Primary color" value={s.theme?.primaryColor} onChange={(v) => patch('theme.primaryColor', v)} editable={canEdit} />
        <Field label="Secondary color" value={s.theme?.secondaryColor} onChange={(v) => patch('theme.secondaryColor', v)} editable={canEdit} />
        <Field label="Header from" value={s.theme?.headerGradientFrom} onChange={(v) => patch('theme.headerGradientFrom', v)} editable={canEdit} />
        <Field label="Header to" value={s.theme?.headerGradientTo} onChange={(v) => patch('theme.headerGradientTo', v)} editable={canEdit} />
      </Section>

      <Section title="Logo">
        <Toggle
          label="Text logo"
          value={s.logo?.useTextLogo !== false}
          onChange={(v) => patch('logo.useTextLogo', v)}
          disabled={!canEdit}
        />
        <Field label="Logo image URL" value={s.logo?.url} onChange={(v) => patch('logo.url', v)} editable={canEdit} />
        <Field label="Text primary" value={s.logo?.textPrimary} onChange={(v) => patch('logo.textPrimary', v)} editable={canEdit} />
        <Field label="Text accent" value={s.logo?.textAccent} onChange={(v) => patch('logo.textAccent', v)} editable={canEdit} />
      </Section>

      <Section title="Banner">
        <Field label="Height (px)" value={String(s.banner?.mobileHeight ?? 200)} onChange={(v) => patch('banner.mobileHeight', Number(v) || 200)} editable={canEdit} keyboardType="numeric" />
        <Field label="Autoplay (ms)" value={String(s.banner?.autoplaySpeed ?? 3000)} onChange={(v) => patch('banner.autoplaySpeed', Number(v) || 3000)} editable={canEdit} keyboardType="numeric" />
        <Text style={styles.meta}>{(s.banner?.slides || []).length} slide(s) configured</Text>
      </Section>

      <Section title="Category search">
        <Toggle label="Enabled" value={!!s.categorySearch?.enabled} onChange={(v) => patch('categorySearch.enabled', v)} disabled={!canEdit} />
        <Toggle label="Show on home" value={!!s.categorySearch?.showOnHome} onChange={(v) => patch('categorySearch.showOnHome', v)} disabled={!canEdit} />
        <Field label="Placeholder" value={s.categorySearch?.placeholder} onChange={(v) => patch('categorySearch.placeholder', v)} editable={canEdit} />
      </Section>

      <Section title="Sales">
        <Toggle label="Show assured badge" value={!!s.sales?.showAssuredBadge} onChange={(v) => patch('sales.showAssuredBadge', v)} disabled={!canEdit} />
        <Field label="Assured label" value={s.sales?.assuredBadgeLabel} onChange={(v) => patch('sales.assuredBadgeLabel', v)} editable={canEdit} />
        <Toggle label="Credit at checkout" value={!!s.sales?.creditOptionEnabled} onChange={(v) => patch('sales.creditOptionEnabled', v)} disabled={!canEdit} />
        <Field label="Credit label" value={s.sales?.creditLabel} onChange={(v) => patch('sales.creditLabel', v)} editable={canEdit} />
      </Section>

      <Section title="Service">
        <Toggle label="Credit on enquiry" value={!!s.service?.creditOptionEnabled} onChange={(v) => patch('service.creditOptionEnabled', v)} disabled={!canEdit} />
        <Field label="Credit label" value={s.service?.creditLabel} onChange={(v) => patch('service.creditLabel', v)} editable={canEdit} />
        <Field label="Default service image URL" value={s.serviceDefaultImage} onChange={(v) => patch('serviceDefaultImage', v)} editable={canEdit} />
        <Field label="Default rental image URL" value={s.rentalDefaultImage} onChange={(v) => patch('rentalDefaultImage', v)} editable={canEdit} />
      </Section>

      <Section title="Content counts">
        <Text style={styles.meta}>Offers: {(s.offerCategories || []).length}</Text>
        <Text style={styles.meta}>Services: {(s.services || []).length}</Text>
        <Text style={styles.meta}>Home products: {(s.homeProducts || []).length}</Text>
        <Text style={styles.meta}>Category banners: {(s.categoryBanners || []).length}</Text>
      </Section>

      {(s.navTabs || []).length > 0 && (
        <Section title="Nav tabs visibility">
          {(s.navTabs || []).map((tab, i) => (
            <Toggle
              key={tab.id || i}
              label={`${tab.label || tab.id} — visible`}
              value={tab.visible !== false}
              onChange={(v) => patch(`navTabs.${i}.visible`, v)}
              disabled={!canEdit}
            />
          ))}
        </Section>
      )}

      {(s.offerCategories || []).length > 0 && (
        <Section title="Offer categories visibility">
          {(s.offerCategories || []).map((item, i) => (
            <Toggle
              key={item.id || i}
              label={`${item.title || item.id} — visible`}
              value={item.visible !== false}
              onChange={(v) => patch(`offerCategories.${i}.visible`, v)}
              disabled={!canEdit}
            />
          ))}
        </Section>
      )}

      {(s.services || []).length > 0 && (
        <Section title="Services visibility">
          {(s.services || []).map((item, i) => (
            <Toggle
              key={item.title || i}
              label={`${item.title} — visible`}
              value={item.visible !== false}
              onChange={(v) => patch(`services.${i}.visible`, v)}
              disabled={!canEdit}
            />
          ))}
        </Section>
      )}

      {(s.homeProducts || []).length > 0 && (
        <Section title="Home products visibility">
          {(s.homeProducts || []).map((item, i) => (
            <Toggle
              key={item.title || i}
              label={`${item.title} — visible`}
              value={item.visible !== false}
              onChange={(v) => patch(`homeProducts.${i}.visible`, v)}
              disabled={!canEdit}
            />
          ))}
        </Section>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Field = ({
  label,
  value,
  onChange,
  editable,
  keyboardType,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  editable: boolean;
  keyboardType?: 'default' | 'numeric';
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, !editable && styles.inputDisabled]}
      value={value ?? ''}
      onChangeText={onChange}
      editable={editable}
      keyboardType={keyboardType}
    />
  </View>
);

const Toggle = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <View style={styles.toggleRow}>
    <Text style={styles.label}>{label}</Text>
    <Switch value={value} onValueChange={onChange} disabled={disabled} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#019ee3', flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#f59e0b' },
  resetText: { color: '#f59e0b', fontWeight: '600' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#019ee3', minWidth: 72, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
  hint: { paddingHorizontal: 16, paddingBottom: 8, fontSize: 13, color: '#666' },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  field: { marginBottom: 10 },
  label: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  inputDisabled: { backgroundColor: '#f5f5f5' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meta: { fontSize: 13, color: '#666', marginTop: 4 },
});

export default FrontHomeSettingsScreen;
