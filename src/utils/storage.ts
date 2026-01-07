export interface Settings {
  geminiBaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  language: "en" | "zh";
}

export const DEFAULT_SETTINGS: Settings = {
  geminiBaseUrl: "http://127.0.0.1:8317",
  geminiApiKey: "your-api-key-1",
  geminiModel: "gemini-3-flash-preview",
  language: "en", // Will be overridden by initialization logic
};

export const getSettings = async (): Promise<Settings> => {
  const result = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  return { ...DEFAULT_SETTINGS, ...result };
};

export const saveSettings = async (
  settings: Partial<Settings>
): Promise<void> => {
  await chrome.storage.local.set(settings);
};

export const initSettings = async (): Promise<Settings> => {
  const current = await getSettings();
  if (!current.language) {
    const uiLang = chrome.i18n.getUILanguage();
    current.language = uiLang.startsWith("zh") ? "zh" : "en";
    await saveSettings({ language: current.language });
  }
  return current;
};
