import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Linking } from 'react-native';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { getCurrentUser, signOut } from '../../services/api';
import { useTheme } from '../../services/theme';
import { useAlert } from '../../services/AlertContext';
import { useTranslation } from 'react-i18next';
import { Globe, User, Lock, HelpCircle, Info, ChevronRight, LogOut, Moon } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { dark, toggle, colors } = useTheme();
  const { showAlert } = useAlert();
  const { t, i18n } = useTranslation();

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [user, setUser] = useState(getCurrentUser());

  useFocusEffect(
    useCallback(() => {
      setUser(getCurrentUser());
    }, [])
  );

  const displayRole =
    user?.role === 'DOCTOR'
      ? t('profile.role_doctor')
      : user?.role === 'ADMIN'
      ? t('profile.role_admin')
      : t('profile.role_patient');

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const displayEmail = user?.email || '';
  const initials = user
    ? `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase()
    : 'U';

  const getIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'User': return <User color={color} size={20} />;
      case 'Lock': return <Lock color={color} size={20} />;
      case 'Globe': return <Globe color={color} size={20} />;
      case 'HelpCircle': return <HelpCircle color={color} size={20} />;
      case 'Info': return <Info color={color} size={20} />;
      default: return <ChevronRight color={color} size={20} />;
    }
  };

  const currentLangName =
    i18n.language === 'uz' ? "O'zbekcha" : i18n.language === 'ru' ? 'Русский' : 'English';

  const settingsItems = [
    { id: 1, icon: 'User', title: t('profile.personal_info'), description: t('profile.personal_info_desc') },
    { id: 3, icon: 'Lock', title: t('profile.privacy_security'), description: t('profile.privacy_security_desc') },
    { id: 6, icon: 'Globe', title: t('profile.language'), description: currentLangName },
    { id: 4, icon: 'HelpCircle', title: t('profile.help_support'), description: t('profile.help_support_desc') },
    { id: 5, icon: 'Info', title: t('profile.about'), description: t('profile.about_desc') },
  ];

  const handleSettingsPress = (item: typeof settingsItems[number]) => {
    switch (item.id) {
      case 1:
        router.push('/personal-info' as any);
        break;
      case 3:
        router.push('/privacy' as any);
        break;
      case 6:
        setLanguageModalVisible(true);
        break;
      case 4:
        setHelpModalVisible(true);
        break;
      case 5:
        router.push('/about' as any);
        break;
    }
  };

  const handleLogout = () => {
    showAlert({
      title: t('profile.logout'),
      message: t('profile.logout_confirm') || 'Are you sure you want to log out?',
      type: 'confirm',
      confirmLabel: t('profile.logout'),
      onConfirm: async () => {
        try {
          await signOut();
        } finally {
          navigation.getParent()?.reset({
            index: 0,
            routes: [{ name: 'index' }],
          });
        }
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.header')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{displayEmail}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{displayRole}</Text>
          </View>
        </View>

        {/* Dark Mode Toggle */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profile.appearance')}</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.toggleRow, styles.settingsRowLast]}>
            <View style={[styles.settingsIcon, { backgroundColor: dark ? '#334155' : '#EFF6FF' }]}>
              <Moon color={colors.primary} size={20} />
            </View>
            <Text style={[styles.settingsTitle, { color: colors.text }]}>{t('profile.dark_mode')}</Text>
            <Switch
              value={dark}
              onValueChange={toggle}
              trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
              thumbColor={dark ? '#3B82F6' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Settings Menu */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profile.settings')}</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingsRow,
                index === settingsItems.length - 1 ? styles.settingsRowLast : null,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => handleSettingsPress(item)}
            >
              <View style={[styles.settingsIcon, { backgroundColor: dark ? '#334155' : '#EFF6FF' }]}>
                {getIcon(item.icon, colors.primary)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingsItemTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.settingsDescription, { color: colors.textSecondary }]}>{item.description}</Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: '#EF4444', marginTop: 12 }]}>{t('profile.danger_zone')}</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: '#FEE2E2', borderWidth: 1 }]}>
          <TouchableOpacity 
            style={[styles.settingsRow, styles.settingsRowLast]}
            onPress={() => {
              showAlert({
                title: t('profile.delete_account'),
                message: t('settings.delete_account_confirm'),
                type: 'confirm',
                confirmLabel: t('settings.request_deletion'),
                onConfirm: () => {
                  showAlert({ title: t('settings.request_sent_title'), message: t('settings.request_sent_msg'), type: 'success' });
                }
              });
            }}
          >
            <View style={[styles.settingsIcon, { backgroundColor: '#FEE2E2' }]}>
              <Lock color="#EF4444" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingsItemTitle, { color: '#EF4444' }]}>{t('profile.delete_account')}</Text>
              <Text style={[styles.settingsDescription, { color: colors.textSecondary }]}>{t('profile.delete_account_desc')}</Text>
            </View>
            <ChevronRight color="#EF4444" size={20} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#EF4444" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textSecondary }]}>ClinicUz v1.0.0</Text>

      </ScrollView>

      {/* Language Selection Modal */}
      {languageModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.langModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.langTitle, { color: colors.text }]}>{t('profile.select_language')}</Text>
            {[
              { code: 'en', name: 'English' },
              { code: 'uz', name: "O'zbekcha" },
              { code: 'ru', name: 'Русский' },
            ].map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langItem,
                  i18n.language === lang.code && {
                    backgroundColor: dark ? '#334155' : '#EFF6FF',
                  },
                ]}
                onPress={() => {
                  i18n.changeLanguage(lang.code);
                  setLanguageModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.langItemText,
                    { color: i18n.language === lang.code ? '#1E63D3' : colors.text },
                  ]}
                >
                  {lang.name}
                </Text>
                {i18n.language === lang.code && (
                  <View style={styles.langDot} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.langCancelBtn} onPress={() => setLanguageModalVisible(false)}>
              <Text style={[styles.langCancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Help & Support Modal */}
      {helpModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.langModal, { backgroundColor: colors.card, alignItems: 'center' }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(30, 99, 211, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <HelpCircle size={32} color="#1E63D3" />
            </View>
            <Text style={[styles.langTitle, { color: colors.text, marginBottom: 8 }]}>{t('profile.help_support')}</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 4, textAlign: 'center' }}>sadullayevshohjahon990@gmail.com</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>+998907192922</Text>
            
            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity 
                style={{ backgroundColor: '#1E63D3', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                onPress={() => {
                  setHelpModalVisible(false);
                  Linking.openURL('mailto:sadullayevshohjahon990@gmail.com').catch(() =>
                    showAlert({ title: t('common.error'), message: 'Unable to open email client', type: 'error' })
                  );
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>{t('common.email')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                onPress={() => {
                  setHelpModalVisible(false);
                  Linking.openURL('tel:+998907192922').catch(() =>
                    showAlert({ title: t('common.error'), message: 'Unable to open dialer', type: 'error' })
                  );
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>{t('common.call')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ backgroundColor: dark ? '#1E293B' : '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                onPress={() => setHelpModalVisible(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 16 }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  profileCard: {
    borderRadius: 24, padding: 24,
    alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 15, elevation: 2,
    borderWidth: 1,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#991B1B' },
  userName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  rolePill: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  roleText: { fontSize: 13, fontWeight: '600', color: '#1E63D3' },
  sectionTitle: {
    fontSize: 12, fontWeight: 'bold', letterSpacing: 1,
    marginBottom: 12, paddingHorizontal: 4,
  },
  settingsCard: {
    borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, marginBottom: 24,
  },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
  },
  settingsRowLast: { borderBottomWidth: 0 },
  settingsIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  settingsTitle: { flex: 1, fontSize: 16 },
  settingsItemTitle: { fontSize: 16 },
  settingsDescription: { fontSize: 12, marginTop: 2 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, marginBottom: 8,
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444', marginLeft: 8 },
  versionText: { textAlign: 'center', fontSize: 12, marginBottom: 20 },
  // Language modal styles
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  },
  langModal: {
    width: '85%', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 10,
  },
  langTitle: {
    fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20,
  },
  langItem: {
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12,
    marginBottom: 8, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  langItemText: { fontSize: 16, fontWeight: '600' },
  langDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E63D3' },
  langCancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  langCancelText: { fontWeight: '600', fontSize: 14 },
});
