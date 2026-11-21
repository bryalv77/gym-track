import { apiRequest, createPoller, emitSyncInvalidate } from '../config/api';
import type { Measurement, MeasurementsById } from '../types';

export function subscribeToMeasurements(
  uid: string,
  callback: (value: unknown) => void,
): () => void {
  return createPoller(
    'measurements',
    () => apiRequest<MeasurementsById>(`/api/measurements/${encodeURIComponent(uid)}`),
    callback,
    (error) => console.warn('[measurements] subscription error:', error.message),
  );
}

export async function addMeasurement(
  uid: string,
  input: Omit<Measurement, 'id' | 'createdAt'>,
): Promise<void> {
  await apiRequest(`/api/measurements/${encodeURIComponent(uid)}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  emitSyncInvalidate('measurements');
}

/** Rewrites an existing measurement entry keeping its original timestamps. */
export async function updateMeasurement(uid: string, entry: Measurement): Promise<void> {
  await apiRequest(
    `/api/measurements/${encodeURIComponent(uid)}/${encodeURIComponent(entry.id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(entry),
    },
  );
  emitSyncInvalidate('measurements');
}

export async function deleteMeasurement(uid: string, id: string): Promise<void> {
  await apiRequest(
    `/api/measurements/${encodeURIComponent(uid)}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );
  emitSyncInvalidate('measurements');
}
