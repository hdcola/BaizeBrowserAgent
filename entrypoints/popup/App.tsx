import { useState } from "react";
import "@/assets/styles/main.css";
import { t } from "@/utils/i18n";
import { browser } from "wxt/browser";

function App() {
  const openSidepanel = async () => {
    // Open sidepanel for the current window
    // Note: This requires a user gesture, which the button click provides.
    const windowId = (await browser.windows.getCurrent()).id;
    if (windowId) {
      await browser.sidePanel.open({ windowId });
      window.close(); // Close popup after opening sidepanel
    }
  };

  return (
    <div className="w-[300px] p-6 flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-2 gradient-text">Baize Agent</h1>
      <p className="text-sm text-center text-gray-500 mb-6">
        Your AI Pair Programmer in the Browser
      </p>

      <button
        onClick={openSidepanel}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span>💬</span> {t("openSidepanel") || "Open Chat Sidepanel"}
      </button>

      <div className="mt-4 text-xs text-gray-400">Click to start chatting</div>
    </div>
  );
}

export default App;
