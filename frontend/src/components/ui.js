import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, GRADIENT } from '../constants/theme';

export function GradientButton({ title, onPress, icon, loading, disabled, testID, style }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85} testID={testID} style={style}>
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientBtn, (disabled || loading) && { opacity: 0.6 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.btnRow}>
            {icon}
            <Text style={styles.gradientBtnText}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function OutlineButton({ title, onPress, icon, testID, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} testID={testID} style={[styles.outlineBtn, style]}>
      <View style={styles.btnRow}>
        {icon}
        <Text style={styles.outlineBtnText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function SectionHeader({ kicker, title, style }) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function Card({ children, style, testID }) {
  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

export function Chip({ label, icon, style }) {
  return (
    <View style={[styles.chip, style]}>
      {icon}
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradientBtnText: { color: '#fff', fontFamily: FONTS.bodySemiBold, fontSize: 16 },
  outlineBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.panel,
  },
  outlineBtnText: { color: COLORS.text, fontFamily: FONTS.bodySemiBold, fontSize: 16 },
  kicker: {
    color: COLORS.pink,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: { color: COLORS.text, fontFamily: FONTS.display, fontSize: 24, lineHeight: 30 },
  card: {
    backgroundColor: COLORS.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.panelSoft,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: { color: COLORS.textSoft, fontFamily: FONTS.bodyMedium, fontSize: 13 },
});
