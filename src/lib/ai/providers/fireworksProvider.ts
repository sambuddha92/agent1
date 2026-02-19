/**
 * Fireworks AI Provider
 *
 * Handles Fireworks AI models
 */

import type { Provider } from './providerBase';
import type { TextRequest, TextResponse, ImageRequest, ImageResponse } from './providerBase';

export class FireworksProvider implements Provider {
  readonly id = 'fireworks';
  readonly name = 'Fireworks AI';
  readonly supportedModels = [
    'accounts/fireworks/models/llama-v3p3-70b-instruct',
    'accounts/fireworks/models/qwen2p5-72b-instruct',
    'accounts/fireworks/models/sdxl-lightning',
  ];

  supportsModel(modelId: string): boolean {
    return this.supportedModels.includes(modelId);
  }

  supportsCapability(capability: 'text' | 'image' | 'video'): boolean {
    return capability === 'text' || capability === 'image';
  }

  async executeText(request: TextRequest): Promise<TextResponse> {
    console.log(`[fireworks-provider] Executing text request with model: ${request.modelId}`);
    
    return {
      id: `fireworks-${Date.now()}`,
      model: request.modelId,
      content: '',
      finishReason: 'stop',
    };
  }

  async executeImage(request: ImageRequest): Promise<ImageResponse> {
    console.log(`[fireworks-provider] Executing image request with model: ${request.modelId}`);
    
    return {
      id: `fireworks-img-${Date.now()}`,
      model: request.modelId,
      images: [],
    };
  }
}

export const fireworksProvider = new FireworksProvider();
