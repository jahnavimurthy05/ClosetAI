import type { WardrobeItem } from '@/types';
import { getColourCompatibility, isNeutral } from './colour-theory';

const FORMALITY_RANK: Record<string, number> = {
  very_casual: 0,
  casual: 1,
  smart_casual: 2,
  business_casual: 3,
  semi_formal: 4,
  formal: 5,
  black_tie: 6,
};

export function getCompatibleItems(
  selectedItem: WardrobeItem,
  wardrobe: WardrobeItem[]
): { item: WardrobeItem; score: number; reason: string }[] {
  return wardrobe
    .filter(
      (item) =>
        item.id !== selectedItem.id &&
        item.is_available &&
        item.category !== selectedItem.category
    )
    .map((item) => {
      let score = 0;

      const colourScore = getColourCompatibility(
        selectedItem.primary_colour ?? '',
        item.primary_colour ?? ''
      );
      score += colourScore * 45;

      const sf = FORMALITY_RANK[selectedItem.formality ?? 'casual'] ?? 1;
      const tf = FORMALITY_RANK[item.formality ?? 'casual'] ?? 1;
      const formalityDiff = Math.abs(sf - tf);
      score += Math.max(0, 30 - formalityDiff * 10);

      const sharedOccasions = (selectedItem.occasions ?? []).filter((o) =>
        (item.occasions ?? []).includes(o)
      );
      score += Math.min(15, sharedOccasions.length * 5);

      const sharedSeasons = (selectedItem.seasons ?? []).filter(
        (s) => s === 'all' || (item.seasons ?? []).includes(s) || (item.seasons ?? []).includes('all')
      );
      score += Math.min(10, sharedSeasons.length * 5);

      let reason = 'Compatible style';
      if (isNeutral(item.primary_colour ?? '')) {
        reason = 'Versatile neutral pairing';
      } else if (colourScore >= 0.9) {
        reason = 'Excellent colour harmony';
      } else if (colourScore >= 0.75) {
        reason = 'Complementary colour match';
      } else if (sharedOccasions.length > 0) {
        reason = `Great for ${sharedOccasions[0].replace(/_/g, ' ')}`;
      }

      return { item, score: Math.min(100, Math.round(score)), reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export function checkOutfitCompatibility(items: WardrobeItem[]): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (items.length === 0) {
    return {
      score: 0,
      issues: ['No items selected'],
      suggestions: ['Select at least a top and bottom, or a dress, to build an outfit.'],
    };
  }

  let score = 85;

  const formalities = items.map((i) => FORMALITY_RANK[i.formality ?? 'casual'] ?? 1);
  const formalityRange = Math.max(...formalities) - Math.min(...formalities);
  if (formalityRange > 2) {
    score -= 20;
    issues.push('Formality mismatch between selected pieces');
    suggestions.push('Swap in pieces with closer formality levels.');
  }

  const colours = items.map((i) => i.primary_colour ?? '').filter(Boolean);
  const nonNeutralColours = colours.filter((c) => !isNeutral(c));
  if (nonNeutralColours.length > 3) {
    score -= 10;
    issues.push('More than 3 bold colours in one look');
    suggestions.push('Ground the look with neutral footwear or outerwear.');
  }

  // Pairwise colour harmony check
  if (colours.length >= 2) {
    let pairTotal = 0;
    let pairs = 0;
    for (let i = 0; i < colours.length; i++) {
      for (let j = i + 1; j < colours.length; j++) {
        pairTotal += getColourCompatibility(colours[i], colours[j]);
        pairs++;
      }
    }
    const avgColour = pairs > 0 ? pairTotal / pairs : 1;
    if (avgColour < 0.65) {
      score -= 12;
      issues.push('Clashing colour tones');
      suggestions.push('Try replacing one bold colour with a neutral or complementary shade.');
    } else if (avgColour >= 0.85) {
      score += 10;
    }
  }

  const patterns = items
    .map((i) => (i.pattern ?? 'solid').toLowerCase())
    .filter((p) => p !== 'solid' && p !== 'plain');
  if (patterns.length > 1) {
    score -= 15;
    issues.push('Multiple bold patterns may compete');
    suggestions.push('Pair one statement pattern with solid-coloured pieces.');
  }

  if (issues.length === 0) {
    suggestions.push('Well-balanced combination with cohesive colour and formality.');
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    issues,
    suggestions,
  };
}
