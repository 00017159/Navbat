import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Bell, Search, Calendar, CheckCircle2, Users, Star } from 'lucide-react-native';

const CATEGORIES = ['All', 'Cardiologist', 'Neurologist', 'Pediatrician', 'Dentist', 'Orthopedic'];

type Doctor = {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  exp: string;
  price: string;
  available: string;
  initials: string;
  bg: string;
  color?: string;
};

const DOCTORS: Doctor[] = [
  {
    id: 1, name: 'Dr. Malika Yusupova', specialty: 'Cardiologist', rating: 4.9, reviews: 248,
    exp: '12y', price: '150K so\'m', available: 'Available Today', initials: 'MY', bg: '#fef3c7'
  },
  {
    id: 2, name: 'Dr. Jasur Toshmatov', specialty: 'Neurologist', rating: 4.7, reviews: 183,
    exp: '8y', price: '130K so\'m', available: 'Available Today', initials: 'JT', bg: '#ffedd5'
  },
  {
    id: 3, name: 'Dr. Nozima Rahimova', specialty: 'Pediatrician', rating: 4.8, reviews: 392,
    exp: '15y', price: '120K so\'m', available: 'Next: Tomorrow', initials: 'NR', bg: '#ffedd5', color: '#c2410c'
  }
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Good morning,</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.userName}>Alisher <Text style={{ fontSize: 24 }}>👋</Text></Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
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
          />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#EFF6FF' }]}>
              <Calendar color="#3B82F6" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#1E40AF' }]}>3</Text>
            <Text style={styles.statTitle}>Appointments</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#ECFDF5' }]}>
              <CheckCircle2 color="#10B981" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#065F46' }]}>1</Text>
            <Text style={styles.statTitle}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#F0FDF4' }]}>
              <Users color="#14B8A6" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#0F766E' }]}>3</Text>
            <Text style={styles.statTitle}>Doctors</Text>
          </View>
        </View>

        {/* Doctors Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Doctors</Text>
          <Text style={styles.sectionSubtitle}>6 available</Text>
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
          {DOCTORS.map(doc => (
            <View key={doc.id} style={styles.doctorCard}>
              <View style={styles.doctorCardHeader}>
                <View style={[styles.doctorAvatar, { backgroundColor: doc.bg }]}>
                  <Text style={[styles.doctorAvatarText, { color: doc.color || '#92400e' }]}>{doc.initials}</Text>
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doc.name}</Text>
                  <Text style={styles.doctorSpecialty}>{doc.specialty}</Text>
                  <View style={styles.ratingRow}>
                    <Star color="#F59E0B" fill="#F59E0B" size={14} />
                    <Text style={styles.ratingText}>{doc.rating}</Text>
                    <Text style={styles.ratingReviews}>({doc.reviews})</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.expText}>{doc.exp} exp</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.priceText}>{doc.price}</Text>
                  </View>
                </View>
                <View style={styles.statusDotWrapper}>
                  {doc.available.includes('Today') && <View style={styles.statusDotOn} />}
                </View>
              </View>

              <View style={styles.doctorCardFooter}>
                <Text 
                  style={[
                    styles.availabilityText, 
                    doc.available.includes('Tomorrow') ? styles.availabilityTextGrey : null
                  ]}
                >
                  {doc.available}
                </Text>
                <TouchableOpacity style={styles.bookBtn}>
                  <Text style={styles.bookBtnText}>Book &gt;</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  bookBtnText: { fontSize: 14, fontWeight: 'bold', color: '#1E63D3' }
});
