/**
 * Shared TypeScript type definitions for FloatGreens
 * 
 * This file contains core type definitions used across the application.
 * Centralizing types improves maintainability and ensures consistency.
 */

// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  full_name?: string;
  postal_code_prefix?: string;
  city?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Garden & Plant Types
// ============================================

export type Orientation = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type WindExposure = 'sheltered' | 'moderate' | 'exposed';

export interface Balcony {
  id: string;
  user_id: string;
  name: string;
  orientation?: Orientation;
  dimensions_m2?: number;
  floor_level?: number;
  sun_hours_estimated?: number;
  climate_zone?: string;
  wind_exposure?: WindExposure;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type PlantStatus = 'active' | 'dormant' | 'deceased' | 'harvested';

export interface Plant {
  id: string;
  balcony_id: string;
  species: string;
  variety?: string;
  nickname?: string;
  container_size_liters?: number;
  position_description?: string;
  acquired_date?: string;
  status: PlantStatus;
  swap_available: boolean;
  created_at: string;
  updated_at: string;
}

export type GrowthStage = 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'dormant';

export interface HealthSnapshot {
  id: string;
  plant_id: string;
  photo_url?: string;
  health_score?: number;
  issues_detected?: Record<string, unknown>;
  growth_stage?: GrowthStage;
  height_cm_estimated?: number;
  ai_analysis?: string;
  created_at: string;
}

export interface HarvestLog {
  id: string;
  plant_id: string;
  harvest_date: string;
  quantity_grams?: number;
  notes?: string;
  photo_url?: string;
  created_at: string;
}

// ============================================
// Community & Bloom Map Types
// ============================================

export interface BloomMapEntry {
  id: string;
  user_id: string;
  postal_prefix: string;
  orientation?: string;
  plant_species: string[];
  container_types?: string[];
  style_tags?: string[];
  sketch_url: string;
  season?: string;
  is_public: boolean;
  created_at: string;
}

// ============================================
// Agent & Actions Types
// ============================================

export type AgentActionType = 
  | 'weather_alert' 
  | 'health_check' 
  | 'swap_match'
  | 'watering_reminder'
  | 'seasonal_planning';

export type ActionStatus = 'pending' | 'delivered' | 'acted_on' | 'dismissed';

export interface AgentAction {
  id: string;
  user_id: string;
  action_type: AgentActionType;
  payload?: Record<string, unknown>;
  status: ActionStatus;
  scheduled_for?: string;
  executed_at?: string;
  created_at: string;
}

// ============================================
// User Context Memory Types
// ============================================

export type MemoryType = 
  | 'preference'     // User preferences
  | 'constraint'     // Physical/time constraints
  | 'goal'          // User goals
  | 'observation'   // Agent observations
  | 'success'       // Successful outcomes
  | 'failure'       // Failed attempts
  | 'interaction'   // Interaction patterns
  | 'context';      // General context

export type MemorySource = 'conversation' | 'observation' | 'explicit' | 'inferred';

export interface UserContextMemory {
  id: string;
  user_id: string;
  memory_type: MemoryType;
  memory_key: string;
  memory_value: string;
  confidence: number;
  source: MemorySource;
  conversation_id?: string;
  expires_at?: string;
  created_at: string;
}

export interface UserContext {
  user: User;
  balconies: Balcony[];
  plants: Plant[];
  recentHealthSnapshots: HealthSnapshot[];
  memories: UserContextMemory[];
  summary: string;
}

// ============================================
// Weather Types
// ============================================

export type WeatherAlertType = 
  | 'FROST_WARNING' 
  | 'HEATWAVE' 
  | 'HEAVY_RAIN' 
  | 'FUNGAL_RISK' 
  | 'HIGH_WIND';

export interface ForecastDay {
  date: string;
  temp_min: number;
  temp_max: number;
  humidity: number;
  description: string;
  wind_speed: number;
  rain_mm: number;
  alerts: WeatherAlertType[];
}

export interface WeatherForecast {
  city: string;
  days: ForecastDay[];
}

// ============================================
// AI & Chat Types
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string | MessageContent[];
  modelId?: string; // Bedrock model ID (only in development)
  tier?: ModelTier; // Model tier used (only in development)
}

export interface MessageContent {
  type: 'text' | 'image';
  text?: string;
  image?: string;
  [key: string]: unknown;
}

export type ModelTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface ModelSelection {
  model: unknown; // Bedrock model instance
  tier: ModelTier;
  modelId: string;
}

// ============================================
// Image Generation Types
// ============================================

export interface GenerateImageResult {
  imageUrl: string;
  seed: number;
}

export type DreamStyle = 
  | 'Mediterranean Herb Wall'
  | 'Tropical Jungle'
  | 'Minimalist Zen'
  | 'Cottage Wildflower';

// ============================================
// API Response Types
// ============================================

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================
// Type Guards
// ============================================

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ApiError).error === 'string'
  );
}

export function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'role' in value &&
    'content' in value
  );
}

export function isValidOrientation(value: string): value is Orientation {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].includes(value);
}

export function isValidWindExposure(value: string): value is WindExposure {
  return ['sheltered', 'moderate', 'exposed'].includes(value);
}
