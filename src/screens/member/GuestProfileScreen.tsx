import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
import {
  AppText,
  Button,
  Card,
  Chip,
  ListGroup,
  ListGroupHeader,
  ListRow,
  NavBar,
  Screen,
  SegmentedControl,
} from '../../ui';
import { useAppDispatch } from '../../store/hooks';
import { authStateChanged } from '../../store/slices/authSlice';
import { clearGuest, formatCode, refreshGuest, subscribeToGuest, type GuestData } from '../../services/guest';
import { LANGUAGES, getLanguageOverride, setLanguage, type LanguageCode } from '../../i18n';
import { confirmAction } from '../../utils/confirm';

/** Profile tab of a guest session: plan info, appearance, language, and leaving guest mode. */
export function GuestProfileScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [languageOverride, setLanguageOverride] = useState<LanguageCode | null>(null);

  useEffect(() => subscribeToGuest(setGuest), []);
  useEffect(() => {
    getLanguageOverride().then(setLanguageOverride);
  }, []);

  const chooseLanguage = (code: LanguageCode | null) => {
    setLanguageOverride(code);
    setLanguage(code);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await refreshGuest();
    setMessage(result === 'updated' ? t('guest.profile.refreshed') : result === 'offline' ? t('guest.profile.refreshOffline') : null);
    setRefreshing(false);
  };

  const leave = async () => {
    await clearGuest();
    dispatch(authStateChanged({ profile: null }));
  };

  return (
    <Screen>
      <NavBar large title={t('profile.title')} subtitle={t('guest.name')} />

      {guest ? (
        <>
          <ListGroupHeader label={t('guest.profile.planHeader')} />
          <Card style={styles.card}>
            <Row label={t('guest.profile.routine')} value={guest.routineName} />
            <Row label={t('guest.profile.coach')} value={guest.coachName} />
            <Row label={t('guest.profile.code')} value={formatCode(guest.code)} />
            <Row label={t('guest.profile.updated')} value={new Date(guest.fetchedAt).toLocaleString()} />
            {guest.revoked ? (
              <AppText variant="footnote" color={colors.systemOrange}>
                {t('guest.profile.revoked')}
              </AppText>
            ) : null}
            {message ? (
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {message}
              </AppText>
            ) : null}
            <Button
              label={t('guest.profile.refresh')}
              variant="tinted"
              size="md"
              icon="refresh"
              onPress={handleRefresh}
              loading={refreshing}
            />
            <AppText variant="caption1" color={colors.tertiaryLabel}>
              {t('guest.profile.localNote')}
            </AppText>
          </Card>
        </>
      ) : null}

      <ListGroupHeader label={t('profile.appearance')} />
      <Card style={styles.card}>
        <SegmentedControl
          options={[t('profile.themes.system'), t('profile.themes.light'), t('profile.themes.dark')]}
          selectedIndex={['system', 'light', 'dark'].indexOf(preference)}
          onChange={(index) => setPreference((['system', 'light', 'dark'] as ThemePreference[])[index])}
        />
      </Card>

      <ListGroupHeader label={t('profile.language')} />
      <Card style={styles.card}>
        <View style={styles.chips}>
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

      <ListGroupHeader label={t('guest.profile.accountHeader')} />
      <ListGroup>
        <ListRow
          title={t('guest.profile.createAccount')}
          icon={{ name: 'person-add-outline', color: colors.systemBlue }}
          chevron
          onPress={() => dispatch(authStateChanged({ profile: null }))}
        />
        <ListRow
          title={t('guest.profile.remove')}
          icon={{ name: 'trash-outline', color: colors.systemRed }}
          onPress={() =>
            confirmAction(t('guest.profile.removeTitle'), t('guest.profile.removeMessage'), leave)
          }
        />
      </ListGroup>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <AppText variant="subheadline" color={colors.secondaryLabel}>
        {label}
      </AppText>
      <AppText variant="subheadline" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
