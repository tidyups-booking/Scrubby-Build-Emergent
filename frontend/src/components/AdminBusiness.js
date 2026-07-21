import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { fetchAppSettings, updateAppSettings, uploadLogo, resetLogo, resolveImageUrl } from '../lib/api';
import { GradientButton } from './ui';
import { useBusiness } from '../lib/business';

const DEFAULT_LOGO = require('../../assets/images/logo.png');

function Field({ label, value, onChangeText, placeholder, testID, keyboardType }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
        testID={testID}
      />
    </View>
  );
}

export default function AdminBusiness({ password }) {
  const { refresh } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    fetchAppSettings()
      .then((s) => {
        setForm({
          phone_display: s.phone_display || '',
          tollfree_display: s.tollfree_display || '',
          tollfree_sub: s.tollfree_sub || '',
          address: s.address || '',
          city_line: s.city_line || '',
          website: s.website || '',
          hours: Array.isArray(s.hours) ? s.hours : [],
        });
        setLogoUrl(s.logo_url || null);
      })
      .catch(() => setError('Failed to load business details'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setHour = (idx, key, value) =>
    setForm((f) => ({ ...f, hours: f.hours.map((h, i) => (i === idx ? { ...h, [key]: value } : h)) }));

  const onSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateAppSettings(form, password);
      await refresh();
      setSuccess('Saved — changes are now live everywhere in the app.');
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onPickLogo = async () => {
    setError('');
    setSuccess('');
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError('Photo library permission is required.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      setLogoBusy(true);
      const s = await uploadLogo(result.assets[0], password);
      setLogoUrl(s.logo_url || null);
      await refresh();
      setSuccess('Logo updated.');
    } catch (e) {
      setError(e.message || 'Logo upload failed');
    } finally {
      setLogoBusy(false);
    }
  };

  const onResetLogo = async () => {
    setLogoBusy(true);
    setError('');
    setSuccess('');
    try {
      await resetLogo(password);
      setLogoUrl(null);
      await refresh();
      setSuccess('Logo reset to default.');
    } catch (e) {
      setError(e.message || 'Reset failed');
    } finally {
      setLogoBusy(false);
    }
  };

  if (loading || !form) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.pink} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Logo</Text>
        <View style={styles.logoRow}>
          <Image
            source={logoUrl ? { uri: resolveImageUrl(logoUrl) } : DEFAULT_LOGO}
            style={styles.logoPreview}
            resizeMode="contain"
            testID="admin-logo-preview"
          />
          <View style={{ flex: 1, gap: 8 }}>
            <TouchableOpacity style={styles.smallBtn} onPress={onPickLogo} disabled={logoBusy} testID="admin-logo-upload">
              {logoBusy ? (
                <ActivityIndicator size="small" color={COLORS.pink} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={15} color={COLORS.textSoft} />
              )}
              <Text style={styles.smallBtnText}>Upload new logo</Text>
            </TouchableOpacity>
            {logoUrl ? (
              <TouchableOpacity style={styles.smallBtn} onPress={onResetLogo} disabled={logoBusy} testID="admin-logo-reset">
                <Ionicons name="refresh" size={15} color={COLORS.textSoft} />
                <Text style={styles.smallBtnText}>Reset to default</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Details</Text>
        <Field label="Phone number" value={form.phone_display} onChangeText={set('phone_display')} placeholder="(780) 718-5092" testID="admin-biz-phone" keyboardType="phone-pad" />
        <Field label="Toll-free (display)" value={form.tollfree_display} onChangeText={set('tollfree_display')} placeholder="(833) TIDY-UPS" testID="admin-biz-tollfree" />
        <Field label="Toll-free (number)" value={form.tollfree_sub} onChangeText={set('tollfree_sub')} placeholder="+1 (833) 843-9877" testID="admin-biz-tollfree-num" keyboardType="phone-pad" />
        <Field label="Street address" value={form.address} onChangeText={set('address')} placeholder="6510 Gateway Boulevard Suite 1020" testID="admin-biz-address" />
        <Field label="City / province / postal" value={form.city_line} onChangeText={set('city_line')} placeholder="Edmonton, AB T6H 5Z5" testID="admin-biz-city" />
        <Field label="Website" value={form.website} onChangeText={set('website')} placeholder="tidyupscleaning.com" testID="admin-biz-website" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Business Hours</Text>
        {form.hours.map((h, i) => (
          <View key={i} style={styles.hourRow}>
            <TextInput
              style={[styles.input, { flex: 1.3 }]}
              value={h.day}
              onChangeText={(v) => setHour(i, 'day', v)}
              placeholder="Day"
              placeholderTextColor={COLORS.placeholder}
              testID={`admin-biz-hours-day-${i}`}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={h.time}
              onChangeText={(v) => setHour(i, 'time', v)}
              placeholder="Time"
              placeholderTextColor={COLORS.placeholder}
              testID={`admin-biz-hours-time-${i}`}
            />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setForm((f) => ({ ...f, hours: f.hours.filter((_, idx) => idx !== i) }))}
              testID={`admin-biz-hours-remove-${i}`}
            >
              <Ionicons name="trash" size={15} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.smallBtn, { alignSelf: 'flex-start', marginTop: 4 }]}
          onPress={() => setForm((f) => ({ ...f, hours: [...f.hours, { day: '', time: '' }] }))}
          testID="admin-biz-hours-add"
        >
          <Ionicons name="add" size={16} color={COLORS.textSoft} />
          <Text style={styles.smallBtnText}>Add row</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={styles.error} testID="admin-biz-error">
          {error}
        </Text>
      ) : null}
      {success ? (
        <Text style={styles.success} testID="admin-biz-success">
          {success}
        </Text>
      ) : null}
      <GradientButton title="Save Changes" onPress={onSave} loading={saving} testID="admin-biz-save" />
      <Text style={styles.hint}>These details power the Home call button and the entire Contact tab.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { color: COLORS.text, fontFamily: FONTS.bodySemiBold, fontSize: 15, marginBottom: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoPreview: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.panelSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  smallBtnText: { color: COLORS.textSoft, fontFamily: FONTS.bodyMedium, fontSize: 13 },
  fieldLabel: { color: COLORS.textMuted, fontFamily: FONTS.bodyMedium, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: COLORS.danger,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  success: {
    color: COLORS.success,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  hint: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 12, marginTop: 12, textAlign: 'center' },
});
