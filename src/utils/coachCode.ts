/** No 0/O/1/I so codes can be read out and typed without mistakes. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Random 8-character coach code, e.g. `K7QF-2MXD` is stored as `K7QF2MXD`. */
export function generateCoachCode(): string {
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/** Normalizes user input (spaces, dashes, case) before comparing codes. */
export function normalizeCoachCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}
