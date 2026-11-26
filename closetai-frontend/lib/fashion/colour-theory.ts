export const COLOUR_WHEEL: Record<string, number> = {
  red: 0,
  'red-orange': 30,
  orange: 60,
  'yellow-orange': 90,
  yellow: 120,
  'yellow-green': 150,
  green: 180,
  'blue-green': 210,
  blue: 240,
  'blue-violet': 270,
  violet: 300,
  'red-violet': 330,
};

const NEUTRALS = [
  'black',
  'white',
  'gray',
  'grey',
  'beige',
  'cream',
  'ivory',
  'nude',
  'tan',
  'brown',
  'navy',
  'charcoal',
  'taupe',
];

const COLOUR_ALIASES: Record<string, string> = {
  crimson: 'red',
  burgundy: 'red-violet',
  maroon: 'red',
  coral: 'red-orange',
  terracotta: 'red-orange',
  rust: 'orange',
  peach: 'yellow-orange',
  gold: 'yellow',
  mustard: 'yellow-orange',
  olive: 'yellow-green',
  sage: 'green',
  emerald: 'green',
  mint: 'blue-green',
  teal: 'blue-green',
  turquoise: 'blue-green',
  sky: 'blue',
  cobalt: 'blue',
  denim: 'blue',
  indigo: 'blue-violet',
  lavender: 'violet',
  purple: 'violet',
  plum: 'red-violet',
  berry: 'red-violet',
  pink: 'red-violet',
  rose: 'red-violet',
  blush: 'red-violet',
};

export function isNeutral(colour: string): boolean {
  const lower = colour.toLowerCase();
  return NEUTRALS.some((n) => lower.includes(n));
}

function getHue(colour: string): number | null {
  const lower = colour.toLowerCase();
  for (const [name, hue] of Object.entries(COLOUR_WHEEL)) {
    if (lower.includes(name)) return hue;
  }
  for (const [alias, canonical] of Object.entries(COLOUR_ALIASES)) {
    if (lower.includes(alias)) return COLOUR_WHEEL[canonical] ?? null;
  }
  return null;
}

export function getColourCompatibility(colour1: string, colour2: string): number {
  if (!colour1 || !colour2) return 0.7;
  if (isNeutral(colour1) || isNeutral(colour2)) return 0.9;

  const h1 = getHue(colour1);
  const h2 = getHue(colour2);
  if (h1 === null || h2 === null) return 0.6;

  const diff = Math.abs(h1 - h2);
  const normalised = Math.min(diff, 360 - diff);

  if (normalised === 0) return 0.85; // monochromatic
  if (normalised >= 150 && normalised <= 210) return 0.95; // complementary
  if (normalised <= 60) return 0.85; // analogous
  if (normalised >= 100 && normalised <= 140) return 0.75; // triadic / split-complementary
  return 0.5;
}

export function areColourComplementary(c1: string, c2: string): boolean {
  const h1 = getHue(c1);
  const h2 = getHue(c2);
  if (h1 === null || h2 === null) return false;
  const diff = Math.abs(h1 - h2);
  const normalised = Math.min(diff, 360 - diff);
  return normalised >= 150 && normalised <= 210;
}

export function areColourAnalogous(c1: string, c2: string): boolean {
  const h1 = getHue(c1);
  const h2 = getHue(c2);
  if (h1 === null || h2 === null) return false;
  const diff = Math.abs(h1 - h2);
  const normalised = Math.min(diff, 360 - diff);
  return normalised <= 60;
}

export function getComplementaryColours(colour: string): string[] {
  const hue = getHue(colour);
  if (hue === null) return ['black', 'white', 'beige'];
  const compHue = (hue + 180) % 360;
  return Object.entries(COLOUR_WHEEL)
    .filter(([, h]) => {
      const diff = Math.abs(h - compHue);
      return Math.min(diff, 360 - diff) <= 30;
    })
    .map(([name]) => name);
}

export function getColourSuggestionsForUndertone(undertone: string): string[] {
  switch (undertone.toLowerCase()) {
    case 'warm':
      return ['terracotta', 'olive', 'coral', 'gold', 'orange', 'rust', 'camel', 'warm red'];
    case 'cool':
      return ['navy', 'blue', 'berry', 'lavender', 'emerald', 'rose', 'purple', 'cool gray'];
    case 'neutral':
      return ['navy', 'white', 'black', 'blush', 'teal', 'olive', 'burgundy', 'sage'];
    default:
      return ['black', 'white', 'navy', 'beige', 'gray'];
  }
}
