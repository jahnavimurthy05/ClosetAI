'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Save, X, User, Palette, Shirt, Settings } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import type { StyleTag } from '@/types'

type Section = 'body' | 'colour' | 'style' | 'account'

const STYLES: StyleTag[] = [
  'minimalist', 'casual', 'elegant', 'smart_casual', 'formal', 'streetwear',
  'chic', 'traditional_ethnic', 'feminine', 'contemporary', 'vintage', 'sporty',
]
const COMPLEXIONS = ['fair', 'light', 'medium', 'tan', 'deep', 'prefer_not_to_say']
const UNDERTONES = ['warm', 'cool', 'neutral', 'not_sure']
const FITS = ['fitted', 'relaxed', 'oversized', 'tailored']
const SHAPES = ['hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle', 'other']
const METALS = ['gold', 'silver', 'rose_gold', 'mixed']

export default function ProfilePage() {
  const { profile, bodyProfile, colourProfile, stylePrefs, isLoading, updateProfile } = useProfile()
  const [editing, setEditing] = useState<Section | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [localBody, setLocalBody] = useState({ height_cm: '', body_shape: '', preferred_fit: '' })
  const [localColour, setLocalColour] = useState({ skin_complexion: '', undertone: '', metal_preference: '' })
  const [localStyle, setLocalStyle] = useState<StyleTag[]>([])
  const [localAccount, setLocalAccount] = useState({ display_name: '' })

  const startEdit = (section: Section) => {
    if (section === 'body') setLocalBody({ height_cm: String(bodyProfile?.height_cm ?? ''), body_shape: bodyProfile?.body_shape ?? '', preferred_fit: bodyProfile?.preferred_fit ?? '' })
    if (section === 'colour') setLocalColour({ skin_complexion: colourProfile?.skin_complexion ?? '', undertone: colourProfile?.undertone ?? '', metal_preference: colourProfile?.metal_preference ?? '' })
    if (section === 'style') setLocalStyle(stylePrefs?.styles ?? [])
    if (section === 'account') setLocalAccount({ display_name: profile?.display_name ?? '' })
    setEditing(section)
  }

  const save = async () => {
    setIsSaving(true)
    let payload: Record<string, unknown> = {}
    if (editing === 'body') payload = { body_profile: { ...localBody, height_cm: localBody.height_cm ? Number(localBody.height_cm) : null } }
    if (editing === 'colour') payload = { colour_profile: localColour }
    if (editing === 'style') payload = { style_preferences: { styles: localStyle } }
    if (editing === 'account') payload = { profile: localAccount }
    await updateProfile(payload as never)
    setIsSaving(false)
    setEditing(null)
  }

  if (isLoading) return <div className="p-8 space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />)}</div>

  const SectionHeader = ({ title, section, icon }: { title: string; section: Section; icon: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-[#A99B8C]">{icon}</span>
        <h2 className="text-lg font-semibold text-[#252525]">{title}</h2>
      </div>
      {editing === section ? (
        <div className="flex gap-2">
          <button onClick={save} disabled={isSaving} className="flex items-center gap-1 text-sm bg-[#252525] text-white px-3 py-1.5 rounded-lg hover:bg-[#A99B8C] transition-colors">
            <Save className="w-3 h-3" /> {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => startEdit(section)} className="flex items-center gap-1 text-sm text-[#A99B8C] hover:text-[#252525] transition-colors">
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      )}
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#252525]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>My Style Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your personal fashion identity</p>
      </div>

      {/* Body Profile */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <SectionHeader title="Body Profile" section="body" icon={<User className="w-4 h-4" />} />
        {editing === 'body' ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#252525] block mb-1">Height (cm)</label>
              <input type="number" value={localBody.height_cm} onChange={e => setLocalBody(p => ({ ...p, height_cm: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A99B8C]" placeholder="e.g. 165" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#252525] block mb-2">Body Shape</label>
              <div className="flex flex-wrap gap-2">
                {SHAPES.map(s => (
                  <button key={s} onClick={() => setLocalBody(p => ({ ...p, body_shape: s }))}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${localBody.body_shape === s ? 'bg-[#252525] text-white' : 'bg-[#F8F6F2] text-[#252525] hover:bg-[#A99B8C] hover:text-white'}`}>
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#252525] block mb-2">Preferred Fit</label>
              <div className="flex flex-wrap gap-2">
                {FITS.map(f => (
                  <button key={f} onClick={() => setLocalBody(p => ({ ...p, preferred_fit: f }))}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${localBody.preferred_fit === f ? 'bg-[#252525] text-white' : 'bg-[#F8F6F2] text-[#252525] hover:bg-[#A99B8C] hover:text-white'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Height', value: bodyProfile?.height_cm ? `${bodyProfile.height_cm} cm` : '—' },
              { label: 'Body Shape', value: bodyProfile?.body_shape?.replace(/_/g, ' ') ?? '—' },
              { label: 'Preferred Fit', value: bodyProfile?.preferred_fit ?? '—' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm font-medium text-[#252525] capitalize">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Colour Profile */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <SectionHeader title="Colour Profile" section="colour" icon={<Palette className="w-4 h-4" />} />
        {editing === 'colour' ? (
          <div className="space-y-4">
            {[{ label: 'Skin Complexion', key: 'skin_complexion' as const, options: COMPLEXIONS },
              { label: 'Undertone', key: 'undertone' as const, options: UNDERTONES },
              { label: 'Metal Preference', key: 'metal_preference' as const, options: METALS }].map(field => (
              <div key={field.key}>
                <label className="text-sm font-medium text-[#252525] block mb-2">{field.label}</label>
                <div className="flex flex-wrap gap-2">
                  {field.options.map(opt => (
                    <button key={opt} onClick={() => setLocalColour(p => ({ ...p, [field.key]: opt }))}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${localColour[field.key] === opt ? 'bg-[#252525] text-white' : 'bg-[#F8F6F2] text-[#252525] hover:bg-[#A99B8C] hover:text-white'}`}>
                      {opt.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Skin Complexion', value: colourProfile?.skin_complexion?.replace(/_/g, ' ') ?? '—' },
              { label: 'Undertone', value: colourProfile?.undertone?.replace(/_/g, ' ') ?? '—' },
              { label: 'Metal Preference', value: colourProfile?.metal_preference?.replace(/_/g, ' ') ?? '—' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm font-medium text-[#252525] capitalize">{item.value}</p>
              </div>
            ))}
            {colourProfile?.favourite_colours?.length ? (
              <div className="col-span-3">
                <p className="text-xs text-gray-400 mb-2">Favourite Colours</p>
                <div className="flex flex-wrap gap-2">
                  {colourProfile.favourite_colours.map(c => (
                    <span key={c} className="px-2 py-1 bg-[#F8F6F2] rounded-full text-xs capitalize">{c}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Style Preferences */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <SectionHeader title="Style Preferences" section="style" icon={<Shirt className="w-4 h-4" />} />
        {editing === 'style' ? (
          <div className="flex flex-wrap gap-2">
            {STYLES.map(s => (
              <button key={s} onClick={() => setLocalStyle(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${localStyle.includes(s) ? 'bg-[#252525] text-white' : 'bg-[#F8F6F2] text-[#252525] hover:bg-[#A99B8C] hover:text-white'}`}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(stylePrefs?.styles ?? []).map(s => (
              <span key={s} className="px-3 py-1 bg-[#F8F6F2] text-[#252525] rounded-full text-sm capitalize">{s.replace(/_/g, ' ')}</span>
            ))}
            {(!stylePrefs?.styles?.length) && <p className="text-sm text-gray-400">No styles selected yet</p>}
          </div>
        )}
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <SectionHeader title="Account" section="account" icon={<Settings className="w-4 h-4" />} />
        {editing === 'account' ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[#252525] block mb-1">Display Name</label>
              <input type="text" value={localAccount.display_name} onChange={e => setLocalAccount({ display_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A99B8C]" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#A99B8C] flex items-center justify-center text-white text-xl font-semibold">
              {(profile?.display_name ?? 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-[#252525]">{profile?.display_name ?? 'Unnamed User'}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
