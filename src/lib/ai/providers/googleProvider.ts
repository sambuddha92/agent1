/**
 * Google Provider
 *
 * Handles Google AI models (Gemini series)
 */

import type { Provider } from './providerBase';
import type { TextRequest, TextResponse, ImageRequest, ImageResponse } from './providerBase';

export class GoogleProvider implements Provider {
  readonly id = 'google';
  readonly name = 'Google AI';
  readonly supportedModels = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-pro',
  ];

  supportsModel(modelId: string): boolean {
    return this.supportedModels.includes(modelId);
  }

  supportsCapability(capability: 'text' | 'image' | 'video'): boolean {
    return capability === 'text' || capability === 'image';
  }

  async executeText(request: TextRequest): Promise<TextResponse> {
    // Implementation would use @ai-sdk/google
    // For now, return a placeholder - actual implementation would integrate with Google AI
    console.log(`[google-provider] Executing text request with model: ${request.modelId}`);
    
    return {
      id: `google-${Date.now()}`,
      model: request.modelId,
      content: '',
      finishReason: 'stop',
    };
  }

  async executeImage(request: ImageRequest): Promise<ImageResponse> {
    // Google AI (Gemini) can analyze images but doesn't generate them
    console.log(`[google-provider] Image request received: ${request.modelId}`);
    
    return {
      id: `google-img-${Date.now()}`,
      model: request.modelId,
      images: [],
    };
  }
}

export const googleProvider = new GoogleProvider();
