import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Ionicons,
  ListGroup,
  ListGroupHeader,
  ListRow,
  NavBar,
  Screen,
  SegmentedControl,
  TextField,
} from '../../ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { authStateChanged, signOutThunk } from '../../store/slices/authSlice';
import { selectGymName } from '../../store/slices/gymsSlice';
import {
  changeUserPassword,
  removeUserPhoto,
  updateUserDisplayName,
  updateUserPhoto,
} from '../../services/auth';
import { fetchOrCreateProfile } from '../../services/auth';
import { firebaseAuth } from '../../config/firebase';
import { pickAvatarDataUrl } from '../../utils/photo';
import { LANGUAGES, getLanguageOverride, setLanguage, type LanguageCode } from '../../i18n';

/** Profile for every role: photo, name, password, appearance, sign out. */
export function ProfileScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { t } = useTranslation();
  const [languageOverride, setLanguageOverride] = useState<LanguageCode | null>(null);

  useEffect(() => {
    getLanguageOverride().then(setLanguageOverride);
  }, []);

  const chooseLanguage = (code: LanguageCode | null) => {
    setLanguageOverride(code);
    setLanguage(code);
  };
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth.profile);
  const gymName = useAppSelector((state) => selectGymName(state, profile?.gymId));

  const [name, setName] = useState(profile?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!profile) return null;

  const nameChanged = name.trim() !== profile.name && name.trim().length > 0;

  const handleSaveName = async () => {
    if (!nameChanged) return;
    setSavingName(true);
    setNameError(null);
    try {
      await updateUserDisplayName(profile.uid, name);
      const user = firebaseAuth.currentUser;
      if (user) {
        const refreshed = await fetchOrCreateProfile(user);
        dispatch(authStateChanged({ profile: refreshed }));
      }
    } catch (error) {
      console.warn('[ProfileScreen] name save failed', error);
      setNameError(t('profile.nameError'));
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePhoto = async () => {
    setPhotoBusy(true);
    try {
      const dataUrl = await pickAvatarDataUrl();
      if (dataUrl) {
        await updateUserPhoto(profile.uid, dataUrl);
        const user = firebaseAuth.currentUser;
        if (user) {
          const refreshed = await fetchOrCreateProfile(user);
          dispatch(authStateChanged({ profile: refreshed }));
        }
      }
    } catch (error) {
      console.warn('[ProfileScreen] photo failed', error);
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoBusy(true);
    try {
      await removeUserPhoto(profile.uid);
      const user = firebaseAuth.currentUser;
      if (user) {
        const refreshed = await fetchOrCreateProfile(user);
        dispatch(authStateChanged({ profile: refreshed }));
      }
    } catch (error) {
      console.warn('[ProfileScreen] photo remove failed', error);
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    setPasswordError(false);
    if (currentPassword.length === 0 || newPassword.length < 6) {
      setPasswordMessage(t('profile.passwordRequired'));
      setPasswordError(true);
      return;
    }
    setSavingPassword(true);
    try {
      await changeUserPassword(profile.email, currentPassword, newPassword);
      setPasswordMessage(t('profile.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile.passwordFailed');
      setPasswordMessage(message);
      setPasswordError(true);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Screen>
      <NavBar large title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleChangePhoto} disabled={photoBusy} accessibilityLabel={t('profile.changePhoto')}>
            <View>
              <Avatar name={profile.name} size={84} photoUrl={profile.photoData} />
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.systemBlue, borderColor: colors.surface },
                ]}
              >
                {photoBusy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                )}
              </View>
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="title3">{profile.name}</AppText>
            <AppText variant="footnote" color={colors.secondaryLabel}>
              {profile.email}
            </AppText>
            <View style={styles.badgeRow}>
              <Badge label={t(`profile.roles.${profile.role}`)} variant={profile.role === 'admin' ? 'orange' : profile.role === 'coach' ? 'blue' : 'green'} />
              {profile.gymId ? <Badge label={gymName} variant="neutral" /> : null}
            </View>
          </View>
        </View>
        {profile.photoData ? (
          <Button label={t('profile.removePhoto')} variant="plain" size="sm" onPress={handleRemovePhoto} disabled={photoBusy} />
        ) : null}
      </Card>

      <ListGroupHeader label={t('profile.name')} />
      <Card style={styles.sectionCard}>
        <TextField
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleSaveName}
          error={nameError}
        />
        <Button
          label={t('profile.saveName')}
          variant="tinted"
          size="md"
          onPress={handleSaveName}
          loading={savingName}
          disabled={!nameChanged}
        />
      </Card>

      <ListGroupHeader label={t('profile.appearance')} />
      <Card style={styles.sectionCard}>
        <AppText variant="footnote" color={colors.secondaryLabel}>
          {t('profile.appearanceHint')}
        </AppText>
        <SegmentedControl
          options={[t('profile.themes.system'), t('profile.themes.light'), t('profile.themes.dark')]}
          selectedIndex={['system', 'light', 'dark'].indexOf(preference)}
          onChange={(index) => setPreference((['system', 'light', 'dark'] as ThemePreference[])[index])}
        />
      </Card>

      <ListGroupHeader label={t('profile.language')} />
      <Card style={styles.sectionCard}>
        <AppText variant="footnote" color={colors.secondaryLabel}>
          {t('profile.languageHint')}
        </AppText>
        <View style={styles.languageChips}>
          <Chip
            label={t('profile.systemDefault')}
            selected={languageOverride === null}
            onPress={() => chooseLanguage(null)}
          />
          {LANGUAGES.map((language) => (
            <Chip
              key={language.code}
              label={language.label}
              selected={languageOverride === language.code}
              onPress={() => chooseLanguage(language.code)}
            />
          ))}
        </View>
      </Card>

      <ListGroupHeader label={t('profile.changePassword')} />
      <Card style={styles.sectionCard}>
        <TextField
          label={t('profile.currentPassword')}
          placeholder="••••••••"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextField
          label={t('profile.newPassword')}
          placeholder="••••••••"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        {passwordMessage ? (
          <AppText variant="footnote" color={passwordError ? colors.systemRed : colors.systemGreen}>
            {passwordMessage}
          </AppText>
        ) : null}
        <Button
          label={t('profile.updatePassword')}
          variant="tinted"
          size="md"
          onPress={handleChangePassword}
          loading={savingPassword}
        />
      </Card>

      <ListGroupHeader label={t('profile.session')} />
      <ListGroup>
        <ListRow
          title={t('profile.signOut')}
          icon={{ name: 'log-out-outline', color: colors.systemRed, background: colors.redTint }}
          destructive
          onPress={() => dispatch(signOutThunk())}
        />
      </ListGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: { gap: 14, marginBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  sectionCard: { gap: 12 },
  languageChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
