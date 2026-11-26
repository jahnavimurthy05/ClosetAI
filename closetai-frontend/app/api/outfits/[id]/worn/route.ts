import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let occasion: string | null = null;
    try {
      const body = await request.json();
      occasion = body?.occasion ?? null;
    } catch {
      // Optional JSON body
    }

    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('id, occasion, items:outfit_items(wardrobe_item_id)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (outfitError || !outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    const { error: historyError } = await supabase.from('outfit_history').insert({
      user_id: user.id,
      outfit_id: outfit.id,
      worn_at: now,
      occasion: occasion ?? outfit.occasion,
    });

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    const itemIds = Array.isArray(outfit.items)
      ? outfit.items.map((i: { wardrobe_item_id: string }) => i.wardrobe_item_id)
      : [];

    if (itemIds.length > 0) {
      const { data: wardrobeItems } = await supabase
        .from('wardrobe_items')
        .select('id, wear_count')
        .in('id', itemIds)
        .eq('user_id', user.id);

      if (wardrobeItems) {
        await Promise.all(
          wardrobeItems.map((wi) =>
            supabase
              .from('wardrobe_items')
              .update({
                wear_count: (wi.wear_count ?? 0) + 1,
                last_worn_at: now,
              })
              .eq('id', wi.id)
              .eq('user_id', user.id)
          )
        );
      }
    }

    return NextResponse.json({ success: true, worn_at: now });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
