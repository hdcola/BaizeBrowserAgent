export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("[Baize] Content script loaded.");

    browser.runtime.onMessage.addListener(
      (message: any, sender, sendResponse) => {
        console.log("[Baize] Received message:", message);

        if (message.type === "GET_PAGE_CONTENT") {
          try {
            // Dynamic import Turndown to avoid global scope pollution if possible,
            // or just standard bundle. WXT handles imports.
            const TurndownService = require("turndown");
            // Note: 'require' might not work in ESM content script depending on WXT config.
            // Let's use standard import if top-level, but inside main() we need dynamic or move import up.
            // Since WXT bundles, we should import top level.
          } catch (e) {
            // Fallback or move import up
          }

          // Return true to indicate async response if needed (not needed if we await?)
          // Standard chrome.runtime.onMessage requires returning true for async sendResponse.
          // WXT wraps this? Let's use standard pattern.
          (async () => {
            const { default: TurndownService } = await import("turndown");
            const turndownService = new TurndownService();
            const markdown = turndownService.turndown(document.body);
            sendResponse({
              content: markdown,
              title: document.title,
              url: window.location.href,
            });
          })();
          return true;
        }

        if (message.type === "CLICK_ELEMENT") {
          const { selector } = message.payload || {};
          try {
            const element = document.querySelector(selector) as HTMLElement;
            if (element) {
              element.click();
              sendResponse({ success: true });
            } else {
              sendResponse({
                success: false,
                error: `Element not found: ${selector}`,
              });
            }
          } catch (e: any) {
            sendResponse({
              success: false,
              error: `Invalid selector or error: ${e.message}`,
            });
          }
          return false;
        }
      }
    );
  },
});
