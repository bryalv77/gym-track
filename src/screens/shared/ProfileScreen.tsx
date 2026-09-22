import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
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

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  coach: 'Coach',
  member: 'Member',
};

/** Profile for every role: photo, name, password, appearance, sign out. */
export function ProfileScreen() {
  const { colors, preference, setPreference } = useTheme();
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
      setNameError('Could not save your name. Try again.');
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
      setPasswordMessage('Enter your current password and a new one (min. 6 characters).');
      setPasswordError(true);
      return;
    }
    setSavingPassword(true);
    try {
      await changeUserPassword(profile.email, currentPassword, newPassword);
      setPasswordMessage('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not change the password.';
      setPasswordMessage(message);
      setPasswordError(true);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Screen>
      <NavBar large title="Profile" subtitle="Your account" />

      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleChangePhoto} disabled={photoBusy} accessibilityLabel="Change photo">
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
              <Badge label={ROLE_LABELS[profile.role] ?? 'Member'} variant={profile.role === 'admin' ? 'orange' : profile.role === 'coach' ? 'blue' : 'green'} />
              {profile.gymId ? <Badge label={gymName} variant="neutral" /> : null}
            </View>
          </View>
        </View>
        {profile.photoData ? (
          <Button label="Remove photo" variant="plain" size="sm" onPress={handleRemovePhoto} disabled={photoBusy} />
        ) : null}
      </Card>

      <ListGroupHeader label="Name" />
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
          label="Save name"
          variant="tinted"
          size="md"
          onPress={handleSaveName}
          loading={savingName}
          disabled={!nameChanged}
        />
      </Card>

      <ListGroupHeader label="Appearance" />
      <Card style={styles.sectionCard}>
        <AppText variant="footnote" color={colors.secondaryLabel}>
          Dark mode follows System by default until you pick a style.
        </AppText>
        <SegmentedControl
          options={['System', 'Light', 'Dark']}
          selectedIndex={['system', 'light', 'dark'].indexOf(preference)}
          onChange={(index) => setPreference((['system', 'light', 'dark'] as ThemePreference[])[index])}
        />
      </Card>

      <ListGroupHeader label="Change password" />
      <Card style={styles.sectionCard}>
        <TextField
          label="Current password"
          placeholder="••••••••"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextField
          label="New password"
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
          label="Update password"
          variant="tinted"
          size="md"
          onPress={handleChangePassword}
          loading={savingPassword}
        />
      </Card>

      <ListGroupHeader label="Session" />
      <ListGroup>
        <ListRow
          title="Sign out"
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
});
