'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Shirt,
  Sparkles,
  Star,
  Calendar as CalendarIcon,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WardrobeItemCard } from '@/components/wardrobe/WardrobeItemCard';
import type { WardrobeItem, OutfitCalendarEntry, WardrobeStats } from '@/types';

function getGreeting(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>('');
  const [stats, setStats] = useState<WardrobeStats | null>(null);
  const [recentItems, setRecentItems] = useState<WardrobeItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<OutfitCalendarEntry[]>([]);
  const [greeting, setGreeting] = useState('Welcome');
  const [todayFormatted, setTodayFormatted] = useState('');
  const [todayIso, setTodayIso] = useState('');

  useEffect(() => {
    const now = new Date();
    setGreeting(getGreeting(now));
    setTodayFormatted(format(now, 'EEEE, MMMM d, yyyy'));
    setTodayIso(format(now, 'yyyy-MM-dd'));

    const loadDashboard = async () => {
      try {
        const today = format(now, 'yyyy-MM-dd');
        const nextWeek = format(new Date(now.getTime() + 7 * 86400000), 'yyyy-MM-dd');

        const [profileRes, statsRes, wardrobeRes, calendarRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/analytics'),
          fetch('/api/wardrobe'),
          fetch(`/api/calendar?start_date=${today}&end_date=${nextWeek}`),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setDisplayName(profileData.user_profile?.display_name || '');
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
        if (wardrobeRes.ok) {
          const wardrobeData = await wardrobeRes.json();
          setRecentItems((wardrobeData.data ?? []).slice(0, 4));
        }
        if (calendarRes.ok) {
          const calData = await calendarRes.json();
          setUpcomingEvents((calData.data ?? []).slice(0, 4));
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#A99B8C]">{todayFormatted}</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#252525] mt-1">
            {greeting}
            {displayName ? `, ${displayName}` : ''}
          </h1>
        </div>
        <Link href={todayIso ? `/outfits?date=${todayIso}` : '/outfits'}>
          <Button className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg h-11 px-5 transition-all duration-150">
            <Sparkles className="w-4 h-4 mr-2 text-[#D9B7B0]" />
            Generate Outfit for Today
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-xl bg-white" />
          ))
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E8DFD3]/60 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A99B8C]">
                  Total Wardrobe Items
                </p>
                <p className="font-serif text-3xl text-[#252525] mt-1">
                  {stats?.total_items ?? 0}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#F8F6F2] flex items-center justify-center">
                <Shirt className="w-5 h-5 text-[#A99B8C]" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E8DFD3]/60 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A99B8C]">
                  Outfits Created
                </p>
                <p className="font-serif text-3xl text-[#252525] mt-1">
                  {stats?.total_outfits ?? 0}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#F8F6F2] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#A99B8C]" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E8DFD3]/60 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A99B8C]">
                  Favourite Pieces
                </p>
                <p className="font-serif text-3xl text-[#252525] mt-1">
                  {stats?.favourite_items ?? 0}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#F8F6F2] flex items-center justify-center">
                <Star className="w-5 h-5 text-[#D9B7B0]" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recently Added Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-light text-[#252525]">
            Recently Added Items
          </h2>
          <Link
            href="/wardrobe"
            className="text-sm text-[#A99B8C] hover:text-[#252525] flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="aspect-[3/4] rounded-xl bg-white" />
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 p-10 text-center">
            <Shirt className="w-10 h-10 text-[#A99B8C] mx-auto mb-3" />
            <h3 className="font-serif text-xl text-[#252525]">Your wardrobe is empty</h3>
            <p className="text-sm text-[#A99B8C] mt-1 mb-5">
              Upload photos of your clothes so ClosetAI can catalogue and style them for you.
            </p>
            <Link href="/wardrobe/upload">
              <Button className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentItems.map((item) => (
              <WardrobeItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Calendar Events */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-light text-[#252525]">
            Upcoming Outfit Plans
          </h2>
          <Link
            href="/calendar"
            className="text-sm text-[#A99B8C] hover:text-[#252525] flex items-center gap-1 transition-colors"
          >
            Open calendar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <Skeleton className="h-32 rounded-xl bg-white" />
        ) : upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 p-8 text-center">
            <CalendarIcon className="w-8 h-8 text-[#A99B8C] mx-auto mb-2" />
            <p className="text-sm text-[#252525] font-medium">No upcoming outfits planned</p>
            <p className="text-xs text-[#A99B8C] mt-1 mb-4">
              Plan your looks for the week ahead on the outfit calendar.
            </p>
            <Link href="/calendar">
              <Button variant="outline" className="rounded-lg border-[#E8DFD3] text-[#252525]">
                Plan an Outfit
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm border border-[#E8DFD3]/60 p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#A99B8C]">
                    {format(new Date(event.date + 'T00:00:00'), 'EEE, MMM d')}
                  </p>
                  <p className="font-medium text-[#252525] mt-1">
                    {event.event_name || event.occasion || 'Planned Outfit'}
                  </p>
                  {event.outfit?.name && (
                    <p className="text-xs text-[#A99B8C] mt-0.5">{event.outfit.name}</p>
                  )}
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs capitalize bg-[#F8F6F2] text-[#252525]">
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
