import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

const JOB_STEPS = [
  { key: 'on_the_way', label: 'On my way', icon: 'car' },
  { key: 'cleaning', label: 'Cleaning', icon: 'sparkles' },
  { key: 'done', label: 'Done', icon: 'checkmark-circle' },
];

export default function CleanerJobs({ jobs, onStatus }) {
  return (
    <View style={styles.jobsSection}>
      <Text style={styles.jobsTitle}>Your Jobs</Text>
      {jobs.length === 0 ? (
        <Text style={styles.noJobs} testID="cleaner-no-jobs">
          No jobs assigned right now — check back later.
        </Text>
      ) : (
        jobs.map((job, index) => (
          <View key={job.id} style={styles.jobCard} testID={`cleaner-job-${index}`}>
            <View style={styles.jobTop}>
              <Text style={styles.jobName}>{job.customer_name}</Text>
              <Text style={styles.jobService}>{job.service_type}</Text>
            </View>
            {job.address ? (
              <TouchableOpacity
                style={styles.jobRow}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`)}
                testID={`cleaner-job-address-${index}`}
              >
                <Ionicons name="location" size={15} color={COLORS.pink} />
                <Text style={[styles.jobRowText, { color: COLORS.pink, fontFamily: FONTS.bodySemiBold }]}>
                  {job.address}
                </Text>
              </TouchableOpacity>
            ) : null}
            {job.phone ? (
              <TouchableOpacity
                style={styles.jobRow}
                onPress={() => Linking.openURL(`tel:${(job.phone || '').replace(/[^+\d]/g, '')}`)}
                testID={`cleaner-job-phone-${index}`}
              >
                <Ionicons name="call" size={15} color={COLORS.textMuted} />
                <Text style={styles.jobRowText}>{job.phone}</Text>
              </TouchableOpacity>
            ) : null}
            {job.preferred_date ? (
              <View style={styles.jobRow}>
                <Ionicons name="calendar" size={15} color={COLORS.textMuted} />
                <Text style={styles.jobRowText}>Preferred: {job.preferred_date}</Text>
              </View>
            ) : null}
            {job.message ? <Text style={styles.jobMessage}>"{job.message}"</Text> : null}
            <View style={styles.statusRow}>
              {JOB_STEPS.map((s) => {
                const active = job.status === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.statusBtn, active && styles.statusBtnActive]}
                    onPress={() => onStatus(job, s.key)}
                    testID={`cleaner-job-${s.key}-${index}`}
                  >
                    <Ionicons name={s.icon} size={14} color={active ? '#0A0611' : COLORS.textSoft} />
                    <Text style={[styles.statusBtnText, active && styles.statusBtnTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  jobsSection: { marginTop: 32, alignSelf: 'stretch' },
  jobsTitle: {
    color: COLORS.gold,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  noJobs: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13.5 },
  jobCard: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  jobName: { color: COLORS.text, fontFamily: FONTS.heading, fontSize: 16, flex: 1 },
  jobService: { color: COLORS.violetLight, fontFamily: FONTS.bodyMedium, fontSize: 12, marginTop: 2 },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  jobRowText: { color: COLORS.textSoft, fontFamily: FONTS.body, fontSize: 13.5, flex: 1 },
  jobMessage: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13, fontStyle: 'italic', marginTop: 4, lineHeight: 18 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.panelSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  statusBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  statusBtnText: { color: COLORS.textSoft, fontFamily: FONTS.bodySemiBold, fontSize: 11.5 },
  statusBtnTextActive: { color: '#0A0611' },
});
