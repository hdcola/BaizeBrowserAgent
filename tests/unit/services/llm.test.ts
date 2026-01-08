import { describe, it, expect, vi } from "vitest";
import { LLMService } from "@/services/llm/index";
import { OpenAIProvider } from "@/services/llm/providers/openai";
import { GeminiProvider } from "@/services/llm/providers/gemini";

// Mock providers to avoid actual network calls
vi.mock("@/services/llm/providers/openai");
vi.mock("@/services/llm/providers/gemini");

describe("LLMService", () => {
  it("should create OpenAI provider when configured", () => {
    const service = new LLMService({
      provider: "openai",
      apiKey: "test-key",
      modelName: "gpt-4",
    });
    expect(service).toBeDefined();
    expect(OpenAIProvider).toHaveBeenCalled();
  });

  it("should create Gemini provider when configured", () => {
    new LLMService({
      provider: "gemini",
      apiKey: "test-key",
      modelName: "gemini-pro",
    });
    expect(GeminiProvider).toHaveBeenCalled();
  });

  it("should create OpenAI provider for local (Ollama) config", () => {
    new LLMService({
      provider: "openai", // User sets this to openai for protocol
      baseUrl: "http://localhost:11434/v1", // Custom URL
      modelName: "llama3",
    });
    expect(OpenAIProvider).toHaveBeenCalled();
  });

  it("should throw error for unsupported provider", () => {
    expect(() => {
      new LLMService({
        provider: "claude" as any, // Testing invalid type
        modelName: "claude-3",
      });
    }).toThrow("Unsupported provider");
  });
});
