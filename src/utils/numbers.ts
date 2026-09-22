/** Parses free-text numeric input from forms ("75,2" or "75.2" → 75.2). */
export function parseOptionalNumber(text: string): number | undefined {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed.length === 0) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}
