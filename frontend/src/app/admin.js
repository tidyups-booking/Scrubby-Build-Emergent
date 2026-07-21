import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { adminLogin, fetchQuotes, formatDate } from '../lib/api';
import { GradientButton, Chip } from '../components/ui';
import AdminImages from '../components/AdminImages';

const PW_KEY = 'tidyups_admin_pw';

function LeadCard({ item }) {
  const address =
    [item.street_address, item.city, item.province, item.postal_code].filter(Boolean).join(', ') || item.address;
  const telHref = `tel:${(item.phone || '').replace(/[^+\d]/g, '')}`;

  return (
    <View style={styles.leadCard} testID="admin-lead-card">
      <View style={styles.leadTop}>
        <Text style={styles.leadName}>{item.name}</Text>
        <Text style={styles.leadDate}>{formatDate(item.created_at)}</Text>
      </View>

      <View style={styles.chipRow}>
        <Chip label={item.service_type} />
        {item.property_type ? <Chip label={item.property_type} /> : null}
        {item.bedrooms ? <Chip label={`${item.bedrooms} bed`} /> : null}
        {item.bathrooms ? <Chip label={`${item.bathrooms} bath`} /> : null}
      </View>

      <TouchableOpacity style={styles.leadRow} onPress={() => Linking.openURL(telHref)}>
        <Ionicons name="call" size={15} color={COLORS.pink} />
        <Text style={[styles.leadRowText, { color: COLORS.pink, fontFamily: FONTS.bodySemiBold }]}>{item.phone}</Text>
      </TouchableOpacity>

      {item.email ? (
        <View style={styles.leadRow}>
          <Ionicons name="mail" size={15} color={COLORS.textMuted} />
          <Text style={styles.leadRowText}>{item.email}</Text>
        </View>
      ) : null}

      {address ? (
        <View style={styles.leadRow}>
          <Ionicons name="location" size={15} color={COLORS.textMuted} />
          <Text style={styles.leadRowText}>{address}</Text>
        </View>
      ) : null}

      {item.preferred_date ? (
        <View style={styles.leadRow}>
          <Ionicons name="calendar" size={15} color={COLORS.textMuted} />
          <Text style={styles.leadRowText}>Preferred: {item.preferred_date}</Text>
        </View>
      ) : null}

      {item.message ? <Text style={styles.leadMessage}>"{item.message}"</Text> : null}
    </View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [storedPw, setStoredPw] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('leads');

  const loadLeads = useCallback(async (pw, mode = 'full') => {
    if (mode === 'full') setLoadingLeads(true);
    try {
      const data = await fetchQuotes(pw);
      setLeads(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      if (e.code === 401) {
        await AsyncStorage.removeItem(PW_KEY);
        setStoredPw(null);
        setError('Session expired — please sign in again.');
      } else {
        setError(e.message || 'Failed to load leads');
      }
    } finally {
      setLoadingLeads(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const pw = await AsyncStorage.getItem(PW_KEY);
        if (pw) {
          setStoredPw(pw);
          loadLeads(pw);
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [loadLeads]);

  const onLogin = async () => {
    if (!password.trim()) {
      setError('Enter the admin password');
      return;
    }
    setLoggingIn(true);
    setError('');
    try {
      await adminLogin(password.trim());
      await AsyncStorage.setItem(PW_KEY, password.trim());
      setStoredPw(password.trim());
      setPassword('');
      loadLeads(password.trim());
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const onLogout = async () => {
    await AsyncStorage.removeItem(PW_KEY);
    setStoredPw(null);
    setLeads([]);
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.pink} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!storedPw) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loginWrap}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} testID="admin-close">
            <Ionicons name="close" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <MaterialCommunityIcons name="shield-lock" size={52} color={COLORS.pink} style={{ marginBottom: 16 }} />
          <Text style={styles.loginTitle}>Staff Login</Text>
          <Text style={styles.loginSub}>Enter the admin password to view incoming leads.</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Admin password"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={onLogin}
            testID="admin-password-input"
          />
          {error ? (
            <Text style={styles.error} testID="admin-error">
              {error}
            </Text>
          ) : null}
          <GradientButton title="Sign In" onPress={onLogin} loading={loggingIn} testID="admin-login-btn" style={{ alignSelf: 'stretch', marginTop: 6 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin</Text>
          <Text style={styles.headerSub} testID="admin-lead-count">
            {leads.length} quote request{leads.length === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={onLogout} testID="admin-logout">
            <Ionicons name="log-out-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} testID="admin-back">
            <Ionicons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, tab === 'leads' && styles.segmentActive]}
          onPress={() => setTab('leads')}
          testID="admin-tab-leads"
        >
          <Ionicons name="people" size={15} color={tab === 'leads' ? '#fff' : COLORS.textMuted} />
          <Text style={[styles.segmentText, tab === 'leads' && styles.segmentTextActive]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, tab === 'images' && styles.segmentActive]}
          onPress={() => setTab('images')}
          testID="admin-tab-images"
        >
          <Ionicons name="images" size={15} color={tab === 'images' ? '#fff' : COLORS.textMuted} />
          <Text style={[styles.segmentText, tab === 'images' && styles.segmentTextActive]}>Images</Text>
        </TouchableOpacity>
      </View>

      {tab === 'images' ? (
        <AdminImages password={storedPw} />
      ) : (
        <>
          {error ? <Text style={[styles.error, { marginHorizontal: 20 }]}>{error}</Text> : null}

      {loadingLeads ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.pink} size="large" />
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LeadCard item={item} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadLeads(storedPw, 'refresh');
              }}
              tintColor={COLORS.pink}
            />
          }
          ListEmptyComponent={
            <View style={[styles.center, { paddingTop: 80 }]}>
              <MaterialCommunityIcons name="inbox-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No leads yet — new quote requests will appear here.</Text>
            </View>
          }
        />
      )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loginWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  closeBtn: { position: 'absolute', top: 18, right: 18, padding: 8 },
  loginTitle: { color: COLORS.text, fontFamily: FONTS.display, fontSize: 26, marginBottom: 8 },
  loginSub: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  input: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 15,
    marginBottom: 14,
  },
  error: {
    color: COLORS.danger,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13.5,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerTitle: { color: COLORS.text, fontFamily: FONTS.display, fontSize: 26 },
  headerSub: { color: COLORS.textMuted, fontFamily: FONTS.bodyMedium, fontSize: 13, marginTop: 2 },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentActive: { backgroundColor: COLORS.violet, borderColor: COLORS.violet },
  segmentText: { color: COLORS.textMuted, fontFamily: FONTS.bodySemiBold, fontSize: 14 },
  segmentTextActive: { color: '#fff' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadCard: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
  },
  leadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  leadName: { color: COLORS.text, fontFamily: FONTS.heading, fontSize: 17, flex: 1, marginRight: 8 },
  leadDate: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 11.5, marginTop: 3 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  leadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  leadRowText: { color: COLORS.textSoft, fontFamily: FONTS.body, fontSize: 13.5, flex: 1 },
  leadMessage: {
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    fontSize: 13.5,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 19,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
  },
});
