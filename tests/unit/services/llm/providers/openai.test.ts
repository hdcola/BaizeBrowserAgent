import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIProvider } from "@/services/llm/providers/openai";
import OpenAI from "openai";

// Mock OpenAI SDK
vi.mock("openai", () => {
  const OpenAI = vi.fn();
  OpenAI.prototype.chat = {
    completions: {
      create: vi.fn(),
    },
  };
  return { default: OpenAI };
});

describe("OpenAIProvider", () => {
  let provider: OpenAIProvider;
  let mockCreate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider({
      provider: "openai",
      apiKey: "test-key",
      modelName: "gpt-4",
    });
    // Get the mocked create function
    mockCreate = (new OpenAI({ apiKey: "test" }) as any).chat.completions
      .create;
  });

  it("should initialize with correct config", () => {
    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: "test-key",
      baseURL: undefined,
      dangerouslyAllowBrowser: true,
    });
  });

  it("should handle chat request correctly", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "Hello world",
            tool_calls: null,
          },
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    });

    const response = await provider.chat({
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "Hi" }],
      })
    );
    expect(response.content).toBe("Hello world");
    expect(response.usage).toEqual({
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    });
  });

  it("should map tool calls in chat response", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: {
                  name: "get_weather",
                  arguments: '{"city":"Tokyo"}',
                },
              },
            ],
          },
        },
      ],
    });

    const response = await provider.chat({
      messages: [{ role: "user", content: "Check weather" }],
      tools: [
        {
          name: "get_weather",
          description: "Get weather",
          parameters: { type: "object" },
        },
      ],
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: expect.any(Array),
      })
    );
    expect(response.toolCalls).toHaveLength(1);
    expect(response.toolCalls![0]).toEqual({
      id: "call_123",
      name: "get_weather",
      args: { city: "Tokyo" },
    });
  });

  it("should handle streaming chunks", async () => {
    // Create an async generator for the mock return
    async function* mockStream() {
      yield { choices: [{ delta: { content: "Hello" } }] };
      yield { choices: [{ delta: { content: " World" } }] };
    }

    mockCreate.mockResolvedValueOnce(mockStream());

    const stream = provider.stream({
      messages: [{ role: "user", content: "Hi" }],
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        stream: true,
      })
    );

    // There are 3 chunks: "Hello", " World", and the final empty done chunk
    expect(chunks).toHaveLength(3);
    expect(chunks[0].content).toBe("Hello");
    expect(chunks[1].content).toBe(" World");
    expect(chunks[2].done).toBe(true);
  });
});
