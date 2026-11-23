import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { radius, useTheme } from '../theme';
import { AppText, Button, Ionicons, NavBar, Screen, TextField } from '../ui';
import { useAppDispatch } from '../store/hooks';
import { authStateChanged } from '../store/slices/authSlice';
import {
  CODE_LENGTH,
  formatCode,
  guestProfile,
  isOfflineError,
  normalizeCode,
  redeemCode,
} from '../services/guest';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'GuestCode'>;

/** Enter a coach's plan code to use the app without an account (and offline). */
export function GuestCodeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const normalized = normalizeCode(code);
    if (normalized.length !== CODE_LENGTH) {
      setError(t('guest.enter.errors.short'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await redeemCode(normalized);
      dispatch(authStateChanged({ profile: guestProfile() }));
    } catch (e) {
      setError(isOfflineError(e) ? t('guest.enter.errors.offline') : t('guest.enter.errors.invalid'));
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <NavBar title={t('guest.enter.title')} />
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.systemBlue }]}>
          <Ionicons name="key-outline" size={40} color={colors.onAccent} />
        </View>
        <AppText variant="title2" style={{ textAlign: 'center' }}>
          {t('guest.enter.title')}
        </AppText>
        <AppText variant="subheadline" color={colors.secondaryLabel} style={{ textAlign: 'center' }}>
          {t('guest.enter.subtitle')}
        </AppText>
      </View>

      <View style={styles.form}>
        <TextField
          label={t('guest.enter.label')}
          placeholder={t('guest.enter.placeholder')}
          value={code}
          onChangeText={(value) => setCode(formatCode(normalizeCode(value).slice(0, CODE_LENGTH)))}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={handleContinue}
        />
        {error ? (
          <AppText variant="footnote" color={colors.systemRed}>
            {error}
          </AppText>
        ) : null}
        <AppText variant="footnote" color={colors.secondaryLabel}>
          {t('guest.enter.note')}
        </AppText>
        <Button label={t('guest.enter.continue')} onPress={handleContinue} loading={loading} />
        <Button
          label={t('guest.enter.back')}
          variant="plain"
          size="md"
          onPress={() => navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 8, marginBottom: 28, marginTop: 8 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  form: { gap: 14 },
});
