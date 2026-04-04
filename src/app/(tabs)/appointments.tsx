import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Calendar, Video, MapPin, FileText, Clock, XCircle, CheckCircle } from 'lucide-react-native';
import { getAppointments, createAppointment } from '../../services/api';

const TABS = ['All', 'Upcoming', 'Completed', 'Cancelled'];

// Live data only
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatPrice(price: string | number) {
  const num = typeof price === 'string' ? parseInt(price, 10) : price;
  if (num >= 1000) return `${Math.round(num / 1000)}K so'm`;
  return `${num} so'm`;
}

function getInitials(firstName: string, lastName: string) {
  return `${(firstName || '').replace('Dr. ', '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) > new Date();
}

const AVATAR_COLORS = ['#fef3c7', '#ffedd5', '#e0f2fe', '#fce7f3', '#dcfce7'];
const TEXT_COLORS = ['#92400e', '#c2410c', '#0369a1', '#be185d', '#166534'];

export default function AppointmentsScreen() {
  const [activeTab, setActiveTab] = useState('All');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await getAppointments();
      if (Array.isArray(data) && data.length > 0) {
        setAppointments(data);
      } else {
        setAppointments([]);
      }
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel the appointment with ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: () => {
            setAppointments(prev =>
              prev.map(a => a.id === appointment.id ? { ...a, status: 'CANCELLED' } : a)
            );
            Alert.alert('Cancelled', 'Your appointment has been cancelled.');
          },
        },
      ]
    );
  };

  const handleReschedule = (appointment: any) => {
    Alert.alert(
      'Reschedule',
      `Rescheduling appointment with ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}.\n\nThis feature will be available soon.`,
      [{ text: 'OK' }]
    );
  };

  const getStatusDisplay = (status: string, dateTime: string): { label: string; bgColor: string; textColor: string } => {
    if (status === 'COMPLETED') return { label: 'Completed', bgColor: '#ECFDF5', textColor: '#10B981' };
    if (status === 'CANCELLED') return { label: 'Cancelled', bgColor: '#FEF2F2', textColor: '#EF4444' };
    if (isUpcoming(dateTime)) return { label: 'Upcoming', bgColor: '#EFF6FF', textColor: '#1E63D3' };
    return { label: status, bgColor: '#F1F5F9', textColor: '#64748B' };
  };

  const getTabCount = (tab: string) => {
    if (tab === 'All') return appointments.length;
    if (tab === 'Upcoming') return appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && isUpcoming(a.dateTime)).length;
    if (tab === 'Completed') return appointments.filter(a => a.status === 'COMPLETED').length;
    if (tab === 'Cancelled') return appointments.filter(a => a.status === 'CANCELLED').length;
    return 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E63D3" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>Loading appointments...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab} {getTabCount(tab) > 0 ? `(${getTabCount(tab)})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E63D3']} />}
      >
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar color="#CBD5E1" size={48} />
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} appointments</Text>
            <Text style={styles.emptySubtitle}>Your {activeTab.toLowerCase()} appointments will appear here</Text>
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
              <View key={app.id} style={styles.card}>
                
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: bg }]}>
                    <Text style={[styles.avatarText, { color }]}>{initials}</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.firstName} {doctor.lastName}</Text>
                    <Text style={styles.specialty}>{doctor.doctorProfile?.specialty || 'Specialist'}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusInfo.bgColor }]}>
                    <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Calendar color="#9CA3AF" size={16} />
                  <Text style={styles.detailText}>{formatDate(app.dateTime)}</Text>
                  <Clock color="#9CA3AF" size={16} style={{ marginLeft: 16 }} />
                  <Text style={styles.detailText}>{formatTime(app.dateTime)}</Text>
                </View>

                <View style={styles.detailsRow}>
                  {app.type === 'IN_PERSON' ? <MapPin color="#9CA3AF" size={16} /> : <Video color="#9CA3AF" size={16} />}
                  <Text style={styles.detailText}>{app.type === 'IN_PERSON' ? 'In-Person Visit' : 'Online Consultation'}</Text>
                </View>

                {app.notes && (
                  <View style={styles.detailsRow}>
                    <FileText color="#9CA3AF" size={16} />
                    <Text style={styles.detailText}>{app.notes}</Text>
                  </View>
                )}

                <Text style={styles.priceText}>{formatPrice(app.price || '0')}</Text>

                {/* Action Buttons */}
                {isActive && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.rescheduleBtn} onPress={() => handleReschedule(app)}>
                      <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelAppointment(app)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {app.status === 'COMPLETED' && (
                  <TouchableOpacity style={styles.reviewBtn} onPress={() => Alert.alert('Review', 'Leave a review feature coming soon!')}>
                    <Text style={styles.reviewBtnText}>Leave a Review ★</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
  priceText: { fontSize: 16, fontWeight: 'bold', color: '#1E63D3', marginTop: 12 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  rescheduleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#EFF6FF', alignItems: 'center',
  },
  rescheduleBtnText: { fontSize: 14, fontWeight: '600', color: '#1E63D3' },
  cancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#FEF2F2', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  reviewBtn: {
    marginTop: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#ECFDF5', alignItems: 'center',
  },
  reviewBtnText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748B', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
