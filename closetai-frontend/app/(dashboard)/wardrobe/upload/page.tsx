'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Upload, ArrowLeft, Loader2, X, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WardrobeCategory, FormalityLevel } from '@/types';

export default function WardrobeUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<WardrobeCategory>('tops');
  const [subcategory, setSubcategory] = useState('');
  const [name, setName] = useState('');
  const [primaryColour, setPrimaryColour] = useState('');
  const [occasion, setOccasion] = useState('casual');
  const [formality, setFormality] = useState<FormalityLevel>('casual');

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select an image to upload');
      return;
    }

    setSubmitting(true);
    try {
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
      let imageUrl = '';

      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(storagePath, file);

      if (!uploadError) {
        const { data: signedData } = await supabase.storage
          .from('wardrobe-images')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
        imageUrl = signedData?.signedUrl || storagePath;
      } else {
        // Fallback placeholder if bucket isn't provisioned yet
        imageUrl = previewUrl || '/placeholder-garment.png';
      }

      const res = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_image_url: imageUrl,
          category,
          subcategory: subcategory || null,
          name: name || subcategory || category,
          primary_colour: primaryColour || null,
          occasions: occasion ? [occasion] : [],
          formality,
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
            Upload a photo and confirm the garment details
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
          <div className="relative w-56 mx-auto">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full aspect-[3/4] object-cover rounded-xl border border-[#E8DFD3]"
            />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              aria-label="Remove image"
              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[#252525] text-white shadow-sm hover:bg-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
            <Input
              id="colour"
              placeholder="e.g. Ivory, Navy, Charcoal"
              value={primaryColour}
              onChange={(e) => setPrimaryColour(e.target.value)}
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
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/wardrobe">
            <Button type="button" variant="outline" className="rounded-lg border-[#E8DFD3]">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
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
