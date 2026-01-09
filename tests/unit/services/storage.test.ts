import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  StorageService,
  defaultProviderConfig,
  defaultSettings,
} from "@/services/storage";
import { ModelConfig } from "@/services/storage/types";

// Mock wxt/storage
const mockStorage = new Map<string, any>();

// Mock global storage object used by WXT auto-imports
const storage = {
  getItem: vi.fn((key: string) => Promise.resolve(mockStorage.get(key))),
  setItem: vi.fn((key: string, value: any) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: vi.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
  // Add other methods if needed
} as any;

// Assign to globalThis so the service code can access it without import
(globalThis as any).storage = storage;

// Also mock wxt/storage module just in case explicit imports are used elsewhere or types
vi.mock("wxt/storage", () => ({
  storage: storage,
}));

describe("StorageService", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  // --- Settings Tests ---
  it("should return default settings if empty", async () => {
    const settings = await StorageService.getSettings();
    expect(settings).toEqual(defaultSettings);
  });

  it("should update settings", async () => {
    await StorageService.updateSettings({ language: "zh_CN" });
    const settings = await StorageService.getSettings();
    expect(settings.language).toBe("zh_CN");
    expect(settings.theme).toBe("system"); // Preserves other defaults
  });

  // --- Provider Config Tests ---
  it("should return default provider config if empty", async () => {
    const config = await StorageService.getProviderConfig();
    expect(config).toEqual(defaultProviderConfig);
  });

  it("should save and retrieve provider config", async () => {
    const newConfig: ModelConfig = {
      id: "test-id",
      name: "Test Provider",
      provider: "openai",
      modelName: "gpt-test",
      apiKey: "sk-test",
    };

    await StorageService.saveProviderConfig(newConfig);
    const fetched = await StorageService.getProviderConfig();
    expect(fetched).toEqual(newConfig);
  });

  it("should persist changes to provider config", async () => {
    const initial = await StorageService.getProviderConfig();
    const updated = { ...initial, apiKey: "new-key" };

    await StorageService.saveProviderConfig(updated);
    const fetched = await StorageService.getProviderConfig();
    expect(fetched.apiKey).toBe("new-key");
  });

  describe("Sessions", () => {
    it("should return empty list initially", async () => {
      const sessions = await StorageService.getSessions();
      expect(sessions).toEqual([]);
    });

    it("should CRUD sessions", async () => {
      const session: any = {
        id: "sess-1",
        title: "Test Session",
        createdAt: 100,
        updatedAt: 100,
        messages: [],
      };

      // Create
      await StorageService.saveSession(session);
      const sessions = await StorageService.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toEqual(session);

      // Update (ordering: should be at top if updated/new? implementation details vary but let's check content)
      session.title = "Updated Session";
      await StorageService.saveSession(session);
      const updatedSessions = await StorageService.getSessions();
      expect(updatedSessions[0].title).toBe("Updated Session");

      // Delete
      await StorageService.deleteSession("sess-1");
      expect(await StorageService.getSessions()).toHaveLength(0);
    });
  });
});
