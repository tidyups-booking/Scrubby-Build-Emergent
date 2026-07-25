import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, GRADIENT, GRADIENT_START, GRADIENT_END_D } from '../../constants/theme';
import { SERVICES } from '../../constants/data';
import { SectionHeader } from '../../components/ui';

const TOP_EDGES = ['top'];
const HEADER_STYLE = { marginTop: 14 };
const STACK_STYLE = { gap: 12 };
const CARD_TEXT_STYLE = { flex: 1 };

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={TOP_EDGES}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader kicker="What we do" title="Our Services" style={HEADER_STYLE} />
        <Text style={styles.intro}>
          Tap any service to request your free, no-obligation quote.
        </Text>

        <View style={STACK_STYLE}>
          {SERVICES.map((s, idx) => (
            <TouchableOpacity
              key={s.name}
              activeOpacity={0.85}
              testID={`service-card-${idx}`}
              style={styles.card}
              onPress={() => router.push({ pathname: '/quote', params: { service: s.name } })}
            >
              <LinearGradient colors={GRADIENT} start={GRADIENT_START} end={GRADIENT_END_D} style={styles.iconWrap}>
                <MaterialCommunityIcons name={s.icon} size={22} color="#fff" />
              </LinearGradient>
              <View style={CARD_TEXT_STYLE}>
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
