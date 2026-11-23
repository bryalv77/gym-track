import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = '@gymtrack/auth_token';

/**
 * Base URL of the Hono Cloudflare Worker API.
 * Defaults to http://localhost:8787 in local dev when EXPO_PUBLIC_API_URL is unset.
 */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'
).replace(/\/+$/, '');

let memoryToken: string | null = null;
let tokenLoaded = false;

export async function getAuthToken(): Promise<string | null> {
  if (tokenLoaded) return memoryToken;
  try {
    memoryToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    tokenLoaded = true;
    return memoryToken;
  } catch {
    return memoryToken;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  memoryToken = token;
  tokenLoaded = true;
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = 'api/error', status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** Called when a signed-in request is rejected with 401 (session expired or user removed). */
export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (response.status === 401 && token && !path.startsWith('/api/auth/')) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    const errObj = (data ?? {}) as { error?: string; code?: string };
    throw new ApiError(
      errObj.error || `Request failed with status ${response.status}`,
      errObj.code || 'api/error',
      response.status,
    );
  }

  return data as T;
}

export type SyncChannel =
  | 'auth'
  | 'users'
  | 'gyms'
  | 'gymCodes'
  | 'exercises'
  | 'routines'
  | 'assignments'
  | 'completions'
  | 'measurements'
  | 'selfies';

type ChannelListener = () => void;
const channelListeners = new Map<SyncChannel, Set<ChannelListener>>();

/**
 * Triggers an immediate refetch on all active subscribers for the given channel(s).
 * Call this right after any POST/PUT/PATCH/DELETE mutation.
 */
export function emitSyncInvalidate(...channels: SyncChannel[]): void {
  for (const channel of channels) {
    const set = channelListeners.get(channel);
    if (set) {
      set.forEach((listener) => {
        try {
          listener();
        } catch {
          // ignore listener errors
        }
      });
    }
  }
}

/**
 * Creates a live subscription (returns an unsubscribe function)
 * that fetches immediately, polls every `intervalMs` (default 10s), and immediately
 * refetches whenever `emitSyncInvalidate(channel)` is triggered locally.
 */
export function createPoller<T>(
  channel: SyncChannel,
  fetcher: () => Promise<T>,
  callback: (value: T) => void,
  onError?: (error: Error) => void,
  intervalMs = 10_000,
): () => void {
  let active = true;
  let inFlight = false;

  const run = async () => {
    if (!active || inFlight) return;
    inFlight = true;
    try {
      const data = await fetcher();
      if (active) {
        callback(data);
      }
    } catch (err) {
      if (active && onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      inFlight = false;
    }
  };

  let set = channelListeners.get(channel);
  if (!set) {
    set = new Set();
    channelListeners.set(channel, set);
  }
  set.add(run);

  void run();
  const timer = setInterval(run, intervalMs);

  return () => {
    active = false;
    clearInterval(timer);
    channelListeners.get(channel)?.delete(run);
  };
}

/** Polls `path` (and refetches on invalidation of `channel`), delivering typed JSON to `callback`. */
export function subscribeToPath<T>(
  channel: SyncChannel,
  path: string,
  callback: (value: T) => void,
): () => void {
  return createPoller(
    channel,
    () => apiRequest<T>(path),
    callback,
    (error) => console.warn(`[${channel}] subscription error:`, error.message),
  );
}

/** Sends a JSON mutation, then refetches the affected channels. */
export async function mutate<T = void>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body: unknown,
  ...channels: SyncChannel[]
): Promise<T> {
  const result = await apiRequest<T>(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  emitSyncInvalidate(...channels);
  return result;
}
