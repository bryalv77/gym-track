import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { radius, useTheme } from '../theme';
import {
  AppText,
  Button,
  Ionicons,
  NavBar,
  Screen,
  TextField,
} from '../ui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuthError, signInThunk } from '../store/slices/authSlice';
import { isFirebaseConfigured } from '../config/firebase';
import type { AuthStackParamList } from '../navigation/RootNavigator';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    if (!email.trim() || !password) return;
    dispatch(signInThunk({ email, password }));
  };

  return (
    <Screen scroll contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <NavBar title="Sign In" />
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.systemBlue }]}>
          <Ionicons name="barbell" size={42} color="#FFFFFF" />
        </View>
        <AppText variant="largeTitle">GymTrack</AppText>
        <AppText variant="subheadline" color={colors.secondaryLabel}>
          Train. Track. Progress.
        </AppText>
      </View>

      {!isFirebaseConfigured ? (
        <View style={[styles.banner, { backgroundColor: colors.orangeTint }]}>
          <Ionicons name="warning" size={16} color={colors.systemOrange} />
          <AppText variant="footnote" color={colors.systemOrange} style={{ flex: 1 }}>
            Firebase is not configured yet — add your keys in src/config/firebase.ts
            (see README.md).
          </AppText>
        </View>
      ) : null}

      <View style={styles.form}>
        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
        />
        <TextField
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
        />
        {error ? (
          <AppText variant="footnote" color={colors.systemRed}>
            {error}
          </AppText>
        ) : null}
        <Button label="Sign In" onPress={handleSignIn} loading={loading} />
        <Button
          label="Create an account"
          variant="plain"
          size="md"
          onPress={() => {
            dispatch(clearAuthError());
            navigation.navigate('SignUp');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 8, marginBottom: 32, marginTop: 8 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  form: { gap: 14 },
});
