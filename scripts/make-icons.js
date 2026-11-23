const sharp = require('sharp');
const path = require('path');
// Regenerates app icons. Needs sharp: run with `pnpm dlx -p sharp node scripts/make-icons.js` (not a project dependency).
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets');

const ORANGE = '#EE7533';
const SHADOW = '#D64D22';

// Dumbbell in local coords centered on (0,0), ~426 units wide (from the reference).
const shapes = (fill) => {
  const f = (c) => fill || c;
  const plate = (x, y, w, h, top, bot) =>
    fill
      ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${fill}"/>`
      : `<clipPath id="c${x}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}"/></clipPath>
         <g clip-path="url(#c${x})"><rect x="${x}" y="${y}" width="${w}" height="${-y}" fill="${top}"/>
         <rect x="${x}" y="0" width="${w}" height="${h + y}" fill="${bot}"/></g>`;
  const bar = fill
    ? `<rect x="-213" y="-29" width="426" height="59" fill="${fill}"/>`
    : `<rect x="-213" y="-29" width="426" height="30" fill="#FFFFFF"/><rect x="-213" y="1" width="426" height="29" fill="#E9ECF5"/>`;
  return (
    bar +
    plate(-190, -79, 60, 158, '#686D7A', '#444A54') +
    plate(-134, -110, 62, 220, '#565B66', '#353A43') +
    plate(72, -110, 62, 220, '#565B66', '#353A43') +
    plate(130, -79, 60, 158, '#686D7A', '#444A54')
  );
};

// Long diagonal shadow: the silhouette stamped along a 45° line.
const shadow = (len) => {
  let s = '';
  for (let k = 0; k <= len; k += 0.5) s += `<g transform="translate(${k} ${k})">${shapes(SHADOW)}</g>`;
  return s;
};

// scale = how many canvas px per local unit; the dumbbell is centered.
const svg = ({ size, bg, scale, withShadow, mono, round }) => {
  const c = size / 2;
  const body = mono ? shapes('#000000') : shapes();
  const sh = withShadow && !mono ? `<g>${shadow(700)}</g>` : '';
  const clip = round ? `<clipPath id="r"><circle cx="${c}" cy="${c}" r="${c}"/></clipPath>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${clip}</defs>
  <g ${round ? 'clip-path="url(#r)"' : ''}>
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
    <g transform="translate(${c} ${c}) scale(${scale})">${sh}${body}</g>
  </g></svg>`;
};

const png = (name, opts, outSize, flatten) => {
  let p = sharp(Buffer.from(svg(opts)), { density: 72 }).resize(outSize, outSize);
  if (flatten) p = p.flatten({ background: ORANGE });
  return p.png().toFile(path.join(OUT, name));
};

(async () => {
  // iOS / Expo icon: full-bleed square, no transparency (stores reject alpha).
  await png('icon.png', { size: 1024, bg: ORANGE, scale: 1.65, withShadow: true }, 1024, true);
  // Android adaptive: 66% safe zone => dumbbell ~620px wide of 1024.
  await png('android-icon-background.png', { size: 1024, bg: ORANGE, scale: 1 }, 1024);
  await png('android-icon-foreground.png', { size: 1024, scale: 1.35, withShadow: true }, 1024);
  await png('android-icon-monochrome.png', { size: 1024, scale: 1.35, mono: true }, 1024);
  // Splash: transparent, centered mark.
  await png('splash-icon.png', { size: 1024, bg: ORANGE, scale: 1.5, withShadow: true, round: true }, 1024);
  // Favicon: round badge like the reference, simplified at small size.
  await png('favicon.png', { size: 256, bg: ORANGE, scale: 0.85, withShadow: true, round: true }, 48);
  // Play Store listing icon: 512x512, full square (Google applies its own mask).
  await sharp(Buffer.from(svg({ size: 1024, bg: ORANGE, scale: 1.65, withShadow: true }))).resize(512, 512).flatten({ background: ORANGE }).png().toFile(path.join(ROOT, 'store', 'play-store-icon.png'));
  console.log('done');
})();
