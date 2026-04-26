import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Dimensions, Image } from 'react-native';
import { Mail, ChevronUp, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { requestOtp, verifyOtp } from '../services/api';
import { useAlert } from '../services/AlertContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;
const OTP_INPUT_SIZE = Math.min((width - 80) / OTP_LENGTH, 48);

type Step = 'email' | 'otp';

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { showAlert } = useAlert();
  const { t, i18n } = useTranslation();

  const handleRequestOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showAlert({ 
        title: 'Invalid Email', 
        message: 'Please enter a valid email address', 
        type: 'error' 
      });
      return;
    }
    setLoading(true);
    try {
      await requestOtp(email);
      setStep('otp');
      showAlert({
        title: 'Code Sent',
        message: `A 6-digit verification code has been sent to ${email}`,
        type: 'success'
      });
    } catch (error: any) {
      showAlert({
        title: 'Error',
        message: error.message || 'Failed to connect to the server',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newDigits = [...otpDigits];
    newDigits[index] = text;
    setOtpDigits(newDigits);

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (text && index === OTP_LENGTH - 1) {
      Keyboard.dismiss();
      const code = [...newDigits.slice(0, OTP_LENGTH - 1), text].join('');
      if (code.length === OTP_LENGTH) {
        handleVerifyOtp(code);
      }
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...otpDigits];
      newDigits[index - 1] = '';
      setOtpDigits(newDigits);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const otpCode = code || otpDigits.join('');
    if (otpCode.length !== OTP_LENGTH) {
      showAlert({
        title: 'Invalid Code',
        message: `Please enter the ${OTP_LENGTH}-digit code`,
        type: 'error'
      });
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otpCode);
      router.replace('/(tabs)');
    } catch (error: any) {
      showAlert({
        title: 'Invalid Code',
        message: error.message || 'The verification code is incorrect or expired. Please try again.',
        type: 'error'
      });
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await requestOtp(email);
      showAlert({
        title: 'Code Resent',
        message: `A new code has been sent to ${email}`,
        type: 'success'
      });
    } catch (error: any) {
      showAlert({
        title: 'Error',
        message: error.message || 'Failed to resend code',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.langSwitcher}>
              {['en', 'uz', 'ru'].map(l => (
                <TouchableOpacity 
                  key={l}
                  onPress={() => i18n.changeLanguage(l)}
                  style={[
                    styles.langBtn,
                    i18n.language === l && styles.langBtnActive
                  ]}
                >
                  <Text style={[
                    styles.langBtnText,
                    i18n.language === l && styles.langBtnTextActive
                  ]}>
                    {l.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => { setStep('email'); setOtpDigits(['', '', '', '', '', '']); }}>
              <ArrowLeft color="#111827" size={24} />
            </TouchableOpacity>

            <View style={styles.otpHeader}>
              <View style={styles.shieldIcon}>
                <ShieldCheck color="#fff" size={32} />
              </View>
              <Text style={styles.otpTitle}>{t('auth.verify_title')}</Text>
              <Text style={styles.otpSubtitle}>{t('auth.verify_subtitle')}</Text>
              <Text style={styles.otpEmail}>{email}</Text>
            </View>

            <View style={styles.otpContainer}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => { inputRefs.current[index] = ref; }}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, loading && { opacity: 0.7 }]}
              onPress={() => handleVerifyOtp()}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.verifyButtonText}>{t('auth.verify_btn')}</Text>
              }
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <TouchableOpacity onPress={() => setStep('email')} disabled={loading}>
                <Text style={styles.resendLink}>{t('auth.back_to_email')}</Text>
              </TouchableOpacity>
            </View>



          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.langSwitcher}>
            {['en', 'uz', 'ru'].map(l => (
              <TouchableOpacity 
                key={l}
                onPress={() => i18n.changeLanguage(l)}
                style={[
                  styles.langBtn,
                  i18n.language === l && styles.langBtnActive
                ]}
              >
                <Text style={[
                  styles.langBtnText,
                  i18n.language === l && styles.langBtnTextActive
                ]}>
                  {l.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </div>

          <View style={styles.header}>
            <Image source={require('../../assets/images/clinicuz-logo-clean.png')} style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 12 }} resizeMode="contain" />
            <Text style={styles.brandTitle}>ClinicUz</Text>
            <Text style={styles.brandSubtitle}>{t('auth.subtitle')}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>{t('auth.title')}</Text>
            <Text style={styles.welcomeSubtext}>{t('auth.subtitle')}</Text>

            <Text style={styles.label}>{t('auth.email')}</Text>
            <View style={styles.inputContainer}>
              <Mail color="#94A3B8" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                returnKeyType="go"
                onSubmitEditing={handleRequestOtp}
              />
            </View>

            <TouchableOpacity
              style={[styles.signInButton, loading && { opacity: 0.7 }]}
              onPress={handleRequestOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.signInText}>{t('auth.send_code')}</Text>
              }
            </TouchableOpacity>
          </View>



        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  langSwitcher: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  langBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  langBtnTextActive: {
    color: '#1E63D3',
  },
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
    shadowRadius: 15, elevation: 2, marginBottom: 24
  },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  welcomeSubtext: { fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, height: 52,
    paddingHorizontal: 12, marginBottom: 16
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  signInButton: {
    backgroundColor: '#1E63D3', borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 8
  },
  signInText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  infoCard: {
    backgroundColor: '#EFF6FF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#1E40AF', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#1E40AF', lineHeight: 20, opacity: 0.8 },

  // OTP Screen
  backButton: { paddingVertical: 10, marginBottom: 10 },
  otpHeader: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  shieldIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  otpTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  otpSubtitle: { fontSize: 14, color: '#64748B' },
  otpEmail: { fontSize: 14, fontWeight: '600', color: '#1E63D3', marginTop: 4 },
  otpContainer: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32,
  },
  otpInput: {
    width: OTP_INPUT_SIZE, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF', textAlign: 'center', fontSize: 22, fontWeight: 'bold',
    color: '#111827',
  },
  otpInputFilled: { borderColor: '#1E63D3', backgroundColor: '#EFF6FF' },
  verifyButton: {
    backgroundColor: '#10B981', borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  verifyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  resendText: { fontSize: 14, color: '#64748B' },
  resendLink: { fontSize: 14, fontWeight: 'bold', color: '#1E63D3' },
  devBanner: {
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#FDE68A',
  },
  devBannerText: { fontSize: 13, color: '#92400E', fontWeight: '500' },
});
