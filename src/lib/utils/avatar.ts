/**
 * Avatar utility functions for generating plant-themed random avatars
 * Uses SVG generation with plant emojis and gradient backgrounds
 */

// Plant-related emojis for avatar variety
const PLANT_EMOJIS = ['🌿', '🌱', '🌾', '🍀', '🌳', '🌲', '🌵', '🌴', '💚', '🪴', '🌻', '🌺', '🌸', '🌷', '🌹', '🌼'];

/**
 * Generate a random seed string
 */
export function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a deterministic seed from user email
 * Same email always produces same seed
 */
export function generateDeterministicSeed(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Hash function to generate deterministic values from a seed
 */
function hashSeed(seed: string, offset: number = 0): number {
  let hash = offset;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get emoji from seed
 */
function getEmojiFromSeed(seed: string): string {
  const index = hashSeed(seed, 0) % PLANT_EMOJIS.length;
  return PLANT_EMOJIS[index];
}

/**
 * Get colors from seed (hue, saturation, lightness)
 */
function getColorsFromSeed(seed: string): { hue: number; saturation: number; lightness: number } {
  const hue = hashSeed(seed, 1) % 360;
  const saturation = 60 + (hashSeed(seed, 2) % 30);
  const lightness = 65 + (hashSeed(seed, 3) % 20);
  
  return { hue, saturation, lightness };
}

/**
 * Generate plant-themed SVG avatar as data URI
 * Deterministic: same seed always produces same avatar
 */
export function generatePlantAvatar(seed: string): string {
  const emoji = getEmojiFromSeed(seed);
  const { hue, saturation, lightness } = getColorsFromSeed(seed);
  
  const bgColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const accentColor = `hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness - 10}%)`;
  
  // Create SVG with emoji and gradient background
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${accentColor};stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="100" fill="url(#grad)"/>
    <text x="100" y="130" font-size="110" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  </svg>`;
  
  // Return as data URI - synchronous, no encoding needed
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Get a random plant quote
 */
export const PLANT_QUOTES = [
  "Every day is a good day to plant something new! 🌱",
  "Growing at your own pace is perfectly fine. 🌿",
  "You're helping the world bloom! 🌸",
  "Remember to water yourself, not just your plants. 💚",
  "Small plants, big dreams! 🌾",
  "Your growth journey is unique and beautiful. 🌳",
  "Photosynthesizing positive energy! ✨🌱",
  "Plant a seed, grow an idea! 💭🌿",
  "Spreading green, growing dreams! 🌍",
  "Every leaf tells a story of resilience. 🍃",
  "Thriving in your own garden of life! 🌺",
  "Just keep growing, you've got this! 🌻",
  "Putting down roots and reaching for the sky! 🌳",
  "Your spirit is as beautiful as a blooming flower! 🌹",
  "Growing together, one day at a time! 🤝🌱",
];

/**
 * Get a random plant quote
 */
export function getRandomPlantQuote(): string {
  return PLANT_QUOTES[Math.floor(Math.random() * PLANT_QUOTES.length)];
}

/**
 * Get a deterministic plant quote for a seed
 */
export function getPlantQuoteFromSeed(seed: string): string {
  const index = hashSeed(seed, 10) % PLANT_QUOTES.length;
  return PLANT_QUOTES[index];
}
