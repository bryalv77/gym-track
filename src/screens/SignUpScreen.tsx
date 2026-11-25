import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { radius, useTheme } from '../theme';
import { AppText, Button, Chip, NavBar, Screen, SegmentedControl, TextField } from '../ui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuthError, signUpThunk } from '../store/slices/authSlice';
import { subscribeToGyms } from '../services/gyms';
import { Turnstile } from '../components/Turnstile';
import type { AuthStackParamList } from '../navigation/types';
import { normalizeCoachCode } from '../utils/coachCode';
import type { Gym } from '../types';
import { MIN_PASSWORD_LENGTH } from '../types/api';
import { useResetOnChange } from '../utils/useResetOnChange';

type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;
type SignUpRole = 'member' | 'coach';

export function SignUpScreen({ navigation }: SignUpScreenProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [role, setRole] = useState<SignUpRole>('member');
  const [coachCode, setCoachCode] = useState('');
  const [gymId, setGymId] = useState<string | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  // Gyms are readable before sign-in so new users can pick theirs.
  useEffect(() => subscribeToGyms((value) => setGyms(Object.values(value))), []);

  // A code only means anything for a coach — clear it if the role changes back.
  useResetOnChange([role], () => setCoachCode(''), role === 'member');

  const sortedGyms = gyms.slice().sort((a, b) => a.name.localeCompare(b.name));

  // Tokens are single-use, so every attempt needs a new one.
  const resetTurnstile = () => {
    setTurnstileToken('');
    setTurnstileKey((key) => key + 1);
  };

  const handleSignUp = () => {
    setLocalError(null);
    if (!name.trim() || !email.trim() || password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(t('auth.errors.fillFields'));
      return;
    }
    const isCoach = role === 'coach';
    // Each gym has its own code; the API checks it against the chosen gym.
    const code = isCoach ? normalizeCoachCode(coachCode) : '';
    if (isCoach && code.length === 0) {
      setLocalError(t('auth.errors.coachCodeRequired'));
      return;
    }
    if ((isCoach || sortedGyms.length > 0) && !gymId) {
      setLocalError(t('auth.errors.chooseGym'));
      return;
    }
    dispatch(
      signUpThunk({
        name,
        email,
        password,
        role: isCoach ? 'coach' : 'member',
        ...(gymId ? { gymId } : {}),
        ...(isCoach ? { coachCode: code } : {}),
        turnstileToken,
      }),
    ).then(resetTurnstile);
  };

  return (
    <Screen scroll maxWidth={420} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <NavBar
        title={t('auth.createAccount')}
        large={false}
        onBack={() => {
          dispatch(clearAuthError());
          navigation.goBack();
        }}
      />
      <View style={styles.form}>
        <TextField
          label={t('auth.name')}
          placeholder={t('auth.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
        />
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
          label={t('auth.passwordMin')}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="next"
        />

        <View style={styles.roleSection}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('auth.roleTitle')}
          </AppText>
          <SegmentedControl
            options={[
              t('auth.roleMember'),
              t('auth.roleCoach'),
            ]}
            selectedIndex={role === 'member' ? 0 : 1}
            onChange={(index) => setRole(index === 0 ? 'member' : 'coach')}
          />
          {role === 'member' ? (
            <AppText variant="footnote" color={colors.secondaryLabel}>
              {t('auth.memberNoCodeHint')}
            </AppText>
          ) : null}
        </View>

        {sortedGyms.length > 0 ? (
          <View style={styles.gymSection}>
            <AppText variant="footnote" color={colors.secondaryLabel}>
              {t('auth.yourGym')}
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {sortedGyms.map((gym) => (
                <Chip
                  key={gym.id}
                  label={gym.name}
                  selected={gymId === gym.id}
                  onPress={() => setGymId(gym.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {role === 'coach' ? (
          <View style={styles.coachSection}>
            <TextField
              label={t('auth.coachCode')}
              placeholder={t('auth.coachCodePlaceholder')}
              value={coachCode}
              onChangeText={setCoachCode}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <AppText variant="footnote" color={colors.secondaryLabel} style={styles.hint}>
              {t('auth.coachCodeHint')}
            </AppText>
          </View>
        ) : null}

        <Turnstile key={turnstileKey} onToken={setTurnstileToken} />
        {localError ?? error ? (
          <AppText variant="footnote" color={colors.systemRed}>
            {localError ?? error}
          </AppText>
        ) : null}
        <Button label={t('auth.createAccount')} onPress={handleSignUp} loading={loading} />
        {role === 'member' ? (
          <View style={[styles.noteBox, { backgroundColor: colors.blueTint }]}>
            <AppText variant="footnote" color={colors.secondaryLabel}>
              {t('auth.coachSeesNote')}
            </AppText>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  roleSection: { gap: 8 },
  gymSection: { gap: 8 },
  chipsScroll: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  coachSection: { gap: 8 },
  hint: { marginTop: -4 },
  noteBox: { borderRadius: radius.md, padding: 12 },
});
