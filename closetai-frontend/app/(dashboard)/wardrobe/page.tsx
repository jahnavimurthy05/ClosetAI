'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Search, LayoutGrid, List, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { WardrobeItemCard } from '@/components/wardrobe/WardrobeItemCard';
import type { WardrobeItem } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'dresses', label: 'Dresses' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'outerwear', label: 'Outerwear' },
];

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [colour, setColour] = useState('all');
  const [formality, setFormality] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      if (colour !== 'all') params.set('colour', colour);
      if (formality !== 'all') params.set('formality', formality);

      const res = await fetch(`/api/wardrobe?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load wardrobe');
      const json = await res.json();
      setItems(json.data ?? []);
    } catch {
      toast.error('Could not load wardrobe items');
    } finally {
      setLoading(false);
    }
  }, [category, search, colour, formality]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggleFavourite = async (id: string, current: boolean) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_favourite: !current } : i))
    );
    const res = await fetch(`/api/wardrobe/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favourite: !current }),
    });
    if (!res.ok) {
      toast.error('Failed to update favourite');
      fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/wardrobe/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Item removed from wardrobe');
    } else {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#252525]">
            My Wardrobe
          </h1>
          <p className="text-sm text-[#A99B8C] mt-1">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'} catalogued
          </p>
        </div>
        <Link href="/wardrobe/upload">
          <Button className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-150 ${
              category === cat.id
                ? 'bg-[#252525] text-white'
                : 'bg-white text-[#252525] border border-[#E8DFD3] hover:border-[#A99B8C]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A99B8C] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name, brand, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-[#E8DFD3] rounded-lg"
          />
        </div>

        <Select value={colour} onValueChange={(v) => setColour(v ?? 'all')}>
          <SelectTrigger className="w-full md:w-40 border-[#E8DFD3] rounded-lg">
            <SelectValue placeholder="Colour" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colours</SelectItem>
            <SelectItem value="black">Black</SelectItem>
            <SelectItem value="white">White</SelectItem>
            <SelectItem value="navy">Navy</SelectItem>
            <SelectItem value="beige">Beige</SelectItem>
            <SelectItem value="brown">Brown</SelectItem>
            <SelectItem value="red">Red</SelectItem>
            <SelectItem value="blue">Blue</SelectItem>
            <SelectItem value="green">Green</SelectItem>
          </SelectContent>
        </Select>

        <Select value={formality} onValueChange={(v) => setFormality(v ?? 'all')}>
          <SelectTrigger className="w-full md:w-44 border-[#E8DFD3] rounded-lg">
            <SelectValue placeholder="Formality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formality</SelectItem>
            <SelectItem value="very_casual">Very Casual</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="smart_casual">Smart Casual</SelectItem>
            <SelectItem value="semi_formal">Semi Formal</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center border border-[#E8DFD3] rounded-lg p-1 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-[#252525] text-white' : 'text-[#A99B8C]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-[#252525] text-white' : 'text-[#A99B8C]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-[3/4] rounded-xl bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 p-12 text-center">
          <Shirt className="w-10 h-10 text-[#A99B8C] mx-auto mb-3" />
          <h3 className="font-serif text-xl text-[#252525]">No items found</h3>
          <p className="text-sm text-[#A99B8C] mt-1 mb-5">
            Try adjusting your filters or upload a new piece to your wardrobe.
          </p>
          <Link href="/wardrobe/upload">
            <Button className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <WardrobeItemCard
              key={item.id}
              item={item}
              viewMode="grid"
              onToggleFavourite={handleToggleFavourite}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <WardrobeItemCard
              key={item.id}
              item={item}
              viewMode="list"
              onToggleFavourite={handleToggleFavourite}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
