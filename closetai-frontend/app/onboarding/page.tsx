'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  User,
  Palette,
  Shirt,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { StyleTag } from '@/types';

const BODY_SHAPES = [
  { id: 'hourglass', label: 'Hourglass', desc: 'Balanced bust & hips, defined waist' },
  { id: 'pear', label: 'Pear', desc: 'Hips wider than shoulders' },
  { id: 'apple', label: 'Apple', desc: 'Fuller midsection, slender legs' },
  { id: 'rectangle', label: 'Rectangle', desc: 'Balanced shoulders, waist & hips' },
  { id: 'inverted_triangle', label: 'Inverted Triangle', desc: 'Broad shoulders, narrow hips' },
  { id: 'other', label: 'Other', desc: 'Unique proportions' },
] as const;

const FITS = ['fitted', 'relaxed', 'oversized', 'tailored'] as const;

const COMPLEXIONS = [
  { id: 'fair', label: 'Fair', swatch: '#F9E4D4' },
  { id: 'light', label: 'Light', swatch: '#F0D0B8' },
  { id: 'medium', label: 'Medium', swatch: '#D9A782' },
  { id: 'tan', label: 'Tan', swatch: '#B67D54' },
  { id: 'deep', label: 'Deep', swatch: '#6F4228' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say', swatch: '#E8DFD3' },
] as const;

const UNDERTONES = [
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'not_sure', label: 'Not sure' },
] as const;

const METALS = [
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silver' },
  { id: 'rose_gold', label: 'Rose Gold' },
  { id: 'mixed', label: 'Mixed' },
] as const;

const STYLES: { id: StyleTag; label: string }[] = [
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'casual', label: 'Casual' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'smart_casual', label: 'Smart Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'chic', label: 'Chic' },
  { id: 'traditional_ethnic', label: 'Traditional / Ethnic' },
  { id: 'feminine', label: 'Feminine' },
  { id: 'contemporary', label: 'Contemporary' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'sporty', label: 'Sporty' },
];

const EXPERIMENT_LEVELS = [
  { id: 'classic', label: 'Classic', desc: 'Stick to timeless staples' },
  { id: 'moderate', label: 'Moderate', desc: 'Mix classics with fresh trends' },
  { id: 'bold', label: 'Bold', desc: 'Love statement pieces & colour' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Body Profile
  const [heightCm, setHeightCm] = useState('');
  const [bodyShape, setBodyShape] = useState<string>('');
  const [preferredFit, setPreferredFit] = useState<string>('tailored');

  // Step 2: Colour Profile
  const [skinComplexion, setSkinComplexion] = useState<string>('');
  const [undertone, setUndertone] = useState<string>('not_sure');
  const [metalPreference, setMetalPreference] = useState<string>('gold');

  // Step 3: Style Preferences
  const [selectedStyles, setSelectedStyles] = useState<StyleTag[]>(['minimalist']);
  const [experimentLevel, setExperimentLevel] = useState<'classic' | 'moderate' | 'bold'>('moderate');

  const toggleStyle = (style: StyleTag) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleComplete = async () => {
    if (selectedStyles.length === 0) {
      toast.error('Please select at least one style preference');
      return;
    }

    setSaving(true);
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

      const [bodyRes, colourRes, styleRes, profileRes] = await Promise.all([
        supabase.from('body_profiles').upsert(
          {
            user_id: user.id,
            height_cm: heightCm ? parseFloat(heightCm) : null,
            body_shape: bodyShape || null,
            preferred_fit: preferredFit || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        ),
        supabase.from('colour_profiles').upsert(
          {
            user_id: user.id,
            skin_complexion: skinComplexion || null,
            undertone: undertone || null,
            metal_preference: metalPreference || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        ),
        supabase.from('style_preferences').upsert(
          {
            user_id: user.id,
            styles: selectedStyles,
            experiment_level: experimentLevel,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        ),
        supabase.from('user_profiles').upsert({
          id: user.id,
          onboarding_done: true,
          updated_at: new Date().toISOString(),
        }),
      ]);

      if (bodyRes.error || colourRes.error || styleRes.error || profileRes.error) {
        throw new Error(
          bodyRes.error?.message ||
            colourRes.error?.message ||
            styleRes.error?.message ||
            profileRes.error?.message
        );
      }

      toast.success('Style profile saved! Welcome to ClosetAI.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#A99B8C] mb-2">
            ClosetAI Onboarding
          </p>
          <h1 className="font-serif text-4xl font-light text-[#252525]">
            Tell us about your style
          </h1>
          <p className="text-sm text-[#A99B8C] mt-2">
            Step {step} of 3 — Personalise your AI fashion stylist
          </p>
        </div>

        <Progress value={(step / 3) * 100} className="h-1.5 mb-8 bg-[#E8DFD3]" />

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-[#E8DFD3]/60">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#252525]">
                <User className="w-5 h-5 text-[#A99B8C]" />
                <h2 className="font-serif text-2xl font-normal">Body Profile</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm text-[#252525]">
                  Height (optional)
                </Label>
                <div className="relative max-w-xs">
                  <Input
                    id="height"
                    type="number"
                    placeholder="168"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="pr-12 bg-[#F8F6F2]/50 border-[#E8DFD3] rounded-lg"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A99B8C]">
                    cm
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-[#252525]">Body Shape</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BODY_SHAPES.map((shape) => {
                    const active = bodyShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setBodyShape(shape.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all duration-150 ${
                          active
                            ? 'border-[#252525] bg-[#F8F6F2] shadow-sm'
                            : 'border-[#E8DFD3] hover:border-[#A99B8C]'
                        }`}
                      >
                        <div className="font-medium text-sm text-[#252525]">{shape.label}</div>
                        <div className="text-xs text-[#A99B8C] mt-0.5">{shape.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-[#252525]">Preferred Fit</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FITS.map((fit) => {
                    const active = preferredFit === fit;
                    return (
                      <button
                        key={fit}
                        type="button"
                        onClick={() => setPreferredFit(fit)}
                        className={`py-2.5 px-4 rounded-lg border text-sm capitalize transition-all duration-150 ${
                          active
                            ? 'bg-[#252525] text-white border-[#252525]'
                            : 'bg-white text-[#252525] border-[#E8DFD3] hover:border-[#A99B8C]'
                        }`}
                      >
                        {fit}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#252525]">
                <Palette className="w-5 h-5 text-[#A99B8C]" />
                <h2 className="font-serif text-2xl font-normal">Colour Profile</h2>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-[#252525]">Skin Complexion</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COMPLEXIONS.map((c) => {
                    const active = skinComplexion === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSkinComplexion(c.id)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-150 ${
                          active
                            ? 'border-[#252525] bg-[#F8F6F2] shadow-sm'
                            : 'border-[#E8DFD3] hover:border-[#A99B8C]'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: c.swatch }}
                        />
                        <span className="text-sm font-medium text-[#252525]">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-[#252525]">Undertone</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {UNDERTONES.map((u) => {
                    const active = undertone === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setUndertone(u.id)}
                        className={`py-2.5 px-4 rounded-lg border text-sm transition-all duration-150 ${
                          active
                            ? 'bg-[#252525] text-white border-[#252525]'
                            : 'bg-white text-[#252525] border-[#E8DFD3] hover:border-[#A99B8C]'
                        }`}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-[#252525]">Metal Preference</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {METALS.map((m) => {
                    const active = metalPreference === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMetalPreference(m.id)}
                        className={`py-2.5 px-4 rounded-lg border text-sm transition-all duration-150 ${
                          active
                            ? 'bg-[#252525] text-white border-[#252525]'
                            : 'bg-white text-[#252525] border-[#E8DFD3] hover:border-[#A99B8C]'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#252525]">
                <Shirt className="w-5 h-5 text-[#A99B8C]" />
                <h2 className="font-serif text-2xl font-normal">Style Preferences</h2>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-[#252525]">
                  Select your favourite styles (choose one or more)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {STYLES.map((style) => {
                    const active = selectedStyles.includes(style.id);
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => toggleStyle(style.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all duration-150 ${
                          active
                            ? 'border-[#252525] bg-[#252525] text-white'
                            : 'border-[#E8DFD3] bg-white text-[#252525] hover:border-[#A99B8C]'
                        }`}
                      >
                        <span className="text-sm font-medium">{style.label}</span>
                        {active && <Check className="w-4 h-4 text-[#D9B7B0]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-[#252525]">Experiment Level</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {EXPERIMENT_LEVELS.map((lvl) => {
                    const active = experimentLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setExperimentLevel(lvl.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all duration-150 ${
                          active
                            ? 'border-[#252525] bg-[#F8F6F2] shadow-sm'
                            : 'border-[#E8DFD3] hover:border-[#A99B8C]'
                        }`}
                      >
                        <div className="font-medium text-sm text-[#252525]">{lvl.label}</div>
                        <div className="text-xs text-[#A99B8C] mt-0.5">{lvl.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E8DFD3]">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border-[#E8DFD3] text-[#252525]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={saving}
                className="bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 text-[#D9B7B0]" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
