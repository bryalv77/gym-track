import i18n from '../i18n';
import { DEFAULT_EXERCISES, LANGS, type DefaultExercise, type Lang } from '../shared/exerciseDefaults';

export function currentLang(): Lang {
  const code = i18n.language?.slice(0, 2) as Lang;
  return LANGS.includes(code) ? code : 'en';
}

const normalize = (value: string) => value.trim().toLowerCase();

/** The starter exercise whose stored name matches any of its translations. */
function findDefaultByName(name: string): DefaultExercise | undefined {
  const needle = normalize(name);
  return DEFAULT_EXERCISES.find((item) =>
    LANGS.some((lang) => normalize(item.text[lang].name) === needle),
  );
}

/**
 * Display name in the app's language. Starter exercises are stored in one
 * language, so they are recognized by name and shown translated; names a coach
 * wrote or edited themselves are shown as saved.
 */
export function exerciseName(exercise: { name: string }): string {
  const match = findDefaultByName(exercise.name);
  return match ? match.text[currentLang()].name : exercise.name;
}

/** Same as `exerciseName`, for the description (only untouched seeded text). */
export function exerciseDescription(exercise: {
  name: string;
  description?: string;
}): string | undefined {
  const match = findDefaultByName(exercise.name);
  if (!match || !exercise.description) return exercise.description;
  const stored = normalize(exercise.description);
  const isSeeded = LANGS.some((lang) => normalize(match.text[lang].description) === stored);
  return isSeeded ? match.text[currentLang()].description : exercise.description;
}
