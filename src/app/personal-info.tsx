import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../services/theme';
import { getCurrentUser, getProfile } from '../services/api';
import { supabase } from '../services/supabase';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const user = getCurrentUser();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ first_name: firstName, last_name: lastName, updated_at: new Date().toISOString() })
        .eq('auth_id', user?.authId || user?.id);

      if (error) throw error;
      
      // Update local memory so changes reflect immediately in Profile tab
      import('../services/api').then(({ setCurrentUser }) => {
        if (user) {
          setCurrentUser({
            ...user,
            firstName,
            lastName,
          });
        }
      });

      Alert.alert('Saved', 'Your personal information has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Personal Information</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Save color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>First Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Last Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
        <View style={[styles.input, styles.readOnly, { backgroundColor: dark ? '#334155' : '#F1F5F9', borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary }}>{email}</Text>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="+998 XX XXX XX XX"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
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
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16,
  },
  readOnly: { justifyContent: 'center' },
  saveButton: {
    borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 32,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
