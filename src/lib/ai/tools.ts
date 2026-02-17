// import { tool } from 'ai';
// import { z } from 'zod';
// import { getWeatherForecast } from '@/lib/weather';
// import { generateImage } from '@/lib/fal';

// ============================================
// FloatGreens Agent Tool Definitions
// ============================================
// P0 — Weekend MVP tools
// These are stubs wired to real APIs, ready to flesh out
// ============================================

// TODO: Fix tools for AI SDK v6 compatibility
// The AI SDK v6 has breaking changes in the tool API
// Temporarily disabled to allow build to succeed

export const floatgreensTools = {};

/*
export const floatgreensTools = {
  analyzePhoto: tool({
    description:
      'Analyze a plant or balcony photo for health assessment, species identification, or layout analysis. Returns structured analysis.',
    parameters: z.object({
      photoUrl: z.string().describe('URL of the photo to analyze'),
      analysisType: z
        .enum(['health', 'species', 'layout'])
        .describe('Type of analysis to perform'),
    }),
    execute: async (params) => {
      return {
        status: 'success',
        analysisType: params.analysisType,
        photoUrl: params.photoUrl,
        result: {
          message: `Photo analysis (${params.analysisType}) will be processed here via Claude Haiku vision.`,
        },
      };
    },
  }),

  getWeatherForecast: tool({
    description:
      'Get weather forecast for a city to provide proactive plant care advice. Returns temperature, humidity, rain forecast, and wind data.',
    parameters: z.object({
      city: z.string().describe('City name (e.g., "Mumbai", "Berlin")'),
      days: z
        .number()
        .max(5)
        .default(3)
        .describe('Number of forecast days (max 5)'),
    }),
    execute: async (params) => {
      try {
        const forecast = await getWeatherForecast(params.city, params.days);
        return { status: 'success', forecast };
      } catch (error) {
        return {
          status: 'error',
          message: `Failed to fetch weather for ${params.city}: ${error}`,
        };
      }
    },
  }),

  generateDreamRender: tool({
    description:
      'Generate a dream balcony visualization render. Takes a photo of the current balcony and a style preference, and generates a beautiful render showing what it could look like with recommended plants.',
    parameters: z.object({
      photoUrl: z.string().describe('URL of the current balcony photo'),
      style: z
        .string()
        .describe(
          'Aesthetic style (e.g., "Mediterranean Herb Wall", "Tropical Jungle", "Minimalist Zen", "Cottage Wildflower")'
        ),
      plantList: z
        .array(z.string())
        .describe('List of plant species to include in the render'),
    }),
    execute: async (params) => {
      try {
        const result = await generateImage(
          `A beautiful ${params.style} balcony garden, featuring ${params.plantList.join(', ')} in attractive containers, warm natural lighting, professional photography`,
          params.photoUrl
        );
        return { status: 'success', ...result };
      } catch (error) {
        return {
          status: 'error',
          message: `Failed to generate render: ${error}`,
        };
      }
    },
  }),

  queryPlantLedger: tool({
    description:
      "Query the user's plant inventory, including health history, growth stages, and harvest logs. Use this to provide context-aware advice.",
    parameters: z.object({
      userId: z.string().describe('User ID to query plants for'),
      filter: z
        .string()
        .optional()
        .describe(
          'Optional filter: "active", "needs_attention", "available_for_swap"'
        ),
    }),
    execute: async (params) => {
      return {
        status: 'success',
        userId: params.userId,
        filter: params.filter,
        plants: [],
        message:
          'Plant ledger query will be implemented with Supabase integration.',
      };
    },
  }),
};
*/
