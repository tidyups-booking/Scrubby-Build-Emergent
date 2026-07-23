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
import { adminLogin, fetchQuotes, formatDate, createAssignment, fetchAssignments, deleteAssignment } from '../lib/api';
import { GradientButton, Chip } from '../components/ui';
import AdminImages from '../components/AdminImages';
import AdminBusiness from '../components/AdminBusiness';
import AdminTeam from '../components/AdminTeam';
import CleanerPicker from '../components/CleanerPicker';
import { requestLeadNotifPermission } from '../lib/leadAlerts';

const PW_KEY = 'tidyups_admin_pw';
const BOOK_AGAIN_TAG = '[Book Again]';
const STATUS_META = {
  assigned: { label: 'Assigned', color: COLORS.violetLight },
  on_the_way: { label: 'On the way', color: COLORS.gold },
  cleaning: { label: 'Cleaning now', color: COLORS.success },
};

function DailySummary({ leads, assignmentList }) {
  const today = new Date().toDateString();
  const leadsToday = leads.filter((l) => l.created_at && new Date(l.created_at).toDateString() === today).length;
  const activeJobs = assignmentList.filter((a) => a.status !== 'done').length;
  const doneToday = assignmentList.filter(
    (a) => a.status === 'done' && a.completed_at && new Date(a.completed_at).toDateString() === today
  ).length;
  const items = [
    { label: "Today's Leads", value: leadsToday, testID: 'summary-leads' },
    { label: 'Active Jobs', value: activeJobs, testID: 'summary-active' },
    { label: 'Done Today', value: doneToday, testID: 'summary-done' },
  ];
  return (
    <View style={styles.summaryCard} testID="daily-summary">
      {items.map((it, i) => (
        <View key={it.label} style={[styles.summaryItem, i < 2 && styles.summaryDivider]}>
          <Text style={styles.summaryValue} testID={it.testID}>
            {it.value}
          </Text>
          <Text style={styles.summaryLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

function LeadCard({ item, assignment, onAssign, onUnassign }) {
  const address =
    [item.street_address, item.city, item.province, item.postal_code].filter(Boolean).join(', ') || item.address;
  const telHref = `tel:${(item.phone || '').replace(/[^+\d]/g, '')}`;
  const isReturning = (item.message || '').includes(BOOK_AGAIN_TAG);
  const displayMessage = (item.message || '').replace(BOOK_AGAIN_TAG, '').trim();

  return (
    <View style={styles.leadCard} testID="admin-lead-card">
      <View style={styles.leadTop}>
        <Text style={styles.leadName}>{item.name}</Text>
        <Text style={styles.leadDate}>{formatDate(item.created_at)}</Text>
      </View>

      <View style={styles.chipRow}>
        {isReturning ? (
          <View style={styles.returningChip} testID="lead-returning-chip">
            <Ionicons name="repeat" size={12} color={COLORS.gold} />
            <Text style={styles.returningChipText}>Returning customer</Text>
          </View>
        ) : null}
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

      {displayMessage ? <Text style={styles.leadMessage}>"{displayMessage}"</Text> : null}

      {assignment ? (
        <View style={styles.assignedRow} testID="lead-assigned-row">
          <MaterialCommunityIcons name="account-check" size={16} color={COLORS.violetLight} />
          <Text style={styles.assignedText}>{assignment.cleaner_name}</Text>
          <View
            style={[styles.statusPill, { borderColor: (STATUS_META[assignment.status] || STATUS_META.assigned).color }]}
            testID="lead-status-pill"
          >
            <Text style={[styles.statusPillText, { color: (STATUS_META[assignment.status] || STATUS_META.assigned).color }]}>
              {(STATUS_META[assignment.status] || STATUS_META.assigned).label}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onUnassign(assignment)} style={styles.unassignBtn} testID="lead-unassign-btn">
            <Ionicons name="close" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.assignBtn} onPress={() => onAssign(item)} testID="lead-assign-btn">
          <Ionicons name="person-add" size={14} color={COLORS.pink} />
          <Text style={styles.assignBtnText}>Assign to cleaner</Text>
        </TouchableOpacity>
      )}
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
        if (STATUS_META[a.status]) map[a.quote_id] = a;
      });
      setAssignments(map);
    } catch (e) {
      console.warn('Assignments load failed:', e.message || e);
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
        {[
          { key: 'leads', icon: 'people', label: 'Leads' },
          { key: 'images', icon: 'images', label: 'Images' },
          { key: 'business', icon: 'storefront', label: 'Business' },
          { key: 'team', icon: 'navigate', label: 'Team' },
        ].map((s) => (
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
    gap: 5,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentActive: { backgroundColor: COLORS.violet, borderColor: COLORS.violet },
  segmentText: { color: COLORS.textMuted, fontFamily: FONTS.bodySemiBold, fontSize: 12.5 },
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
  returningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,138,61,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,61,0.4)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  returningChipText: { color: COLORS.gold, fontFamily: FONTS.bodySemiBold, fontSize: 12.5 },
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
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(179,106,232,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(179,106,232,0.35)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  assignedText: { color: COLORS.violetLight, fontFamily: FONTS.bodySemiBold, fontSize: 13, flex: 1 },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  statusPillText: { fontFamily: FONTS.bodySemiBold, fontSize: 11 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { borderRightWidth: 1, borderRightColor: COLORS.border },
  summaryValue: { color: COLORS.pink, fontFamily: FONTS.display, fontSize: 22 },
  summaryLabel: { color: COLORS.textMuted, fontFamily: FONTS.bodyMedium, fontSize: 11, marginTop: 3 },
  unassignBtn: { padding: 4 },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,95,176,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,95,176,0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  assignBtnText: { color: COLORS.pink, fontFamily: FONTS.bodySemiBold, fontSize: 13 },
  emptyText: {
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
  },
});
