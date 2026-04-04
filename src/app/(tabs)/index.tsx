import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Bell, Search, Calendar, CheckCircle2, Users, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getDoctors, getAppointments, getCurrentUser } from '../../services/api';

const CATEGORIES = ['All', 'Cardiologist', 'Neurologist', 'Pediatrician', 'Dentist', 'Orthopedic'];

// Fallback mock data when backend is unreachable
const MOCK_DOCTORS = [
  {
    id: 1, firstName: 'Dr. Malika', lastName: 'Yusupova',
    doctorProfile: { specialty: 'Cardiologist', experience: 12, priceAmount: 150000 },
    reviewsReceived: Array(248).fill({ rating: 5 }),
    initials: 'MY', bg: '#fef3c7',
  },
  {
    id: 2, firstName: 'Dr. Jasur', lastName: 'Toshmatov',
    doctorProfile: { specialty: 'Neurologist', experience: 8, priceAmount: 130000 },
    reviewsReceived: Array(183).fill({ rating: 4 }),
    initials: 'JT', bg: '#ffedd5',
  },
  {
    id: 3, firstName: 'Dr. Nozima', lastName: 'Rahimova',
    doctorProfile: { specialty: 'Pediatrician', experience: 15, priceAmount: 120000 },
    reviewsReceived: Array(392).fill({ rating: 5 }),
    initials: 'NR', bg: '#ffedd5',
  },
  {
    id: 4, firstName: 'Dr. Sardor', lastName: 'Karimov',
    doctorProfile: { specialty: 'Dentist', experience: 6, priceAmount: 100000 },
    reviewsReceived: Array(124).fill({ rating: 4 }),
    initials: 'SK', bg: '#fef3c7',
  },
  {
    id: 5, firstName: 'Dr. Dilnoza', lastName: 'Hasanova',
    doctorProfile: { specialty: 'Orthopedic', experience: 10, priceAmount: 140000 },
    reviewsReceived: Array(210).fill({ rating: 5 }),
    initials: 'DH', bg: '#e0f2fe',
  },
  {
    id: 6, firstName: 'Dr. Bobur', lastName: 'Alimov',
    doctorProfile: { specialty: 'Cardiologist', experience: 20, priceAmount: 200000 },
    reviewsReceived: Array(510).fill({ rating: 5 }),
    initials: 'BA', bg: '#fce7f3',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatPrice(amount: number) {
  if (amount >= 1000) return `${Math.round(amount / 1000)}K so'm`;
  return `${amount} so'm`;
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
        setDoctors(MOCK_DOCTORS);
      }

      if (appointmentsList.status === 'fulfilled' && Array.isArray(appointmentsList.value)) {
        setAppointments(appointmentsList.value);
      }
    } catch {
      setDoctors(MOCK_DOCTORS);
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
    Alert.alert(
      'Book Appointment',
      `Schedule an appointment with ${doctor.firstName} ${doctor.lastName}?\n\nSpecialty: ${doctor.doctorProfile?.specialty || 'General'}\nPrice: ${formatPrice(doctor.doctorProfile?.priceAmount || 0)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => {
            // Navigate to booking screen with doctor data
            router.push({
              pathname: '/(tabs)/appointments',
              params: { bookDoctorId: doctor.id },
            });
          },
        },
      ]
    );
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'You have 2 new notifications:\n\n• Appointment with Dr. Yusupova tomorrow\n• Lab results are ready');
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E63D3']} />}
      >
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.userName}>{user?.firstName || 'Alisher'} <Text style={{ fontSize: 24 }}>👋</Text></Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn} onPress={handleNotifications}>
            <Bell color="#111827" size={24} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search color="#9CA3AF" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, specializations..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: '#9CA3AF', fontSize: 18, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/appointments')}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EFF6FF' }]}>
              <Calendar color="#3B82F6" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#1E40AF' }]}>{appointments.length || 3}</Text>
            <Text style={styles.statTitle}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/appointments')}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#ECFDF5' }]}>
              <CheckCircle2 color="#10B981" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#065F46' }]}>{completedCount || 1}</Text>
            <Text style={styles.statTitle}>Completed</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#F0FDF4' }]}>
              <Users color="#14B8A6" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#0F766E' }]}>{doctors.length}</Text>
            <Text style={styles.statTitle}>Doctors</Text>
          </View>
        </View>

        {/* Doctors Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Doctors</Text>
          <Text style={styles.sectionSubtitle}>{filteredDoctors.length} available</Text>
        </View>

        {/* Categories Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveTab(cat)}
              style={[styles.categoryPill, activeTab === cat && styles.categoryPillActive]}
            >
              <Text style={[styles.categoryText, activeTab === cat && styles.categoryTextActive]}>{cat}</Text>
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
              const experience = doc.doctorProfile?.experience || 0;
              const price = formatPrice(doc.doctorProfile?.priceAmount || 0);
              const specialty = doc.doctorProfile?.specialty || 'General';
              const isAvailableToday = index % 3 !== 2; // Simple availability pattern

              return (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.doctorCard}
                  activeOpacity={0.7}
                  onPress={() => handleBookDoctor(doc)}
                >
                  <View style={styles.doctorCardHeader}>
                    <View style={[styles.doctorAvatar, { backgroundColor: bg }]}>
                      <Text style={[styles.doctorAvatarText, { color: textColor }]}>{initials}</Text>
                    </View>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>{doc.firstName} {doc.lastName}</Text>
                      <Text style={styles.doctorSpecialty}>{specialty}</Text>
                      <View style={styles.ratingRow}>
                        <Star color="#F59E0B" fill="#F59E0B" size={14} />
                        <Text style={styles.ratingText}>{rating || '4.8'}</Text>
                        <Text style={styles.ratingReviews}>({reviewCount})</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.expText}>{experience}y exp</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.priceText}>{price}</Text>
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
});
