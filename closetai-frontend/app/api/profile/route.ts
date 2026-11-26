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

    const [profileRes, bodyRes, colourRes, styleRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase.from('body_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('colour_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('style_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    if (profileRes.error && profileRes.error.code !== 'PGRST116') {
      return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      user_profile: profileRes.data,
      body_profile: bodyRes.data,
      colour_profile: colourRes.data,
      style_preferences: styleRes.data,
    });
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
    const { user_profile, body_profile, colour_profile, style_preferences } = body;

    const updates: PromiseLike<unknown>[] = [];

    if (user_profile) {
      updates.push(
        supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            ...user_profile,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
      );
    }

    if (body_profile) {
      updates.push(
        supabase
          .from('body_profiles')
          .upsert(
            {
              user_id: user.id,
              ...body_profile,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single()
      );
    }

    if (colour_profile) {
      updates.push(
        supabase
          .from('colour_profiles')
          .upsert(
            {
              user_id: user.id,
              ...colour_profile,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single()
      );
    }

    if (style_preferences) {
      updates.push(
        supabase
          .from('style_preferences')
          .upsert(
            {
              user_id: user.id,
              ...style_preferences,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single()
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
