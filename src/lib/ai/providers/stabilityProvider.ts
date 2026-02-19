/**
 * Stability AI Provider
 *
 * Handles Stability AI models (SVD, etc.)
 */

import type { Provider } from './providerBase';
import type { VideoRequest, VideoResponse } from './providerBase';

export class StabilityProvider implements Provider {
  readonly id = 'stability';
  readonly name = 'Stability AI';
  readonly supportedModels = [
    'stable-video-diffusion',
  ];

  supportsModel(modelId: string): boolean {
    return this.supportedModels.includes(modelId);
  }

  supportsCapability(capability: 'text' | 'image' | 'video'): boolean {
    return capability === 'video';
  }

  async executeVideo(request: VideoRequest): Promise<VideoResponse> {
    console.log(`[stability-provider] Executing video request with model: ${request.modelId}`);
    
    return {
      id: `stability-video-${Date.now()}`,
      model: request.modelId,
      videoUrl: '',
    };
  }
}

export const stabilityProvider = new StabilityProvider();
