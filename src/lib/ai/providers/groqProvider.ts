/**
 * Groq Provider
 *
 * Handles Groq inference models (Llama, Mixtral)
 */

import type { Provider } from './providerBase';
import type { TextRequest, TextResponse } from './providerBase';

export class GroqProvider implements Provider {
  readonly id = 'groq';
  readonly name = 'Groq';
  readonly supportedModels = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'mixtral-8x22b-8192',
  ];

  supportsModel(modelId: string): boolean {
    return this.supportedModels.includes(modelId);
  }

  supportsCapability(capability: 'text' | 'image' | 'video'): boolean {
    return capability === 'text';
  }

  async executeText(request: TextRequest): Promise<TextResponse> {
    console.log(`[groq-provider] Executing text request with model: ${request.modelId}`);
    
    return {
      id: `groq-${Date.now()}`,
      model: request.modelId,
      content: '',
      finishReason: 'stop',
    };
  }
}

export const groqProvider = new GroqProvider();
