import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { User, Bell, Lock, HelpCircle, Info, ChevronRight, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const SETTINGS_ITEMS = [
  { id: 1, icon: 'User', title: 'Personal Information' },
  { id: 2, icon: 'Bell', title: 'Notifications' },
  { id: 3, icon: 'Lock', title: 'Privacy & Security' },
  { id: 4, icon: 'HelpCircle', title: 'Help & Support' },
  { id: 5, icon: 'Info', title: 'About NavbatUz' }
];

export default function ProfileScreen() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState('Patient');

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AQ</Text>
          </View>
          <Text style={styles.userName}>Alisher Qodirov</Text>
          <Text style={styles.userEmail}>patient@navbat.uz</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{activeRole}</Text>
          </View>
        </View>

        {/* Demo Role Switch */}
        <Text style={styles.sectionTitle}>DEMO ROLE SWITCH</Text>
        <View style={styles.roleSwitchContainer}>
          {['Patient', 'Doctor', 'Admin'].map(role => (
            <TouchableOpacity 
              key={role} 
              style={[
                styles.roleBtn, 
                activeRole === role ? styles.roleBtnActive : null
              ]}
              onPress={() => setActiveRole(role)}
            >
              <Text 
                style={[
                  styles.roleBtnText, 
                  activeRole === role ? styles.roleBtnTextActive : null
                ]}
              >
                {role} View
              </Text>
            </TouchableOpacity>
          ))}
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
            >
              <View style={styles.settingsIcon}>
                {getIcon(item.icon, '#1E63D3')}
              </View>
              <Text style={styles.settingsTitle}>{item.title}</Text>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => router.replace('/')}
        >
          <LogOut color="#EF4444" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

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
  settingsRowLast: { borderBottomWidth: 0 },
  settingsIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  settingsTitle: { flex: 1, fontSize: 16, color: '#111827' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, marginBottom: 20
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' }
});
