import React, { useEffect, useRef } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

function isActive(c) {
  return c.sharing && c.last_seen && Date.now() - new Date(c.last_seen).getTime() < 3 * 60000;
}

export default function TeamMap({ cleaners }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !divRef.current) return;
    const L = require('leaflet');
    if (!mapRef.current) {
      mapRef.current = L.map(divRef.current).setView([53.5461, -113.4938], 11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(mapRef.current);
      layerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    const layer = layerRef.current;
    layer.clearLayers();
    const pts = [];
    cleaners
      .filter((c) => c.lat != null && c.lng != null)
      .forEach((c) => {
        const active = isActive(c);
        const color = active ? '#4ADE80' : '#6E5F82';
        const marker = L.circleMarker([c.lat, c.lng], {
          radius: 9,
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 2,
        });
        marker.bindTooltip(`${c.name}${active ? ' — live' : ''}`, { permanent: true, direction: 'top', offset: [0, -10] });
        layer.addLayer(marker);
        pts.push([c.lat, c.lng]);
      });
    if (pts.length) mapRef.current.fitBounds(pts, { padding: [60, 60], maxZoom: 14 });
  }, [cleaners]);

  useEffect(
    () => () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    },
    []
  );

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          Map view is coming to the native app — use the track buttons in the list for now.
        </Text>
      </View>
    );
  }

  const hasPoints = cleaners.some((c) => c.lat != null && c.lng != null);
  return (
    <View style={styles.wrap} testID="team-map">
      <div ref={divRef} style={{ width: '100%', height: '100%' }} />
      {!hasPoints ? (
        <View style={[styles.overlay, { pointerEvents: 'none' }]}>
          <Text style={styles.fallbackText}>No cleaner locations yet — markers appear when someone shares.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.panel,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
    zIndex: 1000,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  fallbackText: {
    color: COLORS.textSoft,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: 'rgba(10,6,17,0.85)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
});
