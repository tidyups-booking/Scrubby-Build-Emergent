import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { checkinCleaner, sendCleanerLocation, stopCleanerSharing, fetchCleanerJobs, setAssignmentStatus } from '../lib/api';
import { GradientButton, OutlineButton } from '../components/ui';
import CleanerJobs from '../components/CleanerJobs';

const PROFILE_KEY = 'tidyups_cleaner';

export default function CleanerScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const watchRef = useRef(null);

  const loadJobs = useCallback(async (p) => {
    if (!p) return;
    try {
      const data = await fetchCleanerJobs(p.cleaner_id, p.pin);
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.code === 401) {
        setJobs([]);
        setError('The cleaner PIN was changed — please sign out and check in again.');
      } else if (__DEV__) {
        console.warn('Jobs load failed:', e.message || e);
      }
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    loadJobs(profile);
    const timer = setInterval(() => loadJobs(profile), 60000);
    return () => clearInterval(timer);
  }, [profile, loadJobs]);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY)
      .then((raw) => {
        if (raw) setProfile(JSON.parse(raw));
      })
      .finally(() => setChecking(false));
    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  const onCheckin = async () => {
    if (!name.trim() || !pin.trim()) {
      setError('Enter your name and the cleaner PIN.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await checkinCleaner(name.trim(), pin.trim());
      const p = { cleaner_id: res.cleaner_id, name: res.name, pin: pin.trim() };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      setProfile(p);
    } catch (e) {
      setError(e.message || 'Check-in failed');
    } finally {
      setBusy(false);
    }
  };

  const sendPing = async (p, coords) => {
    try {
      await sendCleanerLocation(p.cleaner_id, p.pin, coords.latitude, coords.longitude);
      setLastSent(new Date());
      setError('');
    } catch (e) {
      if (e.code === 401) {
        stopWatch();
        setError('The cleaner PIN was changed — please sign out and check in again.');
      }
    }
  };

  const stopWatch = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setSharing(false);
  };

  const onStart = async () => {
    setError('');
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError('Location permission is required to share your position.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await sendPing(profile, pos.coords);
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 20000, distanceInterval: 40 },
        (p) => sendPing(profile, p.coords)
      );
      setSharing(true);
    } catch {
      setError('Could not get your location — check GPS is on and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onStop = () => {
    stopWatch();
    stopCleanerSharing(profile.cleaner_id, profile.pin).catch(() => {});
  };

  const onJobStatus = async (job, status) => {
    setError('');
    try {
      await setAssignmentStatus(job.id, profile.cleaner_id, profile.pin, status);
      if (status === 'done') {
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
      } else {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status } : j)));
      }
    } catch (e) {
      setError(e.message || 'Could not update status');
    }
  };

  const onJobChange = (updated) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  const onSignout = async () => {
    onStop();
    await AsyncStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setName('');
    setPin('');
    setError('');
    setLastSent(null);
    setJobs([]);
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

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.wrap}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} testID="cleaner-close">
            <Ionicons name="close" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <MaterialCommunityIcons name="map-marker-account" size={52} color={COLORS.pink} style={{ marginBottom: 16 }} />
          <Text style={styles.title}>Cleaner Check-In</Text>
          <Text style={styles.sub}>Enter your name and the team PIN to share your location with dispatch.</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={COLORS.placeholder}
            testID="cleaner-name-input"
          />
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="Cleaner PIN"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="number-pad"
            secureTextEntry
            testID="cleaner-pin-input"
          />
          {error ? (
            <Text style={styles.error} testID="cleaner-error">
              {error}
            </Text>
          ) : null}
          <GradientButton title="Check In" onPress={onCheckin} loading={busy} testID="cleaner-checkin-btn" style={{ alignSelf: 'stretch', marginTop: 6 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={[styles.closeBtn, { zIndex: 10 }]} onPress={() => router.back()} testID="cleaner-close">
        <Ionicons name="close" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollWrap} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.statusDot, sharing ? styles.dotLive : styles.dotIdle]} />
          <Text style={styles.title} testID="cleaner-status">
            {sharing ? "You're live!" : `Hi, ${profile.name.split(' ')[0]}!`}
          </Text>
          <Text style={styles.sub}>
            {sharing
              ? `Dispatch can see your live location.${lastSent ? ` Last update ${lastSent.toLocaleTimeString()}.` : ''} Keep this screen open while you travel.`
              : 'Tap below when you head to a job site so dispatch can see you on the way.'}
          </Text>

          {error ? (
            <Text style={styles.error} testID="cleaner-error">
              {error}
            </Text>
          ) : null}

          {sharing ? (
            <OutlineButton
              title="Stop Sharing"
              testID="cleaner-stop-btn"
              icon={<Ionicons name="stop-circle" size={18} color={COLORS.danger} />}
              onPress={onStop}
              style={{ alignSelf: 'stretch', borderColor: 'rgba(248,113,113,0.4)' }}
            />
          ) : (
            <GradientButton
              title="Start Sharing Location"
              testID="cleaner-start-btn"
              loading={busy}
              icon={<Ionicons name="navigate" size={18} color="#fff" />}
              onPress={onStart}
              style={{ alignSelf: 'stretch' }}
            />
          )}
        </View>

        <CleanerJobs jobs={jobs} onStatus={onJobStatus} cleaner={profile} onJobChange={onJobChange} setError={setError} />

        <TouchableOpacity style={styles.signout} onPress={onSignout} testID="cleaner-signout">
          <Text style={styles.signoutText}>Sign out ({profile.name})</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  closeBtn: { position: 'absolute', top: 18, right: 18, padding: 8 },
  title: { color: COLORS.text, fontFamily: FONTS.display, fontSize: 26, marginBottom: 8 },
  sub: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  statusDot: { width: 16, height: 16, borderRadius: 8, marginBottom: 16 },
  dotLive: { backgroundColor: COLORS.success },
  dotIdle: { backgroundColor: COLORS.placeholder },
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
  signout: { marginTop: 22, padding: 8 },
  signoutText: { color: COLORS.textMuted, fontFamily: FONTS.bodyMedium, fontSize: 13 },
  scrollWrap: { paddingHorizontal: 24, paddingTop: 70, paddingBottom: 40 },
});
