import { browser } from "wxt/browser";
import { useState, useEffect } from "react";
import { getSettings } from "./storage";

type Language = "en" | "zh";

const translations = {
  en: {
    settings: "Settings",
    chat: "Chat",
    baseUrl: "Base URL",
    apiKey: "API Key",
    model: "Model",
    language: "Language",
    save: "Save",
    saved: "Saved!",
    send: "Send",
    placeholder: "Ask me to read the page or click links...",
    toolCall: "Tool Call",
    toolOutput: "Output",
    thinking: "Thinking...",
    error: "Error",
    clearHistory: "Clear History",
    appName: "Baize",
  },
  zh: {
    settings: "设置",
    chat: "聊天",
    baseUrl: "基础 URL",
    apiKey: "API Key",
    model: "模型",
    language: "语言",
    save: "保存",
    saved: "已保存!",
    send: "发送",
    placeholder: "让我想想或者读读网页...",
    toolCall: "工具调用",
    toolOutput: "输出",
    thinking: "思考中...",
    error: "错误",
    clearHistory: "清除历史",
    appName: "白泽",
  },
};

export const useTranslation = () => {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    getSettings().then((s) => setLang(s.language));

    const listener = (changes: any) => {
      if (changes.language) {
        setLang(changes.language.newValue as Language);
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  const t = (key: keyof (typeof translations)["en"]) => {
    return translations[lang][key] || key;
  };

  return { t, lang };
};
