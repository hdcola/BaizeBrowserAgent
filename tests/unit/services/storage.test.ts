import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  StorageService,
  defaultSettings,
  defaultModels,
} from "@/services/storage/index";

// Mock wxt/storage
const mockStorage = new Map<string, any>();
vi.mock("wxt/storage", () => ({
  storage: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage.get(key))),
    setItem: vi.fn((key: string, value: any) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      mockStorage.delete(key);
      return Promise.resolve();
    }),
  },
}));

// Mock wxt/browser
vi.mock("wxt/browser", () => ({
  browser: {
    i18n: {
      getUILanguage: vi.fn(() => "en-US"),
    },
  },
}));

describe("StorageService", () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  describe("Settings", () => {
    it("should return default settings if empty", async () => {
      const settings = await StorageService.getSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it("should update settings", async () => {
      await StorageService.updateSettings({ theme: "dark" });
      const settings = await StorageService.getSettings();
      expect(settings.theme).toBe("dark");
      expect(settings.language).toBe(defaultSettings.language); // preserved
    });
  });

  describe("Models", () => {
    it("should return default models if empty", async () => {
      const models = await StorageService.getModels();
      expect(models).toEqual(defaultModels);
    });

    it("should CRUD models", async () => {
      const newModel: any = {
        id: "new-model",
        name: "Test Model",
        provider: "openai",
        modelName: "test",
      };

      // Create
      await StorageService.saveModel(newModel);
      let models = await StorageService.getModels();
      expect(models).toContainEqual(newModel);

      // Read
      const fetched = await StorageService.getModel("new-model");
      expect(fetched).toEqual(newModel);

      // Update
      const updated = { ...newModel, name: "Updated Name" };
      await StorageService.saveModel(updated);
      const fetchedUpdated = await StorageService.getModel("new-model");
      expect(fetchedUpdated?.name).toBe("Updated Name");

      // Delete
      await StorageService.deleteModel("new-model");
      models = await StorageService.getModels();
      expect(models.find((m) => m.id === "new-model")).toBeUndefined();
    });
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
