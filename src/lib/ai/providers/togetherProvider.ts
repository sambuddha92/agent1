/**
 * Together AI Provider
 *
 * Handles Together AI models (Llama, Mixtral, Flux)
 */

import type { Provider } from './providerBase';
import type { TextRequest, TextResponse, ImageRequest, ImageResponse, VideoRequest, VideoResponse } from './providerBase';

export class TogetherProvider implements Provider {
  readonly id = 'together';
  readonly name = 'Together AI';
  readonly supportedModels = [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    'mistralai/Mixtral-8x22B-Instruct-v0.1',
    'Qwen/Qwen2.5-72B-Instruct',
    'black-forest-labs/FLUX.1-dev',
    'black-forest-labs/FLUX.1-schnell',
    'models/iframe/VideoGeneration',
  ];

  supportsModel(modelId: string): boolean {
    return this.supportedModels.includes(modelId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  supportsCapability(_capability: 'text' | 'image' | 'video'): boolean {
    return true; // Supports all types
  }

  async executeText(request: TextRequest): Promise<TextResponse> {
    console.log(`[together-provider] Executing text request with model: ${request.modelId}`);
    
    return {
      id: `together-${Date.now()}`,
      model: request.modelId,
      content: '',
      finishReason: 'stop',
    };
  }

  async executeImage(request: ImageRequest): Promise<ImageResponse> {
    console.log(`[together-provider] Executing image request with model: ${request.modelId}`);
    
    return {
      id: `together-img-${Date.now()}`,
      model: request.modelId,
      images: [],
    };
  }

  async executeVideo(request: VideoRequest): Promise<VideoResponse> {
    console.log(`[together-provider] Executing video request with model: ${request.modelId}`);
    
    return {
      id: `together-video-${Date.now()}`,
      model: request.modelId,
      videoUrl: '',
    };
  }
}

export const togetherProvider = new TogetherProvider();
