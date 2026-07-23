import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { adminLogin, fetchQuotes, createAssignment, fetchAssignments, deleteAssignment } from '../lib/api';
import LeadCard, { DailySummary } from '../components/LeadCard';
import AdminLogin from '../components/AdminLogin';
import AdminImages from '../components/AdminImages';
import AdminBusiness from '../components/AdminBusiness';
import AdminTeam from '../components/AdminTeam';
import AdminHistory from '../components/AdminHistory';
import CleanerPicker from '../components/CleanerPicker';
import { requestLeadNotifPermission } from '../lib/leadAlerts';

const PW_KEY = 'tidyups_admin_pw';
const TABS = [
  { key: 'leads', icon: 'people', label: 'Leads' },
  { key: 'history', icon: 'time', label: 'History' },
  { key: 'images', icon: 'images', label: 'Images' },
  { key: 'business', icon: 'storefront', label: 'Business' },
  { key: 'team', icon: 'navigate', label: 'Team' },
];

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
  const [assignments, setAssignments] = useState({});
  const [assignmentList, setAssignmentList] = useState([]);
  const [assignLead, setAssignLead] = useState(null);

  const loadAssignments = useCallback(async (pw) => {
    try {
      const list = await fetchAssignments(pw);
      const all = Array.isArray(list) ? list : [];
      setAssignmentList(all);
      const map = {};
      all.forEach((a) => {
        const existing = map[a.quote_id];
        if (!existing || (existing.status === 'done' && a.status !== 'done')) map[a.quote_id] = a;
      });
      setAssignments(map);
    } catch (e) {
      if (__DEV__) console.warn('Assignments load failed:', e.message || e);
    }
  }, []);

  const loadLeads = useCallback(async (pw, mode = 'full') => {
    if (mode === 'full') setLoadingLeads(true);
    loadAssignments(pw);
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
  }, [loadAssignments]);

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

  useEffect(() => {
    if (storedPw) requestLeadNotifPermission();
  }, [storedPw]);

  useEffect(() => {
    if (!storedPw || tab !== 'leads') return;
    const timer = setInterval(() => loadAssignments(storedPw), 30000);
    return () => clearInterval(timer);
  }, [storedPw, tab, loadAssignments]);

  const onPasswordChanged = async (newPw) => {
    await AsyncStorage.setItem(PW_KEY, newPw);
    setStoredPw(newPw);
  };

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

  const onAssignPick = async (cleaner) => {
    const lead = assignLead;
    setAssignLead(null);
    if (!lead) return;
    setError('');
    try {
      const address =
        [lead.street_address, lead.city, lead.province, lead.postal_code].filter(Boolean).join(', ') || lead.address || '';
      await createAssignment(
        {
          quote_id: lead.id,
          cleaner_id: cleaner.id,
          customer_name: lead.name,
          service_type: lead.service_type,
          address,
          phone: lead.phone || null,
          preferred_date: lead.preferred_date || null,
          message: (lead.message || '').replace('[Book Again]', '').trim() || null,
        },
        storedPw
      );
      loadAssignments(storedPw);
    } catch (e) {
      setError(e.message || 'Assign failed');
    }
  };

  const onUnassign = async (a) => {
    setError('');
    try {
      await deleteAssignment(a.id, storedPw);
      loadAssignments(storedPw);
    } catch (e) {
      setError(e.message || 'Unassign failed');
    }
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
      <AdminLogin
        password={password}
        setPassword={setPassword}
        error={error}
        loggingIn={loggingIn}
        onLogin={onLogin}
        onClose={() => router.back()}
      />
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
        {TABS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.segment, tab === s.key && styles.segmentActive]}
            onPress={() => setTab(s.key)}
            testID={`admin-tab-${s.key}`}
          >
            <Ionicons name={s.icon} size={14} color={tab === s.key ? '#fff' : COLORS.textMuted} />
            <Text style={[styles.segmentText, tab === s.key && styles.segmentTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'images' ? (
        <AdminImages password={storedPw} />
      ) : tab === 'business' ? (
        <AdminBusiness password={storedPw} onPasswordChanged={onPasswordChanged} />
      ) : tab === 'team' ? (
        <AdminTeam password={storedPw} />
      ) : tab === 'history' ? (
        <AdminHistory password={storedPw} />
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
              renderItem={({ item }) => (
                <LeadCard item={item} assignment={assignments[item.id]} onAssign={setAssignLead} onUnassign={onUnassign} />
              )}
              ListHeaderComponent={<DailySummary leads={leads} assignmentList={assignmentList} />}
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

      <CleanerPicker
        visible={!!assignLead}
        password={storedPw}
        leadName={assignLead ? assignLead.name : ''}
        onClose={() => setAssignLead(null)}
        onPick={onAssignPick}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentActive: { backgroundColor: COLORS.violet, borderColor: COLORS.violet },
  segmentText: { color: COLORS.textMuted, fontFamily: FONTS.bodySemiBold, fontSize: 11.5 },
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
  emptyText: {
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
  },
});
