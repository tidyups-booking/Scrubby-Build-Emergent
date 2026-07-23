import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { formatDate } from '../lib/api';
import { Chip } from './ui';

const BOOK_AGAIN_TAG = '[Book Again]';

export const STATUS_META = {
  assigned: { label: 'Assigned', color: COLORS.violetLight },
  on_the_way: { label: 'On the way', color: COLORS.gold },
  cleaning: { label: 'Cleaning now', color: COLORS.success },
  done: { label: 'Completed', color: COLORS.success },
};

export function DailySummary({ leads, assignmentList }) {
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

export default function LeadCard({ item, assignment, onAssign, onUnassign }) {
  const address =
    [item.street_address, item.city, item.province, item.postal_code].filter(Boolean).join(', ') || item.address;
  const telHref = `tel:${(item.phone || '').replace(/[^+\d]/g, '')}`;
  const isReturning = (item.message || '').includes(BOOK_AGAIN_TAG);
  const displayMessage = (item.message || '').replace(BOOK_AGAIN_TAG, '').trim();
  const statusMeta = STATUS_META[assignment && assignment.status] || STATUS_META.assigned;
  const isDone = !!assignment && assignment.status === 'done';

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
          <MaterialCommunityIcons
            name={isDone ? 'check-circle' : 'account-check'}
            size={16}
            color={isDone ? COLORS.success : COLORS.violetLight}
          />
          <Text style={styles.assignedText}>{assignment.cleaner_name}</Text>
          <View style={[styles.statusPill, { borderColor: statusMeta.color }]} testID="lead-status-pill">
            <Text style={[styles.statusPillText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
          {isDone ? null : (
            <TouchableOpacity onPress={() => onUnassign(assignment)} style={styles.unassignBtn} testID="lead-unassign-btn">
              <Ionicons name="close" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      ) : null}
      {!assignment || isDone ? (
        <TouchableOpacity style={styles.assignBtn} onPress={() => onAssign(item)} testID="lead-assign-btn">
          <Ionicons name={isDone ? 'repeat' : 'person-add'} size={14} color={COLORS.pink} />
          <Text style={styles.assignBtnText}>{isDone ? 'Assign again' : 'Assign to cleaner'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
