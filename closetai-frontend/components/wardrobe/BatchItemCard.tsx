'use client';

import { Loader2, Check, X, Sparkles, Wand2, AlertCircle } from 'lucide-react';
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

export interface BatchUploadItem {
  localId: string;
  file: File;
  previewUrl: string;
  originalImageUrl: string | null;
  processedImageUrl: string | null;
  status: 'queued' | 'analyzing' | 'ready' | 'saving' | 'saved' | 'error';
  errorMessage?: string;
  aiFilled: boolean;
  name: string;
  category: WardrobeCategory;
  subcategory: string;
  primaryColour: string;
  secondaryColours: string[];
  colourHex: string;
  pattern: string;
  fabricAppearance: string;
  occasion: string;
  detectedOccasions: string[];
  formality: FormalityLevel;
  styleTags: string[];
  seasons: string[];
  description: string;
  aiConfidence: number | null;
}

interface BatchItemCardProps {
  item: BatchUploadItem;
  onChange: (localId: string, patch: Partial<BatchUploadItem>) => void;
  onSave: (localId: string) => void;
  onRemove: (localId: string) => void;
}

export function BatchItemCard({
  item,
  onChange,
  onSave,
  onRemove,
}: BatchItemCardProps) {
  const isBusy = item.status === 'analyzing' || item.status === 'saving';
  const isSaved = item.status === 'saved';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/70 p-5 space-y-4">
      <div className="flex flex-col md:flex-row gap-5">
        {/* Image preview */}
        <div className="relative w-36 shrink-0 mx-auto md:mx-0">
          <img
            src={item.previewUrl}
            alt={item.name || item.file.name}
            className="w-36 aspect-[3/4] object-cover rounded-xl border border-[#E8DFD3] bg-[#F8F6F2]"
          />
          {!isSaved && (
            <button
              type="button"
              onClick={() => onRemove(item.localId)}
              aria-label="Remove item"
              className="absolute -top-2 -right-2 p-1 rounded-full bg-[#252525] text-white shadow-sm hover:bg-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="mt-2 text-center">
            {item.status === 'queued' && (
              <span className="text-xs text-[#A99B8C]">Queued…</span>
            )}
            {item.status === 'analyzing' && (
              <span className="inline-flex items-center gap-1 text-xs text-[#252525]">
                <Loader2 className="w-3 h-3 animate-spin" />
                AI analyzing…
              </span>
            )}
            {item.status === 'ready' && item.aiFilled && (
              <span className="inline-flex items-center gap-1 text-xs text-[#252525] bg-[#F8F6F2] border border-[#D9B7B0] px-2 py-0.5 rounded-full">
                <Wand2 className="w-3 h-3 text-[#A99B8C]" />
                AI filled
              </span>
            )}
            {item.status === 'saved' && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
            {item.status === 'error' && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                {item.errorMessage || 'Check details'}
              </span>
            )}
          </div>
        </div>

        {/* Editable fields */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-[#252525]">Item Name</Label>
            <Input
              value={item.name}
              disabled={isSaved}
              placeholder="e.g. Ivory Silk Blouse"
              onChange={(e) => onChange(item.localId, { name: e.target.value })}
              className="border-[#E8DFD3] rounded-lg h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-[#252525]">Category</Label>
            <Select
              value={item.category}
              disabled={isSaved}
              onValueChange={(v) =>
                onChange(item.localId, { category: v as WardrobeCategory })
              }
            >
              <SelectTrigger className="border-[#E8DFD3] rounded-lg h-9 text-sm">
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

          <div className="space-y-1">
            <Label className="text-xs text-[#252525]">Subcategory</Label>
            <Input
              value={item.subcategory}
              disabled={isSaved}
              placeholder="e.g. Blouse, Blazer"
              onChange={(e) => onChange(item.localId, { subcategory: e.target.value })}
              className="border-[#E8DFD3] rounded-lg h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-[#252525]">Primary Colour</Label>
            <div className="flex items-center gap-1.5">
              {item.colourHex && (
                <span
                  className="w-7 h-9 rounded-lg border border-[#E8DFD3] shrink-0"
                  style={{ backgroundColor: item.colourHex }}
                  title={item.colourHex}
                />
              )}
              <Input
                value={item.primaryColour}
                disabled={isSaved}
                placeholder="e.g. Navy, Ivory"
                onChange={(e) => onChange(item.localId, { primaryColour: e.target.value })}
                className="border-[#E8DFD3] rounded-lg h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-[#252525]">Pattern</Label>
            <Input
              value={item.pattern}
              disabled={isSaved}
              placeholder="solid, floral, striped"
              onChange={(e) => onChange(item.localId, { pattern: e.target.value })}
              className="border-[#E8DFD3] rounded-lg h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-[#252525]">Fabric Appearance</Label>
            <Input
              value={item.fabricAppearance}
              disabled={isSaved}
              placeholder="Cotton, Silk, Denim"
              onChange={(e) =>
                onChange(item.localId, { fabricAppearance: e.target.value })
              }
              className="border-[#E8DFD3] rounded-lg h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-[#252525]">Primary Occasion</Label>
            <Select
              value={item.occasion}
              disabled={isSaved}
              onValueChange={(v) => onChange(item.localId, { occasion: v ?? 'casual' })}
            >
              <SelectTrigger className="border-[#E8DFD3] rounded-lg h-9 text-sm">
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

          <div className="space-y-1">
            <Label className="text-xs text-[#252525]">Formality</Label>
            <Select
              value={item.formality}
              disabled={isSaved}
              onValueChange={(v) =>
                onChange(item.localId, { formality: v as FormalityLevel })
              }
            >
              <SelectTrigger className="border-[#E8DFD3] rounded-lg h-9 text-sm">
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

          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-[#252525]">Description</Label>
            <Textarea
              rows={2}
              value={item.description}
              disabled={isSaved}
              placeholder="AI-generated description (editable)"
              onChange={(e) => onChange(item.localId, { description: e.target.value })}
              className="border-[#E8DFD3] rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {!isSaved && (
        <div className="flex justify-end pt-1 border-t border-[#F8F6F2]">
          <Button
            type="button"
            size="sm"
            disabled={isBusy}
            onClick={() => onSave(item.localId)}
            className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg"
          >
            {item.status === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#D9B7B0]" />
                Save This Item
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
