import { mutate, subscribeToPath } from '../config/api';
import type { Measurement, MeasurementsById } from '../types';

export function subscribeToMeasurements(
  uid: string,
  callback: (value: MeasurementsById) => void,
): () => void {
  return subscribeToPath('measurements', `/api/measurements/${encodeURIComponent(uid)}`, callback);
}

export function addMeasurement(
  uid: string,
  input: Omit<Measurement, 'id' | 'createdAt'>,
): Promise<void> {
  return mutate('POST', `/api/measurements/${encodeURIComponent(uid)}`, input, 'measurements');
}

/** Rewrites an existing measurement entry keeping its original timestamps. */
export function updateMeasurement(uid: string, entry: Measurement): Promise<void> {
  const path = [uid, entry.id].map(encodeURIComponent).join('/');
  return mutate('PUT', `/api/measurements/${path}`, entry, 'measurements');
}

export function deleteMeasurement(uid: string, id: string): Promise<void> {
  const path = [uid, id].map(encodeURIComponent).join('/');
  return mutate('DELETE', `/api/measurements/${path}`, undefined, 'measurements');
}
