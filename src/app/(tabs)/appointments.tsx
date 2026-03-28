import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Video, MapPin, FileText } from 'lucide-react-native';

const TABS = ['All', 'Upcoming', 'Completed', 'Cancelled'];

const APPOINTMENTS = [
  {
    id: 1, name: 'Dr. Malika Yusupova', specialty: 'Cardiologist',
    status: 'Cancelled', date: '2026-04-02', time: '10:00',
    type: 'In-Person Visit', typeIcon: 'MapPin',
    notes: 'Regular heart checkup', price: '150K so\'m',
    initials: 'MY', bg: '#fef3c7', color: '#92400e'
  },
  {
    id: 2, name: 'Dr. Jasur Toshmatov', specialty: 'Neurologist',
    status: 'Completed', date: '2026-03-20', time: '14:00',
    type: 'Online Consultation', typeIcon: 'Video',
    notes: 'Migraine treatment follow-up', price: '130K so\'m',
    initials: 'JT', bg: '#ffedd5', color: '#c2410c'
  },
  {
    id: 3, name: 'Dr. Gulnora Mirzayeva', specialty: 'Dermatologist',
    status: 'Cancelled', date: '2026-03-10', time: '11:00',
    type: 'In-Person Visit', typeIcon: 'MapPin',
    notes: 'Skin rash examination', price: '110K so\'m',
    initials: 'GM', bg: '#fef3c7', color: '#92400e'
  }
];

export default function AppointmentsScreen() {
  const [activeTab, setActiveTab] = useState('All');

  const filteredAppointments = APPOINTMENTS.filter(app => {
    if (activeTab === 'All') return true;
    return app.status === activeTab;
  });

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
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredAppointments.map(app => (
          <View key={app.id} style={styles.card}>
            
            <View style={styles.cardHeader}>
              <View style={[styles.avatar, { backgroundColor: app.bg }]}>
                <Text style={[styles.avatarText, { color: app.color }]}>{app.initials}</Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{app.name}</Text>
                <Text style={styles.specialty}>{app.specialty}</Text>
              </View>
              <View style={[
                styles.statusPill, 
                app.status === 'Completed' ? styles.statusCompletedBg : styles.statusCancelledBg
              ]}>
                <Text style={[
                  styles.statusText, 
                  app.status === 'Completed' ? styles.statusCompletedText : styles.statusCancelledText
                ]}>
                  {app.status}
                </Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <Calendar color="#9CA3AF" size={16} />
              <Text style={styles.detailText}>{app.date}</Text>
              <Text style={styles.timeText}>🕑 {app.time}</Text>
            </View>

            <View style={styles.detailsRow}>
              {app.typeIcon === 'MapPin' ? <MapPin color="#9CA3AF" size={16} /> : <Video color="#9CA3AF" size={16} />}
              <Text style={styles.detailText}>{app.type}</Text>
            </View>

            <View style={styles.detailsRow}>
              <FileText color="#9CA3AF" size={16} />
              <Text style={styles.detailText}>{app.notes}</Text>
            </View>

            <Text style={styles.priceText}>{app.price}</Text>

          </View>
        ))}
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
  statusCompletedBg: { backgroundColor: '#ECFDF5' },
  statusCancelledBg: { backgroundColor: '#FEF2F2' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusCompletedText: { color: '#10B981' },
  statusCancelledText: { color: '#EF4444' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailText: { fontSize: 14, color: '#4B5563', marginLeft: 8 },
  timeText: { fontSize: 14, color: '#4B5563', marginLeft: 16 },
  priceText: { fontSize: 16, fontWeight: 'bold', color: '#1E63D3', marginTop: 12 }
});
