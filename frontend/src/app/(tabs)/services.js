import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, GRADIENT } from '../../constants/theme';
import { SERVICES } from '../../constants/data';
import { SectionHeader } from '../../components/ui';

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader kicker="What we do" title="Our Services" style={{ marginTop: 14 }} />
        <Text style={styles.intro}>
          Tap any service to request your free, no-obligation quote.
        </Text>

        <View style={{ gap: 12 }}>
          {SERVICES.map((s, idx) => (
            <TouchableOpacity
              key={s.name}
              activeOpacity={0.85}
              testID={`service-card-${idx}`}
              style={styles.card}
              onPress={() => router.push({ pathname: '/quote', params: { service: s.name } })}
            >
              <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrap}>
                <MaterialCommunityIcons name={s.icon} size={22} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.desc}>{s.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footNote}>
          Something else in mind? Choose "Other / Not Sure" on the quote form and tell us what you need.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  intro: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 14, marginBottom: 18, marginTop: -6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  name: { color: COLORS.text, fontFamily: FONTS.bodySemiBold, fontSize: 15.5 },
  desc: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13, marginTop: 2, lineHeight: 18 },
  footNote: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13, marginTop: 22, lineHeight: 19, textAlign: 'center' },
});
