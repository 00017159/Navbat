import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { User, Bell, Lock, HelpCircle, Info, ChevronRight, LogOut, Shield, Moon, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser, setAuthToken, setCurrentUser } from '../../services/api';

const SETTINGS_ITEMS = [
  { id: 1, icon: 'User', title: 'Personal Information', description: 'Name, email, phone number' },
  { id: 2, icon: 'Bell', title: 'Notifications', description: 'Push, email, SMS preferences' },
  { id: 3, icon: 'Lock', title: 'Privacy & Security', description: 'Password, 2FA, data' },
  { id: 4, icon: 'HelpCircle', title: 'Help & Support', description: 'FAQ, contact us, report' },
  { id: 5, icon: 'Info', title: 'About NavbatUz', description: 'Version, terms, licenses' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const user = getCurrentUser();
  const [activeRole, setActiveRole] = useState(user?.role || 'PATIENT');
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const displayRole = activeRole === 'PATIENT' ? 'Patient' : activeRole === 'DOCTOR' ? 'Doctor' : 'Admin';
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Alisher Qodirov';
  const displayEmail = user?.email || 'patient@navbat.uz';
  const initials = user
    ? `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase()
    : 'AQ';

  const getIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'User': return <User color={color} size={20} />;
      case 'Bell': return <Bell color={color} size={20} />;
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
          `Name: ${displayName}\nEmail: ${displayEmail}\nRole: ${displayRole}\nPhone: +998 90 123 45 67\n\nEditing will be available in the next update.`,
        );
        break;
      case 2:
        Alert.alert(
          'Notification Settings',
          'Choose your notification preferences:',
          [
            { text: 'Push Only', onPress: () => Alert.alert('Saved', 'Push notifications enabled') },
            { text: 'Email + Push', onPress: () => Alert.alert('Saved', 'Email and push notifications enabled') },
            { text: 'Cancel', style: 'cancel' },
          ]
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
          'About NavbatUz',
          'NavbatUz v1.0.0\n\nYour Healthcare Companion\n\n© 2026 NavbatUz. All rights reserved.\n\nBuilt with ❤️ in Tashkent, Uzbekistan',
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
          onPress: () => {
            setAuthToken(null);
            setCurrentUser(null);
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleRoleSwitch = (role: string) => {
    const roleMap: Record<string, string> = { Patient: 'PATIENT', Doctor: 'DOCTOR', Admin: 'ADMIN' };
    setActiveRole(roleMap[role]);
    Alert.alert('Role Switched', `You are now viewing as: ${role}\n\nNote: In production, this would be controlled by your account permissions.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{displayRole}</Text>
          </View>
        </View>

        {/* Quick Toggles */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.settingsCard}>
          <View style={styles.toggleRow}>
            <View style={styles.settingsIcon}>
              <Bell color="#1E63D3" size={20} />
            </View>
            <Text style={styles.settingsTitle}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => {
                setNotificationsEnabled(val);
                Alert.alert(val ? 'Enabled' : 'Disabled', `Notifications ${val ? 'enabled' : 'disabled'}`);
              }}
              trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
              thumbColor={notificationsEnabled ? '#1E63D3' : '#94A3B8'}
            />
          </View>
          <View style={[styles.toggleRow, styles.settingsRowLast]}>
            <View style={styles.settingsIcon}>
              <Moon color="#1E63D3" size={20} />
            </View>
            <Text style={styles.settingsTitle}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={(val) => {
                setDarkMode(val);
                Alert.alert('Theme', `Dark mode ${val ? 'enabled' : 'disabled'}. Full theming coming soon!`);
              }}
              trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
              thumbColor={darkMode ? '#1E63D3' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Demo Role Switch */}
        <Text style={styles.sectionTitle}>DEMO ROLE SWITCH</Text>
        <View style={styles.roleSwitchContainer}>
          {['Patient', 'Doctor', 'Admin'].map(role => {
            const roleMap: Record<string, string> = { Patient: 'PATIENT', Doctor: 'DOCTOR', Admin: 'ADMIN' };
            const isActive = activeRole === roleMap[role];
            return (
              <TouchableOpacity 
                key={role} 
                style={[styles.roleBtn, isActive ? styles.roleBtnActive : null]}
                onPress={() => handleRoleSwitch(role)}
              >
                <Text style={[styles.roleBtnText, isActive ? styles.roleBtnTextActive : null]}>
                  {role} View
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Settings Menu */}
        <Text style={styles.sectionTitle}>SETTINGS</Text>
        <View style={styles.settingsCard}>
          {SETTINGS_ITEMS.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.settingsRow, 
                index === SETTINGS_ITEMS.length - 1 ? styles.settingsRowLast : null
              ]}
              onPress={() => handleSettingsPress(item)}
            >
              <View style={styles.settingsIcon}>
                {getIcon(item.icon, '#1E63D3')}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsTitle}>{item.title}</Text>
                <Text style={styles.settingsDescription}>{item.description}</Text>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#EF4444" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>NavbatUz v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 40, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 15, elevation: 2
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#991B1B' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  rolePill: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12
  },
  roleText: { fontSize: 13, fontWeight: '600', color: '#1E63D3' },
  sectionTitle: {
    fontSize: 12, fontWeight: 'bold', color: '#64748B', letterSpacing: 1,
    marginBottom: 12, paddingHorizontal: 4
  },
  roleSwitchContainer: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  roleBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12
  },
  roleBtnActive: { backgroundColor: '#1E63D3' },
  roleBtnText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  roleBtnTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  settingsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24
  },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  settingsRowLast: { borderBottomWidth: 0 },
  settingsIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  settingsTitle: { flex: 1, fontSize: 16, color: '#111827' },
  settingsDescription: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, marginBottom: 8
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
  versionText: { textAlign: 'center', fontSize: 12, color: '#CBD5E1', marginBottom: 20 },
});
