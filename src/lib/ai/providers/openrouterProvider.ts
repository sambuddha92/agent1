/**
 * OpenRouter Provider
 *
 * Handles OpenRouter aggregation (100+ models)
 */

import type { Provider } from './providerBase';
import type { TextRequest, TextResponse } from './providerBase';

export class OpenRouterProvider implements Provider {
  readonly id = 'openrouter';
  readonly name = 'OpenRouter';
  readonly supportedModels = [
    'openai/gpt-4o-mini',
    'anthropic/claude-3-haiku',
    'google/gemini-pro-1.5',
  ];

  supportsModel(modelId: string): boolean {
    return this.supportedModels.includes(modelId);
  }

  supportsCapability(capability: 'text' | 'image' | 'video'): boolean {
    return capability === 'text';
  }

  async executeText(request: TextRequest): Promise<TextResponse> {
    console.log(`[openrouter-provider] Executing text request with model: ${request.modelId}`);
    
    return {
      id: `openrouter-${Date.now()}`,
      model: request.modelId,
      content: '',
      finishReason: 'stop',
    };
  }
}

export const openrouterProvider = new OpenRouterProvider();
