import { GoogleGenAI } from "@google/genai";
import type {
  LLMConfig,
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMResponseChunk,
  Message,
} from "../types";

export class GeminiProvider implements LLMProvider {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(config: LLMConfig) {
    if (!config.apiKey) {
      throw new Error("API Key is required for Gemini Provider");
    }
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.modelName = config.modelName;
  }

  private mapMessages(messages: Message[]): {
    role: string;
    parts: { text?: string; functionCall?: any; functionResponse?: any }[];
  }[] {
    const systemMessage = messages.find((m) => m.role === "system");
    // System message is handled via config, so filter it out here
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        const role = m.role === "assistant" ? "model" : "user";
        const parts: any[] = [];

        if (m.content) {
          parts.push({ text: m.content });
        }

        if (m.toolCalls) {
          m.toolCalls.forEach((tc) => {
            parts.push({
              functionCall: {
                name: tc.name, // Gemini expects 'name', 'args'
                args: tc.args,
              },
            });
          });
        }

        if (m.role === "tool") {
          // Tool response
          parts.push({
            functionResponse: {
              name: m.name,
              response: { content: m.content }, // content is usually the result string/json
            },
          });
        }

        return { role, parts };
      });
  }

  private mapTools(tools?: any[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((t) => ({
      functionDeclarations: [
        {
          name: t.name,
          description: t.description,
          parameters: t.parameters, // JSON Schema
        },
      ],
    }));
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const systemMessage = request.messages.find((m) => m.role === "system");
    const contents = this.mapMessages(request.messages);
    const tools = this.mapTools(request.tools);

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: contents,
      config: {
        systemInstruction: systemMessage ? systemMessage.content : undefined,
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
        tools: tools,
      },
    });

    // Handle tool calls in response
    const candidates = response.candidates?.[0];
    const part = candidates?.content?.parts?.[0];
    const text = part?.text;
    const functionCalls = candidates?.content?.parts
      ?.filter((p: any) => p.functionCall)
      ?.map((p: any) => ({
        id: "call_" + Math.random().toString(36).substr(2, 9), // Gemini v1 doesn't have call IDs same way as OpenAI
        name: p.functionCall.name,
        args: p.functionCall.args,
      }));

    return {
      content: text || "",
      toolCalls: functionCalls,
    };
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMResponseChunk> {
    const systemMessage = request.messages.find((m) => m.role === "system");
    const contents = this.mapMessages(request.messages);
    const tools = this.mapTools(request.tools);

    const result = await this.ai.models.generateContentStream({
      model: this.modelName,
      contents: contents,
      config: {
        systemInstruction: systemMessage ? systemMessage.content : undefined,
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
        tools: tools,
      },
    });

    for await (const chunk of result) {
      const text = chunk.text;
      const candidates = chunk.candidates?.[0]; // Restore candidates

      // Gemini streaming tool calls:
      const functionCalls = candidates?.content?.parts
        ?.filter((p: any) => p.functionCall)
        ?.map((p: any) => ({
          id: "call_" + Math.random().toString(36).substr(2, 9),
          name: p.functionCall.name,
          args: p.functionCall.args,
        }));

      yield {
        content: text || "",
        toolCalls: functionCalls, // Gemini usually sends complete function calls in stream chunks (at end)
        done: false,
      };
    }
    yield { content: "", done: true };
  }
}
