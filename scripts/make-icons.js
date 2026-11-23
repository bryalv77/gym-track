const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
// Regenerates Fitlance app icons. Needs sharp: run with `NODE_PATH=<dir with sharp installed>/node_modules node scripts/make-icons.js` (not a project dependency).
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets');

const BG_TOP = '#FF9A4D';
const BG_BOT = '#E8481C';
const FLAT = '#EE5F25'; // solid fallback behind the Android adaptive foreground

const defs = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${BG_TOP}"/><stop offset="1" stop-color="${BG_BOT}"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.3" cy="0.22" r="0.8">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="plate" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3A3F4D"/><stop offset="0.45" stop-color="#232733"/><stop offset="1" stop-color="#14171F"/>
  </linearGradient>
  <linearGradient id="plateS" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#4A5060"/><stop offset="0.5" stop-color="#2E3340"/><stop offset="1" stop-color="#1B1E27"/>
  </linearGradient>
  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#F1F3F8"/><stop offset="1" stop-color="#C9CEDA"/>
  </linearGradient>`;

// Dumbbell in local coords centered on (0,0), ~480 units wide, horizontal.
const dumbbell = (mono) => {
  const f = (g) => (mono ? '#000000' : `url(#${g})`);
  const rr = (x, y, w, h, r, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
  const hi = (x, y, w, h) =>
    mono ? '' : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="#FFFFFF" fill-opacity="0.22"/>`;
  return (
    rr(-240, -22, 480, 44, 0, f('bar')) +
    rr(-240, -34, 28, 68, 12, f('plateS')) + rr(212, -34, 28, 68, 12, f('plateS')) +
    rr(-212, -92, 58, 184, 24, f('plateS')) + rr(154, -92, 58, 184, 24, f('plateS')) +
    rr(-150, -132, 66, 264, 28, f('plate')) + rr(84, -132, 66, 264, 28, f('plate')) +
    hi(-138, -118, 10, 236) + hi(96, -118, 10, 236) +
    hi(-200, -78, 8, 156) + hi(166, -78, 8, 156)
  );
};

// scale = canvas px per local unit; rotate = degrees.
const svg = ({ size, bg, scale, rotate = -45, shadow = true, mono, round, flat }) => {
  const c = size / 2;
  const clip = round ? `<clipPath id="r"><circle cx="${c}" cy="${c}" r="${c}"/></clipPath>` : '';
  const body = dumbbell(mono);
  // Soft shadow: stacked offset copies (SVG blur filters leave tile artifacts in librsvg).
  const drop = shadow && !mono
    ? Array.from({ length: 30 }, (_, i) => 8 + i * 1.2).map((dy) => `<g opacity="0.028" transform="translate(0 ${dy}) rotate(${rotate}) scale(${scale})">${dumbbell(true)}</g>`).join('')
    : '';
  const back = bg
    ? `<rect width="${size}" height="${size}" fill="${flat ? FLAT : 'url(#bg)'}"/>${flat ? '' : `<rect width="${size}" height="${size}" fill="url(#glow)"/>`}`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${defs}${clip}</defs>
  <g ${round ? 'clip-path="url(#r)"' : ''}>
    ${back}
    <g transform="translate(${c} ${c})">${drop}<g transform="rotate(${rotate}) scale(${scale})">${body}</g></g>
  </g></svg>`;
};

const png = (name, opts, outSize, flatten) => {
  let p = sharp(Buffer.from(svg(opts)), { density: 72 }).resize(outSize, outSize);
  if (flatten) p = p.flatten({ background: BG_BOT });
  return p.png().toFile(path.join(OUT, name));
};

(async () => {
  // iOS / Expo icon: full-bleed square, no transparency (stores reject alpha).
  await png('icon.png', { size: 1024, bg: true, scale: 1.7 }, 1024, true);
  // Android adaptive: 66% safe zone.
  await png('android-icon-background.png', { size: 1024, bg: true, flat: true, scale: 1, shadow: false }, 1024);
  await png('android-icon-foreground.png', { size: 1024, scale: 1.4 }, 1024);
  await png('android-icon-monochrome.png', { size: 1024, scale: 1.4, mono: true }, 1024);
  // Splash: round badge, centered mark.
  await png('splash-icon.png', { size: 1024, bg: true, scale: 1.5, round: true }, 1024);
  // Favicon: round badge, simplified at small size.
  await png('favicon.png', { size: 256, bg: true, scale: 0.7, round: true }, 48);
  // Play Store listing icon: 512x512, full square.
  fs.mkdirSync(path.join(ROOT, 'store'), { recursive: true });
  await sharp(Buffer.from(svg({ size: 1024, bg: true, scale: 1.7 }))).resize(512, 512).flatten({ background: BG_BOT }).png().toFile(path.join(ROOT, 'store', 'play-store-icon.png'));
  console.log('done');
})();
