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
  const timestamp = Date.now();
  const fileName = `${user.id}/${timestamp}-${sanitizedName}`;

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

  let aiResult: Record<string, unknown> | null = null;
  let processedImageUrl: string | null = null;

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
        signal: AbortSignal.timeout(90000),
      });

      if (aiResponse.ok) {
        const rawResult = await aiResponse.json();
        const processedB64 = rawResult?.processed_image_base64;

        if (typeof processedB64 === 'string' && processedB64.length > 0) {
          const processedBuffer = Buffer.from(processedB64, 'base64');
          const processedPath = `${user.id}/processed-${timestamp}.png`;
          const { error: procUploadError } = await supabase.storage
            .from('wardrobe-images')
            .upload(processedPath, processedBuffer, {
              contentType: 'image/png',
              upsert: false,
            });

          if (!procUploadError) {
            const { data: procSigned } = await supabase.storage
              .from('wardrobe-images')
              .createSignedUrl(processedPath, 60 * 60 * 24 * 365);
            processedImageUrl = procSigned?.signedUrl || null;
          }
        }

        // Strip large base64 before returning JSON to browser
        const { processed_image_base64: _omit, ...rest } = rawResult;
        aiResult = rest;
      }
    } catch (err) {
      console.error('AI service error:', err);
    }
  }

  return NextResponse.json({
    original_image_url: originalUrl,
    processed_image_url: processedImageUrl,
    storage_path: fileName,
    ai_result: aiResult,
    message: aiResult
      ? 'Image processed successfully'
      : 'Image uploaded. AI processing unavailable – please fill in details manually.',
  });
}
