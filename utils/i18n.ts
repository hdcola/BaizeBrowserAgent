import { browser } from "wxt/browser";

/**
 * Helper to retrieve localized meaningful descriptions from the _locales directory.
 * @param messageName The name of the message, as specified in the messages.json file.
 * @param substitutions Optional. A single string or an array of strings to be substituted into the message.
 * @returns The localized string.
 */
export function i18n(
  messageName: string,
  substitutions?: string | string[]
): string {
  return browser.i18n.getMessage(messageName as any, substitutions);
}
