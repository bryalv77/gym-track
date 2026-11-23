import { apiRequest } from '../config/api';
import type { ShareCode } from '../types/api';

/** Coach: active plan codes. */
export const listShareCodes = () => apiRequest<ShareCode[]>('/api/share');

export const createShareCode = (routineId: string) =>
  apiRequest<{ code: string }>('/api/share', { method: 'POST', body: JSON.stringify({ routineId }) });

export const revokeShareCode = (code: string) =>
  apiRequest<void>(`/api/share/${encodeURIComponent(code)}`, { method: 'DELETE' });
