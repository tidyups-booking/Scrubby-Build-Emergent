import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';
import { fetchAppImages, resolveImageUrl } from '../../lib/api';
import { SectionHeader } from '../../components/ui';

const TOP_EDGES = ['top'];
const LIST_CONTENT_STYLE = { paddingHorizontal: 20, paddingBottom: 40, gap: 14 };
const HEADER_STYLE = { marginTop: 14 };

const GalleryImage = React.memo(function GalleryImage({ url, style, resizeMode }) {
  const source = React.useMemo(() => ({ uri: resolveImageUrl(url) }), [url]);
  return <Image source={source} style={style} resizeMode={resizeMode} />;
});

export default function GalleryScreen() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewer, setViewer] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAppImages();
      setImages(Array.isArray(data) ? data : []);
    } catch (e) {
      if (__DEV__) console.warn('Gallery load failed, keeping current images:', e.message || e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.safe} edges={TOP_EDGES}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.pink} size="large" />
        </View>
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={LIST_CONTENT_STYLE}
          ListHeaderComponent={
            <View>
              <SectionHeader kicker="Our work & offers" title="Gallery" style={HEADER_STYLE} />
              <Text style={styles.intro}>Promos, our fleet and the Tidyups crew in action. Tap to view.</Text>
            </View>
          }
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
          renderItem={({ item, index }) => (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setViewer(item)} testID={`gallery-card-${index}`}>
              <GalleryImage url={item.url} style={styles.image} resizeMode={item.fit === 'contain' ? 'contain' : 'cover'} />
              {item.label ? (
                <View style={styles.labelWrap}>
                  <Text style={styles.label} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={[styles.center, { paddingTop: 80 }]}>
              <MaterialCommunityIcons name="image-off-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No images yet — check back soon!</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewer(null)} testID="gallery-viewer-close">
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {viewer ? (
            <>
              <GalleryImage url={viewer.url} style={styles.viewerImage} resizeMode="contain" />
              {viewer.label ? <Text style={styles.viewerLabel}>{viewer.label}</Text> : null}
            </>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 14, marginBottom: 16, marginTop: -6 },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panel,
  },
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,6,17,0.75)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  label: { color: COLORS.text, fontFamily: FONTS.bodySemiBold, fontSize: 14 },
  emptyText: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 14, marginTop: 12 },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 48, right: 20, zIndex: 10, padding: 10 },
  viewerImage: { width: '100%', height: '78%' },
  viewerLabel: { color: COLORS.textSoft, fontFamily: FONTS.bodyMedium, fontSize: 15, marginTop: 14 },
});
