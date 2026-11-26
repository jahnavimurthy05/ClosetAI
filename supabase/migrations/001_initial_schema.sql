CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  location_city TEXT,
  location_lat NUMERIC(9,6),
  location_lon NUMERIC(9,6),
  onboarding_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.body_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  height_cm NUMERIC(5,1), shoulder_cm NUMERIC(5,1), bust_cm NUMERIC(5,1),
  waist_cm NUMERIC(5,1), hip_cm NUMERIC(5,1),
  preferred_fit TEXT, body_shape TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.colour_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  skin_complexion TEXT, undertone TEXT,
  favourite_colours JSONB DEFAULT '[]', avoided_colours JSONB DEFAULT '[]',
  metal_preference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.style_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  styles JSONB DEFAULT '[]', experiment_level TEXT DEFAULT 'moderate',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  original_image_url TEXT NOT NULL, processed_image_url TEXT, thumbnail_url TEXT,
  category TEXT NOT NULL, subcategory TEXT, name TEXT,
  primary_colour TEXT, secondary_colours JSONB DEFAULT '[]', colour_hex TEXT,
  pattern TEXT, fabric_appearance TEXT, style_tags JSONB DEFAULT '[]',
  formality TEXT, seasons JSONB DEFAULT '["all"]', occasions JSONB DEFAULT '[]',
  description TEXT, brand TEXT,
  is_favourite BOOLEAN DEFAULT FALSE, is_available BOOLEAN DEFAULT TRUE,
  wear_count INTEGER DEFAULT 0, last_worn_at TIMESTAMPTZ,
  date_added TIMESTAMPTZ DEFAULT NOW(), ai_confidence NUMERIC(3,2),
  ai_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT, occasion TEXT, season TEXT, score NUMERIC(4,2),
  explanation JSONB DEFAULT '{}', is_favourite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.outfit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE,
  wardrobe_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  role TEXT, position_order INTEGER DEFAULT 0
);

CREATE TABLE public.outfit_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE SET NULL,
  date DATE NOT NULL, occasion TEXT, event_name TEXT,
  weather_snapshot JSONB, status TEXT DEFAULT 'planned', notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE public.outfit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE SET NULL,
  worn_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occasion TEXT, rating INTEGER CHECK (rating BETWEEN 1 AND 5), notes TEXT
);

CREATE TABLE public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE SET NULL,
  feedback_type TEXT, context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wardrobe_items_user ON public.wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_items_category ON public.wardrobe_items(user_id, category);
CREATE INDEX idx_outfit_calendar_user_date ON public.outfit_calendar(user_id, date);
CREATE INDEX idx_outfit_history_user ON public.outfit_history(user_id, worn_at DESC);
CREATE INDEX idx_outfits_user ON public.outfits(user_id);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colour_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON public.user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_body" ON public.body_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_colour" ON public.colour_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_style" ON public.style_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_wardrobe" ON public.wardrobe_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_outfits" ON public.outfits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_outfit_items" ON public.outfit_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.outfits o WHERE o.id = outfit_id AND o.user_id = auth.uid())
);
CREATE POLICY "own_calendar" ON public.outfit_calendar FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_history" ON public.outfit_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_feedback" ON public.user_feedback FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
