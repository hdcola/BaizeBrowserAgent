import type { LLMConfig, Message } from "../llm/types";

export interface AppSettings {
  language: "zh_CN" | "en";
  theme: "light" | "dark" | "system";
  activeModelId?: string;
  quickPrompts?: string[]; // Defined in PRD but missed in first pass, adding for completeness
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
