import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { User, Lock, HelpCircle, Info, ChevronRight, LogOut, Moon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser, signOut } from '../../services/api';
import { useTheme } from '../../services/theme';

const SETTINGS_ITEMS = [
  { id: 1, icon: 'User', title: 'Personal Information', description: 'Name, email, phone number' },
  { id: 3, icon: 'Lock', title: 'Privacy & Security', description: 'Password, 2FA, data' },
  { id: 4, icon: 'HelpCircle', title: 'Help & Support', description: 'FAQ, contact us, report' },
  { id: 5, icon: 'Info', title: 'About Navbat', description: 'Version, terms, licenses' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const user = getCurrentUser();
  const { dark, toggle, colors } = useTheme();

  const displayRole = user?.role === 'DOCTOR' ? 'Doctor' : user?.role === 'ADMIN' ? 'Admin' : 'Patient';
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const displayEmail = user?.email || '';
  const initials = user
    ? `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase()
    : 'U';

  const getIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'User': return <User color={color} size={20} />;
      case 'Lock': return <Lock color={color} size={20} />;
      case 'HelpCircle': return <HelpCircle color={color} size={20} />;
      case 'Info': return <Info color={color} size={20} />;
      default: return <ChevronRight color={color} size={20} />;
    }
  };

  const handleSettingsPress = (item: typeof SETTINGS_ITEMS[number]) => {
    switch (item.id) {
      case 1:
        Alert.alert(
          'Personal Information',
          `Name: ${displayName}\nEmail: ${displayEmail}\nRole: ${displayRole}\n\nEditing will be available in the next update.`,
        );
        break;
      case 3:
        Alert.alert(
          'Privacy & Security',
          'Security options:',
          [
            { text: 'Change Password', onPress: () => Alert.alert('Change Password', 'Password change feature coming soon.') },
            { text: 'Enable 2FA', onPress: () => Alert.alert('Two-Factor Auth', '2FA setup coming in the next update.') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        break;
      case 4:
        Alert.alert(
          'Help & Support',
          'How can we help?',
          [
            { text: 'FAQ', onPress: () => Alert.alert('FAQ', 'Frequently asked questions will be available soon.') },
            { text: 'Contact Support', onPress: () => Alert.alert('Contact', 'Email: support@navbat.uz\nPhone: +998 71 555 0000') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        break;
      case 5:
        Alert.alert(
          'About Navbat',
          'Navbat v1.0.0\n\nYour Healthcare Companion\n\n© 2026 Navbat. All rights reserved.\n\nBuilt with ❤️ in Tashkent, Uzbekistan',
        );
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
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
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.toggleRow, styles.settingsRowLast]}>
            <View style={[styles.settingsIcon, { backgroundColor: dark ? '#334155' : '#EFF6FF' }]}>
              <Moon color={colors.primary} size={20} />
            </View>
            <Text style={[styles.settingsTitle, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={dark}
              onValueChange={toggle}
              trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
              thumbColor={dark ? '#3B82F6' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Settings Menu */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SETTINGS</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SETTINGS_ITEMS.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.settingsRow, 
                index === SETTINGS_ITEMS.length - 1 ? styles.settingsRowLast : null,
                { borderBottomColor: colors.border }
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

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#EF4444" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textSecondary }]}>Navbat v1.0.0</Text>

      </ScrollView>
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
    alignItems: 'center', justifyContent: 'center', marginBottom: 16
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#991B1B' },
  userName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  rolePill: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12
  },
  roleText: { fontSize: 13, fontWeight: '600', color: '#1E63D3' },
  sectionTitle: {
    fontSize: 12, fontWeight: 'bold', letterSpacing: 1,
    marginBottom: 12, paddingHorizontal: 4
  },
  settingsCard: {
    borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, marginBottom: 24
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
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  settingsTitle: { flex: 1, fontSize: 16 },
  settingsItemTitle: { fontSize: 16 },
  settingsDescription: { fontSize: 12, marginTop: 2 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, marginBottom: 8
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
  versionText: { textAlign: 'center', fontSize: 12, marginBottom: 20 },
});
