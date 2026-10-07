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
import {
  Ionicons,
  ScreenLoader,
  TabBar,
} from '../ui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { authStateChanged } from '../store/slices/authSlice';
import { isFirebaseConfigured } from '../config/firebase';
import { fetchOrCreateProfile, listenToAuth } from '../services/auth';
import { DataSync } from '../components/DataSync';
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

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function MemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: Platform.OS !== 'web' }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="today-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="body-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function CoachTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: Platform.OS !== 'web' }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="albums-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExercisesLibraryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="barbell-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: Platform.OS !== 'web' }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen
        name="Gyms"
        component={GymsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="business-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={UsersScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExercisesLibraryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="barbell-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={24} color={color} />
          ),
        }}
      />
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
    if (!isFirebaseConfigured) {
      dispatch(authStateChanged({ profile: null }));
      return;
    }
    const unsubscribe = listenToAuth(async (user) => {
      if (!user) {
        dispatch(authStateChanged({ profile: null }));
        return;
      }
      try {
        const loaded = await fetchOrCreateProfile(user);
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
        {profile === null ? (
          <AuthNavigator />
        ) : profile.role === 'admin' ? (
          <AdminTabs />
        ) : profile.role === 'coach' ? (
          <CoachTabs />
        ) : (
          <MemberTabs />
        )}
      </NavigationContainer>
    </>
  );
}
