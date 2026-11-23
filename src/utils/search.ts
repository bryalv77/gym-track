/** True when the query is empty or appears (case-insensitive) in any of the fields. */
export function matchesQuery(query: string, ...fields: string[]): boolean {
  const needle = query.trim().toLowerCase();
  return needle.length === 0 || fields.some((field) => field.toLowerCase().includes(needle));
}
