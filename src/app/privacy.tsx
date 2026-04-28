import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { ArrowLeft, Shield, Smartphone, Key, Eye } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../services/theme';
import { deleteAccount } from '../services/api';
import { useAlert } from '../services/AlertContext';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export default function PrivacyScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const handleAccountDeletion = () => {
    showAlert({
      title: t('profile.delete_account'),
      message: t('settings.delete_account_confirm'),
      type: 'confirm',
      confirmLabel: t('common.confirm'),
      onConfirm: async () => {
        try {
          await deleteAccount();
        } finally {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'index' }],
            })
          );
        }
      }
    });
  };

  const sections = [
    {
      icon: <Shield color={colors.primary} size={20} />,
      title: t('privacy_page.data_protection'),
      description: t('privacy_page.data_protection_desc'),
    },
    {
      icon: <Key color="#F59E0B" size={20} />,
      title: t('privacy_page.auth'),
      description: t('privacy_page.auth_desc'),
    },
    {
      icon: <Eye color="#10B981" size={20} />,
      title: t('privacy_page.rights'),
      description: t('privacy_page.rights_desc'),
    },
    {
      icon: <Smartphone color="#8B5CF6" size={20} />,
      title: t('privacy_page.security'),
      description: t('privacy_page.security_desc'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.privacy_security')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: dark ? '#334155' : '#EFF6FF' }]}>
              {section.icon}
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{section.description}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.linkButton, { borderColor: colors.border }]}
          onPress={handleAccountDeletion}
        >
          <Text style={{ color: '#EF4444', fontWeight: '600' }}>{t('profile.delete_account')}</Text>
        </TouchableOpacity>
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
  content: { padding: 20 },
  card: {
    borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 16,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  cardDesc: { fontSize: 14, lineHeight: 20 },
  linkButton: {
    borderRadius: 12, borderWidth: 1, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
});
