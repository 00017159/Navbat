import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Image, Alert } from 'react-native';
import { ArrowLeft, Heart, Globe, Mail, Phone, ChevronUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../services/theme';

export default function AboutScreen() {
  const router = useRouter();
  const { colors, dark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About ClinicUz</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image source={require('../../assets/images/clinicuz-logo.png')} style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16 }} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.text }]}>ClinicUz</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your Healthcare Companion</Text>
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Our Mission</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            ClinicUz makes healthcare accessible to everyone in Uzbekistan. Book free appointments with qualified doctors, 
            manage your medical records, and get AI-powered health guidance — all in one app.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Features</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>🏥  Free doctor appointments</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>📋  Digital medical records</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>🤖  AI health assistant</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>🔒  Secure & private</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>🌙  Dark mode support</Text>
        </View>

        {/* Contact */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Contact Us</Text>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:sadullayevshohjahon990@gmail.com').catch(() => Alert.alert('Error', 'No email app found on your device.'))}>
            <Mail color={colors.primary} size={18} />
            <Text style={[styles.contactText, { color: colors.primary }]}>sadullayevshohjahon990@gmail.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('tel:+998907192922').catch(() => Alert.alert('Error', 'No phone app found on your device.'))}>
            <Phone color={colors.primary} size={18} />
            <Text style={[styles.contactText, { color: colors.primary }]}>+998 90 719 29 22</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Made with <Heart color="#EF4444" fill="#EF4444" size={12} /> in Tashkent, Uzbekistan
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>© 2026 ClinicUz. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 20, borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },
  logoSection: { alignItems: 'center', marginBottom: 32, marginTop: 12 },
  logo: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#1E63D3',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  appName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  version: { fontSize: 14, marginBottom: 4 },
  tagline: { fontSize: 14 },
  card: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  cardDesc: { fontSize: 14, lineHeight: 22 },
  featureItem: { fontSize: 14, lineHeight: 28 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  contactText: { fontSize: 14, fontWeight: '500' },
  footer: { alignItems: 'center', marginTop: 16 },
  footerText: { fontSize: 12, lineHeight: 20 },
});
