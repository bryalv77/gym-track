import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { common } from './locales/common';
import { auth } from './locales/auth';
import { member } from './locales/member';
import { coach } from './locales/coach';
import { admin } from './locales/admin';
import { library } from './locales/library';
import { profile } from './locales/profile';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const LANGUAGE_KEY = 'gymtrack.language';
const SECTIONS = { common, auth, member, coach, admin, library, profile };

function build(lang: LanguageCode) {
  const translation: Record<string, unknown> = {};
  for (const [name, section] of Object.entries(SECTIONS)) {
    translation[name] = section[lang];
  }
  return { translation };
}

export function isSupported(code: string | null | undefined): code is LanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}

function deviceLanguage(): LanguageCode {
  const code = getLocales()[0]?.languageCode;
  return isSupported(code) ? code : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: build('en'), es: build('es'), pt: build('pt'), de: build('de'), fr: build('fr') },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Restore a manually chosen language (if any) after startup.
AsyncStorage.getItem(LANGUAGE_KEY)
  .then((stored) => {
    if (isSupported(stored) && stored !== i18n.language) i18n.changeLanguage(stored);
  })
  .catch(() => {});

/** Persist and apply a language; pass null to follow the device language again. */
export async function setLanguage(code: LanguageCode | null): Promise<void> {
  try {
    if (code) await AsyncStorage.setItem(LANGUAGE_KEY, code);
    else await AsyncStorage.removeItem(LANGUAGE_KEY);
  } catch {
    // preference just won't persist
  }
  await i18n.changeLanguage(code ?? deviceLanguage());
}

/** The manually chosen language, or null when following the device. */
export async function getLanguageOverride(): Promise<LanguageCode | null> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    return isSupported(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** BCP-47 tag of the active language, for Intl / toLocale* formatting. */
export function currentLocale(): string {
  return i18n.language || 'en';
}

export default i18n;
