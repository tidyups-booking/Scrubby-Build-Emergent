import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { fetchQuotes, HTTP_UNAUTHORIZED } from './api';

const LAST_SEEN_KEY = 'tidyups_last_lead_seen';
const POLLING_INTERVAL_MS = 60000;
const ADMIN_PW_KEY = 'tidyups_admin_pw';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestLeadNotifPermission() {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
        await window.Notification.requestPermission();
      }
    } else {
      await Notifications.requestPermissionsAsync();
    }
  } catch (e) {
    if (__DEV__) console.warn('Notification permission request failed:', e);
  }
}

async function notifyNewLeads(count, newest) {
  const title = count === 1 ? 'New Tidyups lead!' : `${count} new Tidyups leads!`;
  const body = `${newest.name} — ${newest.service_type}`;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(title, { body, icon: '/icons/icon-192.png' });
      }
    } else {
      await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
    }
  } catch (e) {
    if (__DEV__) console.warn('Lead notification failed:', e);
  }
}

export function useLeadAlerts() {
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const pw = await AsyncStorage.getItem(ADMIN_PW_KEY);
        if (!pw || cancelled) return;
        const quotes = await fetchQuotes(pw);
        if (cancelled || !Array.isArray(quotes) || quotes.length === 0) return;
        const newest = quotes[0];
        const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);
        if (lastSeen && newest.created_at > lastSeen) {
          const count = quotes.filter((q) => q.created_at > lastSeen).length;
          notifyNewLeads(count, newest);
        }
        if (!lastSeen || newest.created_at > lastSeen) {
          await AsyncStorage.setItem(LAST_SEEN_KEY, newest.created_at);
        }
      } catch (e) {
        if (e && e.code === HTTP_UNAUTHORIZED) {
          await AsyncStorage.removeItem(ADMIN_PW_KEY);
          return;
        }
        if (__DEV__) console.warn('Lead poll failed (will retry):', e.message || e);
      }
    };
    tick();
    const timer = setInterval(tick, POLLING_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);
}
