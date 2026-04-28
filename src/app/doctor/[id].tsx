import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, MapPin, Calendar, FileText, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Phone, Mail, Building2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Linking, View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useTheme } from '../../services/theme';
import { useAlert } from '../../services/AlertContext';
import { useTranslation } from 'react-i18next';
import { createAppointment, getDoctorAppointmentsForDate, getReviews, getDoctor, getClinicByName } from '../../services/api';

const AVATAR_COLORS = ['#fef3c7', '#ffedd5', '#e0f2fe', '#fce7f3', '#dcfce7', '#f3e8ff'];
const TEXT_COLORS = ['#92400e', '#c2410c', '#0369a1', '#be185d', '#166534', '#7e22ce'];

// Generate time slots
function generateTimeSlots(date?: Date) {
  const slots = [];
  const now = new Date();
  const isToday = date && date.toDateString() === now.toDateString();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  for (let h = 9; h <= 17; h++) {
    const min00 = h * 60;
    const min30 = h * 60 + 30;
    
    if (!isToday || min00 > currentMins) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    if (h < 17 && (!isToday || min30 > currentMins)) {
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
}

// Generate dates: rest of this month + next month
function generateDates() {
  const dates = [];
  const today = new Date();
  // Get remaining days this month
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - today.getDate();
  // Also add next month
  const daysInNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
  const totalDays = daysRemaining + daysInNextMonth + 1; // +1 for today
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateLabel(date: Date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function formatDateNum(date: Date) {
  return date.getDate().toString();
}

function formatMonth(date: Date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function isToday(date: Date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export default function DoctorBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, dark } = useTheme();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  // Parse doctor data from params
  const doctorName = (params.name as string) || 'Doctor';
  const specialty = (params.specialty as string) || 'Specialist';
  const experience = (params.experience as string) || '0';
  const rating = (params.rating as string) || '4.8';
  const reviews = (params.reviews as string) || '0';
  const doctorId = params.id as string;
  const initials = (params.initials as string) || doctorName.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  const colorIndex = (doctorId?.charCodeAt(0) || 0) % AVATAR_COLORS.length;

  const dates = generateDates();
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const timeSlots = generateTimeSlots(selectedDate);

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [doctorReviews, setDoctorReviews] = useState<any[]>([]);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [clinicData, setClinicData] = useState<any>(null);
  const [fetchingData, setFetchingData] = useState(true);

  // Fetch reviews from DB
  useEffect(() => {
    async function fetchReviews() {
      if (!doctorId) return;
      try {
        const data = await getReviews(doctorId);
        setDoctorReviews(data);
      } catch {}
    }
    fetchReviews();
  }, [doctorId]);

  // Fetch full doctor and clinic data
  useEffect(() => {
    async function fetchFullData() {
      setFetchingData(true);
      try {
        const fullDoc = await getDoctor(doctorId);
        setDoctorData(fullDoc);
        
        if (fullDoc?.doctor_profiles?.clinic_name) {
          const clinic = await getClinicByName(fullDoc.doctor_profiles.clinic_name);
          setClinicData(clinic);
        }
      } catch (err) {
        console.error('Error fetching doctor/clinic data:', err);
      } finally {
        setFetchingData(false);
      }
    }
    fetchFullData();
  }, [doctorId]);

  // Compute live rating from reviews
  const liveRating = doctorReviews.length > 0
    ? (doctorReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / doctorReviews.length).toFixed(1)
    : rating;
  const liveReviewCount = doctorReviews.length > 0 ? doctorReviews.length.toString() : reviews;

  // Fetch pre-booked slots from DB
  useEffect(() => {
    async function fetchBooked() {
      if (!doctorId || !selectedDate) return;
      const slots = await getDoctorAppointmentsForDate(doctorId, selectedDate.toISOString());
      setBookedSlots(slots);
    }
    fetchBooked();
  }, [doctorId, selectedDate]);

  const availableTimeSlots = timeSlots.filter(s => !bookedSlots.includes(s));

  // Reset selected time if it becomes invalid on a different day
  useEffect(() => {
    if (selectedTime && !availableTimeSlots.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [selectedDate, availableTimeSlots]);

  const handleBook = async () => {
    if (!selectedTime) {
      showAlert({
        title: t('doctor.select_time'),
        message: t('doctor.select_time_error'),
        type: 'info'
      });
      return;
    }

    setLoading(true);
    try {
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await createAppointment({
        doctorId,
        dateTime: dateTime.toISOString(),
        type: 'IN_PERSON',
        notes: notes || undefined,
      });
      setBooked(true);
    } catch (error: any) {
      showAlert({
        title: t('doctor.booking_failed'),
        message: error.message || t('common.error'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (booked) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: colors.background }]}>
        <View style={styles.successCircle}>
          <CheckCircle color="#FFF" size={48} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>{t('doctor.success_title')}</Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
          {t('doctor.success_msg', { 
            doctor: doctorName, 
            date: selectedDate.toLocaleDateString(t('common.locale', 'en-US'), { weekday: 'long', month: 'long', day: 'numeric' }), 
            time: selectedTime 
          })}
        </Text>
        <TouchableOpacity style={styles.successButton} onPress={() => router.push('/(tabs)/appointments')}>
          <Text style={styles.successButtonText}>{t('doctor.view_appointments')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.successSecondary} onPress={() => router.back()}>
          <Text style={styles.successSecondaryText}>{t('doctor.back_to_home')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('doctor.book_appointment')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Doctor Info Card - Tappable to expand */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setProfileExpanded(!profileExpanded)}
          style={[styles.doctorCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, flexDirection: 'column' }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[colorIndex] }]}>
              <Text style={[styles.avatarText, { color: TEXT_COLORS[colorIndex] }]}>{initials}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={[styles.doctorName, { color: colors.text }]}>{doctorName}</Text>
              <Text style={[styles.doctorSpecialty, { color: colors.textSecondary }]}>{specialty}</Text>
              <View style={styles.ratingRow}>
                <Star color="#F59E0B" fill="#F59E0B" size={14} />
                <Text style={[styles.ratingText, { color: colors.text }]}>{liveRating}</Text>
                <Text style={styles.ratingCount}>({liveReviewCount} {t('doctor.reviews_count')})</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.expText}>{experience}{t('doctor.years_exp')}</Text>
              </View>
            </View>
            {profileExpanded
              ? <ChevronUp color={colors.textSecondary} size={20} />
              : <ChevronDown color={colors.textSecondary} size={20} />
            }
          </View>

          {/* Expanded reviews */}
          {profileExpanded && (
            <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
                {t('doctor.patient_reviews')} ({doctorReviews.length})
              </Text>
              {doctorReviews.length === 0 ? (
                <Text style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' }}>{t('doctor.no_reviews')}</Text>
              ) : (
                doctorReviews.slice(0, 10).map((review: any, idx: number) => {
                  const patientName = review.patient
                    ? `${review.patient.first_name || ''} ${review.patient.last_name || ''}`.trim()
                    : t('doctor.anonymous');
                  const reviewDate = new Date(review.created_at).toLocaleDateString(t('common.locale', 'en-US'), { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <View key={review.id || idx} style={[styles.reviewCard, { backgroundColor: dark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                      <View style={styles.reviewHeader}>
                        <View style={[styles.reviewAvatar, { backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }]}>
                          <Text style={{ color: TEXT_COLORS[idx % TEXT_COLORS.length], fontWeight: 'bold', fontSize: 14 }}>
                            {patientName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.reviewName, { color: colors.text }]}>{patientName}</Text>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>{reviewDate}</Text>
                        </View>
                        <View style={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} color="#F59E0B" fill={s <= review.rating ? '#F59E0B' : 'transparent'} size={12} />
                          ))}
                        </View>
                      </View>
                      {review.comment && (
                        <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.comment}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Consultation Type */}
        <View style={[styles.typeCard, styles.typeCardActive, { marginBottom: 12, backgroundColor: dark ? '#1E3A5F' : '#EFF6FF', borderColor: '#1E63D3' }]}>
          <MapPin color="#1E63D3" size={24} />
          <Text style={[styles.typeText, styles.typeTextActive]}>{t('doctor.in_person')}</Text>
          <Text style={[styles.typeSubtext, { color: colors.textSecondary }]}>{t('doctor.visit_clinic')}</Text>
        </View>

        {/* Doctor Bio & Contact */}
        <View style={[styles.infoSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('doctor.about')}</Text>
          <Text style={[styles.bioText, { color: colors.textSecondary }]}>
            {doctorData?.doctor_profiles?.description || t('doctor.no_description')}
          </Text>
          
          <View style={styles.contactRow}>
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: dark ? '#1E293B' : '#F1F5F9' }]}
              onPress={() => {
                const phone = doctorData?.doctor_profiles?.contact_phone;
                if (phone) Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
                else showAlert({ title: t('common.info'), message: t('doctor.no_phone'), type: 'info' });
              }}
            >
              <Phone size={18} color="#1E63D3" />
              <Text style={[styles.contactButtonText, { color: colors.text }]}>{t('doctor.call')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: dark ? '#1E293B' : '#F1F5F9' }]}
              onPress={() => {
                const email = doctorData?.doctor_profiles?.contact_email;
                if (email) Linking.openURL(`mailto:${email}`);
                else showAlert({ title: t('common.info'), message: t('doctor.no_email'), type: 'info' });
              }}
            >
              <Mail size={18} color="#1E63D3" />
              <Text style={[styles.contactButtonText, { color: colors.text }]}>{t('doctor.email')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clinic Info */}
        {clinicData && (
          <View style={[styles.infoSection, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 28 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Building2 size={20} color="#1E63D3" style={{ marginRight: 8 }} />
              <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>{clinicData.name}</Text>
            </View>
            <Text style={[styles.bioText, { color: colors.textSecondary, marginBottom: 12 }]}>
              {clinicData.description || t('doctor.default_clinic_desc')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>{clinicData.location}</Text>
            </View>
          </View>
        )}

        {/* Date Selection */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Calendar color={colors.text} size={16} /> {t('doctor.select_date')}
        </Text>
        <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{formatMonth(selectedDate)}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {dates.map((date, index) => {
            const selected = date.toDateString() === selectedDate.toDateString();
            const today = isToday(date);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateCard, { backgroundColor: colors.card, borderColor: colors.border }, selected && styles.dateCardActive]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDayLabel, { color: colors.textSecondary }, selected && styles.dateDayLabelActive]}>
                  {today ? t('doctor.today') : date.toLocaleDateString(t('common.locale', 'en-US'), { weekday: 'short' })}
                </Text>
                <Text style={[styles.dateNum, { color: colors.text }, selected && styles.dateNumActive]}>{formatDateNum(date)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time Selection */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Clock color={colors.text} size={16} /> {t('doctor.select_time')}
        </Text>
        <View style={styles.timeGrid}>
          {availableTimeSlots.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontStyle: 'italic', paddingVertical: 10 }}>{t('doctor.no_slots')}</Text>
          ) : (
            availableTimeSlots.map(slot => {
              const selected = slot === selectedTime;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeSlot, { backgroundColor: colors.card, borderColor: colors.border }, selected && styles.timeSlotActive]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Text style={[styles.timeSlotText, { color: colors.textSecondary }, selected && styles.timeSlotTextActive]}>{slot}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Notes */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <FileText color={colors.text} size={16} /> {t('doctor.notes_label')}
        </Text>
        <TextInput
          style={[styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder={t('doctor.notes_placeholder')}
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Summary */}
        {selectedTime ? (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>{t('doctor.appointment_summary')}</Text>
            <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('doctor.doctor')}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{doctorName}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('doctor.date')}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedDate.toLocaleDateString(t('common.locale', 'en-US'), { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('doctor.time')}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedTime}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('doctor.type')}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{t('doctor.in_person_visit')}</Text>
            </View>
          </View>
        ) : null}

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, !selectedTime && styles.bookButtonDisabled, loading && { opacity: 0.7 }]}
          onPress={handleBook}
          disabled={!selectedTime || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.bookButtonText}>{t('doctor.confirm_booking')}</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Doctor Card
  doctorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 16, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  doctorInfo: { flex: 1 },
  infoSection: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  doctorSpecialty: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginLeft: 4 },
  ratingCount: { fontSize: 12, color: '#9CA3AF', marginLeft: 2 },
  dot: { fontSize: 12, color: '#9CA3AF', marginHorizontal: 6 },
  expText: { fontSize: 12, color: '#9CA3AF' },
  priceTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  priceTagText: { fontSize: 13, fontWeight: 'bold', color: '#1E63D3' },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  monthLabel: { fontSize: 13, color: '#64748B', marginBottom: 10 },

  // Consultation Type
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  typeCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 2, borderColor: '#F1F5F9',
  },
  typeCardActive: { borderColor: '#1E63D3', backgroundColor: '#EFF6FF' },
  typeText: { fontSize: 14, fontWeight: '600', color: '#64748B', marginTop: 8 },
  typeTextActive: { color: '#1E63D3' },
  typeSubtext: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Dates
  dateScroll: { marginBottom: 28 },
  dateCard: {
    width: 64, height: 76, borderRadius: 16, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  dateCardActive: { backgroundColor: '#1E63D3', borderColor: '#1E63D3' },
  dateDayLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  dateDayLabelActive: { color: '#FFFFFF', opacity: 0.8 },
  dateNum: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  dateNumActive: { color: '#FFFFFF' },

  // Time Slots
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  timeSlot: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9',
  },
  timeSlotActive: { backgroundColor: '#1E63D3', borderColor: '#1E63D3' },
  timeSlotText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  timeSlotTextActive: { color: '#FFFFFF', fontWeight: 'bold' },

  // Notes
  notesInput: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9', fontSize: 14, color: '#111827',
    minHeight: 80, marginBottom: 24,
  },

  // Summary
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  summaryLabel: { fontSize: 14, color: '#64748B' },
  summaryValue: { fontSize: 14, color: '#111827', fontWeight: '500' },

  // Book Button
  bookButton: {
    backgroundColor: '#1E63D3', borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center',
  },
  bookButtonDisabled: { backgroundColor: '#CBD5E1' },
  bookButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  // Success Screen
  successCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  successSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  successButton: {
    backgroundColor: '#1E63D3', borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 12,
  },
  successButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  successSecondary: { paddingVertical: 12 },
  successSecondaryText: { fontSize: 14, color: '#64748B' },

  // Reviews
  reviewCard: {
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
  },
  reviewAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  reviewName: { fontSize: 13, fontWeight: '600' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, lineHeight: 18 },
});
