import type {
  LLMConfig,
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMResponseChunk,
} from "./types";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";

export class LLMService {
  private provider: LLMProvider;

  constructor(config: LLMConfig) {
    this.provider = this.createProvider(config);
  }

  private createProvider(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case "openai":
        return new OpenAIProvider(config);
      case "gemini":
        return new GeminiProvider(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      return await this.provider.chat(request);
    } catch (error) {
      console.error("LLM Request Failed:", error);
      throw error;
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMResponseChunk> {
    try {
      // Use the stream method of the underlying provider
      const generator = this.provider.stream(request);
      for await (const chunk of generator) {
        yield chunk;
      }
    } catch (error) {
      console.error("LLM Stream Failed:", error);
      throw error;
    }
  }

  updateConfig(config: LLMConfig) {
    this.provider = this.createProvider(config);
  }
}
