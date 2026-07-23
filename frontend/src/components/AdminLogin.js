import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { GradientButton } from './ui';

export default function AdminLogin({ password, setPassword, error, loggingIn, onLogin, onClose }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.loginWrap}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} testID="admin-close">
          <Ionicons name="close" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <MaterialCommunityIcons name="shield-lock" size={52} color={COLORS.pink} style={{ marginBottom: 16 }} />
        <Text style={styles.loginTitle}>Staff Login</Text>
        <Text style={styles.loginSub}>Enter the admin password to view incoming leads.</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Admin password"
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={onLogin}
          testID="admin-password-input"
        />
        {error ? (
          <Text style={styles.error} testID="admin-error">
            {error}
          </Text>
        ) : null}
        <GradientButton
          title="Sign In"
          onPress={onLogin}
          loading={loggingIn}
          testID="admin-login-btn"
          style={{ alignSelf: 'stretch', marginTop: 6 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  loginWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  closeBtn: { position: 'absolute', top: 18, right: 18, padding: 8 },
  loginTitle: { color: COLORS.text, fontFamily: FONTS.display, fontSize: 26, marginBottom: 8 },
  loginSub: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  input: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 15,
    marginBottom: 14,
  },
  error: {
    color: COLORS.danger,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13.5,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
});
