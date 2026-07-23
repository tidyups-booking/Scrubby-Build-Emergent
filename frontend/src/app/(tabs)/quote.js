import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';
import {
  SERVICE_OPTIONS,
  PROPERTY_TYPES,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  PROVINCES,
} from '../../constants/data';
import { submitQuote } from '../../lib/api';
import { saveLastQuote, getLastQuote, BOOK_AGAIN_TAG } from '../../lib/lastQuote';
import { GradientButton, OutlineButton, SectionHeader } from '../../components/ui';
import SelectField from '../../components/SelectField';

const TOP_EDGES = ['top'];
const KAV_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : undefined;

const INITIAL = {
  name: '',
  phone: '',
  email: '',
  service_type: '',
  property_type: '',
  bedrooms: '',
  bathrooms: '',
  street_address: '',
  city: 'Edmonton',
  province: 'Alberta',
  postal_code: '',
  preferred_date: '',
  message: '',
};

function Field({ label, required, value, onChangeText, placeholder, keyboardType, multiline, testID }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: COLORS.pink }}> *</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        keyboardType={keyboardType || 'default'}
        multiline={!!multiline}
        testID={testID}
      />
    </View>
  );
}

export default function QuoteScreen() {
  const router = useRouter();
  const { service, bookAgain } = useLocalSearchParams();
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (service && SERVICE_OPTIONS.includes(service)) {
      setForm((f) => ({ ...f, service_type: service }));
      setSuccess(false);
    }
  }, [service]);

  useEffect(() => {
    if (!bookAgain) return;
    getLastQuote().then((saved) => {
      if (!saved) return;
      const next = { ...INITIAL };
      Object.keys(INITIAL).forEach((k) => {
        if (saved[k]) next[k] = saved[k];
      });
      next.preferred_date = '';
      setForm(next);
      setPrefilled(true);
      setSuccess(false);
      setError('');
    });
  }, [bookAgain]);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const onSubmit = async () => {
    setError('');
    if (!form.name.trim() || !form.phone.trim() || !form.service_type) {
      setError('Please fill in your name, phone number and the service you need.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim(), service_type: form.service_type };
      const optional = ['email', 'property_type', 'bedrooms', 'bathrooms', 'street_address', 'city', 'province', 'postal_code', 'preferred_date', 'message'];
      optional.forEach((k) => {
        const v = (form[k] || '').trim ? (form[k] || '').trim() : form[k];
        if (v) payload[k] = v;
      });
      if (payload.street_address) {
        payload.address = [payload.street_address, payload.city, payload.province, payload.postal_code]
          .filter(Boolean)
          .join(', ');
      }
      if (prefilled) {
        payload.message = [BOOK_AGAIN_TAG, payload.message].filter(Boolean).join(' ');
      }
      await submitQuote(payload);
      saveLastQuote(form);
      setSuccess(true);
      setPrefilled(false);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again or call us.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={TOP_EDGES}>
        <View style={styles.successWrap} testID="quote-success">
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={54} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Request received!</Text>
          <Text style={styles.successSub}>
            Thanks {form.name.split(' ')[0]}! Our team will text or call you shortly with your free quote.
          </Text>
          <GradientButton
            title="Done"
            testID="quote-done"
            style={{ alignSelf: 'stretch', marginTop: 28 }}
            onPress={() => {
              setForm(INITIAL);
              setSuccess(false);
              router.push('/');
            }}
          />
          <OutlineButton
            title="Submit another request"
            style={{ alignSelf: 'stretch', marginTop: 12 }}
            onPress={() => {
              setForm(INITIAL);
              setSuccess(false);
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={TOP_EDGES}>
      <KeyboardAvoidingView style={styles.kavFill} behavior={KAV_BEHAVIOR}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SectionHeader kicker="Free · No obligation" title="Request a Quote" style={{ marginTop: 14 }} />
          <Text style={styles.intro}>Tell us about your space and we'll get right back to you with a price.</Text>

          {prefilled ? (
            <View style={styles.prefillBanner} testID="book-again-banner">
              <Ionicons name="flash" size={15} color={COLORS.gold} />
              <Text style={styles.prefillText}>Prefilled from your last booking — review and send.</Text>
            </View>
          ) : null}

          <Text style={styles.groupTitle}>Your details</Text>
          <Field label="Full name" required value={form.name} onChangeText={set('name')} placeholder="Jane Smith" testID="input-name" />
          <Field label="Phone number" required value={form.phone} onChangeText={set('phone')} placeholder="(780) 555-0123" keyboardType="phone-pad" testID="input-phone" />
          <Field label="Email" value={form.email} onChangeText={set('email')} placeholder="jane@email.com (optional)" keyboardType="email-address" testID="input-email" />

          <Text style={styles.groupTitle}>The job</Text>
          <SelectField label="Service needed" required value={form.service_type} placeholder="Choose a service" options={SERVICE_OPTIONS} onSelect={set('service_type')} testID="select-service" />
          <SelectField label="Property type" value={form.property_type} placeholder="Choose property type (optional)" options={PROPERTY_TYPES} onSelect={set('property_type')} testID="select-property" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <SelectField label="Bedrooms" value={form.bedrooms} placeholder="Optional" options={BEDROOM_OPTIONS} onSelect={set('bedrooms')} testID="select-bedrooms" />
            </View>
            <View style={{ flex: 1 }}>
              <SelectField label="Bathrooms" value={form.bathrooms} placeholder="Optional" options={BATHROOM_OPTIONS} onSelect={set('bathrooms')} testID="select-bathrooms" />
            </View>
          </View>

          <Text style={styles.groupTitle}>Where (optional)</Text>
          <Field label="Street address" value={form.street_address} onChangeText={set('street_address')} placeholder="123 Main Street NW" testID="input-street" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="City" value={form.city} onChangeText={set('city')} placeholder="Edmonton" testID="input-city" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Postal code" value={form.postal_code} onChangeText={set('postal_code')} placeholder="T6H 5Z5" testID="input-postal" />
            </View>
          </View>
          <SelectField label="Province" value={form.province} placeholder="Province" options={PROVINCES} onSelect={set('province')} testID="select-province" />

          <Text style={styles.groupTitle}>Anything else?</Text>
          <Field label="Preferred date" value={form.preferred_date} onChangeText={set('preferred_date')} placeholder="YYYY-MM-DD (optional)" testID="input-date" />
          <Field label="Message" value={form.message} onChangeText={set('message')} placeholder="Pets, keys, special requests… (optional)" multiline testID="input-message" />

          {error ? (
            <Text style={styles.error} testID="quote-error">
              {error}
            </Text>
          ) : null}

          <GradientButton
            title="Send My Quote Request"
            testID="quote-submit"
            loading={submitting}
            icon={<Ionicons name="paper-plane" size={18} color="#fff" />}
            onPress={onSubmit}
            style={{ marginTop: 8 }}
          />
          <Text style={styles.privacyNote}>We only use your info to prepare your quote. No spam, ever.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  kavFill: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  intro: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 14, marginBottom: 10, marginTop: -6 },
  prefillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,138,61,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,61,0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  prefillText: { color: COLORS.gold, fontFamily: FONTS.bodyMedium, fontSize: 13, flex: 1 },
  groupTitle: {
    color: COLORS.gold,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 12,
  },
  fieldWrap: { marginBottom: 16 },
  label: { color: COLORS.textSoft, fontFamily: FONTS.bodyMedium, fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  error: {
    color: COLORS.danger,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  successTitle: { color: COLORS.text, fontFamily: FONTS.display, fontSize: 28, marginBottom: 10 },
  successSub: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  privacyNote: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
