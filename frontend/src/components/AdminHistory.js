import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { fetchAssignmentHistory, fetchCleaners, sendReviewRequest, resolveImageUrl, formatDate } from '../lib/api';

function timeAgoShort(iso) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const LIST_CONTENT_STYLE = { paddingHorizontal: 20, paddingBottom: 40, gap: 12 };

// Wraps <Image> so we don't recreate a {uri} object on every parent render.
const PhotoImage = React.memo(function PhotoImage({ url, style, resizeMode }) {
  const [source, setSource] = useState({ uri: resolveImageUrl(url) });
  useEffect(() => {
    setSource({ uri: resolveImageUrl(url) });
  }, [url]);
  return <Image source={source} style={style} resizeMode={resizeMode} />;
});

function CleanerFilter({ cleaners, selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
      testID="history-cleaner-filter"
    >
      <TouchableOpacity
        style={[styles.chip, !selected && styles.chipActive]}
        onPress={() => onSelect(null)}
        testID="history-filter-all"
      >
        <Text style={[styles.chipText, !selected && styles.chipTextActive]}>All cleaners</Text>
      </TouchableOpacity>
      {cleaners.map((c) => (
        <TouchableOpacity
          key={c.id}
          style={[styles.chip, selected === c.id && styles.chipActive]}
          onPress={() => onSelect(c.id)}
          testID={`history-filter-${c.id}`}
        >
          <Text style={[styles.chipText, selected === c.id && styles.chipTextActive]}>{c.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PhotoStrip({ photos }) {
  if (!photos || photos.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
      {photos.map((p) => (
        <View key={p.id} style={styles.photoTile}>
          <PhotoImage url={p.url} style={styles.photoImg} resizeMode="cover" />
          <View style={[styles.kindBadge, p.kind === 'after' && styles.kindBadgeAfter]}>
            <Text style={styles.kindBadgeText}>{p.kind === 'before' ? 'Before' : 'After'}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function HistoryCard({ item, onSendReview, sendingId, onOpenPhoto }) {
  const isSending = sendingId === item.id;
  const beforeCount = (item.photos || []).filter((p) => p.kind === 'before').length;
  const afterCount = (item.photos || []).filter((p) => p.kind === 'after').length;
  const telHref = `tel:${(item.phone || '').replace(/[^+\d]/g, '')}`;
  return (
    <View style={styles.card} testID="history-card">
      <View style={styles.cardTop}>
        <Text style={styles.customer}>{item.customer_name}</Text>
        <Text style={styles.date}>{formatDate(item.completed_at || item.status_updated_at)}</Text>
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="person" size={14} color={COLORS.violetLight} />
        <Text style={styles.rowText}>{item.cleaner_name || 'Unknown cleaner'}</Text>
        <Text style={styles.serviceChip}>{item.service_type}</Text>
      </View>
      {item.address ? (
        <TouchableOpacity
          style={styles.cardRow}
          onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(item.address)}`)}
        >
          <Ionicons name="location" size={14} color={COLORS.textMuted} />
          <Text style={[styles.rowText, styles.rowTextSoft]}>{item.address}</Text>
        </TouchableOpacity>
      ) : null}
      {item.phone ? (
        <TouchableOpacity style={styles.cardRow} onPress={() => Linking.openURL(telHref)}>
          <Ionicons name="call" size={14} color={COLORS.pink} />
          <Text style={[styles.rowText, styles.phoneText]}>{item.phone}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="camera" size={12} color={COLORS.textSoft} />
          <Text style={styles.metaChipText}>
            {beforeCount} before · {afterCount} after
          </Text>
        </View>
        {item.review_sent_at ? (
          <View style={[styles.metaChip, styles.reviewSent]} testID="history-review-sent">
            <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
            <Text style={[styles.metaChipText, styles.metaChipTextSuccess]}>
              Review sent {timeAgoShort(item.review_sent_at)}
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity onPress={() => onOpenPhoto(item)} activeOpacity={0.85}>
        <PhotoStrip photos={item.photos} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.reviewBtn, isSending && styles.reviewBtnBusy]}
        onPress={() => onSendReview(item)}
        disabled={isSending}
        testID={`history-send-review-${item.id}`}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={COLORS.pink} />
        ) : (
          <>
            <Ionicons name={item.review_sent_at ? 'send' : 'star'} size={14} color={COLORS.pink} />
            <Text style={styles.reviewBtnText}>
              {item.review_sent_at ? 'Resend review link' : 'Send Google review link'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function PhotoViewer({ item, onClose }) {
  if (!item) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerBackdrop}>
        <TouchableOpacity style={styles.viewerClose} onPress={onClose} testID="history-viewer-close">
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.viewerTitle}>
          {item.customer_name} · {item.service_type}
        </Text>
        <ScrollView contentContainerStyle={styles.viewerScroll} showsVerticalScrollIndicator={false}>
          {(item.photos || []).length === 0 ? (
            <Text style={styles.viewerEmpty}>No photos were taken for this job.</Text>
          ) : (
            (item.photos || []).map((p) => (
              <View key={p.id} style={styles.viewerCard}>
                <Text style={styles.viewerKind}>{p.kind === 'before' ? 'Before' : 'After'}</Text>
                <PhotoImage url={p.url} style={styles.viewerImg} resizeMode="contain" />
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function AdminHistory({ password }) {
  const [items, setItems] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [selectedCleaner, setSelectedCleaner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const [openPhoto, setOpenPhoto] = useState(null);

  const load = useCallback(async (cleanerId) => {
    try {
      const data = await fetchAssignmentHistory(cleanerId, password);
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [password]);

  useEffect(() => {
    fetchCleaners(password)
      .then((data) => setCleaners(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [password]);

  useEffect(() => {
    load(selectedCleaner);
  }, [load, selectedCleaner]);

  const onSendReview = async (assignment) => {
    setError('');
    setNotice('');
    setSendingId(assignment.id);
    try {
      const res = await sendReviewRequest(assignment.id, password);
      setItems((prev) => prev.map((a) => (a.id === assignment.id ? { ...a, review_sent_at: res.review_sent_at } : a)));
      setNotice(
        res.sent_via_sms
          ? `Review SMS sent to ${assignment.customer_name}.`
          : `Review link marked as sent. (Text messages aren't configured in this environment — share the link manually.)`
      );
    } catch (e) {
      setError(e.message || 'Could not send review');
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.pink} size="large" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={LIST_CONTENT_STYLE}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(selectedCleaner);
            }}
            tintColor={COLORS.pink}
          />
        }
        ListHeaderComponent={
          <View>
            <CleanerFilter cleaners={cleaners} selected={selectedCleaner} onSelect={setSelectedCleaner} />
            {error ? (
              <Text style={styles.error} testID="history-error">
                {error}
              </Text>
            ) : null}
            {notice ? (
              <Text style={styles.notice} testID="history-notice">
                {notice}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            onSendReview={onSendReview}
            sendingId={sendingId}
            onOpenPhoto={setOpenPhoto}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.center, styles.emptyPad]}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.empty}>
              {selectedCleaner
                ? 'No completed jobs for this cleaner yet.'
                : 'No completed cleans yet — jobs appear here after a cleaner marks them done.'}
            </Text>
          </View>
        }
      />
      <PhotoViewer item={openPhoto} onClose={() => setOpenPhoto(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: { paddingBottom: 12, gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.violet, borderColor: COLORS.violet },
  chipText: { color: COLORS.textMuted, fontFamily: FONTS.bodyMedium, fontSize: 12.5 },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  customer: { color: COLORS.text, fontFamily: FONTS.heading, fontSize: 16, flex: 1, marginRight: 8 },
  date: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 11.5, marginTop: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rowText: { color: COLORS.textSoft, fontFamily: FONTS.body, fontSize: 13, flex: 1 },
  rowTextSoft: { color: COLORS.textSoft },
  phoneText: { color: COLORS.pink, fontFamily: FONTS.bodySemiBold },
  emptyPad: { paddingTop: 60 },
  reviewBtnBusy: { opacity: 0.7 },
  metaChipTextSuccess: { color: COLORS.success },
  serviceChip: {
    color: COLORS.violetLight,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11.5,
    backgroundColor: 'rgba(179,106,232,0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.panelSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  metaChipText: { color: COLORS.textSoft, fontFamily: FONTS.bodyMedium, fontSize: 11 },
  reviewSent: { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.35)' },
  photoStrip: { paddingTop: 10, gap: 8 },
  photoTile: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  photoImg: { width: '100%', height: '100%' },
  kindBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: 'rgba(10,6,17,0.85)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  kindBadgeAfter: { backgroundColor: 'rgba(74,222,128,0.85)' },
  kindBadgeText: { color: '#fff', fontFamily: FONTS.bodySemiBold, fontSize: 9.5, letterSpacing: 0.5 },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,95,176,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,95,176,0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  reviewBtnText: { color: COLORS.pink, fontFamily: FONTS.bodySemiBold, fontSize: 13 },
  error: {
    color: COLORS.danger,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  notice: {
    color: COLORS.success,
    fontFamily: FONTS.bodyMedium,
    fontSize: 12.5,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  empty: {
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 30,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,6,17,0.96)',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  viewerClose: { position: 'absolute', top: 22, right: 18, padding: 6, zIndex: 2 },
  viewerTitle: {
    color: COLORS.text,
    fontFamily: FONTS.heading,
    fontSize: 16,
    marginBottom: 14,
    paddingRight: 40,
  },
  viewerScroll: { gap: 12, paddingBottom: 20 },
  viewerCard: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 10,
  },
  viewerKind: { color: COLORS.textSoft, fontFamily: FONTS.bodySemiBold, fontSize: 12, marginBottom: 8 },
  viewerImg: { width: '100%', height: 260, borderRadius: 10, backgroundColor: COLORS.bg },
  viewerEmpty: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13.5, textAlign: 'center', marginTop: 40 },
});
