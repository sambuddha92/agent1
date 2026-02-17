/**
 * Application-wide constants for FloatGreens
 * 
 * Centralizes magic strings, configuration values, and app constants
 * to improve maintainability and reduce duplication.
 */

// ============================================
// Route Paths
// ============================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CHAT: '/chat',
  GARDEN: '/garden',
  DREAM: '/dream',
  BLOOM: '/bloom',
} as const;

export const PROTECTED_ROUTES = [
  ROUTES.CHAT,
  ROUTES.GARDEN,
  ROUTES.DREAM,
  ROUTES.BLOOM,
] as const;

export const AUTH_ROUTES = [ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD] as const;

// ============================================
// API Endpoints
// ============================================

export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  WEATHER_CHECK: '/api/cron/weather-check',
} as const;

// ============================================
// Validation Rules
// ============================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MAX_MESSAGE_LENGTH: 10000,
  MAX_HEALTH_SCORE: 100,
  MIN_HEALTH_SCORE: 0,
} as const;

// ============================================
// UI Text & Labels
// ============================================

export const UI_TEXT = {
  APP_NAME: 'FloatGreens',
  APP_TAGLINE: 'Your AI Plant Companion',
  APP_DESCRIPTION: 'Expert plant care guidance powered by AI. Get personalized recommendations to help your garden thrive.',
  
  // Auth
  SIGN_IN: 'Sign In',
  SIGN_UP: 'Create Account',
  SIGN_OUT: 'Sign Out',
  
  // Loading states
  LOADING: 'Loading...',
  SIGNING_IN: 'Signing in...',
  CREATING_ACCOUNT: 'Creating account...',
  SENDING: 'Sending...',
  
  // Errors
  AUTH_ERROR: 'Authentication failed',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  
  // Success messages
  SIGN_UP_SUCCESS: 'Account created successfully!',
  SIGN_IN_SUCCESS: 'Welcome back!',
} as const;

// ============================================
// Weather Configuration
// ============================================

export const WEATHER_CONFIG = {
  DEFAULT_FORECAST_DAYS: 3,
  MAX_FORECAST_DAYS: 5,
  CRON_INTERVAL_HOURS: 6,
  
  // Alert thresholds (DO NOT MODIFY - affects proactive notifications)
  FROST_THRESHOLD_CELSIUS: 2,
  HEATWAVE_THRESHOLD_CELSIUS: 35,
  HEAVY_RAIN_THRESHOLD_MM: 20,
  HIGH_HUMIDITY_THRESHOLD: 80,
  HUMID_TEMP_THRESHOLD: 25,
  HIGH_WIND_THRESHOLD_KMH: 40,
} as const;

// ============================================
// AI Model Configuration
// ============================================

export const MODEL_CONFIG = {
  // Model IDs - DO NOT MODIFY (cost-critical)
  T1_MODEL: 'amazon.nova-micro-v1:0',
  T2_MODEL: 'amazon.nova-lite-v1:0',
  T3_MODEL: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  T4_MODEL: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  T5_MODEL: 'us.anthropic.claude-3-opus-20240229-v1:0',
  
  // Classification thresholds - DO NOT MODIFY (cost optimization)
  SHORT_MESSAGE_LENGTH: 30,
  MEDIUM_MESSAGE_LENGTH: 200,
  LONG_MESSAGE_LENGTH: 300,
  VERY_LONG_MESSAGE_LENGTH: 500,
  MULTI_QUESTION_THRESHOLD: 3,
  LONG_CONVERSATION_THRESHOLD: 8,
} as const;

// ============================================
// Image Generation Configuration
// ============================================

export const IMAGE_CONFIG = {
  FAL_MODEL: 'fal-ai/flux-pro/v1.1',
  DEFAULT_IMAGE_SIZE: 'landscape_16_9',
  DEFAULT_INFERENCE_STEPS: 28,
  DEFAULT_GUIDANCE_SCALE: 3.5,
  NUM_IMAGES: 1,
} as const;

// ============================================
// Email Configuration
// ============================================

export const EMAIL_CONFIG = {
  FROM_ADDRESS: 'FloatGreens 🌿 <notifications@floatgreens.app>',
  WEATHER_ALERT_SUBJECT: '☁️ Heads Up! Weather Drama Incoming for Your Plants',
} as const;

// ============================================
// Database Configuration
// ============================================

export const DB_CONFIG = {
  DEFAULT_BALCONY_NAME: 'My Balcony',
  DEFAULT_TIMEZONE: 'UTC',
  DEFAULT_PLANT_STATUS: 'active',
} as const;

// ============================================
// UI Configuration
// ============================================

export const UI_CONFIG = {
  CHAT_MAX_WIDTH: '80%',
  CHAT_SM_MAX_WIDTH: '70%',
  DEFAULT_ANIMATION_DURATION: 250,
  SCROLL_BEHAVIOR: 'smooth',
  DEBOUNCE_DELAY_MS: 300,
} as const;

// ============================================
// Feature Flags (Placeholder for future use)
// ============================================

export const FEATURE_FLAGS = {
  ENABLE_DREAM_RENDERS: false,
  ENABLE_BLOOM_MAP: false,
  ENABLE_PLANT_LEDGER: false,
  ENABLE_SWAP_AGENT: false,
  ENABLE_WEATHER_ALERTS: true,
} as const;

// ============================================
// Type Helpers
// ============================================

export type Route = typeof ROUTES[keyof typeof ROUTES];
export type ProtectedRoute = typeof PROTECTED_ROUTES[number];
export type AuthRoute = typeof AUTH_ROUTES[number];
