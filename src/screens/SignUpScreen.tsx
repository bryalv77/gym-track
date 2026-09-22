import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { radius, useTheme } from '../theme';
import { AppText, Button, Chip, NavBar, Screen, TextField } from '../ui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuthError, signUpThunk } from '../store/slices/authSlice';
import { COACH_SIGNUP_CODE } from '../config/firebase';
import { subscribeToGyms } from '../services/gyms';
import { normalizeGyms } from '../store/slices/gymsSlice';
import type { AuthStackParamList } from '../navigation/RootNavigator';
import type { Gym } from '../types';

type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: SignUpScreenProps) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coachCode, setCoachCode] = useState('');
  const [gymId, setGymId] = useState<string | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  // Gyms are readable before sign-in so new users can pick theirs.
  useEffect(() => subscribeToGyms((value) => setGyms(Object.values(normalizeGyms(value)))), []);

  const sortedGyms = gyms.slice().sort((a, b) => a.name.localeCompare(b.name));

  const handleSignUp = () => {
    setLocalError(null);
    if (!name.trim() || !email.trim() || password.length < 6) {
      setLocalError('Fill in your name, email and a password of at least 6 characters.');
      return;
    }
    const trimmedCode = coachCode.trim();
    if (trimmedCode.length > 0 && trimmedCode.toUpperCase() !== COACH_SIGNUP_CODE) {
      setLocalError('That coach code is not valid. Leave it empty to join as a member.');
      return;
    }
    const isCoach = trimmedCode.toUpperCase() === COACH_SIGNUP_CODE;
    if ((isCoach || sortedGyms.length > 0) && !gymId) {
      setLocalError('Choose your gym to continue.');
      return;
    }
    dispatch(
      signUpThunk({
        name,
        email,
        password,
        role: isCoach ? 'coach' : 'member',
        ...(gymId ? { gymId } : {}),
      }),
    );
  };

  return (
    <Screen scroll contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <NavBar
        title="Create Account"
        large={false}
        onBack={() => {
          dispatch(clearAuthError());
          navigation.goBack();
        }}
      />
      <View style={styles.form}>
        <TextField
          label="Name"
          placeholder="Brian Alvarez"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
        />
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
          label="Password (min. 6 characters)"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="next"
        />

        {sortedGyms.length > 0 ? (
          <View style={styles.gymSection}>
            <AppText variant="footnote" color={colors.secondaryLabel}>
              YOUR GYM
            </AppText>
            <View style={styles.chips}>
              {sortedGyms.map((gym) => (
                <Chip
                  key={gym.id}
                  label={gym.name}
                  selected={gymId === gym.id}
                  onPress={() => setGymId(gym.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <TextField
          label="Coach code (optional)"
          placeholder="Coaches only"
          value={coachCode}
          onChangeText={setCoachCode}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
        />
        <AppText variant="footnote" color={colors.secondaryLabel} style={styles.hint}>
          Leave the coach code empty to create a member account. Ask your gym for the
          code if you are the coach.
        </AppText>
        {localError ?? error ? (
          <AppText variant="footnote" color={colors.systemRed}>
            {localError ?? error}
          </AppText>
        ) : null}
        <Button label="Create Account" onPress={handleSignUp} loading={loading} />
        <View style={[styles.noteBox, { backgroundColor: colors.blueTint }]}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            Your coach sees your daily checkmarks, streak and body measurements.
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  gymSection: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { marginTop: -4 },
  noteBox: { borderRadius: radius.md, padding: 12 },
});
