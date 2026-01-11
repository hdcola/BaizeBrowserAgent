import type { LLMConfig, Message } from "../llm/types";

export interface AppSettings {
  language: "zh_CN" | "en";
  theme: "light" | "dark" | "system";
  // activeModelId removed - we now store a single provider config
  quickPrompts?: string[];
  maxSteps: number;
}

export interface ModelConfig extends LLMConfig {
  id: string; // UUID
  name: string; // Display name
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}
