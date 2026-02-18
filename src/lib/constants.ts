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
  GARDEN: '/my-garden',
} as const;

export const PROTECTED_ROUTES = [
  ROUTES.CHAT,
  ROUTES.GARDEN,
] as const;

export const AUTH_ROUTES = [ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD] as const;

// ============================================
// API Endpoints
// ============================================

export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  CONVERSATIONS: '/api/conversations',
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
// UI Text & Labels - Refined & Concise
// ============================================

export const UI_TEXT = {
  APP_NAME: 'FloatGreens',
  APP_TAGLINE: 'AI plant care assistant',
  APP_DESCRIPTION: 'AI plant care assistant. Learns your space, keeps plants thriving.',
  
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
  NETWORK_ERROR: 'Check your connection and try again.',
  
  // Success messages
  SIGN_UP_SUCCESS: 'Account created successfully!',
  SIGN_IN_SUCCESS: 'Welcome back!',
  
  // Landing Page
  LANDING_HERO_SUBTITLE: 'AI plant care assistant. Learns your space, keeps plants thriving.',
  LANDING_CTA_PRIMARY: 'Get Started',
  LANDING_CTA_SECONDARY: 'Sign In',
  LANDING_SETUP_PROMISE: 'Setup in minutes. Expert care guidance daily.',
  
  // Chat Page
  CHAT_INPUT_PLACEHOLDER: 'Ask about your plants...',
  CHAT_EMPTY_STATE_TITLE: 'Ask about your plants',
  CHAT_EMPTY_STATE_SUBTITLE: 'Upload photos for instant analysis',
  CHAT_POWERED_BY: 'AI-powered',
  
  // My Garden Page
  GARDEN_EMPTY_STATE_TITLE: 'Your garden gallery is empty',
  GARDEN_EMPTY_STATE_SUBTITLE: 'Upload plant photos to build your collection',
  GARDEN_UPLOAD_CTA: 'Upload Photo',
  
  // Navigation
  NAV_CHAT: 'Chat',
  NAV_GARDEN: 'My Garden',
  NAV_NEW_CHAT: 'New Chat',
  
  // Auth Pages
  AUTH_EMAIL_LABEL: 'Email',
  AUTH_PASSWORD_LABEL: 'Password',
  AUTH_EMAIL_PLACEHOLDER: 'your.email@example.com',
  AUTH_PASSWORD_PLACEHOLDER: 'Enter your password',
  AUTH_PASSWORD_HINT: 'Minimum 6 characters',
  AUTH_FORGOT_PASSWORD: 'Forgot password?',
  AUTH_RESET_PASSWORD: 'Reset Password',
  AUTH_LOGIN_TITLE: 'Sign in to continue',
  AUTH_SIGNUP_TITLE: 'Create your account',
  AUTH_ALREADY_HAVE_ACCOUNT: 'Already have an account?',
  AUTH_NEED_ACCOUNT: 'Need an account?',
  
  // Common Actions
  ACTION_SAVE: 'Save',
  ACTION_CANCEL: 'Cancel', 
  ACTION_DELETE: 'Delete',
  ACTION_CONFIRM: 'Confirm',
  ACTION_CLOSE: 'Close',
  ACTION_RETRY: 'Try Again',
  ACTION_UPLOAD: 'Upload',
  ACTION_SEND: 'Send',
  
  // Status Messages
  STATUS_ONLINE: 'Online',
  STATUS_OFFLINE: 'Offline', 
  STATUS_TYPING: 'Typing...',
  STATUS_PROCESSING: 'Processing...',
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
// AI Model Configuration (3-Tier System)
// ============================================

export const MODEL_CONFIG = {
  // Primary Models - Optimized for cost & UX
  T1_MODEL: 'amazon.nova-pro-v1:0',              // Simple tasks, greetings, Q&A
  T2_MODEL: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',  // Medium complexity, detailed guidance
  T3_MODEL: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', // Complex tasks, planning, design
  
  // Fallback Models - Always available (cost-effective)
  T1_FALLBACK: 'amazon.nova-lite-v1:0',
  T2_FALLBACK: 'amazon.nova-pro-v1:0',
  T3_FALLBACK: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  T3_FALLBACK_SECONDARY: 'amazon.nova-pro-v1:0',
  
  // Classification thresholds
  SHORT_MESSAGE_LENGTH: 30,
  MEDIUM_MESSAGE_LENGTH: 150,
  LONG_MESSAGE_LENGTH: 300,
  MULTI_QUESTION_THRESHOLD: 2,
  LONG_CONVERSATION_THRESHOLD: 6,
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
