import enMessages from "@/assets/locales/en/messages.json";
import zhCNMessages from "@/assets/locales/zh_CN/messages.json";

// Type definition for Chrome i18n message format
type MessageFile = Record<string, { message: string; description?: string }>;

/**
 * Helper to convert Chrome i18n format { key: { message: "msg" } }
 * into simple key-value format { key: "msg" }
 */
function convertMessages<T extends MessageFile>(
  messages: T
): { [K in keyof T]: string } {
  return Object.fromEntries(
    Object.entries(messages).map(([key, value]) => [key, value.message])
  ) as { [K in keyof T]: string };
}

export const translations = {
  en: convertMessages(enMessages),
  zh_CN: convertMessages(zhCNMessages),
};
