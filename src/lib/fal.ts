// ============================================
// fal.ai Image Generation Integration
// ============================================

import { fal } from '@fal-ai/client';
import { IMAGE_CONFIG } from './constants';
import type { GenerateImageResult } from '@/types';

/**
 * Generate an image using fal.ai Flux Pro
 * Used for Dream Balcony renders and Bloom Map sketches
 * 
 * @param prompt - Text prompt for image generation
 * @param imageUrl - Optional source image URL for img2img transformation
 * @returns Generated image URL and seed
 * @throws Error if FAL_KEY is not configured
 */
export async function generateImage(
  prompt: string,
  imageUrl?: string
): Promise<GenerateImageResult> {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY is not configured');
  }

  if (imageUrl) {
    // img2img — Dream Balcony render (transform existing photo)
    const result = (await fal.subscribe(IMAGE_CONFIG.FAL_MODEL, {
      input: {
        prompt,
        image_url: imageUrl,
        num_images: IMAGE_CONFIG.NUM_IMAGES,
        image_size: IMAGE_CONFIG.DEFAULT_IMAGE_SIZE,
        num_inference_steps: IMAGE_CONFIG.DEFAULT_INFERENCE_STEPS,
        guidance_scale: IMAGE_CONFIG.DEFAULT_GUIDANCE_SCALE,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    })) as { data: { images: Array<{ url: string }>; seed: number } };

    return {
      imageUrl: result.data.images[0].url,
      seed: result.data.seed,
    };
  } else {
    // text2img — Bloom Map stylized sketch
    const result = (await fal.subscribe(IMAGE_CONFIG.FAL_MODEL, {
      input: {
        prompt,
        num_images: IMAGE_CONFIG.NUM_IMAGES,
        image_size: IMAGE_CONFIG.DEFAULT_IMAGE_SIZE,
        num_inference_steps: IMAGE_CONFIG.DEFAULT_INFERENCE_STEPS,
        guidance_scale: IMAGE_CONFIG.DEFAULT_GUIDANCE_SCALE,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    })) as { data: { images: Array<{ url: string }>; seed: number } };

    return {
      imageUrl: result.data.images[0].url,
      seed: result.data.seed,
    };
  }
}

/**
 * Generate a stylized sketch for the Bloom Map
 * Uses a deliberately artistic, non-photorealistic style
 * 
 * @param plantSpecies - Array of plant species names
 * @param containerTypes - Array of container type descriptions
 * @param arrangementPattern - Description of plant arrangement
 * @returns Generated sketch URL and seed
 */
export async function generateBloomSketch(
  plantSpecies: string[],
  containerTypes: string[],
  arrangementPattern: string
): Promise<GenerateImageResult> {
  const prompt = `Architectural watercolor sketch of a balcony garden featuring ${plantSpecies.join(', ')} in ${containerTypes.join(', ')}, ${arrangementPattern}, warm afternoon light, artistic illustration style, non-photorealistic, gentle color palette, hand-drawn feel`;

  return generateImage(prompt);
}
