import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../services/theme';
import { getCurrentUser, setCurrentUser } from '../services/api';
import { supabase } from '../services/supabase';
import { useAlert } from '../services/AlertContext';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const user = getCurrentUser();
  const { showAlert } = useAlert();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  // Load fresh data from DB using the live auth session
  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('auth_id', authUser.id)
        .single();

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || authUser.email || '');
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get live auth user — never rely on in-memory authId
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        showAlert({ 
          title: 'Error', 
          message: 'Session expired. Please log out and log in again.', 
          type: 'error' 
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_id', authUser.id);

      if (error) throw error;

      // Update in-memory user so profile tab reflects changes immediately
      if (user) {
        setCurrentUser({ ...user, firstName, lastName });
      }

      showAlert({ 
        title: 'Saved ✓', 
        message: 'Your profile has been updated successfully.', 
        type: 'success' 
      });
    } catch (e: any) {
      showAlert({ 
        title: 'Error', 
        message: e.message || 'Failed to save. Please try again.', 
        type: 'error' 
      });
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
