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
    const { message, conversation_history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const aiServiceKey =
      process.env.AI_SERVICE_API_KEY || process.env.AI_SERVICE_SECRET || '';

    const [wardrobeRes, bodyRes, colourRes, styleRes] = await Promise.all([
      supabase
        .from('wardrobe_items')
        .select('id, name, category, subcategory, primary_colour, formality, seasons, occasions')
        .eq('user_id', user.id),
      supabase.from('body_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('colour_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('style_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    try {
      const response = await fetch(`${aiServiceUrl}/chat/stylist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiServiceKey ? { 'X-API-Key': aiServiceKey } : {}),
        },
        body: JSON.stringify({
          user_id: user.id,
          message,
          conversation_history: conversation_history ?? [],
          wardrobe_summary: wardrobeRes.data ?? [],
          user_profile: {
            body_profile: bodyRes.data,
            colour_profile: colourRes.data,
            style_preferences: styleRes.data,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback when AI service is not running locally
    }

    return NextResponse.json({
      reply:
        'Your AI stylist is currently offline. Once the Python AI service is running, I can give you personalised styling advice based on your wardrobe!',
      suggested_items: [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
