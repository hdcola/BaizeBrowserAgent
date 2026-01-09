import React, { useState, useEffect } from "react";
import { useAgent } from "../AgentContext";
import { useTranslation } from "@/utils/i18n";
import type { ModelConfig } from "@/services/storage/types";
import modelPresets from "@/assets/config/model_presets.json";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { providerConfig, actions, settings } = useAgent();
  const { t } = useTranslation(); // Use dynamic t

  // State for the single active form
  const [formData, setFormData] = useState<Partial<ModelConfig>>({});
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    modelPresets[0].id
  );
  const [isInitialized, setIsInitialized] = useState(false);
  // State for visibility of API Key
  const [showApiKey, setShowApiKey] = useState(false);

  // Initialize form with the active model or default
  useEffect(() => {
    if (isInitialized) return;
    if (providerConfig && !isInitialized) {
      setFormData({ ...providerConfig });

      // Try to match current config to a preset
      const matchedPreset = modelPresets.find(
        (p) =>
          p.provider === providerConfig.provider &&
          (p.defaultModel === providerConfig.modelName ||
            providerConfig.modelName)
      );
      // Fallback or exact match logic could be improved, but this is a good start
      // Actually, matching by ID (if we stored preset ID) would be better.
      // Since we don't store preset ID in ModelConfig, we just infer or default to first.
      if (matchedPreset) {
        setSelectedPresetId(matchedPreset.id);
      } else {
        // If custom or unknown, maybe default to first or keep empty?
        // Let's default to the first preset if we can't match, or just "custom" logic if we had it.
        // For now, let's just pick the first one's ID as the UI state if nothing matches,
        // but keep form data as is.
        const defaultPreset = modelPresets[0];
        setSelectedPresetId(defaultPreset.id);
      }
      setIsInitialized(true);
    }
  }, [providerConfig, isInitialized]);

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = modelPresets.find((p) => p.id === presetId);
    if (!preset) return;

    // overwrite form data with preset defaults
    setFormData((prev) => ({
      ...prev,
      provider: preset.provider as any, // Cast to ModelProvider
      modelName: preset.defaultModel,
      baseUrl: preset.defaultBaseUrl,
      // Don't overwrite API Key if the user already typed one, unless switching providers?
      // Usually safer to clear or keep. Let's keep it for now.
    }));
  };

  const handleSave = async () => {
    if (!formData.provider || !formData.modelName) return;

    // Construct new config (preserving ID if we want, or generating new?
    // Actually ID is less relevant for single config, but let's keep one valid ID)
    const newConfig: ModelConfig = {
      id: providerConfig?.id || crypto.randomUUID(),
      name: formData.name || "AI Provider", // Default name
      provider: formData.provider,
      modelName: formData.modelName,
      baseUrl: formData.baseUrl,
      apiKey: formData.apiKey || "",
    };

    await actions.updateProviderConfig(newConfig);
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold">{t("settings_title")}</h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {t("cancel_button")} {/* Acts as Back */}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Language Setting */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
            {t("settings_language_label")}
          </label>
          <select
            value={settings.language}
            onChange={(e) =>
              actions.updateSettings({ language: e.target.value as any })
            }
            className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="en">English</option>
            <option value="zh_CN">简体中文</option>
          </select>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        {/* AI Configuration */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t("settings_provider_title")}
          </h3>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("settings_preset_label")}
            </label>
            <div className="relative">
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                {modelPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t("settings_preset_help")}
            </p>
          </div>
          {/* FIELDS ORDER: Base URL -> API Key -> Model Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("settings_base_url_label")}
            </label>
            <input
              value={formData.baseUrl || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))
              }
              className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={t("settings_base_url_placeholder")}
            />
            <p className="text-xs text-gray-400">
              {t("settings_base_url_help")}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("settings_api_key_label")}
            </label>
            <div className="relative">
              <input
                value={formData.apiKey || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                className="w-full p-2.5 pr-10 rounded-lg bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                type={showApiKey ? "text" : "password"}
                placeholder={t("settings_api_key_placeholder")}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showApiKey ? (
                  // Eye Slash Icon (Hide)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  // Eye Icon (Show)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("settings_model_name_label")}
            </label>
            <input
              value={formData.modelName || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, modelName: e.target.value }))
              }
              className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={t("settings_model_name_placeholder")}
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={!formData.modelName}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("save_button")}
            </button>
            {/* Only show explicit cancel if we have an active model to go back to */}
          </div>
        </div>
      </div>
    </div>
  );
}
