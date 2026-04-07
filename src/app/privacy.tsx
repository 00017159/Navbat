import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { ArrowLeft, Shield, Smartphone, Key, Eye } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../services/theme';
import { deleteAccount } from '../services/api';
import { CommonActions, useNavigation } from '@react-navigation/native';

export default function PrivacyScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  const handleAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
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
        }
      ]
    );
  };

  const sections = [
    {
      icon: <Shield color={colors.primary} size={20} />,
      title: 'Data Protection',
      description: 'Your health data is encrypted end-to-end and stored securely in Supabase cloud infrastructure with SOC2 compliance.',
    },
    {
      icon: <Key color="#F59E0B" size={20} />,
      title: 'Authentication',
      description: 'We use one-time email verification codes — no passwords stored. Your session is secured with JWT tokens.',
    },
    {
      icon: <Eye color="#10B981" size={20} />,
      title: 'Your Privacy Rights',
      description: 'You can request deletion of your account and all associated data at any time by contacting sadullayevshohjahon990@gmail.com.',
    },
    {
      icon: <Smartphone color="#8B5CF6" size={20} />,
      title: 'Device Security',
      description: 'Session data is stored in-memory only. Closing the app requires re-authentication for maximum security.',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
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
          <Text style={{ color: '#EF4444', fontWeight: '600' }}>Request Account Deletion</Text>
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
