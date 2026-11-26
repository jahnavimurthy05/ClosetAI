import { NextRequest, NextResponse } from 'next/server';
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

    const { data, error } = await supabase
      .from('outfits')
      .select(
        `
        *,
        items:outfit_items(
          *,
          wardrobe_item:wardrobe_items(*)
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, occasion, season, score, explanation, is_favourite, items } = body;

    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .insert({
        user_id: user.id,
        name: name ?? 'Untitled Outfit',
        occasion: occasion ?? null,
        season: season ?? null,
        score: score ?? null,
        explanation: explanation ?? {},
        is_favourite: is_favourite ?? false,
      })
      .select()
      .single();

    if (outfitError || !outfit) {
      return NextResponse.json(
        { error: outfitError?.message ?? 'Failed to create outfit' },
        { status: 500 }
      );
    }

    if (Array.isArray(items) && items.length > 0) {
      const outfitItems = items.map(
        (
          item: { wardrobe_item_id: string; role?: string; position_order?: number },
          index: number
        ) => ({
          outfit_id: outfit.id,
          wardrobe_item_id: item.wardrobe_item_id,
          role: item.role ?? null,
          position_order: item.position_order ?? index,
        })
      );

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ data: outfit }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
