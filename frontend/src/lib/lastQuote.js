import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tidyups_last_quote';

export const BOOK_AGAIN_TAG = '[Book Again]';

export async function saveLastQuote(form) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...form, saved_at: new Date().toISOString() }));
  } catch (e) {
    if (__DEV__) console.warn('Could not save last quote:', e);
  }
}

export async function getLastQuote() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.name && data.service_type ? data : null;
  } catch (e) {
    if (__DEV__) console.warn('Could not read last quote:', e);
    return null;
  }
}
