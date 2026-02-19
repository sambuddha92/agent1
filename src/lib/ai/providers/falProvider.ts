/**
 * fal.ai Provider
 *
 * Handles fal.ai models (Flux, Kling, AnimateDiff)
 */

import type { Provider } from './providerBase';
import type { ImageRequest, ImageResponse, VideoRequest, VideoResponse } from './providerBase';

export class FalProvider implements Provider {
  readonly id = 'fal';
  readonly name = 'fal.ai';
  readonly supportedModels = [
    'flux-pro',
    'flux-dev',
    'flux-schnell',
    'kling-video',
    'animatediff',
  ];

  supportsModel(modelId: string): boolean {
    return this.supportedModels.includes(modelId);
  }

  supportsCapability(capability: 'text' | 'image' | 'video'): boolean {
    return capability === 'image' || capability === 'video';
  }

  async executeImage(request: ImageRequest): Promise<ImageResponse> {
    console.log(`[fal-provider] Executing image request with model: ${request.modelId}`);
    
    return {
      id: `fal-img-${Date.now()}`,
      model: request.modelId,
      images: [],
    };
  }

  async executeVideo(request: VideoRequest): Promise<VideoResponse> {
    console.log(`[fal-provider] Executing video request with model: ${request.modelId}`);
    
    return {
      id: `fal-video-${Date.now()}`,
      model: request.modelId,
      videoUrl: '',
    };
  }
}

export const falProvider = new FalProvider();
