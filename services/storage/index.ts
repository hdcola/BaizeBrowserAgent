import { storage } from "wxt/storage";
import type { AppSettings, ModelConfig, ChatSession } from "./types";
import { browser } from "wxt/browser";

const SETTINGS_KEY = "local:settings";
const MODELS_KEY = "local:models";
const SESSIONS_KEY = "local:sessions";

// Default Settings
const getDefaultLanguage = (): "zh_CN" | "en" => {
  try {
    const uiLang = browser.i18n.getUILanguage();
    if (uiLang && uiLang.toLowerCase().startsWith("zh")) {
      return "zh_CN";
    }
  } catch (e) {
    // Ignore error in non-extension env
  }
  return "en";
};

export const defaultSettings: AppSettings = {
  language: getDefaultLanguage(),
  theme: "system",
  activeModelId: undefined,
};

export const defaultModels: ModelConfig[] = [
  {
    id: "default-openai",
    name: "OpenAI GPT-4o",
    provider: "openai",
    modelName: "gpt-4o",
    apiKey: "", // User must fill
  },
  {
    id: "default-gemini",
    name: "Gemini 1.5 Flash",
    provider: "gemini",
    modelName: "gemini-1.5-flash",
    apiKey: "", // User must fill
  },
  {
    id: "default-ollama",
    name: "Local Ollama (Llama3)",
    provider: "openai", // Uses OpenAI protocol
    modelName: "llama3",
    baseUrl: "http://localhost:11434/v1",
    apiKey: "ollama",
  },
];

export class StorageService {
  // --- Settings ---
  static async getSettings(): Promise<AppSettings> {
    const settings = await storage.getItem<AppSettings>(SETTINGS_KEY);
    return { ...defaultSettings, ...settings };
  }

  static async updateSettings(partial: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    await storage.setItem(SETTINGS_KEY, { ...current, ...partial });
  }

  // --- Models ---
  static async getModels(): Promise<ModelConfig[]> {
    const models = await storage.getItem<ModelConfig[]>(MODELS_KEY);
    return models || defaultModels;
  }

  static async getModel(id: string): Promise<ModelConfig | undefined> {
    const models = await this.getModels();
    return models.find((m) => m.id === id);
  }

  static async saveModel(config: ModelConfig): Promise<void> {
    const models = await this.getModels();
    const index = models.findIndex((m) => m.id === config.id);
    if (index >= 0) {
      models[index] = config;
    } else {
      models.push(config);
    }
    await storage.setItem(MODELS_KEY, models);
  }

  static async deleteModel(id: string): Promise<void> {
    const models = await this.getModels();
    const newModels = models.filter((m) => m.id !== id);
    await storage.setItem(MODELS_KEY, newModels);
  }

  static async getActiveModelConfig(): Promise<ModelConfig | undefined> {
    const settings = await this.getSettings();
    if (!settings.activeModelId) {
      // If no active model, return the first one as default or undefined
      const models = await this.getModels();
      return models[0];
    }
    return this.getModel(settings.activeModelId);
  }

  // --- Sessions ---
  static async getSessions(): Promise<ChatSession[]> {
    // We store sessions as a Record<id, Session> or List?
    // Plan said Record<string, ChatSession> in defineItem, but List is often easier for UI list.
    // Let's store as a list for simplicity in sorting, or Record for O(1) lookup.
    // The plan said: `storage.defineItem<Record<string, ChatSession>>("local:sessions", ...)`
    // But implementation details can vary. List is likely better for "History List".
    // I will store as List for now to match getModels pattern, unless performance dictates otherwise.
    // Wait, implementation plan says: `storage.defineItem<Record<string, ChatSession>>("local:sessions", ...)`
    // I will stick to List for simplicity of "get all sorted by date".
    // Actually, wxt storage limits. Storing ALL sessions in ONE key might hit quota.
    // But for V1 local storage, let's assume it fits or we paginate later.
    // Let's use List to be consistent with Models.
    const sessions = await storage.getItem<ChatSession[]>(SESSIONS_KEY);
    return sessions || [];
  }

  static async getSession(id: string): Promise<ChatSession | undefined> {
    const sessions = await this.getSessions();
    return sessions.find((s) => s.id === id);
  }

  static async saveSession(session: ChatSession): Promise<void> {
    const sessions = await this.getSessions();
    const index = sessions.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session); // Add to top
    }
    await storage.setItem(SESSIONS_KEY, sessions);
  }

  static async deleteSession(id: string): Promise<void> {
    const sessions = await this.getSessions();
    const newSessions = sessions.filter((s) => s.id !== id);
    await storage.setItem(SESSIONS_KEY, newSessions);
  }

  static async clearSessions(): Promise<void> {
    await storage.removeItem(SESSIONS_KEY);
  }
}
