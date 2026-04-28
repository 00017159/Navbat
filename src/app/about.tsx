import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Image, Alert } from 'react-native';
import { ArrowLeft, Heart, Globe, Mail, Phone, ChevronUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../services/theme';
import { useTranslation } from 'react-i18next';

export default function AboutScreen() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('about_page.header')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image source={require('../../assets/images/clinicuz-logo.png')} style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16 }} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.text }]}>ClinicUz</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>{t('settings.version')} 1.0.0</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>{t('about_page.tagline')}</Text>
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('about_page.mission_title')}</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            {t('about_page.mission_desc')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('about_page.features_title')}</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>🏥  {t('about_page.feature_appointments')}</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>📋  {t('about_page.feature_records')}</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>🤖  {t('about_page.feature_ai')}</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>🔒  {t('about_page.feature_secure')}</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>🌙  {t('about_page.feature_dark')}</Text>
        </View>

        {/* Contact */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('about_page.contact_title')}</Text>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:sadullayevshohjahon990@gmail.com').catch(() => Alert.alert(t('common.error'), 'No email app found on your device.'))}>
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
            {t('about_page.footer_made_with')} <Heart color="#EF4444" fill="#EF4444" size={12} /> {t('about_page.footer_in')}
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>© 2026 ClinicUz. {t('about_page.copyright')}</Text>
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
