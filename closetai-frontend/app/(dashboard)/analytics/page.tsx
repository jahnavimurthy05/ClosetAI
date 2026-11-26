'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shirt, Sparkles, Calendar, AlertTriangle, TrendingUp, Palette } from 'lucide-react'
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard'
import { InsightItem } from '@/components/analytics/InsightItem'
import type { WardrobeItem, Outfit } from '@/types'

interface AnalyticsData {
  totalItems: number
  categoryBreakdown: Record<string, number>
  totalOutfits: number
  wornThisMonth: number
  neverWorn: WardrobeItem[]
  mostWorn: (WardrobeItem & { wearCount: number })[]
  leastWorn: (WardrobeItem & { wearCount: number })[]
  colourFrequency: Record<string, number>
}

function computeInsights(data: AnalyticsData): { text: string; variant: 'default' | 'warning' | 'tip' }[] {
  const insights: { text: string; variant: 'default' | 'warning' | 'tip' }[] = []
  const tops = data.categoryBreakdown['tops'] ?? 0
  const bottoms = data.categoryBreakdown['bottoms'] ?? 0
  if (tops > bottoms * 2) insights.push({ text: `You have ${tops} tops but only ${bottoms} bottoms. Consider adding more bottoms for more outfit combinations.`, variant: 'tip' })
  if (data.neverWorn.length > 0) insights.push({ text: `${data.neverWorn.length} item${data.neverWorn.length > 1 ? 's' : ''} in your wardrobe have never been worn. Try styling them!`, variant: 'warning' })
  if (data.mostWorn[0]) insights.push({ text: `Your most worn item is "${data.mostWorn[0].name ?? 'Unnamed item'}" — worn ${data.mostWorn[0].wearCount} times.`, variant: 'default' })
  if (data.totalOutfits > 0) insights.push({ text: `You've saved ${data.totalOutfits} outfits. Great style curation!`, variant: 'default' })
  return insights
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [wRes, oRes] = await Promise.all([fetch('/api/wardrobe'), fetch('/api/outfits')])
        const wData = await wRes.json()
        const oData = await oRes.json()
        const items: WardrobeItem[] = wData.items ?? []
        const outfits: Outfit[] = oData.outfits ?? []
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const categoryBreakdown: Record<string, number> = {}
        const colourFrequency: Record<string, number> = {}
        for (const item of items) {
          categoryBreakdown[item.category] = (categoryBreakdown[item.category] ?? 0) + 1
          if (item.primary_colour) colourFrequency[item.primary_colour] = (colourFrequency[item.primary_colour] ?? 0) + 1
        }
        const neverWorn = items.filter(i => !i.wear_count || i.wear_count === 0)
        const wornThisMonth = items.filter(i => i.last_worn_at && new Date(i.last_worn_at) >= monthStart).length
        const sorted = [...items].sort((a, b) => (b.wear_count ?? 0) - (a.wear_count ?? 0))
        const mostWorn = sorted.slice(0, 5).map(i => ({ ...i, wearCount: i.wear_count ?? 0 }))
        const leastWorn = sorted.filter(i => (i.wear_count ?? 0) > 0).slice(-5).map(i => ({ ...i, wearCount: i.wear_count ?? 0 }))
        setData({ totalItems: items.length, categoryBreakdown, totalOutfits: outfits.length, wornThisMonth, neverWorn, mostWorn, leastWorn, colourFrequency })
      } catch {
        setData({ totalItems: 0, categoryBreakdown: {}, totalOutfits: 0, wornThisMonth: 0, neverWorn: [], mostWorn: [], leastWorn: [], colourFrequency: {} })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm p-6 h-32 animate-pulse" />
      ))}
    </div>
  )

  if (!data) return null

  const insights = computeInsights(data)
  const topColours = Object.entries(data.colourFrequency).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const totalItems = data.totalItems || 1

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#252525]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Wardrobe Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Insights into your personal style</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: data.totalItems, icon: <Shirt className="w-5 h-5" />, colour: 'text-[#A99B8C]' },
          { label: 'Saved Outfits', value: data.totalOutfits, icon: <Sparkles className="w-5 h-5" />, colour: 'text-purple-500' },
          { label: 'Worn This Month', value: data.wornThisMonth, icon: <Calendar className="w-5 h-5" />, colour: 'text-green-500' },
          { label: 'Never Worn', value: data.neverWorn.length, icon: <AlertTriangle className="w-5 h-5" />, colour: 'text-amber-500' },
        ].map(stat => (
          <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2">
            <span className={stat.colour}>{stat.icon}</span>
            <span className="text-2xl font-bold text-[#252525]">{stat.value}</span>
            <span className="text-xs text-gray-500">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <AnalyticsCard title="Category Breakdown" icon={<TrendingUp className="w-4 h-4" />}>
          <div className="space-y-3">
            {Object.entries(data.categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-[#252525]">{cat.replace(/_/g, ' ')}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#A99B8C] rounded-full transition-all duration-500"
                    style={{ width: `${(count / totalItems) * 100}%` }} />
                </div>
              </div>
            ))}
            {Object.keys(data.categoryBreakdown).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No wardrobe items yet</p>
            )}
          </div>
        </AnalyticsCard>

        {/* Colour Analysis */}
        <AnalyticsCard title="Colour Palette" icon={<Palette className="w-4 h-4" />}>
          <div className="flex flex-wrap gap-2 mb-4">
            {topColours.map(([colour, count]) => (
              <div key={colour} className="flex items-center gap-1.5 bg-[#F8F6F2] rounded-full px-3 py-1">
                <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: colour }} />
                <span className="text-xs capitalize text-[#252525]">{colour}</span>
                <span className="text-xs text-gray-400">({count})</span>
              </div>
            ))}
            {topColours.length === 0 && <p className="text-sm text-gray-400">No colour data yet</p>}
          </div>
        </AnalyticsCard>

        {/* Most Worn */}
        <AnalyticsCard title="Most Worn Items">
          <div className="space-y-3">
            {data.mostWorn.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#A99B8C] w-5">{idx + 1}</span>
                <div className="w-10 h-10 rounded-lg bg-[#F8F6F2] overflow-hidden shrink-0">
                  {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.name ?? ''} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#252525] truncate">{item.name ?? 'Unnamed item'}</p>
                  <p className="text-xs text-gray-400">{item.wearCount} wears{item.last_worn_at ? ` · Last: ${new Date(item.last_worn_at).toLocaleDateString()}` : ''}</p>
                </div>
              </div>
            ))}
            {data.mostWorn.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No wear data yet</p>}
          </div>
        </AnalyticsCard>

        {/* Never Worn */}
        <AnalyticsCard title="Never Worn">
          <div className="space-y-3">
            {data.neverWorn.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F8F6F2] overflow-hidden shrink-0">
                  {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.name ?? ''} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#252525] truncate">{item.name ?? 'Unnamed item'}</p>
                  <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                </div>
                <button className="text-xs text-[#A99B8C] hover:text-[#252525] transition-colors shrink-0">Style it</button>
              </div>
            ))}
            {data.neverWorn.length === 0 && <p className="text-sm text-green-600 text-center py-4">You wear everything!</p>}
          </div>
        </AnalyticsCard>
      </div>

      {/* AI Insights */}
      <AnalyticsCard title="Style Insights" icon={<Sparkles className="w-4 h-4" />}>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <InsightItem key={i} text={insight.text} variant={insight.variant} />
          ))}
          {insights.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Add items to your wardrobe to see insights</p>}
        </div>
      </AnalyticsCard>
    </motion.div>
  )
}
