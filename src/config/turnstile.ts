import { API_BASE_URL } from './api';

export const TURNSTILE_URL = `${API_BASE_URL}/api/auth/turnstile`;

export interface TurnstileProps {
  /** Called with a token once the check passes, and with '' when it expires or fails. */
  onToken: (token: string) => void;
}
