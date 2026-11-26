import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const aiServiceKey =
      process.env.AI_SERVICE_API_KEY || process.env.AI_SERVICE_SECRET || '';

    const [wardrobeRes, bodyRes, colourRes, styleRes] = await Promise.all([
      supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_available', true),
      supabase.from('body_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('colour_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('style_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    const payload = {
      user_id: user.id,
      date: body.date || new Date().toISOString().split('T')[0],
      occasion: body.occasion || 'casual',
      weather: body.weather || null,
      wardrobe_items: wardrobeRes.data ?? [],
      user_profile: {
        body_profile: bodyRes.data,
        colour_profile: colourRes.data,
        style_preferences: styleRes.data,
      },
      exclude_item_ids: body.exclude_item_ids ?? [],
    };

    try {
      const response = await fetch(`${aiServiceUrl}/recommend/outfits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiServiceKey ? { 'X-API-Key': aiServiceKey } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback when AI service is not running locally
    }

    const items = wardrobeRes.data ?? [];
    if (items.length === 0) {
      return NextResponse.json({
        outfits: [],
        reasoning: 'Add items to your wardrobe to generate personalised outfit recommendations.',
        weather_considered: false,
        processing_time_ms: 0,
      });
    }

    return NextResponse.json({
      outfits: [],
      reasoning:
        'AI styling service is currently offline. Start the Python AI service to generate scored recommendations.',
      weather_considered: Boolean(body.weather),
      processing_time_ms: 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
