import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ThemeColors } from './index';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  colors: ThemeColors;
  /** Effective mode after resolving 'system'. */
  mode: 'light' | 'dark';
  isDark: boolean;
  /** What the user picked (persisted). */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const THEME_KEY = 'gymtrack.theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => undefined);
  };

  const mode: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const isDark = mode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      mode,
      isDark,
      preference: loaded ? preference : 'system',
      setPreference,
    }),
    [isDark, mode, preference, loaded],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
