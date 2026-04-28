import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Calendar, Video, MapPin, FileText, Clock, X, Star } from 'lucide-react-native';
import { getAppointments, createReview } from '../../services/api';
import { useTheme } from '../../services/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAlert } from '../../services/AlertContext';
import { useTranslation } from 'react-i18next';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getInitials(firstName: string, lastName: string) {
  return `${(firstName || '').replace('Dr. ', '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) > new Date();
}

function isCancelable(dateStr: string) {
  const appointmentTime = new Date(dateStr).getTime();
  const now = new Date().getTime();
  return appointmentTime - now > 60 * 60 * 1000;
}

const AVATAR_COLORS = ['#fef3c7', '#ffedd5', '#e0f2fe', '#fce7f3', '#dcfce7'];
const TEXT_COLORS = ['#92400e', '#c2410c', '#0369a1', '#be185d', '#166534'];

export default function AppointmentsScreen() {
  const { colors, dark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const TABS = [
    { key: 'All', label: t('appointments.all') },
    { key: 'Upcoming', label: t('appointments.upcoming') },
    { key: 'Completed', label: t('appointments.completed') },
    { key: 'Cancelled', label: t('appointments.cancelled') },
  ];

  const [activeTab, setActiveTab] = useState(params.tab ? (params.tab as string) : 'All');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.tab) setActiveTab(params.tab as string);
  }, [params.tab]);

  const fetchData = useCallback(async () => {
    try {
      const data = await getAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const filteredAppointments = appointments.filter(app => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Upcoming') return app.status !== 'COMPLETED' && app.status !== 'CANCELLED' && isUpcoming(app.dateTime);
    if (activeTab === 'Completed') return app.status === 'COMPLETED';
    if (activeTab === 'Cancelled') return app.status === 'CANCELLED';
    return true;
  });

  const handleCancelAppointment = (appointment: any) => {
    showAlert({
      title: t('appointments.cancel_title'),
      message: t('appointments.cancel_message'),
      type: 'confirm',
      confirmLabel: t('appointments.cancel_btn'),
      onConfirm: () => {
        setAppointments(prev =>
          prev.map(a => a.id === appointment.id ? { ...a, status: 'CANCELLED' } : a)
        );
        showAlert({ title: t('appointments.cancelled_title'), message: t('appointments.cancelled_message'), type: 'success' });
      },
    });
  };

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleLeaveReview = (app: any) => {
    setReviewAppointment(app);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!reviewAppointment) return;
    setSubmittingReview(true);
    try {
      const doctor = reviewAppointment.doctor || {};
      await createReview({
        doctorId: reviewAppointment.doctorId || reviewAppointment.doctor_id,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      showAlert({
        title: t('appointments.review_success_title'),
        message: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        type: 'success',
      });
      setReviewModalVisible(false);
    } catch (e: any) {
      showAlert({ title: t('common.error'), message: e.message || 'Failed to submit review.', type: 'error' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusDisplay = (status: string, dateTime: string) => {
    if (status === 'COMPLETED') return { label: t('appointments.status_completed'), bgColor: dark ? '#1E3A5F' : '#EFF6FF', textColor: dark ? '#93C5FD' : '#1E63D3' };
    if (status === 'CANCELLED') return { label: t('appointments.status_cancelled'), bgColor: dark ? '#7F1D1D' : '#FEF2F2', textColor: dark ? '#FCA5A5' : '#EF4444' };
    if (isUpcoming(dateTime)) return { label: t('appointments.status_upcoming'), bgColor: dark ? '#1E3A5F' : '#EFF6FF', textColor: dark ? '#93C5FD' : '#1E63D3' };
    return { label: t('appointments.status_passed'), bgColor: dark ? '#334155' : '#F1F5F9', textColor: dark ? '#94A3B8' : '#64748B' };
  };

  const getTabCount = (key: string) => {
    if (key === 'All') return appointments.length;
    if (key === 'Upcoming') return appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && isUpcoming(a.dateTime)).length;
    if (key === 'Completed') return appointments.filter(a => a.status === 'COMPLETED').length;
    if (key === 'Cancelled') return appointments.filter(a => a.status === 'CANCELLED').length;
    return 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E63D3" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>{t('appointments.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('appointments.title')}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, { backgroundColor: colors.card, borderColor: colors.border }, activeTab === tab.key && styles.activeTabButton]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab.key && styles.activeTabText]}>
                {tab.label} {getTabCount(tab.key) > 0 ? `(${getTabCount(tab.key)})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar color={colors.textSecondary} size={48} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t('appointments.no_appointments')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('appointments.no_appointments_sub')}</Text>
          </View>
        ) : (
          filteredAppointments.map((app, index) => {
            const doctor = app.doctor || {};
            const initials = getInitials(doctor.firstName || '', doctor.lastName || '');
            const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const color = TEXT_COLORS[index % TEXT_COLORS.length];
            const statusInfo = getStatusDisplay(app.status, app.dateTime);
            const isActive = app.status !== 'COMPLETED' && app.status !== 'CANCELLED';

            return (
              <View key={app.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: bg }]}>
                    <Text style={[styles.avatarText, { color }]}>{initials}</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={[styles.doctorName, { color: colors.text }]}>{doctor.firstName} {doctor.lastName}</Text>
                    <Text style={[styles.specialty, { color: colors.textSecondary }]}>{doctor.doctorProfile?.specialty || 'Specialist'}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusInfo.bgColor }]}>
                    <Text style={[styles.statusText, { color: statusInfo.textColor }]}>{statusInfo.label}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Calendar color={colors.textSecondary} size={16} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>{formatDate(app.dateTime)}</Text>
                  <Clock color={colors.textSecondary} size={16} style={{ marginLeft: 16 }} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>{formatTime(app.dateTime)}</Text>
                </View>

                <View style={styles.detailsRow}>
                  {app.type === 'IN_PERSON' ? <MapPin color={colors.textSecondary} size={16} /> : <Video color={colors.textSecondary} size={16} />}
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {app.type === 'IN_PERSON' ? t('appointments.in_person') : t('appointments.online')}
                  </Text>
                </View>

                {app.notes && (
                  <View style={styles.detailsRow}>
                    <FileText color={colors.textSecondary} size={16} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{app.notes}</Text>
                  </View>
                )}

                {isActive && isUpcoming(app.dateTime) && (
                  <View style={styles.actionsRow}>
                    {isCancelable(app.dateTime) ? (
                      <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: dark ? '#7F1D1D' : '#FEF2F2', flex: 1 }]} onPress={() => handleCancelAppointment(app)}>
                        <Text style={[styles.cancelBtnText, { color: dark ? '#FCA5A5' : '#EF4444' }]}>{t('appointments.cancel_btn')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.cancelBtn, { backgroundColor: dark ? '#334155' : '#F1F5F9', flex: 1, opacity: 0.7 }]}>
                        <Text style={[styles.cancelBtnText, { color: dark ? '#94A3B8' : '#64748B' }]}>{t('appointments.too_late_cancel')}</Text>
                      </View>
                    )}
                  </View>
                )}

                {(app.status === 'COMPLETED' || (isActive && !isUpcoming(app.dateTime))) && (
                  <TouchableOpacity style={[styles.reviewBtn, { backgroundColor: dark ? '#064E3B' : '#ECFDF5' }]} onPress={() => handleLeaveReview(app)}>
                    <Text style={[styles.reviewBtnText, { color: dark ? '#6EE7B7' : '#10B981' }]}>{t('appointments.write_review')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('appointments.review_title')}</Text>
                  <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                    <X color={colors.textSecondary} size={24} />
                  </TouchableOpacity>
                </View>
                {reviewAppointment && (
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    Dr. {reviewAppointment.doctor?.firstName} {reviewAppointment.doctor?.lastName}
                  </Text>
                )}

                <Text style={[styles.ratingLabel, { color: colors.text }]}>{t('appointments.rating_label')}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={{ padding: 4 }}>
                      <Star color="#F59E0B" fill={star <= reviewRating ? '#F59E0B' : 'transparent'} size={36} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.ratingLabel, { color: colors.text }]}>{t('appointments.comment_label')}</Text>
                <TextInput
                  style={[styles.commentInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder={t('appointments.comment_placeholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.submitReviewBtn, submittingReview && { opacity: 0.6 }]}
                  onPress={submitReview}
                  disabled={submittingReview}
                >
                  <Text style={styles.submitReviewBtnText}>
                    {submittingReview ? t('appointments.submitting') : t('appointments.submit_review')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 40, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  tabsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  tabButton: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    marginRight: 10, height: 40, justifyContent: 'center'
  },
  activeTabButton: { backgroundColor: '#1E63D3', borderColor: '#1E63D3' },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  activeTabText: { color: '#FFFFFF', fontWeight: 'bold' },
  listContainer: { padding: 20, gap: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 15, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  doctorInfo: { flex: 1, justifyContent: 'center', paddingTop: 4 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  specialty: { fontSize: 14, color: '#64748B' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailText: { fontSize: 14, color: '#4B5563', marginLeft: 8 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  reviewBtn: { marginTop: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center' },
  reviewBtnText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748B', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  ratingLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  commentInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 100, marginBottom: 20 },
  submitReviewBtn: { backgroundColor: '#1E63D3', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitReviewBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
