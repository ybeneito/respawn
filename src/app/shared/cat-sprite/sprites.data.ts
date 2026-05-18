import { CatPalette, CatStage } from '../../../domain/profile/user-profile.entity';

export interface StageInfo {
  label: string;
  blurb: string;
  minLevel: number;
  maxLevel: number;
}

export const STAGE_INFO: Record<CatStage, StageInfo> = {
  kitten:    { label: 'KITTEN',    blurb: 'tiny, curious, full of beans',                  minLevel: 1,  maxLevel: 3   },
  stray:     { label: 'STRAY',     blurb: 'street-smart, scrappy, knows every alley',       minLevel: 4,  maxLevel: 7   },
  ninja:     { label: 'NINJA',     blurb: 'shadows, silence, perfect form',                 minLevel: 8,  maxLevel: 12  },
  samurai:   { label: 'SAMURAI',   blurb: 'one strike, no mistakes, code of honor',         minLevel: 13, maxLevel: 18  },
  arcane:    { label: 'ARCANE',    blurb: 'orb in paw, runes humming, robes flowing',       minLevel: 19, maxLevel: 25  },
  legendary: { label: 'LEGENDARY', blurb: 'cosmic crown, nine lives squared',               minLevel: 26, maxLevel: 999 },
};

export const STAGE_ORDER: CatStage[] = ['kitten', 'stray', 'ninja', 'samurai', 'arcane', 'legendary'];

// Fur palette definitions — per-palette fur/eye/nose colors
const FUR_PALETTES: Record<CatPalette, { '1': string; '2': string; '3': string; '4': string; E: string; P: string }> = {
  orange:  { '1': '#ffce7e', '2': '#f59940', '3': '#c66520', '4': '#7a3a10', E: '#7ed87a', P: '#ff9fb5' },
  black:   { '1': '#4a3f58', '2': '#2a2238', '3': '#1a1428', '4': '#0a0410', E: '#fde047', P: '#ff79a0' },
  slate:   { '1': '#d8d0e8', '2': '#9a92aa', '3': '#5a5268', '4': '#3a3248', E: '#6ec8ff', P: '#ff9fb5' },
  white:   { '1': '#fffafa', '2': '#e8e0e8', '3': '#b8b0c0', '4': '#807888', E: '#6ec8ff', P: '#ff9fb5' },
  brown:   { '1': '#d4a274', '2': '#a06840', '3': '#6a3a20', '4': '#3a1f10', E: '#7ed87a', P: '#ff9fb5' },
  siamese: { '1': '#f4e8d0', '2': '#c8a878', '3': '#5a3818', '4': '#2a1808', E: '#3aa8ff', P: '#ff9fb5' },
  calico:  { '1': '#ffffff', '2': '#ffce7e', '3': '#c66520', '4': '#2a1408', E: '#7ed87a', P: '#ff9fb5' },
  void:    { '1': '#3a3050', '2': '#1f1638', '3': '#0f0820', '4': '#08040c', E: '#ff5fc8', P: '#ff79c8' },
};

// Shared accessory colors used by stage sprites (same for all palettes)
const ACCESSORY_COLORS: Record<string, string> = {
  K: '#1a0820', // outline
  M: '#1a0a10', // mouth
  W: '#ffffff', // eye shine

  B: '#d93838', b: '#ffeee0',           // Stray bandana

  I: '#0d0612', i: '#d93838', Q: '#ffffff', // Ninja mask

  A: '#e2dceb', a: '#5a5268',           // Samurai armor
  H: '#6a4020', h: '#3a2010',           // handle
  S: '#fff1a8', s: '#dcd6e6',           // sparkle/blade
  G: '#ffd966', g: '#b88a20',           // crest gold

  R: '#7048cc', r: '#4a2b8a',           // Arcane robe
  L: '#e2c9ff', T: '#3a1f6e',           // hat
  O: '#6ee5d8', o: '#b8fff5', U: '#3aaab0', // orb

  C: '#ffd966', D: '#b88a20', X: '#fff1a8', // Legendary crown/sparkle
};

// Build a complete character→color map for a given palette
export function buildPalette(paletteKey: CatPalette): Record<string, string> {
  const fur = FUR_PALETTES[paletteKey];
  return {
    ...ACCESSORY_COLORS,
    '1': fur['1'], '2': fur['2'], '3': fur['3'], '4': fur['4'],
    E: fur.E, P: fur.P,
  };
}

// Stage sprite art strings — copied exactly from design export
export const STAGE_SPRITES: Record<CatStage, string> = {
  kitten: `
..................
..................
.....KK....KK.....
....K22K..K22K....
....K212K.K212K...
...K11111KK1111K..
...K112222222.1K..
...K1WEWE.WEWE1K..
...K1EEEE.EEEE1K..
...K1122PPPP221K..
...K1122MMMM221K..
....K1122222.1K...
.....KKKKKKKKK....
..................
..................
..................
..................
..................
`,
  stray: `
..................
..................
...KK........KK...
..K22K......K22K..
..K212K....K212K..
.K1111KKKKKK1111K.
.K11222222222221K.
K112333223333321K.
K112212222122121K.
K1WEWE2222WEWE1.K.
K1EEEE3333EEEE1.K.
K11222PPPPPP2221K.
K1122223MMM322.1K.
.K2222222222222K..
.K1122222222211K..
..KKKKKKKKKKKKK...
..................
..................
`,
  ninja: `
..................
...KK........KK...
..K22K......K22K..
..K212K....K212K..
.K1111KKKKKK1111K.
.K1122222222.221K.
KiiiiiiiiiiiiiiiK.
KiiiiQiiiiiiQiiiK.
K1WEWE2222WEWE1.K.
K1EEEE2222EEEE1.K.
K1IIIIIIIIIIIIII1K
K1IQIIIIIIIIIIII1K
K1IIIIIIIIIIIIII1K
.K1IIIIIIIIIIII1K.
..K1IIIIIIIIII1K..
...KKKKKKKKKKKK...
..................
..................
`,
  samurai: `
..................
..................
...KK........KK...
..K22K......K22K..
..K212K....K212K..
.K1111KKKKKK1111K.
.K11222222222221K.
.KAAAAAAiiiAAAAAK.
.KAAAAAiiiiiAAAAK.
K1WEWE2222WEWE1K..
K1EEEE2222EEEE1K..
K1122222PP2222.1K.
K1122223MM322221K.
KaaAAAAAAAAAAAaaK.
.HhGsssssssssss...
.KAAAAAAAAAAAAAK..
..KKKKKKKKKKKKK...
..................
`,
  arcane: `
.......X..........
......TXT.........
.....TTRTT........
....TRRRRT........
...TRRrrrrT.......
..LLLLLLLLLLL.....
..K22K....K22K....
..K212K..K212K....
.K1111KKKK1111K..oOo
.K11222222222K..oOOOo
.K1WEWE22WEWE1K.OUUUO
.K1EEEE22EEEE1K.oOOOo
.K1122PPPP2221K..oOo
.K11223MMM3221K.....
.KRR222222222RRK..
.KRRRRRRRRRRRRRK..
..KKKKKKKKKKKKK...
..................
`,
  legendary: `
.....X..X..X.X....
....CCCCCCCCCC....
...CCDCDCDCDCDC...
....CDCDCDCDCD....
..KK..CCCCCC..KK..
.K22K........K22K.
.K212K......K212K.
K1111KKKKKKKK1111K
K112222222222221.K
K11233322233333.1K
K1WEWE22222WEWE1K.
K1EEEE33333EEEE1K.
K11222PPPPPPP222.K
K112223MMMM322.21K
KX1122222222221XK.
.K112233333322.K..
..KKKKKKKKKKKKK...
.X..............X.
`,
};
