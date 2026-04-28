import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Bell, Calendar, FileText, CheckCircle, CheckCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../services/theme';
import { getAppointments } from '../services/api';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: 'calendar' | 'file' | 'check';
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      let appointments: any[] = [];
      try {
        appointments = (await getAppointments()) || [];
      } catch (e) {
        console.warn('Failed to fetch appointments for notifications:', e);
      }

      let lastRead = 0;
      try {
        const lastReadTime = await AsyncStorage.getItem('notif_last_read');
        lastRead = lastReadTime ? parseInt(lastReadTime, 10) : 0;
      } catch (e) {
        console.warn('Failed to read notifications from AsyncStorage:', e);
      }

      const notifs: Notification[] = [];

      // Generate notifications from upcoming appointments
      appointments.forEach((apt: any) => {
        if (apt.status === 'UPCOMING') {
          const date = new Date(apt.dateTime);
          const doctorName = apt.doctor ? `${apt.doctor.firstName} ${apt.doctor.lastName}` : t('notifications.your_doctor');
          const createdAt = new Date(apt.createdAt || apt.dateTime).getTime();
          notifs.push({
            id: `apt-${apt.id}`,
            title: t('notifications.upcoming_title'),
            message: t('notifications.appointment_msg', { 
              doctor: doctorName, 
              date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) 
            }),
            time: getRelativeTime(date),
            read: createdAt <= lastRead,
            icon: 'calendar',
          });
        }
      });

      // Add a welcome notification
      notifs.push({
        id: 'welcome',
        title: t('notifications.welcome_title'),
        message: t('notifications.welcome_msg'),
        time: t('notifications.time_just_now'),
        read: lastRead > 0,
        icon: 'check',
      });

      setNotifications(notifs);
    } catch (err) {
      console.error('Critical error in loadNotifications:', err);
      // Fallback state that won't crash the component
      setNotifications([{
        id: 'welcome',
        title: t('notifications.welcome_title'),
        message: t('notifications.welcome_msg').substring(0, 35) + '...',
        time: t('notifications.time_just_now'),
        read: true,
        icon: 'check',
      }]);
    }
  };

  const markAllAsRead = async () => {
    const hasUnread = notifications.some(n => !n.read);
    if (!hasUnread) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await AsyncStorage.setItem('notif_last_read', Date.now().toString());
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 1) return t('notifications.time_in_days', { count: days });
    if (days === 1) return t('notifications.time_tomorrow');
    if (hours > 0) return t('notifications.time_in_hours', { count: hours });
    return t('notifications.time_just_now');
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'calendar': return <Calendar color={colors.primary} size={20} />;
      case 'file': return <FileText color="#10B981" size={20} />;
      case 'check': return <CheckCircle color="#10B981" size={20} />;
      default: return <Bell color={colors.primary} size={20} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('notifications.title')}</Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.backBtn} disabled={unreadCount === 0}>
          <CheckCheck color={unreadCount > 0 ? colors.primary : colors.textSecondary} size={24} />
        </TouchableOpacity>
      </View>

      {unreadCount > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: dark ? '#1E3A5F' : '#EFF6FF' }]}>
          <Text style={[styles.unreadText, { color: colors.primary }]}>
            {unreadCount} {unreadCount > 1 ? t('notifications.unread_suffix_plural') : t('notifications.unread_suffix')}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell color={colors.textSecondary} size={48} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('notifications.no_notifications')}</Text>
          </View>
        ) : (
          notifications.map(notif => (
            <View
              key={notif.id}
              style={[
                styles.notifCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                !notif.read && { borderLeftWidth: 3, borderLeftColor: colors.primary },
              ]}
            >
              <View style={[styles.notifIcon, { backgroundColor: dark ? '#334155' : '#EFF6FF' }]}>
                {getNotifIcon(notif.icon)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: colors.text }]}>{notif.title}</Text>
                <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>{notif.message}</Text>
                <Text style={[styles.notifTime, { color: colors.textSecondary }]}>{notif.time}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 20, borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  unreadBanner: { paddingHorizontal: 20, paddingVertical: 10 },
  unreadText: { fontSize: 13, fontWeight: '600' },
  scrollContent: { padding: 16 },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 16,
    borderRadius: 16, borderWidth: 1, marginBottom: 12,
  },
  notifIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  notifTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  notifMessage: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notifTime: { fontSize: 11 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, marginTop: 16 },
});
