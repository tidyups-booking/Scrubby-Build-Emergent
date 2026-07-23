import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { fetchAppImages, uploadAppImage, deleteAppImage, reorderAppImages, setImageFit, resolveImageUrl } from '../lib/api';
import { GradientButton } from './ui';

const LIST_CONTENT_STYLE = { paddingHorizontal: 20, paddingBottom: 40, gap: 12 };

async function confirmAsync(title, message) {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

function UploadCard({ label, setLabel, uploading, error, onUpload }) {
  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>Add a new image</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder="Label (optional) — e.g. Spring Promo"
        placeholderTextColor={COLORS.placeholder}
        testID="admin-image-label"
      />
      <GradientButton
        title="Upload Image"
        loading={uploading}
        testID="admin-image-upload"
        icon={<Ionicons name="cloud-upload" size={18} color="#fff" />}
        onPress={onUpload}
      />
      {error ? (
        <Text style={styles.error} testID="admin-image-error">
          {error}
        </Text>
      ) : null}
      <Text style={styles.hint}>
        Images appear in the Home carousel and the Gallery tab instantly. Use the fit toggle on each image: "Fill
        frame" crops to fill, "Show full" displays the whole graphic.
      </Text>
    </View>
  );
}

function RowActions({ index, total, onMove, onDelete }) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  return (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.actionBtn, isFirst && styles.actionDisabled]}
        onPress={() => onMove(index, -1)}
        disabled={isFirst}
        testID={`admin-image-up-${index}`}
      >
        <Ionicons name="chevron-up" size={17} color={isFirst ? COLORS.placeholder : COLORS.textSoft} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, isLast && styles.actionDisabled]}
        onPress={() => onMove(index, 1)}
        disabled={isLast}
        testID={`admin-image-down-${index}`}
      >
        <Ionicons name="chevron-down" size={17} color={isLast ? COLORS.placeholder : COLORS.textSoft} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete} testID={`admin-image-delete-${index}`}>
        <Ionicons name="trash" size={16} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );
}

function ImageRow({ item, index, total, onDelete, onToggleFit, onMove }) {
  const showFull = item.fit === 'contain';
  return (
    <View style={styles.row} testID={`admin-image-row-${index}`}>
      <Image
        source={{ uri: resolveImageUrl(item.url) }}
        style={styles.thumb}
        resizeMode={showFull ? 'contain' : 'cover'}
      />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel} numberOfLines={2}>
          {item.label || 'Untitled'}
        </Text>
        <Text style={styles.rowOrder}>Position {index + 1} of {total}</Text>
        <TouchableOpacity style={styles.fitBtn} onPress={() => onToggleFit(item)} testID={`admin-image-fit-${index}`}>
          <MaterialCommunityIcons
            name={showFull ? 'fit-to-screen-outline' : 'arrow-expand-all'}
            size={12}
            color={COLORS.textSoft}
          />
          <Text style={styles.fitText}>{showFull ? 'Show full' : 'Fill frame'}</Text>
        </TouchableOpacity>
      </View>
      <RowActions index={index} total={total} onMove={onMove} onDelete={() => onDelete(item)} />
    </View>
  );
}

export default function AdminImages({ password }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetchAppImages();
      setImages(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load images');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pickAndUpload = async () => {
    setError('');
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError('Photo library permission is required to upload images.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      setUploading(true);
      await uploadAppImage(result.assets[0], label.trim(), password);
      setLabel('');
      await load();
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (img) => {
    const ok = await confirmAsync('Delete image?', `"${img.label || 'Untitled'}" will be removed from the app.`);
    if (!ok) return;
    try {
      await deleteAppImage(img.id, password);
      await load();
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  const toggleFit = async (img) => {
    const fit = img.fit === 'contain' ? 'cover' : 'contain';
    setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, fit } : i)));
    try {
      await setImageFit(img.id, fit, password);
    } catch {
      setError('Could not change image fit — refreshing');
      load();
    }
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setImages(next);
    try {
      await reorderAppImages(next.map((i) => i.id), password);
    } catch {
      setError('Reorder failed — refreshing');
      load();
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
    <FlatList
      data={images}
      keyExtractor={(item) => item.id}
      contentContainerStyle={LIST_CONTENT_STYLE}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={COLORS.pink}
        />
      }
      ListHeaderComponent={
        <UploadCard label={label} setLabel={setLabel} uploading={uploading} error={error} onUpload={pickAndUpload} />
      }
      renderItem={({ item, index }) => (
        <ImageRow
          item={item}
          index={index}
          total={images.length}
          onDelete={onDelete}
          onToggleFit={toggleFit}
          onMove={move}
        />
      )}
      ListEmptyComponent={
        <View style={[styles.center, styles.emptyPad]}>
          <MaterialCommunityIcons name="image-off-outline" size={44} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No images — upload your first one above.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyPad: { paddingTop: 60 },
  uploadCard: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  uploadTitle: { color: COLORS.text, fontFamily: FONTS.bodySemiBold, fontSize: 15, marginBottom: 12 },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 14,
    marginBottom: 12,
  },
  error: {
    color: COLORS.danger,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  hint: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 12, marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
  },
  rowText: { flex: 1 },
  thumb: { width: 76, height: 76, borderRadius: 12, backgroundColor: COLORS.panelSoft },
  rowLabel: { color: COLORS.text, fontFamily: FONTS.bodySemiBold, fontSize: 14 },
  rowOrder: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 12, marginTop: 3 },
  fitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.panelSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 7,
  },
  fitText: { color: COLORS.textSoft, fontFamily: FONTS.bodyMedium, fontSize: 11 },
  actions: { gap: 6 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.panelSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: { opacity: 0.4 },
  deleteBtn: { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.25)' },
  emptyText: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 14, marginTop: 12 },
});
