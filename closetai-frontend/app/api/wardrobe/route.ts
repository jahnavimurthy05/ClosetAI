import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const colour = searchParams.get('colour');
    const occasion = searchParams.get('occasion');
    const formality = searchParams.get('formality');
    const favourite = searchParams.get('favourite');

    let query = supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (colour) {
      query = query.ilike('primary_colour', `%${colour}%`);
    }
    if (formality) {
      query = query.eq('formality', formality);
    }
    if (favourite === 'true') {
      query = query.eq('is_favourite', true);
    }
    if (occasion) {
      query = query.contains('occasions', [occasion]);
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,subcategory.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

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

    if (!body.category || !body.original_image_url) {
      return NextResponse.json(
        { error: 'category and original_image_url are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: user.id,
        original_image_url: body.original_image_url,
        processed_image_url: body.processed_image_url ?? null,
        thumbnail_url: body.thumbnail_url ?? null,
        category: body.category,
        subcategory: body.subcategory ?? null,
        name: body.name ?? null,
        primary_colour: body.primary_colour ?? null,
        secondary_colours: body.secondary_colours ?? [],
        colour_hex: body.colour_hex ?? null,
        pattern: body.pattern ?? null,
        fabric_appearance: body.fabric_appearance ?? null,
        style_tags: body.style_tags ?? [],
        formality: body.formality ?? null,
        seasons: body.seasons ?? ['all'],
        occasions: body.occasions ?? [],
        description: body.description ?? null,
        brand: body.brand ?? null,
        is_favourite: body.is_favourite ?? false,
        is_available: body.is_available ?? true,
        ai_confidence: body.ai_confidence ?? null,
        ai_metadata: body.ai_metadata ?? {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
