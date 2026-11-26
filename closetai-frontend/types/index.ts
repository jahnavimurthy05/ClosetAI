// =====================
// Core User Types
// =====================

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  location_city: string | null;
  location_lat: number | null;
  location_lon: number | null;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface BodyProfile {
  id: string;
  user_id: string;
  height_cm: number | null;
  shoulder_cm: number | null;
  bust_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  preferred_fit: 'fitted' | 'relaxed' | 'oversized' | 'tailored' | null;
  body_shape:
    | 'hourglass'
    | 'pear'
    | 'apple'
    | 'rectangle'
    | 'inverted_triangle'
    | 'other'
    | null;
  created_at: string;
  updated_at: string;
}

export interface ColourProfile {
  id: string;
  user_id: string;
  skin_complexion:
    | 'fair'
    | 'light'
    | 'medium'
    | 'tan'
    | 'deep'
    | 'prefer_not_to_say'
    | null;
  undertone: 'warm' | 'cool' | 'neutral' | 'not_sure' | null;
  favourite_colours: string[];
  avoided_colours: string[];
  metal_preference: 'gold' | 'silver' | 'rose_gold' | 'mixed' | null;
  created_at: string;
  updated_at: string;
}

export type StyleTag =
  | 'minimalist'
  | 'casual'
  | 'elegant'
  | 'smart_casual'
  | 'formal'
  | 'streetwear'
  | 'chic'
  | 'traditional_ethnic'
  | 'feminine'
  | 'contemporary'
  | 'vintage'
  | 'sporty';

export interface StylePreferences {
  id: string;
  user_id: string;
  styles: StyleTag[];
  experiment_level: 'classic' | 'moderate' | 'bold';
  created_at: string;
  updated_at: string;
}

// =====================
// Wardrobe Types
// =====================

export type WardrobeCategory =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'footwear'
  | 'accessories'
  | 'outerwear'
  | 'activewear'
  | 'bags'
  | 'other';

export type FormalityLevel =
  | 'very_casual'
  | 'casual'
  | 'smart_casual'
  | 'semi_formal'
  | 'formal'
  | 'black_tie';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all';

export interface WardrobeItem {
  id: string;
  user_id: string;
  original_image_url: string;
  processed_image_url: string | null;
  thumbnail_url: string | null;
  category: WardrobeCategory;
  subcategory: string | null;
  name: string | null;
  primary_colour: string | null;
  secondary_colours: string[];
  colour_hex: string | null;
  pattern: string | null;
  fabric_appearance: string | null;
  style_tags: StyleTag[];
  formality: FormalityLevel | null;
  seasons: Season[];
  occasions: string[];
  description: string | null;
  brand: string | null;
  is_favourite: boolean;
  is_available: boolean;
  wear_count: number;
  last_worn_at: string | null;
  date_added: string;
  ai_confidence: number | null;
  ai_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =====================
// Outfit Types
// =====================

export interface Outfit {
  id: string;
  user_id: string;
  name: string | null;
  occasion: string | null;
  season: Season | null;
  score: number | null;
  explanation: Record<string, unknown>;
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
  items?: OutfitItem[];
}

export interface OutfitItem {
  id: string;
  outfit_id: string;
  wardrobe_item_id: string;
  role: string | null;
  position_order: number;
  wardrobe_item?: WardrobeItem;
}

// =====================
// Calendar Types
// =====================

export interface OutfitCalendarEntry {
  id: string;
  user_id: string;
  outfit_id: string | null;
  date: string; // ISO date string YYYY-MM-DD
  occasion: string | null;
  event_name: string | null;
  weather_snapshot: WeatherData | null;
  status: 'planned' | 'worn' | 'skipped';
  notes: string | null;
  created_at: string;
  outfit?: Outfit;
}

export interface OutfitHistory {
  id: string;
  user_id: string;
  outfit_id: string | null;
  worn_at: string;
  occasion: string | null;
  rating: 1 | 2 | 3 | 4 | 5 | null;
  notes: string | null;
  outfit?: Outfit;
}

// =====================
// Feedback Types
// =====================

export interface UserFeedback {
  id: string;
  user_id: string;
  outfit_id: string | null;
  feedback_type: 'like' | 'dislike' | 'love' | 'skip' | 'report';
  context: Record<string, unknown>;
  created_at: string;
}

// =====================
// AI & Weather Types
// =====================

export interface WeatherData {
  temperature_c: number;
  feels_like_c: number;
  condition: string;
  description: string;
  humidity: number;
  wind_speed_kmh: number;
  icon: string;
  city: string;
  date: string;
}

export interface RecommendationRequest {
  user_id: string;
  date: string;
  occasion?: string;
  weather?: WeatherData;
  override_preferences?: Partial<StylePreferences>;
  exclude_item_ids?: string[];
}

export interface RecommendationResponse {
  outfits: Outfit[];
  reasoning: string;
  weather_considered: boolean;
  processing_time_ms: number;
}

export interface AIProcessingResult {
  success: boolean;
  category: WardrobeCategory;
  subcategory: string;
  primary_colour: string;
  secondary_colours: string[];
  colour_hex: string;
  pattern: string;
  fabric_appearance: string;
  style_tags: StyleTag[];
  formality: FormalityLevel;
  seasons: Season[];
  occasions: string[];
  description: string;
  confidence: number;
  metadata: Record<string, unknown>;
  error?: string;
}

// =====================
// API Response Types
// =====================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// =====================
// Analytics Types
// =====================

export interface WardrobeStats {
  total_items: number;
  total_outfits: number;
  favourite_items: number;
  most_worn_category: string;
  items_by_category: Record<string, number>;
  average_wear_count: number;
  items_never_worn: number;
  recent_additions: number; // last 30 days
}

// =====================
// Chat Types
// =====================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
}
