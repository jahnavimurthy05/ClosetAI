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
    const month = searchParams.get('month'); // YYYY-MM
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('outfit_calendar')
      .select(
        `
        *,
        outfit:outfits(
          *,
          items:outfit_items(
            *,
            wardrobe_item:wardrobe_items(*)
          )
        )
      `
      )
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = `${year}-${String(mon).padStart(2, '0')}-01`;
      const lastDay = new Date(year, mon, 0).getDate();
      const end = `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('date', start).lte('date', end);
    } else if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
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

    if (!body.date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('outfit_calendar')
      .upsert(
        {
          user_id: user.id,
          date: body.date,
          outfit_id: body.outfit_id ?? null,
          occasion: body.occasion ?? null,
          event_name: body.event_name ?? null,
          weather_snapshot: body.weather_snapshot ?? null,
          status: body.status ?? 'planned',
          notes: body.notes ?? null,
        },
        { onConflict: 'user_id,date' }
      )
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

export async function PUT(request: NextRequest) {
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

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { id, user_id: _ignoredUserId, ...updates } = body;

    const { data, error } = await supabase
      .from('outfit_calendar')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
