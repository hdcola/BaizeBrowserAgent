import React, { useEffect, useState } from "react";
import type { Settings as SettingsType } from "../../utils/storage";
import { getSettings, saveSettings } from "../../utils/storage";
import { useTranslation } from "../../utils/i18n";
import "./Sidepanel.css";
import { Save } from "lucide-react";

export const Settings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (settings) {
      await saveSettings(settings);
      setStatus(t("saved"));
      setTimeout(() => setStatus(""), 2000);
    }
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="settings-container fade-in">
      <div className="settings-header">
        <button className="icon-btn" onClick={onBack}>
          &larr;
        </button>
        <h2>{t("settings")}</h2>
      </div>

      <div className="form-group">
        <label>{t("baseUrl")}</label>
        <input
          type="text"
          value={settings.geminiBaseUrl}
          onChange={(e) =>
            setSettings({ ...settings, geminiBaseUrl: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>{t("apiKey")}</label>
        <input
          type="password"
          value={settings.geminiApiKey}
          onChange={(e) =>
            setSettings({ ...settings, geminiApiKey: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>{t("model")}</label>
        <input
          type="text"
          value={settings.geminiModel}
          onChange={(e) =>
            setSettings({ ...settings, geminiModel: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>{t("language")}</label>
        <select
          value={settings.language}
          onChange={(e) =>
            setSettings({
              ...settings,
              language: e.target.value as "en" | "zh",
            })
          }
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>

      <div className="actions">
        <button className="primary" onClick={handleSave}>
          <Save size={16} /> {t("save")}
        </button>
        {status && <span className="status-msg">{status}</span>}
      </div>
    </div>
  );
};
