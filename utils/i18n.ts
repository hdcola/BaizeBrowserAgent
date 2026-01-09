import { browser } from "wxt/browser";
import { translations } from "./translations";
import { useAgent } from "@/components/AgentContext";

export type I18nKey = keyof typeof translations.en;

/**
 * Get a localized message (static ver, falls back to browser.i18n or EN).
 */
export function t(key: I18nKey, substitutions?: string | string[]): string {
  // Try browser i18n first for manifest/system consistency
  try {
    return browser.i18n.getMessage(key, substitutions);
  } catch (e) {
    return translations.en[key] || key;
  }
}

/**
 * Hook for reactive translations based on AgentContext language setting.
 */
export function useTranslation() {
  const { settings } = useAgent();
  const lang = settings.language || "en";

  const t = (key: I18nKey) => {
    const dict = translations[lang] || translations.en;
    return dict[key] || key;
  };

  return { t, lang };
}
