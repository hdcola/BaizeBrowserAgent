export type LLMProviderType = "openai" | "gemini";

export interface LLMConfig {
  provider: LLMProviderType;
  apiKey?: string;
  baseUrl?: string;
  modelName: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
}

export interface ToolCall {
  id: string;
  name: string;
  args: any;
}

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string; // tool name
}

export interface LLMRequest {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Tool[];
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMResponseChunk {
  content: string; // Delta content
  toolCalls?: ToolCall[]; // Delta or complete tool calls depending on provider
  done: boolean;
}

export interface LLMProvider {
  chat(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncGenerator<LLMResponseChunk>;
}
