import { useState } from 'react';
import { errorMessage } from './errorMessage';

/**
 * Save-button state for a form: `submit` runs the action with `saving` set and
 * shows `fallback` (or the server's own message when `useServerMessage`) on failure.
 */
export function useSubmit(tag: string) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (action: () => Promise<void>, fallback: string, useServerMessage = false) => {
    setSaving(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      console.warn(`[${tag}] save failed`, failure);
      setError(useServerMessage ? errorMessage(failure, fallback) : fallback);
    } finally {
      setSaving(false);
    }
  };

  return { saving, error, setError, submit };
}
