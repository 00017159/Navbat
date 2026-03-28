import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Mail, Lock, EyeOff, Activity, User, ActivitySquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Navigate to tabs directly for demo
    router.replace('/(tabs)');
  };

  const loginWithDemo = (role: 'patient' | 'doctor') => {
    setEmail(role === 'patient' ? 'patient@navbat.uz' : 'doctor@navbat.uz');
    setPassword('demo123');
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Activity color="#fff" size={32} />
          </View>
          <Text style={styles.brandTitle}>NavbatUz</Text>
          <Text style={styles.brandSubtitle}>Your Healthcare Companion</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.welcomeSubtext}>Sign in to your account</Text>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Mail color="#94A3B8" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="patient@navbat.uz"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Lock color="#94A3B8" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.eyeIcon}>
              <EyeOff color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.demoSectionTitle}>DEMO ACCOUNTS</Text>
        
        <TouchableOpacity style={styles.demoCard} onPress={() => loginWithDemo('patient')}>
          <View style={styles.demoIconContainer}>
            <User color="#1F61C3" size={20} />
          </View>
          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>Patient</Text>
            <Text style={styles.demoEmail}>patient@navbat.uz</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.demoCard} onPress={() => loginWithDemo('doctor')}>
          <View style={styles.demoIconContainer}>
            <ActivitySquare color="#1F61C3" size={20} />
          </View>
          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>Doctor</Text>
            <Text style={styles.demoEmail}>doctor@navbat.uz</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  logoContainer: { 
    width: 64, height: 64, borderRadius: 16, 
    backgroundColor: '#1E63D3', alignItems: 'center', justifyContent: 'center', 
    marginBottom: 16 
  },
  brandTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  brandSubtitle: { fontSize: 14, color: '#64748B' },
  formCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    shadowRadius: 15, elevation: 2, marginBottom: 32
  },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  welcomeSubtext: { fontSize: 14, color: '#64748B', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8, marginTop: 12 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, height: 52,
    paddingHorizontal: 12, marginBottom: 16
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  eyeIcon: { padding: 4 },
  signInButton: {
    backgroundColor: '#1E63D3', borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 16
  },
  signInText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  demoSectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748B', paddingHorizontal: 4, marginBottom: 12, letterSpacing: 1 },
  demoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  demoIconContainer: { marginRight: 16, width: 24, alignItems: 'center' },
  demoInfo: { flex: 1 },
  demoTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  demoEmail: { fontSize: 14, color: '#64748B' }
});
