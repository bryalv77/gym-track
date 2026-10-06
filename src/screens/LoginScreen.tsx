import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <NavBar title={t('auth.signIn')} />
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.systemBlue }]}>
          <Ionicons name="barbell" size={42} color="#FFFFFF" />
        </View>
        <AppText variant="largeTitle">GymTrack</AppText>
        <AppText variant="subheadline" color={colors.secondaryLabel}>
          {t('auth.tagline')}
        </AppText>
      </View>

      {!isFirebaseConfigured ? (
        <View style={[styles.banner, { backgroundColor: colors.orangeTint }]}>
          <Ionicons name="warning" size={16} color={colors.systemOrange} />
          <AppText variant="footnote" color={colors.systemOrange} style={{ flex: 1 }}>
            {t('auth.firebaseWarning')}
          </AppText>
        </View>
      ) : null}

      <View style={styles.form}>
        <TextField
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
        />
        <TextField
          label={t('auth.password')}
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
        <Button label={t('auth.signIn')} onPress={handleSignIn} loading={loading} />
        <Button
          label={t('auth.createAccountLink')}
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
