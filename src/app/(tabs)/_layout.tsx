import { Tabs } from 'expo-router';
import { Home, Calendar, ClipboardList, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#1F61C3',
      tabBarInactiveTintColor: '#A0AEC0',
      headerShown: false,
      tabBarStyle: {
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 0,
        backgroundColor: '#f8f9fa'
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
