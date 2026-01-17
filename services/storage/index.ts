import type { AppSettings, ModelConfig, ChatSession } from "./types";
import { browser } from "wxt/browser";

const SETTINGS_KEY = "local:settings";
// MODELS_KEY removed
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

const PROVIDER_CONFIG_KEY = "local:provider_config";

export const defaultSettings: AppSettings = {
  language: "en",
  theme: "system",
  maxSteps: 30, // Default max steps
};

export const defaultProviderConfig: ModelConfig = {
  id: "default-openai",
  name: "OpenAI GPT-4o",
  provider: "openai",
  modelName: "gpt-4o",
  apiKey: "", // User must fill
  baseUrl: "https://api.openai.com/v1",
};

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

  // --- Provider Config ---
  static async getProviderConfig(): Promise<ModelConfig> {
    const config = await storage.getItem<ModelConfig>(PROVIDER_CONFIG_KEY);
    return config || defaultProviderConfig;
  }

  static async saveProviderConfig(config: ModelConfig): Promise<void> {
    await storage.setItem(PROVIDER_CONFIG_KEY, config);
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
