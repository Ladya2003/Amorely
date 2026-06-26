/**
 * Generates consistent kawaii-style SVG pet assets for all species/variant/level combos.
 * Run: npx ts-node scripts/generate-pet-assets.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = path.join(process.cwd(), 'client/public/pets');

const SPECIES = ['kitten', 'puppy', 'gecko', 'bunny', 'owlet'] as const;
const VARIANTS: Record<string, string[]> = {
  kitten: ['orange', 'gray', 'black'],
  puppy: ['golden', 'brown', 'spotted'],
  gecko: ['green', 'blue', 'yellow'],
  bunny: ['white', 'gray', 'cream'],
  owlet: ['brown', 'gray', 'white'],
};

const COLORS: Record<string, { main: string; accent: string; belly: string }> = {
  orange: { main: '#F4A460', accent: '#E8893A', belly: '#FFE4C4' },
  gray: { main: '#A9A9A9', accent: '#808080', belly: '#DCDCDC' },
  black: { main: '#3D3D3D', accent: '#1A1A1A', belly: '#555555' },
  golden: { main: '#FFD700', accent: '#DAA520', belly: '#FFF8DC' },
  brown: { main: '#8B4513', accent: '#654321', belly: '#DEB887' },
  spotted: { main: '#F5DEB3', accent: '#8B4513', belly: '#FFEFD5' },
  green: { main: '#7CB342', accent: '#558B2F', belly: '#C5E1A5' },
  blue: { main: '#64B5F6', accent: '#1976D2', belly: '#BBDEFB' },
  yellow: { main: '#FFEE58', accent: '#F9A825', belly: '#FFF9C4' },
  white: { main: '#FAFAFA', accent: '#E0E0E0', belly: '#FFFFFF' },
  cream: { main: '#FFF8E7', accent: '#F5DEB3', belly: '#FFFAF0' },
};

const levelScale = (level: number) => 0.75 + level * 0.05;
const levelAccessory = (species: string, level: number) => {
  if (level < 5) return '';
  if (species === 'kitten') return '<circle cx="100" cy="55" r="8" fill="#FF69B4" opacity="0.6"/>';
  if (species === 'puppy') return '<ellipse cx="100" cy="50" rx="12" ry="6" fill="#FF4444"/>';
  if (species === 'gecko') return '<circle cx="100" cy="48" r="6" fill="#FFD700" opacity="0.8"/>';
  if (species === 'bunny') return '<ellipse cx="100" cy="42" rx="8" ry="4" fill="#FFB6C1"/>';
  return '<polygon points="100,35 95,45 105,45" fill="#FFD700"/>';
};

const drawPetBody = (species: string, c: { main: string; accent: string; belly: string }, level: number, spotted: boolean) => {
  const s = levelScale(level);
  const cy = 140 - (level - 1) * 4;
  const spots = spotted
    ? `<circle cx="85" cy="${cy - 10}" r="5" fill="${c.accent}" opacity="0.5"/>
       <circle cx="115" cy="${cy - 5}" r="4" fill="${c.accent}" opacity="0.5"/>`
    : '';

  if (species === 'kitten' || species === 'puppy') {
    const earL = species === 'kitten' ? 'triangle' : 'floppy';
    const ears =
      earL === 'triangle'
        ? `<polygon points="70,${cy - 55} 82,${cy - 85} 94,${cy - 55}" fill="${c.main}"/>
           <polygon points="106,${cy - 55} 118,${cy - 85} 130,${cy - 55}" fill="${c.main}"/>
           <polygon points="74,${cy - 58} 82,${cy - 78} 90,${cy - 58}" fill="${c.belly}"/>
           <polygon points="110,${cy - 58} 118,${cy - 78} 126,${cy - 58}" fill="${c.belly}"/>`
        : `<ellipse cx="72" cy="${cy - 45}" rx="14" ry="22" fill="${c.main}" transform="rotate(-20 72 ${cy - 45})"/>
           <ellipse cx="128" cy="${cy - 45}" rx="14" ry="22" fill="${c.main}" transform="rotate(20 128 ${cy - 45})"/>`;
    const tail =
      species === 'kitten'
        ? `<path d="M ${130 + s * 5} ${cy + 20} Q ${155 + level * 3} ${cy - 10} ${145 + level * 2} ${cy - 35}" stroke="${c.main}" stroke-width="8" fill="none" stroke-linecap="round"/>`
        : `<path d="M ${128} ${cy + 25} Q ${150 + level * 2} ${cy + 5} ${140 + level} ${cy - 20}" stroke="${c.main}" stroke-width="10" fill="none" stroke-linecap="round"/>`;

    return `${ears}
      <ellipse cx="100" cy="${cy}" rx="${38 * s}" ry="${42 * s}" fill="${c.main}"/>
      <ellipse cx="100" cy="${cy + 12}" rx="${22 * s}" ry="${18 * s}" fill="${c.belly}"/>
      ${spots}
      <circle cx="88" cy="${cy - 8}" r="${5 + level * 0.3}" fill="#222"/>
      <circle cx="112" cy="${cy - 8}" r="${5 + level * 0.3}" fill="#222"/>
      <circle cx="90" cy="${cy - 10}" r="2" fill="#fff"/>
      <circle cx="114" cy="${cy - 10}" r="2" fill="#fff"/>
      <ellipse cx="100" cy="${cy + 2}" rx="4" ry="3" fill="#FFB6C1"/>
      <path d="M 96 ${cy + 8} Q 100 ${cy + 12} 104 ${cy + 8}" stroke="#333" stroke-width="1.5" fill="none"/>
      ${tail}
      <ellipse cx="${85 - level}" cy="${cy + 35}" rx="10" ry="8" fill="${c.main}"/>
      <ellipse cx="${115 + level}" cy="${cy + 35}" rx="10" ry="8" fill="${c.main}"/>`;
  }

  if (species === 'gecko') {
    return `
      <ellipse cx="100" cy="${cy}" rx="${32 * s}" ry="${28 * s}" fill="${c.main}"/>
      <ellipse cx="100" cy="${cy + 8}" rx="${18 * s}" ry="${14 * s}" fill="${c.belly}"/>
      ${spots}
      <circle cx="88" cy="${cy - 5}" r="6" fill="#222"/>
      <circle cx="112" cy="${cy - 5}" r="6" fill="#222"/>
      <circle cx="90" cy="${cy - 7}" r="2" fill="#fff"/>
      <circle cx="114" cy="${cy - 7}" r="2" fill="#fff"/>
      <path d="M 70 ${cy - 20} L 55 ${cy - 35} L 65 ${cy - 15} Z" fill="${c.main}"/>
      <path d="M 130 ${cy - 20} L 145 ${cy - 35} L 135 ${cy - 15} Z" fill="${c.main}"/>
      <path d="M 75 ${cy + 30} L 60 ${cy + 45} L 70 ${cy + 35} Z" fill="${c.main}"/>
      <path d="M 125 ${cy + 30} L 140 ${cy + 45} L 130 ${cy + 35} Z" fill="${c.main}"/>
      <path d="M ${130 + level} ${cy + 15} Q ${150 + level * 2} ${cy + 5} ${145 + level} ${cy - 15}" stroke="${c.accent}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }

  if (species === 'bunny') {
    return `
      <ellipse cx="82" cy="${cy - 55}" rx="10" ry="${28 + level * 2}" fill="${c.main}"/>
      <ellipse cx="118" cy="${cy - 55}" rx="10" ry="${28 + level * 2}" fill="${c.main}"/>
      <ellipse cx="82" cy="${cy - 55}" rx="5" ry="${18 + level}" fill="${c.belly}"/>
      <ellipse cx="118" cy="${cy - 55}" rx="5" ry="${18 + level}" fill="${c.belly}"/>
      <ellipse cx="100" cy="${cy}" rx="${35 * s}" ry="${38 * s}" fill="${c.main}"/>
      <ellipse cx="100" cy="${cy + 10}" rx="${20 * s}" ry="${16 * s}" fill="${c.belly}"/>
      ${spots}
      <circle cx="88" cy="${cy - 5}" r="5" fill="#222"/>
      <circle cx="112" cy="${cy - 5}" r="5" fill="#222"/>
      <circle cx="90" cy="${cy - 7}" r="1.5" fill="#fff"/>
      <circle cx="114" cy="${cy - 7}" r="1.5" fill="#fff"/>
      <ellipse cx="100" cy="${cy + 3}" rx="3" ry="2" fill="#FFB6C1"/>
      <ellipse cx="${88 - level}" cy="${cy + 38}" rx="9" ry="7" fill="${c.main}"/>
      <ellipse cx="${112 + level}" cy="${cy + 38}" rx="9" ry="7" fill="${c.main}"/>
      <circle cx="100" cy="${cy + 38}" rx="8" ry="6" fill="#fff" opacity="0.8"/>`;
  }

  // owlet
  return `
    <ellipse cx="100" cy="${cy - 15}" rx="${40 * s}" ry="${38 * s}" fill="${c.main}"/>
    <ellipse cx="100" cy="${cy + 5}" rx="${30 * s}" ry="${28 * s}" fill="${c.belly}"/>
    ${spots}
    <circle cx="100" cy="${cy - 15}" r="${22 * s}" fill="${c.belly}"/>
    <circle cx="88" cy="${cy - 18}" r="${8 + level * 0.4}" fill="#F5F5F5"/>
    <circle cx="112" cy="${cy - 18}" r="${8 + level * 0.4}" fill="#F5F5F5"/>
    <circle cx="88" cy="${cy - 18}" r="${5 + level * 0.2}" fill="#222"/>
    <circle cx="112" cy="${cy - 18}" r="${5 + level * 0.2}" fill="#222"/>
    <circle cx="89" cy="${cy - 20}" r="1.5" fill="#fff"/>
    <circle cx="113" cy="${cy - 20}" r="1.5" fill="#fff"/>
    <polygon points="100,${cy - 8} 94,${cy + 2} 106,${cy + 2}" fill="#FFB347"/>
    <ellipse cx="72" cy="${cy - 5}" rx="8" ry="5" fill="${c.main}" transform="rotate(-30 72 ${cy - 5})"/>
    <ellipse cx="128" cy="${cy - 5}" rx="8" ry="5" fill="${c.main}" transform="rotate(30 128 ${cy - 5})"/>
    <ellipse cx="100" cy="${cy + 35}" rx="12" ry="10" fill="${c.main}"/>
    <ellipse cx="${85 - level}" cy="${cy + 42}" rx="8" ry="5" fill="${c.accent}"/>
    <ellipse cx="${115 + level}" cy="${cy + 42}" rx="8" ry="5" fill="${c.accent}"/>`;
};

const petSvg = (species: string, variant: string, level: number) => {
  const c = COLORS[variant] ?? COLORS.orange;
  const spotted = variant === 'spotted';
  const acc = levelAccessory(species, level);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFF5F8"/>
      <stop offset="100%" stop-color="#FFE8F0"/>
    </linearGradient>
  </defs>
  <rect width="200" height="280" fill="url(#bg)" rx="16"/>
  ${acc}
  ${drawPetBody(species, c, level, spotted)}
  <text x="100" y="265" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#999">Lv.${level}</text>
</svg>`;
};

const eggSvg = (species: string) => {
  const silhouettes: Record<string, string> = {
    kitten: `<ellipse cx="100" cy="155" rx="18" ry="14" fill="#FFB6C1" opacity="0.4"/>`,
    puppy: `<ellipse cx="100" cy="155" rx="20" ry="15" fill="#DEB887" opacity="0.4"/>`,
    gecko: `<ellipse cx="100" cy="158" rx="16" ry="12" fill="#A5D6A7" opacity="0.4"/>`,
    bunny: `<ellipse cx="100" cy="152" rx="14" ry="18" fill="#F8BBD0" opacity="0.4"/>
            <ellipse cx="92" cy="138" rx="4" ry="12" fill="#F8BBD0" opacity="0.3"/>
            <ellipse cx="108" cy="138" rx="4" ry="12" fill="#F8BBD0" opacity="0.3"/>`,
    owlet: `<circle cx="100" cy="155" r="16" fill="#D7CCC8" opacity="0.4"/>`,
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
  <defs>
    <linearGradient id="eggGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFF8E7"/>
      <stop offset="100%" stop-color="#FFE4B5"/>
    </linearGradient>
  </defs>
  <rect width="200" height="280" fill="#FFF5F8" rx="16"/>
  <ellipse cx="100" cy="155" rx="55" ry="70" fill="url(#eggGrad)" stroke="#E8D5B7" stroke-width="2"/>
  <ellipse cx="85" cy="120" rx="20" ry="30" fill="#fff" opacity="0.3"/>
  ${silhouettes[species] ?? ''}
</svg>`;
};

const coinSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#FFA500"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#coin)" stroke="#E6A800" stroke-width="2"/>
  <text x="32" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#fff" font-weight="bold">♥</text>
</svg>`;

const writeFile = (filePath: string, content: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
};

writeFile(path.join(OUT_DIR, 'currency-coin.svg'), coinSvg);

for (const species of SPECIES) {
  writeFile(path.join(OUT_DIR, species, 'egg.svg'), eggSvg(species));
  for (const variant of VARIANTS[species]) {
    for (let level = 1; level <= 5; level++) {
      writeFile(
        path.join(OUT_DIR, species, variant, `level-${level}.svg`),
        petSvg(species, variant, level)
      );
    }
  }
}

console.log('Pet assets generated in client/public/pets/');
