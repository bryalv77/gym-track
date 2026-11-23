/** The error's own message when it has one, otherwise the localized fallback. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
