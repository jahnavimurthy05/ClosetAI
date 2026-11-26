import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [itemsRes, outfitsRes] = await Promise.all([
      supabase.from('wardrobe_items').select('*').eq('user_id', user.id),
      supabase.from('outfits').select('id').eq('user_id', user.id),
    ]);

    if (itemsRes.error) {
      return NextResponse.json({ error: itemsRes.error.message }, { status: 500 });
    }

    const items = itemsRes.data ?? [];
    const totalItems = items.length;
    const totalOutfits = outfitsRes.data?.length ?? 0;
    const favouriteItems = items.filter((i) => i.is_favourite).length;

    const itemsByCategory: Record<string, number> = {};
    const wearsByCategory: Record<string, number> = {};
    let totalWears = 0;
    let itemsNeverWorn = 0;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let recentAdditions = 0;

    for (const item of items) {
      const cat = item.category || 'other';
      itemsByCategory[cat] = (itemsByCategory[cat] || 0) + 1;
      const wears = item.wear_count || 0;
      wearsByCategory[cat] = (wearsByCategory[cat] || 0) + wears;
      totalWears += wears;
      if (wears === 0) itemsNeverWorn += 1;
      if (new Date(item.date_added || item.created_at).getTime() >= thirtyDaysAgo) {
        recentAdditions += 1;
      }
    }

    let mostWornCategory = 'none';
    let maxWears = -1;
    for (const [cat, wears] of Object.entries(wearsByCategory)) {
      if (wears > maxWears) {
        maxWears = wears;
        mostWornCategory = cat;
      }
    }

    return NextResponse.json({
      data: {
        total_items: totalItems,
        total_outfits: totalOutfits,
        favourite_items: favouriteItems,
        most_worn_category: mostWornCategory,
        items_by_category: itemsByCategory,
        average_wear_count: totalItems > 0 ? Number((totalWears / totalItems).toFixed(1)) : 0,
        items_never_worn: itemsNeverWorn,
        recent_additions: recentAdditions,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
