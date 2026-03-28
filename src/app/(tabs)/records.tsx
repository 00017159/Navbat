import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Activity, MessageSquare, Paperclip, ChevronRight } from 'lucide-react-native';

const RECORDS = [
  {
    id: 1, 
    doctor: 'Dr. Jasur Toshmatov', 
    date: '2026-03-20',
    diagnosis: 'Chronic Migraine',
    prescriptions: ['Sumatriptan 50mg', 'Amitriptyline 25mg', 'Vitamin B2 400mg'],
    notes: 'Patient responds well to treatment. Follow-up in 3 months.',
    attachments: ['MRI_scan.pdf', 'Blood_test.pdf'],
    initials: 'JT', bg: '#ffedd5', color: '#c2410c'
  },
  {
    id: 2, 
    doctor: 'Dr. Sherzod Umarov', 
    date: '2026-02-15',
    diagnosis: 'Acute Respiratory Infection',
    prescriptions: ['Amoxicillin 500mg', 'Paracetamol 500mg', 'Vitamin C 1000mg'],
    notes: 'Complete course of antibiotics required. Rest and hydration advised.',
    attachments: [],
    initials: 'SU', bg: '#fef3c7', color: '#92400e'
  }
];

export default function RecordsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {RECORDS.map(record => (
          <View key={record.id} style={styles.card}>
            
            {/* Doctor Info Row */}
            <TouchableOpacity style={styles.doctorRow}>
              <View style={[styles.avatar, { backgroundColor: record.bg }]}>
                <Text style={[styles.avatarText, { color: record.color }]}>{record.initials}</Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{record.doctor}</Text>
                <Text style={styles.recordDate}>{record.date}</Text>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>

            {/* Diagnosis Section */}
            <View style={styles.diagnosisSection}>
              <View style={styles.pulseIconContainer}>
                <Activity color="#1E63D3" size={20} />
              </View>
              <View>
                <Text style={styles.sectionLabelTxt}>Diagnosis</Text>
                <Text style={styles.diagnosisTitle}>{record.diagnosis}</Text>
              </View>
            </View>

            {/* Prescriptions Section */}
            {record.prescriptions.length > 0 && (
              <View style={styles.prescriptionsSection}>
                <Text style={styles.sectionLabelTxt}>Prescriptions</Text>
                <View style={styles.tagsContainer}>
                  {record.prescriptions.map((med, index) => (
                    <View key={index} style={styles.prescriptionPill}>
                      <Text style={styles.prescriptionText}>{med}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Notes Section */}
            {record.notes && (
              <View style={styles.notesSection}>
                <MessageSquare color="#9CA3AF" size={16} style={{ marginTop: 2, marginRight: 8 }} />
                <Text style={styles.notesText}>{record.notes}</Text>
              </View>
            )}

            {/* Attachments Section */}
            {record.attachments && record.attachments.length > 0 && (
              <View style={styles.attachmentsRow}>
                {record.attachments.map((file, index) => (
                  <TouchableOpacity key={index} style={styles.attachmentPill}>
                    <Paperclip color="#1E63D3" size={14} style={{ marginRight: 6 }} />
                    <Text style={styles.attachmentText}>{file}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
  listContainer: { padding: 20, gap: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 15, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  doctorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 16, fontWeight: 'bold' },
  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  recordDate: { fontSize: 14, color: '#64748B' },
  sectionLabelTxt: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  diagnosisSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pulseIconContainer: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  diagnosisTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  prescriptionsSection: { marginBottom: 16 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  prescriptionPill: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6
  },
  prescriptionText: { fontSize: 13, color: '#1E63D3', fontWeight: '500' },
  notesSection: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  notesText: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20 },
  attachmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachmentPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE'
  },
  attachmentText: { fontSize: 13, color: '#1E63D3', fontWeight: '500' }
});
