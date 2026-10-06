import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import { Button, Ionicons } from '../ui';
import type { Exercise } from '../types';
import { openExternalUrl } from '../utils/link';

/** Inline image/GIF of an exercise with graceful fallback, plus optional
 *  "watch demo" button that opens the video link externally. */
export function ExerciseMediaView({ exercise }: { exercise: Exercise }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const showImage = exercise.imageUrl != null && exercise.imageUrl.length > 0 && !failed;

  return (
    <View style={styles.container}>
      {showImage ? (
        <Image
          source={{ uri: exercise.imageUrl }}
          style={[styles.image, { backgroundColor: colors.fill }]}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[styles.image, styles.placeholder, { backgroundColor: colors.fill }]}>
          <Ionicons name="barbell-outline" size={34} color={colors.systemGray} />
        </View>
      )}
      {exercise.videoUrl ? (
        <Button
          label={t('library.media.watchDemo')}
          icon="play-circle-outline"
          variant="tinted"
          size="md"
          onPress={() => openExternalUrl(exercise.videoUrl as string)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  image: { height: 180, width: '100%', borderRadius: radius.lg },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
