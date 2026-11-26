'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Star,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { WardrobeItem } from '@/types';

export default function WardrobeItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [primaryColour, setPrimaryColour] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const loadItem = async () => {
      try {
        const res = await fetch(`/api/wardrobe/${id}`);
        if (!res.ok) throw new Error('Item not found');
        const json = await res.json();
        const data: WardrobeItem = json.data;
        setItem(data);
        setName(data.name || '');
        setSubcategory(data.subcategory || '');
        setPrimaryColour(data.primary_colour || '');
        setBrand(data.brand || '');
        setDescription(data.description || '');
      } catch {
        toast.error('Could not load wardrobe item');
      } finally {
        setLoading(false);
      }
    };
    loadItem();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/wardrobe/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || null,
          subcategory: subcategory || null,
          primary_colour: primaryColour || null,
          brand: brand || null,
          description: description || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const json = await res.json();
      setItem(json.data);
      setEditing(false);
      toast.success('Item updated');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/wardrobe/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Item deleted');
      router.push('/wardrobe');
    } else {
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="aspect-[3/4] rounded-xl bg-white" />
        <Skeleton className="h-80 rounded-xl bg-white" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl p-10 text-center shadow-sm">
        <h2 className="font-serif text-2xl text-[#252525]">Item not found</h2>
        <Link href="/wardrobe" className="inline-block mt-4">
          <Button className="bg-[#252525] text-white rounded-lg">Back to Wardrobe</Button>
        </Link>
      </div>
    );
  }

  const imageUrl = item.processed_image_url || item.original_image_url;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/wardrobe"
          className="inline-flex items-center gap-2 text-sm text-[#A99B8C] hover:text-[#252525] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wardrobe
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditing((e) => !e)}
            className="rounded-lg border-[#E8DFD3]"
          >
            {editing ? (
              <>
                <X className="w-4 h-4 mr-1.5" /> Cancel
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4 mr-1.5" /> Edit
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 overflow-hidden aspect-[3/4]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name || item.category}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#A99B8C]">
              No image
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 p-6 space-y-5">
          {!editing ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge className="bg-[#E8DFD3]/70 text-[#252525] capitalize mb-2">
                    {item.category}
                  </Badge>
                  <h1 className="font-serif text-3xl font-light text-[#252525] capitalize">
                    {item.name || item.subcategory || item.category}
                  </h1>
                </div>
                <Star
                  className={`w-5 h-5 ${
                    item.is_favourite ? 'fill-[#D9B7B0] text-[#D9B7B0]' : 'text-[#A99B8C]'
                  }`}
                />
              </div>

              {item.description && (
                <p className="text-sm text-[#252525]/80 leading-relaxed">
                  {item.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E8DFD3]">
                <div>
                  <p className="text-xs text-[#A99B8C]">Subcategory</p>
                  <p className="text-sm font-medium text-[#252525] capitalize">
                    {item.subcategory || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#A99B8C]">Primary Colour</p>
                  <p className="text-sm font-medium text-[#252525] capitalize">
                    {item.primary_colour || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#A99B8C]">Formality</p>
                  <p className="text-sm font-medium text-[#252525] capitalize">
                    {item.formality?.replace('_', ' ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#A99B8C]">Brand</p>
                  <p className="text-sm font-medium text-[#252525]">{item.brand || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A99B8C]">Wear Count</p>
                  <p className="text-sm font-medium text-[#252525]">
                    {item.wear_count} {item.wear_count === 1 ? 'time' : 'times'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#A99B8C]">Pattern</p>
                  <p className="text-sm font-medium text-[#252525] capitalize">
                    {item.pattern || '—'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h2 className="font-serif text-2xl text-[#252525]">Edit Item</h2>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-[#E8DFD3] rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Input
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="border-[#E8DFD3] rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Primary Colour</Label>
                <Input
                  value={primaryColour}
                  onChange={(e) => setPrimaryColour(e.target.value)}
                  className="border-[#E8DFD3] rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="border-[#E8DFD3] rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-[#E8DFD3] rounded-lg"
                />
              </div>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete wardrobe item?</DialogTitle>
            <DialogDescription>
              This will permanently remove this item from your wardrobe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
