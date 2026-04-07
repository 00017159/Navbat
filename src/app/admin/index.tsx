import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../services/theme';
import { getAllUsers, getGlobalAppointments, deleteUserAccount } from '../../services/api';
import { Users, Calendar, AlertCircle, ShieldAlert, Activity, Mail } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const { colors, dark } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [u, a] = await Promise.all([getAllUsers(), getGlobalAppointments()]);
      setUsers(u);
      setAppointments(a);
    } catch (e: any) {
      Alert.alert('Admin Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteUser = (id: string, name: string) => {
    Alert.alert(
      'Enforce Deletion',
      `Permanently delete user ${name}? This will cause a destructive database cascade!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount(id);
              await fetchData();
            } catch (err: any) {
              Alert.alert('Failed', err.message);
            }
          }
        }
      ]
    );
  };

  const isWeb = width > 768;

  const totalPatients = users.filter(u => u.role === 'PATIENT').length;
  const totalDoctors = users.filter(u => u.role === 'DOCTOR').length;
  const upcomingCount = appointments.filter(a => new Date(a.date_time) > new Date()).length;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      <View style={[styles.headerMetrics, isWeb ? { flexDirection: 'row' } : null]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: isWeb ? 1 : undefined, margin: isWeb ? 8 : 0, marginBottom: isWeb ? 0 : 16 }]}>
          <Users color="#3B82F6" size={28} style={{ marginBottom: 8 }} />
          <Text style={[styles.metricValue, { color: colors.text }]}>{totalPatients}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Patients</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: isWeb ? 1 : undefined, margin: isWeb ? 8 : 0, marginBottom: isWeb ? 0 : 16 }]}>
          <Activity color="#10B981" size={28} style={{ marginBottom: 8 }} />
          <Text style={[styles.metricValue, { color: colors.text }]}>{totalDoctors}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Active Doctors</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: isWeb ? 1 : undefined, margin: isWeb ? 8 : 0, marginBottom: isWeb ? 0 : 16 }]}>
          <Calendar color="#8B5CF6" size={28} style={{ marginBottom: 8 }} />
          <Text style={[styles.metricValue, { color: colors.text }]}>{upcomingCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Upcoming Appointments</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Complete User Directory</Text>
      
      {users.map((u, i) => (
        <View key={u.id} style={[styles.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: u.role === 'ADMIN' ? '#FEE2E2' : '#EFF6FF' }]}>
              {u.role === 'ADMIN' ? <ShieldAlert color="#EF4444" size={20} /> : <Text style={styles.avatarLetter}>{(u.first_name || u.email || 'U')[0].toUpperCase()}</Text>}
            </View>
            <View>
              <Text style={[styles.userName, { color: colors.text }]}>
                {u.first_name || 'Unknown'} {u.last_name || ''}
              </Text>
              <View style={styles.roleWrap}>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginRight: 8 }}>{u.role}</Text>
                <Text style={{ fontSize: 13, color: '#3B82F6' }}>{u.email}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteUser(u.id, u.email)} style={styles.actionBtn}>
            <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Recent Appointments</Text>
      {appointments.slice(0, 10).map((a, i) => (
        <View key={a.id} style={[styles.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>PID: {a.patient?.first_name} → DID: {a.doctor?.first_name}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>{new Date(a.date_time).toLocaleString()}</Text>
            <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>[STATUS: {a.status}]</Text>
          </View>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  headerMetrics: { marginBottom: 24 },
  card: {
    padding: 24, borderRadius: 16, borderWidth: 1, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  metricValue: { fontSize: 32, fontWeight: '900', marginBottom: 4 },
  metricLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarLetter: { fontSize: 16, fontWeight: 'bold', color: '#1E40AF' },
  userName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  roleWrap: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8 }
});
