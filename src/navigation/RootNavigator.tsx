import React, { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import { Ionicons, ScreenLoader, TabBar, type IconName } from '../ui';
import type { Role } from '../types';
import type { AuthStackParamList } from './types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { authStateChanged } from '../store/slices/authSlice';
import { fetchProfile, listenToAuth } from '../services/auth';
import { DataSync } from '../store/DataSync';
import { GuestCodeScreen } from '../screens/GuestCodeScreen';
import { GuestProfileScreen } from '../screens/member/GuestProfileScreen';
import { clearGuest, guestProfile, loadGuest } from '../services/guest';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { TodayScreen } from '../screens/member/TodayScreen';
import { DashboardScreen } from '../screens/member/DashboardScreen';
import { ProgressScreen } from '../screens/member/ProgressScreen';
import { PlanScreen } from '../screens/coach/PlanScreen';
import { MembersScreen } from '../screens/coach/MembersScreen';
import { RoutinesScreen } from '../screens/coach/RoutinesScreen';
import { GymsScreen } from '../screens/admin/GymsScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { ExercisesLibraryScreen } from '../screens/shared/ExercisesLibraryScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="GuestCode" component={GuestCodeScreen} />
    </AuthStack.Navigator>
  );
}

interface TabSpec {
  name: string;
  component: React.ComponentType;
  icon: IconName;
}

const PROFILE_TAB: TabSpec = { name: 'Profile', component: ProfileScreen, icon: 'person-circle-outline' };
const EXERCISES_TAB: TabSpec = { name: 'Exercises', component: ExercisesLibraryScreen, icon: 'barbell-outline' };

const TABS_BY_ROLE: Record<Role, TabSpec[]> = {
  member: [
    { name: 'Today', component: TodayScreen, icon: 'today-outline' },
    { name: 'Dashboard', component: DashboardScreen, icon: 'stats-chart-outline' },
    { name: 'Progress', component: ProgressScreen, icon: 'body-outline' },
    PROFILE_TAB,
  ],
  coach: [
    { name: 'Plan', component: PlanScreen, icon: 'calendar-outline' },
    { name: 'Routines', component: RoutinesScreen, icon: 'albums-outline' },
    EXERCISES_TAB,
    { name: 'Members', component: MembersScreen, icon: 'people-outline' },
    PROFILE_TAB,
  ],
  admin: [
    { name: 'Gyms', component: GymsScreen, icon: 'business-outline' },
    { name: 'Users', component: UsersScreen, icon: 'people-outline' },
    EXERCISES_TAB,
    PROFILE_TAB,
  ],
};

const GUEST_TABS: TabSpec[] = [
  { name: 'Today', component: TodayScreen, icon: 'today-outline' },
  { name: 'Dashboard', component: DashboardScreen, icon: 'stats-chart-outline' },
  { name: 'Profile', component: GuestProfileScreen, icon: 'person-circle-outline' },
];

function RoleTabs({ role, guest = false }: { role: Role; guest?: boolean }) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: Platform.OS !== 'web' }}
      tabBar={(props) => <TabBar {...props} />}
    >
      {(guest ? GUEST_TABS : TABS_BY_ROLE[role]).map(({ name, component, icon }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name={icon} size={24} color={color} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { colors, mode } = useTheme();
  const dispatch = useAppDispatch();
  const { initialized, profile } = useAppSelector((state) => state.auth);

  const navigationTheme: Theme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: colors.systemBlue,
        background: colors.background,
        card: colors.surface,
        text: colors.label,
        border: colors.separator,
        notification: colors.systemRed,
      },
    }),
    [colors],
  );

  useEffect(() => {
    const unsubscribe = listenToAuth(async (user) => {
      if (!user) {
        // No account session: resume an offline guest plan if this device has one.
        const guest = await loadGuest();
        dispatch(authStateChanged({ profile: guest ? guestProfile() : null }));
        return;
      }
      void clearGuest();
      try {
        const loaded = await fetchProfile();
        dispatch(authStateChanged({ profile: loaded }));
      } catch (error) {
        console.warn('[auth] failed to load profile', error);
        dispatch(authStateChanged({ profile: null }));
      }
    });
    return unsubscribe;
  }, [dispatch]);

  if (!initialized) {
    return <ScreenLoader />;
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <DataSync />
      <NavigationContainer theme={navigationTheme}>
        {profile === null ? <AuthNavigator /> : <RoleTabs role={profile.role} guest={profile.guest === true} />}
      </NavigationContainer>
    </>
  );
}
