import React, { useState, useEffect } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { fetchCleaners } from '../lib/api';

const ACTIVE_WINDOW_MS = 3 * 60000;
const LIST_CONTENT_STYLE = { gap: 10, paddingBottom: 8 };

function isActive(c) {
  return c.sharing && c.last_seen && Date.now() - new Date(c.last_seen).getTime() < ACTIVE_WINDOW_MS;
}

function PickerBody({ loading, error, cleaners, onPick }) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.pink} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText} testID="cleaner-picker-error">{error}</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={cleaners}
      keyExtractor={(item) => item.id}
      contentContainerStyle={LIST_CONTENT_STYLE}
      renderItem={({ item, index }) => {
        const live = isActive(item);
        return (
          <TouchableOpacity style={styles.row} onPress={() => onPick(item)} testID={`cleaner-pick-${index}`}>
            <View style={[styles.dot, live ? styles.dotLive : styles.dotIdle]} />
            <Text style={styles.name}>{item.name}</Text>
            {live ? <Text style={styles.live}>live</Text> : null}
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <MaterialCommunityIcons name="account-group-outline" size={36} color={COLORS.textMuted} />
          <Text style={styles.empty}>No cleaners yet — they check in from the Contact tab first.</Text>
        </View>
      }
    />
  );
}

export default function CleanerPicker({ visible, password, leadName, onClose, onPick }) {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError('');
    fetchCleaners(password)
      .then((data) => setCleaners(Array.isArray(data) ? data : []))
      .catch((e) => {
        setCleaners([]);
        setError(e.message === 'unauthorized' ? 'Session expired — please sign in again.' : 'Could not load cleaners — check your connection.');
      })
      .finally(() => setLoading(false));
  }, [visible, password]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID="cleaner-picker">
          <View style={styles.header}>
            <Text style={styles.title}>Assign {leadName ? `"${leadName}"` : 'lead'} to…</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="cleaner-picker-close">
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <PickerBody loading={loading} error={error} cleaners={cleaners} onPick={onPick} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    padding: 20,
    maxHeight: '70%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: COLORS.text, fontFamily: FONTS.heading, fontSize: 17, flex: 1, marginRight: 8 },
  closeBtn: { padding: 6 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.panelSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 15,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLive: { backgroundColor: COLORS.success },
  dotIdle: { backgroundColor: COLORS.placeholder },
  name: { color: COLORS.text, fontFamily: FONTS.bodySemiBold, fontSize: 15, flex: 1 },
  live: { color: COLORS.success, fontFamily: FONTS.bodyMedium, fontSize: 12 },
  empty: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13.5, textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
  errorText: { color: COLORS.danger, fontFamily: FONTS.bodyMedium, fontSize: 13.5, textAlign: 'center', paddingHorizontal: 20 },
});
