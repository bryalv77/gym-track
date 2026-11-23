import React, { useCallback, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import { AppText, Button, Chip, ChipRow, SheetModal } from '../ui';
import { useAppSelector } from '../store/hooks';
import { selectRoutinesSorted } from '../store/slices/routinesSlice';
import { createShareCode, listShareCodes, revokeShareCode } from '../services/share';
import { formatCode } from '../services/guest';
import { confirmAction } from '../utils/confirm';
import { useResetOnChange } from '../utils/useResetOnChange';
import type { ShareCode } from '../types/api';

/** Coach sheet: hand out plan codes (guest access to one routine, works offline) and revoke them. */
export function ShareCodesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const routines = useAppSelector(selectRoutinesSorted);
  const [codes, setCodes] = useState<ShareCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setCodes(await listShareCodes());
    } catch {
      setError(t('guest.share.failed'));
    }
  }, [t]);

  useResetOnChange([visible], () => {
    setError(null);
    void reload();
  }, visible);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload();
    } catch {
      setError(t('guest.share.failed'));
    } finally {
      setBusy(false);
    }
  };

  const shareCode = (item: ShareCode) =>
    Share.share({
      message: t('guest.share.message', { routine: item.routineName, code: formatCode(item.code) }),
    }).catch(() => undefined);

  return (
    <SheetModal visible={visible} onClose={onClose} title={t('guest.share.title')}>
      <View style={styles.body}>
        <AppText variant="footnote" color={colors.secondaryLabel}>
          {t('guest.share.intro')}
        </AppText>

        <AppText variant="footnote" color={colors.secondaryLabel}>
          {t('guest.share.new')}
        </AppText>
        <ChipRow
          scroll={false}
          empty={
            routines.length === 0 ? (
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {t('guest.share.noRoutines')}
              </AppText>
            ) : null
          }
        >
          {routines.map((routine) => (
            <Chip
              key={routine.id}
              label={routine.name}
              selected={false}
              onPress={() => {
                if (!busy) void run(() => createShareCode(routine.id));
              }}
            />
          ))}
        </ChipRow>

        {error ? (
          <AppText variant="footnote" color={colors.systemRed}>
            {error}
          </AppText>
        ) : null}

        <AppText variant="footnote" color={colors.secondaryLabel}>
          {t('guest.share.active')}
        </AppText>
        {codes.length === 0 ? (
          <AppText variant="footnote" color={colors.tertiaryLabel}>
            {t('guest.share.none')}
          </AppText>
        ) : (
          codes.map((item) => (
            <View key={item.code} style={[styles.codeCard, { backgroundColor: colors.background }]}>
              <View style={{ flex: 1 }}>
                <AppText variant="title3" selectable>
                  {formatCode(item.code)}
                </AppText>
                <AppText variant="footnote" color={colors.secondaryLabel} numberOfLines={1}>
                  {item.routineName}
                </AppText>
              </View>
              <Button label={t('guest.share.share')} size="sm" variant="tinted" onPress={() => shareCode(item)} />
              <Button
                label={t('guest.share.revoke')}
                size="sm"
                variant="plain"
                onPress={() =>
                  confirmAction(t('guest.share.revokeTitle'), t('guest.share.revokeMessage'), () =>
                    run(() => revokeShareCode(item.code)),
                  )
                }
              />
            </View>
          ))
        )}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12, paddingBottom: 8 },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    padding: 12,
  },
});
