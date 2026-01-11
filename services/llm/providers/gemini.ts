import { GoogleGenAI, Type } from "@google/genai";
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
    this.ai = new GoogleGenAI({
      apiKey: config.apiKey,
      httpOptions: config.baseUrl ? { baseUrl: config.baseUrl } : undefined,
    });
    this.modelName = config.modelName;
  }

  private mapMessages(messages: Message[]): {
    role: string;
    parts: { text?: string; functionCall?: any; functionResponse?: any }[];
  }[] {
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
            const { id, name, args, ...rest } = tc as any;
            // The API expects thought_signature and other metadata to be on the Part object.
            // We spread ...rest (containing thought_signature) onto the Part object itself.
            parts.push({
              functionCall: {
                name: name,
                args: typeof args === "string" ? JSON.parse(args) : args,
              },
              ...rest,
            });
          });
        }

        if (m.role === "tool") {
          parts.push({
            functionResponse: {
              name: m.name,
              response: { content: m.content },
            },
          });
        }

        return { role, parts };
      });
  }

  private mapTools(tools?: any[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;

    // Format tools to match the expected structure
    return [
      {
        functionDeclarations: tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters || { type: Type.OBJECT, properties: {} },
        })),
      },
    ];
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

    // Handle candidates safely
    const candidates = response.candidates?.[0];
    const part = candidates?.content?.parts?.[0];
    const text = part?.text;

    // Parse function calls from response
    // For non-streaming, we also need to capture part metadata, but user issue was streaming.
    // We'll apply similar logic here for consistency.
    const functionCalls = candidates?.content?.parts
      ?.filter((p: any) => p.functionCall)
      ?.map((p: any) => {
        const { functionCall, ...partRest } = p;
        return {
          id: "call_" + Math.random().toString(36).substr(2, 9),
          name: functionCall.name,
          args: functionCall.args,
          ...partRest,
        };
      });

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
      // Use the logic from the user's snippet to handle text/functionCalls
      // Safely access properties as per user recommendation
      const chunkAny = chunk as any;
      const calls = chunkAny.functionCalls; // SDK helper, might strip metadata
      let text = "";

      // Handle text extraction
      if (typeof chunkAny.text === "string") {
        text = chunkAny.text;
      } else if (typeof chunkAny.text === "function") {
        const t = chunkAny.text();
        if (t) text = t;
      }

      // Collect tool calls
      let functionCalls: any[] = [];

      // If calls were found only in SDK helper, we try to use it but we might miss metadata.
      // Ideally we SHOULD LOOK AT PARTS directly.

      if (chunk.candidates?.[0]?.content?.parts) {
        const parts = chunk.candidates[0].content.parts;
        const callsFromParts = parts
          .filter((p: any) => p.functionCall)
          .map((p: any) => {
            const { name, args } = p.functionCall;
            // Capture everything else from the PART (like thought_signature)
            // We exclude functionCall itself to avoid nesting
            const { functionCall, ...partRest } = p;

            return {
              id: "call_" + Math.random().toString(36).substr(2, 9),
              name: name,
              args: typeof args === "object" ? JSON.stringify(args) : args,
              ...partRest, // Capture thought_signature from Part
            };
          });

        if (callsFromParts.length > 0) {
          functionCalls = callsFromParts;
        } else if (calls && Array.isArray(calls)) {
          // Fallback to helper if parts didn't work (unlikely)
          functionCalls = calls.map((call: any) => {
            const { name, args, ...rest } = call;
            return {
              id: call.id || "call_" + Math.random().toString(36).substr(2, 9),
              name: name,
              args: typeof args === "object" ? JSON.stringify(args) : args,
              ...rest,
            };
          });
        }
      } else if (calls && Array.isArray(calls)) {
        // Fallback if no parts structure found
        functionCalls = calls.map((call: any) => {
          const { name, args, ...rest } = call;
          return {
            id: call.id || "call_" + Math.random().toString(36).substr(2, 9),
            name: name,
            args: typeof args === "object" ? JSON.stringify(args) : args,
            ...rest,
          };
        });
      }

      yield {
        content: text || "",
        toolCalls: functionCalls.length > 0 ? functionCalls : undefined,
        done: false,
      };
    }
    yield { content: "", done: true };
  }
}
