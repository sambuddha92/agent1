/**
 * Cloudflare Workers AI Provider
 *
 * Handles Cloudflare edge models
 */

import type { Provider } from './providerBase';
import type { TextRequest, TextResponse } from './providerBase';

export class CloudflareProvider implements Provider {
  readonly id = 'cloudflare';
  readonly name = 'Cloudflare Workers AI';
  readonly supportedModels = [
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-3-8b-instruct',
  ];

  supportsModel(modelId: string): boolean {
    return this.supportedModels.includes(modelId);
  }

  supportsCapability(capability: 'text' | 'image' | 'video'): boolean {
    return capability === 'text';
  }

  async executeText(request: TextRequest): Promise<TextResponse> {
    console.log(`[cloudflare-provider] Executing text request with model: ${request.modelId}`);
    
    return {
      id: `cloudflare-${Date.now()}`,
      model: request.modelId,
      content: '',
      finishReason: 'stop',
    };
  }
}

export const cloudflareProvider = new CloudflareProvider();
