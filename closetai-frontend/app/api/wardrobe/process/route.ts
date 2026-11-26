import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Use JPEG, PNG or WebP.' },
      { status: 400 }
    );
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File too large. Maximum 10MB.' },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from('wardrobe-images')
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: 'Upload failed: ' + uploadError.message },
      { status: 500 }
    );
  }

  const { data: signedUrl } = await supabase.storage
    .from('wardrobe-images')
    .createSignedUrl(fileName, 60 * 60 * 24 * 365);

  const originalUrl = signedUrl?.signedUrl || '';

  const aiServiceUrl = process.env.AI_SERVICE_URL;
  const aiServiceSecret =
    process.env.AI_SERVICE_API_KEY || process.env.AI_SERVICE_SECRET;

  let aiResult = null;
  if (aiServiceUrl) {
    try {
      const aiFormData = new FormData();
      aiFormData.append(
        'file',
        new Blob([buffer], { type: file.type }),
        file.name
      );

      const aiResponse = await fetch(`${aiServiceUrl}/process/image`, {
        method: 'POST',
        headers: { 'X-API-Key': aiServiceSecret || '' },
        body: aiFormData,
        signal: AbortSignal.timeout(60000),
      });

      if (aiResponse.ok) {
        aiResult = await aiResponse.json();
      }
    } catch (err) {
      console.error('AI service error:', err);
    }
  }

  return NextResponse.json({
    original_image_url: originalUrl,
    storage_path: fileName,
    ai_result: aiResult,
    message: aiResult
      ? 'Image processed successfully'
      : 'Image uploaded. AI processing unavailable – please fill in details manually.',
  });
}
