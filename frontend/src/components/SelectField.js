import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

export default function SelectField({ label, required, value, placeholder, options, onSelect, testID }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: COLORS.pink }}> *</Text> : null}
      </Text>
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)} activeOpacity={0.8} testID={testID}>
        <Text style={[styles.value, !value && { color: COLORS.placeholder }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    testID={`option-${item}`}
                  >
                    <Text style={[styles.optionText, selected && { color: COLORS.pink, fontFamily: FONTS.bodySemiBold }]}>
                      {item}
                    </Text>
                    {selected ? <Ionicons name="checkmark" size={18} color={COLORS.pink} /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { color: COLORS.textSoft, fontFamily: FONTS.bodyMedium, fontSize: 14, marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  value: { color: COLORS.text, fontFamily: FONTS.body, fontSize: 15, flex: 1, marginRight: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.panelSoft,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
    marginBottom: 14,
  },
  sheetTitle: { color: COLORS.text, fontFamily: FONTS.heading, fontSize: 18, marginBottom: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionSelected: { backgroundColor: 'rgba(255,95,176,0.08)' },
  optionText: { color: COLORS.textSoft, fontFamily: FONTS.body, fontSize: 15 },
});
