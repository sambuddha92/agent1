// ============================================
// fal.ai Image Generation Integration
// ============================================

import { fal } from '@fal-ai/client';

interface GenerateImageResult {
  imageUrl: string;
  seed: number;
}

/**
 * Generate an image using fal.ai Flux Pro
 * Used for Dream Balcony renders and Bloom Map sketches
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
    const result = (await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt,
        image_url: imageUrl,
        num_images: 1,
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 3.5,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    })) as { data: { images: Array<{ url: string }>; seed: number } };

    return {
      imageUrl: result.data.images[0].url,
      seed: result.data.seed,
    };
  } else {
    // text2img — Bloom Map stylized sketch
    const result = (await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt,
        num_images: 1,
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 3.5,
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
 */
export async function generateBloomSketch(
  plantSpecies: string[],
  containerTypes: string[],
  arrangementPattern: string
): Promise<GenerateImageResult> {
  const prompt = `Architectural watercolor sketch of a balcony garden featuring ${plantSpecies.join(', ')} in ${containerTypes.join(', ')}, ${arrangementPattern}, warm afternoon light, artistic illustration style, non-photorealistic, gentle color palette, hand-drawn feel`;

  return generateImage(prompt);
}
