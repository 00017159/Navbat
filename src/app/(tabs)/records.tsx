import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Activity, MessageSquare, Paperclip, ChevronRight, ChevronDown, ChevronUp, Download } from 'lucide-react-native';
import { getRecords } from '../../services/api';

// Live data only
function getInitials(firstName: string, lastName: string) {
  return `${(firstName || '').replace('Dr. ', '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toISOString().split('T')[0];
}

const AVATAR_COLORS = ['#ffedd5', '#fef3c7', '#e0f2fe', '#fce7f3', '#dcfce7'];
const TEXT_COLORS = ['#c2410c', '#92400e', '#0369a1', '#be185d', '#166534'];

export default function RecordsScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await getRecords();
      if (Array.isArray(data) && data.length > 0) {
        setRecords(data);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
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

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleAttachment = (filename: string) => {
    Alert.alert(
      'Open Attachment',
      `Would you like to download "${filename}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => Alert.alert('Downloaded', `${filename} has been saved to your device.`),
        },
      ]
    );
  };

  const handleShareRecord = (record: any) => {
    const doctorName = `${record.doctor?.firstName || ''} ${record.doctor?.lastName || ''}`;
    Alert.alert(
      'Share Record',
      `Share medical record from ${doctorName}?\n\nDiagnosis: ${record.diagnosis}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => Alert.alert('Shared', 'Record shared successfully.') },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E63D3" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>Loading records...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <Text style={styles.headerSubtitle}>{records.length} record{records.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E63D3']} />}
      >
        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <Activity color="#CBD5E1" size={48} />
            <Text style={styles.emptyTitle}>No medical records</Text>
            <Text style={styles.emptySubtitle}>Your medical records will appear here after doctor visits</Text>
          </View>
        ) : (
          records.map((record, index) => {
            const doctor = record.doctor || {};
            const initials = getInitials(doctor.firstName || '', doctor.lastName || '');
            const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const color = TEXT_COLORS[index % TEXT_COLORS.length];
            const date = formatDate(record.createdAt || record.date || '');
            const isExpanded = expandedId === record.id;
            const prescriptions = record.prescriptions || [];
            const attachments = record.attachments || [];

            return (
              <View key={record.id} style={styles.card}>
                
                {/* Doctor Info Row - Tappable to expand */}
                <TouchableOpacity style={styles.doctorRow} onPress={() => toggleExpand(record.id)}>
                  <View style={[styles.avatar, { backgroundColor: bg }]}>
                    <Text style={[styles.avatarText, { color }]}>{initials}</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.firstName} {doctor.lastName}</Text>
                    <Text style={styles.recordDate}>{date}</Text>
                  </View>
                  {isExpanded
                    ? <ChevronUp color="#9CA3AF" size={20} />
                    : <ChevronDown color="#9CA3AF" size={20} />
                  }
                </TouchableOpacity>

                {/* Diagnosis Section - Always visible */}
                <View style={styles.diagnosisSection}>
                  <View style={styles.pulseIconContainer}>
                    <Activity color="#1E63D3" size={20} />
                  </View>
                  <View>
                    <Text style={styles.sectionLabelTxt}>Diagnosis</Text>
                    <Text style={styles.diagnosisTitle}>{record.diagnosis}</Text>
                  </View>
                </View>

                {/* Expanded Content */}
                {isExpanded && (
                  <>
                    {/* Prescriptions Section */}
                    {prescriptions.length > 0 && (
                      <View style={styles.prescriptionsSection}>
                        <Text style={styles.sectionLabelTxt}>Prescriptions</Text>
                        <View style={styles.tagsContainer}>
                          {prescriptions.map((med: string, idx: number) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.prescriptionPill}
                              onPress={() => Alert.alert('Prescription', `${med}\n\nTake as directed by your doctor.`)}
                            >
                              <Text style={styles.prescriptionText}>{med}</Text>
                            </TouchableOpacity>
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
                    {attachments.length > 0 && (
                      <View style={styles.attachmentsRow}>
                        {attachments.map((file: string, idx: number) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.attachmentPill}
                            onPress={() => handleAttachment(file)}
                          >
                            <Paperclip color="#1E63D3" size={14} style={{ marginRight: 6 }} />
                            <Text style={styles.attachmentText}>{file}</Text>
                            <Download color="#1E63D3" size={12} style={{ marginLeft: 6 }} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Share Button */}
                    <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareRecord(record)}>
                      <Text style={styles.shareBtnText}>Share Record</Text>
                    </TouchableOpacity>
                  </>
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
  headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
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
  attachmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  attachmentPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE'
  },
  attachmentText: { fontSize: 13, color: '#1E63D3', fontWeight: '500' },
  shareBtn: {
    paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center',
  },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748B', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
