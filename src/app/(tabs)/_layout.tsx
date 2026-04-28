import { withLayoutContext } from 'expo-router';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from '@react-navigation/material-top-tabs';
import { Home, Calendar, ClipboardList, User } from 'lucide-react-native';
import { useTheme } from '../../services/theme';
import { useTranslation } from 'react-i18next';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  any,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabLayout() {
  const { dark, colors } = useTheme();
  const { t } = useTranslation();
  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      screenOptions={{
        lazy: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        swipeEnabled: true,
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 3,
          top: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'System',
          textTransform: 'none',
          marginBottom: 4,
          padding: 0,
        },
        tabBarStyle: {
          height: 64,
          justifyContent: 'center',
          backgroundColor: dark ? '#1E293B' : '#f8f9fa',
          borderTopWidth: 1,
          borderColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="appointments"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="records"
        options={{
          title: t('tabs.records'),
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </MaterialTopTabs>
  );
}
