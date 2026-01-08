import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiProvider } from "@/services/llm/providers/gemini";
import { GoogleGenAI } from "@google/genai";

// Mock @google/genai SDK
vi.mock("@google/genai", () => {
  const GoogleGenAI = vi.fn();
  GoogleGenAI.prototype.models = {
    generateContent: vi.fn(),
    generateContentStream: vi.fn(),
  };
  return { GoogleGenAI };
});

describe("GeminiProvider", () => {
  let provider: GeminiProvider;
  let mockModels: any;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider({
      provider: "gemini",
      apiKey: "test-key",
      modelName: "gemini-pro",
    });
    // Get the mocked models object
    mockModels = (new GoogleGenAI({ apiKey: "test" }) as any).models;
  });

  it("should initialize with correct config", () => {
    expect(GoogleGenAI).toHaveBeenCalledWith({
      apiKey: "test-key",
    });
  });

  it("should handle chat request correctly", async () => {
    mockModels.generateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [{ text: "Hello Gemini" }],
          },
        },
      ],
      text: "Hello Gemini", // Helper usually available on response
    });

    const response = await provider.chat({
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(mockModels.generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-pro",
      })
    );
    expect(response.content).toBe("Hello Gemini");
  });

  it("should handle streaming chunks", async () => {
    // Create an async generator for the mock return
    // Iterating directly over result as implemented in provider
    async function* mockStreamIterator() {
      yield {
        text: "Hello",
        candidates: [{ content: { parts: [{ text: "Hello" }] } }],
      };
      yield {
        text: " World",
        candidates: [{ content: { parts: [{ text: " World" }] } }],
      };
    }

    mockModels.generateContentStream.mockResolvedValueOnce(
      mockStreamIterator()
    );

    const stream = provider.stream({
      messages: [{ role: "user", content: "Hi" }],
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(mockModels.generateContentStream).toHaveBeenCalled();

    // 3 chunks: "Hello", " World", and Done
    expect(chunks).toHaveLength(3);
    expect(chunks[0].content).toBe("Hello");
    expect(chunks[1].content).toBe(" World");
    expect(chunks[2].done).toBe(true);
  });
});
