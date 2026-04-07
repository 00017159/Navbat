import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Bell, Search, Calendar, CheckCircle2, Users, Star, Bot } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getDoctors, getAppointments, getCurrentUser } from '../../services/api';
import { useTheme } from '../../services/theme';

const CATEGORIES = ['All', 'Cardiologist', 'Neurologist', 'Pediatrician', 'Dentist', 'Orthopedic'];

// Live data only

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}



function getAvgRating(reviews: { rating: number }[]) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((a, b) => a + b.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function getInitials(firstName: string, lastName: string) {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

const AVATAR_COLORS = ['#fef3c7', '#ffedd5', '#e0f2fe', '#fce7f3', '#dcfce7', '#f3e8ff'];
const TEXT_COLORS = ['#92400e', '#c2410c', '#0369a1', '#be185d', '#166534', '#7e22ce'];

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const { colors, dark } = useTheme();
  const user = getCurrentUser();

  const fetchData = useCallback(async () => {
    try {
      const [doctorsList, appointmentsList] = await Promise.allSettled([
        getDoctors(),
        getAppointments(),
      ]);

      if (doctorsList.status === 'fulfilled' && Array.isArray(doctorsList.value)) {
        setDoctors(doctorsList.value);
      } else {
        setDoctors([]);
      }

      if (appointmentsList.status === 'fulfilled' && Array.isArray(appointmentsList.value)) {
        setAppointments(appointmentsList.value);
      }
    } catch {
      setDoctors([]);
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

  // Filter doctors by category and search
  const filteredDoctors = doctors.filter(doc => {
    const specialty = doc.doctorProfile?.specialty || '';
    const matchesCategory = activeTab === 'All' || specialty === activeTab;
    const fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.toLowerCase();
    const matchesSearch = !searchQuery || fullName.includes(searchQuery.toLowerCase()) || specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

  const handleBookDoctor = (doctor: any) => {
    const ratingVal = getAvgRating(doctor.reviewsReceived || []);
    const init = doctor.initials || getInitials(doctor.firstName, doctor.lastName);
    const params = new URLSearchParams({
      name: `${doctor.firstName} ${doctor.lastName}`,
      specialty: doctor.doctorProfile?.specialty || 'General',
      experience: (doctor.doctorProfile?.experience || doctor.doctorProfile?.experienceYrs || 0).toString(),
      rating: (ratingVal || 4.8).toString(),
      reviews: (doctor.reviewsReceived?.length || 0).toString(),
      initials: init,
    }).toString();
    router.push(`/doctor/${doctor.id}?${params}` as any);
  };

  const handleNotifications = () => {
    setHasUnread(false);
    router.push('/notifications' as any);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const results = filteredDoctors.length;
      if (results === 0) {
        Alert.alert('No Results', `No doctors found for "${searchQuery}"`);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E63D3" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>{getGreeting()},</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.firstName || 'User'} <Text style={{ fontSize: 24 }}>👋</Text></Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleNotifications}>
            <Bell color={colors.text} size={24} />
            {hasUnread && appointments.filter(a => a.status === 'UPCOMING').length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{appointments.filter(a => a.status === 'UPCOMING').length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search doctors, specializations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.textSecondary, fontSize: 18, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card }]} onPress={() => router.push('/(tabs)/appointments?tab=All' as any)}>
            <View style={[styles.statIconWrapper, { backgroundColor: dark ? '#1E3A5F' : '#EFF6FF' }]}>
              <Calendar color="#3B82F6" size={24} />
            </View>
            <Text style={[styles.statValue, { color: dark ? '#93C5FD' : '#1E40AF' }]}>{appointments.length}</Text>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card }]} onPress={() => router.push('/(tabs)/appointments?tab=Completed' as any)}>
            <View style={[styles.statIconWrapper, { backgroundColor: dark ? '#064E3B' : '#ECFDF5' }]}>
              <CheckCircle2 color="#10B981" size={24} />
            </View>
            <Text style={[styles.statValue, { color: dark ? '#6EE7B7' : '#065F46' }]}>{completedCount}</Text>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Completed</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: dark ? '#134E4A' : '#F0FDF4' }]}>
              <Users color="#14B8A6" size={24} />
            </View>
            <Text style={[styles.statValue, { color: dark ? '#5EEAD4' : '#0F766E' }]}>{doctors.length}</Text>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Doctors</Text>
          </View>
        </View>

        {/* Doctors Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Doctors</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{filteredDoctors.length} available</Text>
        </View>

        {/* Categories Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveTab(cat)}
              style={[styles.categoryPill, { backgroundColor: colors.card, borderColor: colors.border }, activeTab === cat && styles.categoryPillActive]}
            >
              <Text style={[styles.categoryText, { color: colors.textSecondary }, activeTab === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Doctors List */}
        <View style={styles.doctorsList}>
          {filteredDoctors.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No doctors found{searchQuery ? ` for "${searchQuery}"` : ''}</Text>
              <TouchableOpacity onPress={() => { setActiveTab('All'); setSearchQuery(''); }}>
                <Text style={styles.emptyStateAction}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredDoctors.map((doc, index) => {
              const initials = doc.initials || getInitials(doc.firstName, doc.lastName);
              const bg = doc.bg || AVATAR_COLORS[index % AVATAR_COLORS.length];
              const textColor = TEXT_COLORS[index % TEXT_COLORS.length];
              const rating = getAvgRating(doc.reviewsReceived || []);
              const reviewCount = doc.reviewsReceived?.length || 0;
              const experience = doc.doctorProfile?.experience || doc.doctorProfile?.experienceYrs || 0;
              const specialty = doc.doctorProfile?.specialty || 'General';
              const isAvailableToday = index % 3 !== 2; // Simple availability pattern

              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.doctorCard, { backgroundColor: colors.card }]}
                  activeOpacity={0.7}
                  onPress={() => handleBookDoctor(doc)}
                >
                  <View style={styles.doctorCardHeader}>
                    <View style={[styles.doctorAvatar, { backgroundColor: bg }]}>
                      <Text style={[styles.doctorAvatarText, { color: textColor }]}>{initials}</Text>
                    </View>
                    <View style={styles.doctorInfo}>
                      <Text style={[styles.doctorName, { color: colors.text }]}>{doc.firstName} {doc.lastName}</Text>
                      <Text style={[styles.doctorSpecialty, { color: colors.textSecondary }]}>{specialty}</Text>
                      <View style={styles.ratingRow}>
                        <Star color="#F59E0B" fill="#F59E0B" size={14} />
                        <Text style={styles.ratingText}>{rating || '4.8'}</Text>
                        <Text style={styles.ratingReviews}>({reviewCount})</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.expText}>{experience}y exp</Text>
                      </View>
                    </View>
                    <View style={styles.statusDotWrapper}>
                      {isAvailableToday && <View style={styles.statusDotOn} />}
                    </View>
                  </View>

                  <View style={styles.doctorCardFooter}>
                    <Text 
                      style={[
                        styles.availabilityText, 
                        !isAvailableToday ? styles.availabilityTextGrey : null
                      ]}
                    >
                      {isAvailableToday ? 'Available Today' : 'Next: Tomorrow'}
                    </Text>
                    <TouchableOpacity style={styles.bookBtn} onPress={() => handleBookDoctor(doc)}>
                      <Text style={styles.bookBtnText}>Book &gt;</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* AI Floating Button */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => router.push('/ai-chat' as any)}
        activeOpacity={0.85}
      >
        <Bot color="#fff" size={24} />
        <Text style={styles.aiButtonText}>AI</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greetingText: { fontSize: 16, color: '#64748B', marginBottom: 4 },
  userName: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  notificationBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center'
  },
  badge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: '#EF4444',
    width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF'
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, height: 56, paddingHorizontal: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    alignItems: 'center', marginHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1
  },
  statIconWrapper: {
    width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12
  },
  statValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statTitle: { fontSize: 12, color: '#64748B' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  sectionSubtitle: { fontSize: 14, color: '#64748B' },
  categoriesScroll: { marginBottom: 20, flexGrow: 0 },
  categoryPill: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0', marginRight: 12, height: 40, justifyContent: 'center'
  },
  categoryPillActive: { backgroundColor: '#1E63D3', borderColor: '#1E63D3' },
  categoryText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  categoryTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  doctorsList: { gap: 16 },
  doctorCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2
  },
  doctorCardHeader: { flexDirection: 'row', marginBottom: 16 },
  doctorAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  doctorAvatarText: { fontSize: 20, fontWeight: 'bold' },
  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  doctorSpecialty: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginLeft: 4 },
  ratingReviews: { fontSize: 13, color: '#9CA3AF', marginLeft: 2 },
  dotSeparator: { fontSize: 13, color: '#9CA3AF', marginHorizontal: 6 },
  expText: { fontSize: 13, color: '#9CA3AF' },
  priceText: { fontSize: 13, fontWeight: '600', color: '#1E63D3' },
  statusDotWrapper: { alignItems: 'flex-end', paddingTop: 4 },
  statusDotOn: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  doctorCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  availabilityText: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  availabilityTextGrey: { color: '#64748B' },
  bookBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  bookBtnText: { fontSize: 14, fontWeight: 'bold', color: '#1E63D3' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { fontSize: 16, color: '#64748B', marginBottom: 12 },
  emptyStateAction: { fontSize: 14, fontWeight: 'bold', color: '#1E63D3' },
  aiButton: {
    position: 'absolute', bottom: 24, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#10B981', borderRadius: 28,
    paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
