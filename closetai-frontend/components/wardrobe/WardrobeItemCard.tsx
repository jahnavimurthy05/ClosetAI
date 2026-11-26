'use client';

import Link from 'next/link';
import { Star, Eye, Trash2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WardrobeItem } from '@/types';

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onToggleFavourite?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

export function WardrobeItemCard({
  item,
  onToggleFavourite,
  onDelete,
  viewMode = 'grid',
}: WardrobeItemCardProps) {
  const imageUrl = item.processed_image_url || item.original_image_url;
  const displayName = item.name || item.subcategory || item.category;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 p-4 flex items-center gap-4 hover:shadow-md transition-all duration-150">
        <Link href={`/wardrobe/${item.id}`} className="w-20 h-20 rounded-lg overflow-hidden bg-[#F8F6F2] flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#A99B8C] text-xs">
              No image
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/wardrobe/${item.id}`}
              className="font-medium text-[#252525] truncate hover:underline"
            >
              {displayName}
            </Link>
            <Badge variant="secondary" className="bg-[#E8DFD3]/60 text-[#252525] capitalize text-xs">
              {item.category}
            </Badge>
          </div>
          <p className="text-xs text-[#A99B8C] mt-1">
            {[item.primary_colour, item.formality?.replace('_', ' '), item.brand]
              .filter(Boolean)
              .join(' · ') || 'No additional details'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onToggleFavourite && (
            <button
              type="button"
              onClick={() => onToggleFavourite(item.id, item.is_favourite)}
              aria-label="Toggle favourite"
              className="p-2 rounded-lg hover:bg-[#F8F6F2] transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  item.is_favourite ? 'fill-[#D9B7B0] text-[#D9B7B0]' : 'text-[#A99B8C]'
                }`}
              />
            </button>
          )}
          <Link
            href={`/wardrobe/${item.id}`}
            className="p-2 rounded-lg hover:bg-[#F8F6F2] text-[#252525] transition-colors"
            aria-label="View item"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 overflow-hidden hover:shadow-md transition-all duration-150">
      <div className="relative aspect-[3/4] bg-[#F8F6F2] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#A99B8C] text-sm">
            No image
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/90 text-[#252525] hover:bg-white capitalize text-xs font-normal shadow-sm">
            {item.category}
          </Badge>
        </div>

        {onToggleFavourite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavourite(item.id, item.is_favourite);
            }}
            aria-label="Toggle favourite"
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all duration-150"
          >
            <Star
              className={`w-4 h-4 ${
                item.is_favourite ? 'fill-[#D9B7B0] text-[#D9B7B0]' : 'text-[#252525]'
              }`}
            />
          </button>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-between gap-2">
          <Link
            href={`/wardrobe/${item.id}`}
            className="flex-1 py-1.5 px-3 rounded-lg bg-white text-[#252525] text-xs font-medium text-center hover:bg-[#F8F6F2] transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Link>
          <Link
            href={`/outfits?item=${item.id}`}
            className="py-1.5 px-2.5 rounded-lg bg-[#252525] text-white text-xs hover:bg-[#3a3a3a] transition-colors"
            title="Style this item"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </Link>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDelete(item.id);
              }}
              aria-label="Delete item"
              className="py-1.5 px-2.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <Link href={`/wardrobe/${item.id}`} className="block p-3.5">
        <h3 className="font-medium text-sm text-[#252525] truncate capitalize">
          {displayName}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-[#A99B8C] capitalize truncate">
            {item.primary_colour || item.formality?.replace('_', ' ') || 'Wardrobe piece'}
          </span>
          {item.colour_hex && (
            <span
              className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
              style={{ backgroundColor: item.colour_hex }}
            />
          )}
        </div>
      </Link>
    </div>
  );
}
