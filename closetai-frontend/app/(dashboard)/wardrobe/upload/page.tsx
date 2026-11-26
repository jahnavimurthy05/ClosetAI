'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Upload, ArrowLeft, Loader2, X, Sparkles, Wand2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<WardrobeCategory>('tops');
  const [subcategory, setSubcategory] = useState('');
  const [name, setName] = useState('');
  const [primaryColour, setPrimaryColour] = useState('');
  const [secondaryColours, setSecondaryColours] = useState<string[]>([]);
  const [colourHex, setColourHex] = useState('');
  const [pattern, setPattern] = useState('solid');
  const [fabricAppearance, setFabricAppearance] = useState('');
  const [occasion, setOccasion] = useState('casual');
  const [detectedOccasions, setDetectedOccasions] = useState<string[]>([]);
  const [formality, setFormality] = useState<FormalityLevel>('casual');
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>(['all']);
  const [description, setDescription] = useState('');
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const runAiAnalysis = async (selected: File) => {
    setAnalyzing(true);
    setAiFilled(false);
    try {
      const formData = new FormData();
      formData.append('file', selected);

      const res = await fetch('/api/wardrobe/process', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not process image');
      }

      const data = await res.json();
      if (data.original_image_url) setOriginalImageUrl(data.original_image_url);
      if (data.processed_image_url) {
        setProcessedImageUrl(data.processed_image_url);
        setPreviewUrl(data.processed_image_url);
      }

      const ai = data.ai_result;
      if (ai) {
        const cls = ai.classification || {};
        const cols = ai.colours || {};

        if (cls.category && VALID_CATEGORIES.includes(cls.category)) {
          setCategory(cls.category as WardrobeCategory);
        }
        if (cls.subcategory) {
          setSubcategory(titleCase(cls.subcategory));
        }
        if (cols.primary && cols.primary !== 'unknown') {
          setPrimaryColour(titleCase(cols.primary));
        }
        if (Array.isArray(cols.secondary)) {
          setSecondaryColours(cols.secondary);
        }
        if (cols.hex) {
          setColourHex(cols.hex);
        }
        if (cls.pattern) {
          setPattern(cls.pattern);
        }
        if (cls.fabric_appearance) {
          setFabricAppearance(titleCase(cls.fabric_appearance));
        }
        if (cls.formality) {
          setFormality(mapFormality(cls.formality));
        }
        if (Array.isArray(cls.occasions) && cls.occasions.length > 0) {
          setDetectedOccasions(cls.occasions);
          setOccasion(mapOccasion(cls.occasions));
        }
        if (Array.isArray(cls.style_tags)) {
          setStyleTags(cls.style_tags);
        }
        if (Array.isArray(cls.seasons)) {
          setSeasons(cls.seasons);
        }
        if (cls.description) {
          setDescription(cls.description);
        }
        if (typeof ai.ai_confidence === 'number') {
          setAiConfidence(ai.ai_confidence);
        }

        const autoName = [
          cols.primary && cols.primary !== 'unknown' ? titleCase(cols.primary) : '',
          cls.subcategory ? titleCase(cls.subcategory) : '',
        ]
          .filter(Boolean)
          .join(' ');
        if (autoName) setName(autoName);

        setAiFilled(true);
        toast.success('AI detected your garment! Review or edit any field below.');
      } else {
        toast.info('Image uploaded. AI service is waking up — you can fill in details below.');
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'AI analysis unavailable — you can still fill in details manually.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setFile(selected);
    setOriginalImageUrl(null);
    setProcessedImageUrl(null);
    setPreviewUrl(URL.createObjectURL(selected));
    void runAiAnalysis(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleResetImage = () => {
    setFile(null);
    setPreviewUrl(null);
    setOriginalImageUrl(null);
    setProcessedImageUrl(null);
    setAiFilled(false);
    setAiConfidence(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select an image to upload');
      return;
    }

    setSubmitting(true);
    try {
      let finalOriginalUrl = originalImageUrl;

      if (!finalOriginalUrl) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error('Please sign in again');
          router.push('/login');
          return;
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const storagePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('wardrobe-images')
          .upload(storagePath, file);

        if (!uploadError) {
          const { data: signedData } = await supabase.storage
            .from('wardrobe-images')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
          finalOriginalUrl = signedData?.signedUrl || storagePath;
        } else {
          finalOriginalUrl = previewUrl || '/placeholder-garment.png';
        }
      }

      const combinedOccasions = Array.from(
        new Set([occasion, ...detectedOccasions].filter(Boolean))
      );

      const res = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_image_url: finalOriginalUrl,
          processed_image_url: processedImageUrl,
          category,
          subcategory: subcategory || null,
          name: name || subcategory || category,
          primary_colour: primaryColour || null,
          secondary_colours: secondaryColours,
          colour_hex: colourHex || null,
          pattern: pattern || 'solid',
          fabric_appearance: fabricAppearance || null,
          style_tags: styleTags,
          seasons,
          occasions: combinedOccasions,
          formality,
          description: description || null,
          ai_confidence: aiConfidence,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save item');
      }

      toast.success('Item added to your wardrobe!');
      router.push('/wardrobe');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/wardrobe"
          className="p-2 rounded-lg bg-white border border-[#E8DFD3] text-[#252525] hover:bg-[#F8F6F2] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-light text-[#252525]">Add Wardrobe Item</h1>
          <p className="text-sm text-[#A99B8C]">
            Upload a photo — AI will auto-fill the details for you to review or edit
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 p-6 space-y-6"
      >
        {/* Drop Zone */}
        {!previewUrl ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-150 ${
              dragActive
                ? 'border-[#252525] bg-[#F8F6F2]'
                : 'border-[#E8DFD3] hover:border-[#A99B8C]'
            }`}
          >
            <Upload className="w-10 h-10 text-[#A99B8C] mx-auto mb-3" />
            <p className="font-medium text-[#252525]">
              Drag and drop your garment photo here
            </p>
            <p className="text-xs text-[#A99B8C] mt-1">
              or click to browse (JPG, PNG, WebP)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative w-56 mx-auto">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full aspect-[3/4] object-cover rounded-xl border border-[#E8DFD3] bg-[#F8F6F2]"
              />
              <button
                type="button"
                onClick={handleResetImage}
                aria-label="Remove image"
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[#252525] text-white shadow-sm hover:bg-black"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {analyzing && (
              <div className="flex items-center justify-center gap-2 text-sm text-[#252525] bg-[#F8F6F2] border border-[#E8DFD3] rounded-lg py-2.5 px-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#A99B8C]" />
                <span>Analyzing garment with AI (removing background &amp; detecting details)…</span>
              </div>
            )}

            {!analyzing && aiFilled && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#252525] bg-[#F8F6F2] border border-[#D9B7B0] rounded-lg py-2 px-4">
                <Wand2 className="w-3.5 h-3.5 text-[#A99B8C]" />
                <span>
                  AI auto-filled the fields below — edit anything if needed before saving.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Details Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-[#252525]">
              Item Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Ivory Silk Blouse"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-[#E8DFD3] rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-[#252525]">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as WardrobeCategory)}
            >
              <SelectTrigger className="border-[#E8DFD3] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tops">Tops</SelectItem>
                <SelectItem value="bottoms">Bottoms</SelectItem>
                <SelectItem value="dresses">Dresses</SelectItem>
                <SelectItem value="outerwear">Outerwear</SelectItem>
                <SelectItem value="footwear">Footwear</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="bags">Bags</SelectItem>
                <SelectItem value="activewear">Activewear</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory" className="text-sm text-[#252525]">
              Subcategory
            </Label>
            <Input
              id="subcategory"
              placeholder="e.g. Blouse, Blazer, Midi Skirt"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="border-[#E8DFD3] rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="colour" className="text-sm text-[#252525]">
              Primary Colour
            </Label>
            <div className="flex items-center gap-2">
              {colourHex && (
                <span
                  className="w-8 h-9 rounded-lg border border-[#E8DFD3] shrink-0"
                  style={{ backgroundColor: colourHex }}
                  title={colourHex}
                />
              )}
              <Input
                id="colour"
                placeholder="e.g. Ivory, Navy, Charcoal"
                value={primaryColour}
                onChange={(e) => setPrimaryColour(e.target.value)}
                className="border-[#E8DFD3] rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pattern" className="text-sm text-[#252525]">
              Pattern
            </Label>
            <Input
              id="pattern"
              placeholder="e.g. Solid, Floral, Striped"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="border-[#E8DFD3] rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabric" className="text-sm text-[#252525]">
              Fabric Appearance
            </Label>
            <Input
              id="fabric"
              placeholder="e.g. Cotton, Silk, Denim"
              value={fabricAppearance}
              onChange={(e) => setFabricAppearance(e.target.value)}
              className="border-[#E8DFD3] rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occasion" className="text-sm text-[#252525]">
              Primary Occasion
            </Label>
            <Select value={occasion} onValueChange={(v) => setOccasion(v ?? 'casual')}>
              <SelectTrigger className="border-[#E8DFD3] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="work">Work / Office</SelectItem>
                <SelectItem value="date_night">Date Night</SelectItem>
                <SelectItem value="formal_event">Formal Event</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="weekend">Weekend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-[#252525]">Formality</Label>
            <Select
              value={formality}
              onValueChange={(v) => setFormality(v as FormalityLevel)}
            >
              <SelectTrigger className="border-[#E8DFD3] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very_casual">Very Casual</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="smart_casual">Smart Casual</SelectItem>
                <SelectItem value="semi_formal">Semi Formal</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="black_tie">Black Tie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description" className="text-sm text-[#252525]">
              Description
            </Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="AI-generated searchable description (you can edit it)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-[#E8DFD3] rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/wardrobe">
            <Button type="button" variant="outline" className="rounded-lg border-[#E8DFD3]">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting || analyzing}
            className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2 text-[#D9B7B0]" />
                Save to Wardrobe
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
