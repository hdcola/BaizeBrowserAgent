import { useState, useEffect } from "react";
import { Chat } from "./Chat";
import { Settings } from "./Settings";
import { initSettings } from "../../utils/storage";
import { useTranslation } from "../../utils/i18n";
import { Settings as SettingsIcon } from "lucide-react";
import "./Sidepanel.css";

function App() {
  const { t } = useTranslation();
  const [view, setView] = useState<"chat" | "settings">("chat");

  useEffect(() => {
    initSettings().then((settings) => {
      if (!settings.geminiApiKey) {
        setView("settings");
      }
    });
  }, []);

  return (
    <div className="app-container">
      <header>
        <h1>{t("appName")}</h1>
        {view === "chat" && (
          <button className="icon-btn" onClick={() => setView("settings")}>
            <SettingsIcon size={20} />
          </button>
        )}
      </header>

      {view === "chat" ? <Chat /> : <Settings onBack={() => setView("chat")} />}
    </div>
  );
}

export default App;
