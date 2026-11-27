'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Upload, FolderOpen, ArrowLeft, Loader2, Sparkles, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BatchItemCard,
  type BatchUploadItem,
} from '@/components/wardrobe/BatchItemCard';
import type { WardrobeCategory, FormalityLevel } from '@/types';

const VALID_CATEGORIES: WardrobeCategory[] = [
  'tops',
  'bottoms',
  'dresses',
  'footwear',
  'accessories',
  'outerwear',
  'bags',
  'activewear',
  'other',
];

const VALID_FORMALITIES: FormalityLevel[] = [
  'very_casual',
  'casual',
  'smart_casual',
  'semi_formal',
  'formal',
  'black_tie',
];

function mapFormality(raw?: string): FormalityLevel {
  if (!raw) return 'casual';
  if (raw === 'festive') return 'semi_formal';
  if (VALID_FORMALITIES.includes(raw as FormalityLevel)) {
    return raw as FormalityLevel;
  }
  return 'casual';
}

function mapOccasion(occasions?: string[]): string {
  const first = occasions?.[0] || 'casual';
  if (first === 'office') return 'work';
  if (first === 'date') return 'date_night';
  if (first === 'daily_wear' || first === 'casual_outing' || first === 'shopping') {
    return 'casual';
  }
  if (['casual', 'work', 'date_night', 'formal_event', 'travel', 'weekend'].includes(first)) {
    return first;
  }
  return 'casual';
}

function titleCase(str: string): string {
  return str
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function WardrobeUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<BatchUploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const updateItem = (localId: string, patch: Partial<BatchUploadItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it))
    );
  };

  const analyzeSingleItem = async (entry: BatchUploadItem) => {
    updateItem(entry.localId, { status: 'analyzing', errorMessage: undefined });
    try {
      const formData = new FormData();
      formData.append('file', entry.file);

      const res = await fetch('/api/wardrobe/process', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AI processing failed');
      }

      const data = await res.json();
      const ai = data.ai_result;
      const patch: Partial<BatchUploadItem> = {
        status: 'ready',
        originalImageUrl: data.original_image_url || null,
        processedImageUrl: data.processed_image_url || null,
        previewUrl: data.processed_image_url || entry.previewUrl,
      };

      if (ai) {
        const cls = ai.classification || {};
        const cols = ai.colours || {};

        if (cls.category && VALID_CATEGORIES.includes(cls.category)) {
          patch.category = cls.category as WardrobeCategory;
        }
        if (cls.subcategory) patch.subcategory = titleCase(cls.subcategory);
        if (cols.primary && cols.primary !== 'unknown') {
          patch.primaryColour = titleCase(cols.primary);
        }
        if (Array.isArray(cols.secondary)) patch.secondaryColours = cols.secondary;
        if (cols.hex) patch.colourHex = cols.hex;
        if (cls.pattern) patch.pattern = cls.pattern;
        if (cls.fabric_appearance) {
          patch.fabricAppearance = titleCase(cls.fabric_appearance);
        }
        if (cls.formality) patch.formality = mapFormality(cls.formality);
        if (Array.isArray(cls.occasions) && cls.occasions.length > 0) {
          patch.detectedOccasions = cls.occasions;
          patch.occasion = mapOccasion(cls.occasions);
        }
        if (Array.isArray(cls.style_tags)) patch.styleTags = cls.style_tags;
        if (Array.isArray(cls.seasons)) patch.seasons = cls.seasons;
        if (cls.description) patch.description = cls.description;
        if (typeof ai.ai_confidence === 'number') patch.aiConfidence = ai.ai_confidence;

        const autoName = [
          cols.primary && cols.primary !== 'unknown' ? titleCase(cols.primary) : '',
          cls.subcategory ? titleCase(cls.subcategory) : '',
        ]
          .filter(Boolean)
          .join(' ');
        if (autoName) patch.name = autoName;
        patch.aiFilled = true;
      }

      updateItem(entry.localId, patch);
    } catch (err) {
      updateItem(entry.localId, {
        status: 'ready',
        errorMessage: err instanceof Error ? err.message : 'Fill manually',
      });
    }
  };

  const enqueueFiles = async (fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) ||
      /\.(jpe?g|png|webp)$/i.test(f.name)
    );

    if (validFiles.length === 0) {
      toast.error('No supported images found (use JPG, PNG, or WebP)');
      return;
    }

    const newEntries: BatchUploadItem[] = validFiles.map((f, idx) => ({
      localId: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      originalImageUrl: null,
      processedImageUrl: null,
      status: 'queued',
      aiFilled: false,
      name: '',
      category: 'tops',
      subcategory: '',
      primaryColour: '',
      secondaryColours: [],
      colourHex: '',
      pattern: 'solid',
      fabricAppearance: '',
      occasion: 'casual',
      detectedOccasions: [],
      formality: 'casual',
      styleTags: [],
      seasons: ['all'],
      description: '',
      aiConfidence: null,
    }));

    setItems((prev) => [...prev, ...newEntries]);
    toast.info(`Added ${newEntries.length} image(s). AI is analyzing them…`);

    // Process sequentially so Render's free tier stays well within 512 MiB RAM
    for (const entry of newEntries) {
      await analyzeSingleItem(entry);
    }
  };

  const saveSingleItem = async (localId: string): Promise<boolean> => {
    const target = items.find((it) => it.localId === localId);
    if (!target || target.status === 'saved') return false;

    updateItem(localId, { status: 'saving' });
    try {
      let finalOriginalUrl = target.originalImageUrl;

      if (!finalOriginalUrl) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error('Please sign in again');
          router.push('/login');
          return false;
        }

        const ext = target.file.name.split('.').pop() || 'jpg';
        const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('wardrobe-images')
          .upload(storagePath, target.file);

        if (!uploadError) {
          const { data: signedData } = await supabase.storage
            .from('wardrobe-images')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
          finalOriginalUrl = signedData?.signedUrl || storagePath;
        } else {
          finalOriginalUrl = target.previewUrl || '/placeholder-garment.png';
        }
      }

      const combinedOccasions = Array.from(
        new Set([target.occasion, ...target.detectedOccasions].filter(Boolean))
      );

      const res = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_image_url: finalOriginalUrl,
          processed_image_url: target.processedImageUrl,
          category: target.category,
          subcategory: target.subcategory || null,
          name: target.name || target.subcategory || target.category,
          primary_colour: target.primaryColour || null,
          secondary_colours: target.secondaryColours,
          colour_hex: target.colourHex || null,
          pattern: target.pattern || 'solid',
          fabric_appearance: target.fabricAppearance || null,
          style_tags: target.styleTags,
          seasons: target.seasons,
          occasions: combinedOccasions,
          formality: target.formality,
          description: target.description || null,
          ai_confidence: target.aiConfidence,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save item');
      }

      updateItem(localId, { status: 'saved' });
      return true;
    } catch (err) {
      updateItem(localId, {
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Save failed',
      });
      toast.error(err instanceof Error ? err.message : 'Failed to save item');
      return false;
    }
  };

  const handleSaveAll = async () => {
    const unsaved = items.filter(
      (it) => it.status === 'ready' || it.status === 'error'
    );
    if (unsaved.length === 0) return;

    setSavingAll(true);
    let savedCount = 0;
    for (const entry of unsaved) {
      const ok = await saveSingleItem(entry.localId);
      if (ok) savedCount += 1;
    }
    setSavingAll(false);

    if (savedCount > 0) {
      toast.success(`Saved ${savedCount} item(s) to your wardrobe!`);
      router.push('/wardrobe');
      router.refresh();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void enqueueFiles(e.dataTransfer.files);
    }
  };

  const analyzedCount = items.filter(
    (it) => it.status !== 'queued' && it.status !== 'analyzing'
  ).length;
  const readyCount = items.filter(
    (it) => it.status === 'ready' || it.status === 'error'
  ).length;
  const progressPct = items.length > 0 ? Math.round((analyzedCount / items.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/wardrobe"
            className="p-2 rounded-lg bg-white border border-[#E8DFD3] text-[#252525] hover:bg-[#F8F6F2] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-light text-[#252525]">
              Add Wardrobe Items
            </h1>
            <p className="text-sm text-[#A99B8C]">
              Upload single photos or an entire folder — AI auto-fills every item for you to review &amp; edit
            </p>
          </div>
        </div>

        {readyCount > 0 && (
          <Button
            type="button"
            disabled={savingAll}
            onClick={handleSaveAll}
            className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg"
          >
            {savingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving All…
              </>
            ) : (
              <>
                <CheckCheck className="w-4 h-4 mr-2 text-[#D9B7B0]" />
                Save All Ready ({readyCount})
              </>
            )}
          </Button>
        )}
      </div>

      {/* Drop Zone & Folder Picker */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`bg-white border-2 border-dashed rounded-xl p-8 text-center transition-all duration-150 ${
          dragActive
            ? 'border-[#252525] bg-[#F8F6F2]'
            : 'border-[#E8DFD3] hover:border-[#A99B8C]'
        }`}
      >
        <Upload className="w-10 h-10 text-[#A99B8C] mx-auto mb-3" />
        <p className="font-medium text-[#252525]">
          Drag &amp; drop garment photos here, or choose files / a whole folder
        </p>
        <p className="text-xs text-[#A99B8C] mt-1 mb-4">
          Supports JPG, PNG, WebP — all detected details remain open to edit before saving
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-[#E8DFD3] rounded-lg"
          >
            <Sparkles className="w-4 h-4 mr-2 text-[#A99B8C]" />
            Select Photos
          </Button>
          <Button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg"
          >
            <FolderOpen className="w-4 h-4 mr-2 text-[#D9B7B0]" />
            Upload Folder
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void enqueueFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          accept="image/*"
          {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void enqueueFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Progress Bar */}
      {items.length > 0 && analyzedCount < items.length && (
        <div className="bg-white rounded-xl border border-[#E8DFD3]/70 p-4 space-y-2">
          <div className="flex justify-between text-xs text-[#252525]">
            <span>AI analyzing your wardrobe photos…</span>
            <span>
              {analyzedCount} / {items.length} ready
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      )}

      {/* Editable Review Cards */}
      <div className="space-y-4">
        {items.map((item) => (
          <BatchItemCard
            key={item.localId}
            item={item}
            onChange={updateItem}
            onSave={(id) => void saveSingleItem(id)}
            onRemove={(id) =>
              setItems((prev) => prev.filter((it) => it.localId !== id))
            }
          />
        ))}
      </div>
    </div>
  );
}
