import { getColourCompatibility } from './colour-theory';

const OCCASION_FORMALITY: Record<string, number> = {
  daily_wear: 1,
  casual_outing: 1,
  shopping: 1,
  college: 2,
  travel: 2,
  office: 3,
  interview: 4,
  dinner: 3,
  date: 3,
  party: 3,
  birthday: 3,
  wedding: 5,
  family_function: 4,
  festive: 4,
};

const FORMALITY_SCALE: Record<string, number> = {
  very_casual: 0,
  casual: 1,
  smart_casual: 2,
  business_casual: 3,
  semi_formal: 4,
  formal: 5,
  black_tie: 6,
};

export function scoreColourCombination(colours: string[]): number {
  const valid = colours.filter(Boolean);
  if (valid.length <= 1) return 100;

  let total = 0;
  let pairs = 0;
  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      total += getColourCompatibility(valid[i], valid[j]) * 100;
      pairs++;
    }
  }
  return pairs === 0 ? 100 : Math.round(total / pairs);
}

export function scoreFormalityMatch(
  formalities: string[],
  occasion: string
): number {
  const target = OCCASION_FORMALITY[occasion.toLowerCase()] ?? 2;
  const values = formalities
    .filter(Boolean)
    .map((f) => FORMALITY_SCALE[f.toLowerCase()] ?? 2);

  if (values.length === 0) return 70;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const diff = Math.abs(avg - target);
  return Math.max(0, Math.round(100 - diff * 20));
}

export function scorePatternHarmony(patterns: string[]): number {
  const boldPatterns = patterns.filter(
    (p) => p && p.toLowerCase() !== 'solid' && p.toLowerCase() !== 'plain'
  );
  if (boldPatterns.length === 0) return 100;
  if (boldPatterns.length === 1) return 90;
  if (boldPatterns.length === 2) return 65;
  return 40;
}
