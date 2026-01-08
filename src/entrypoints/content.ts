import { browser } from "wxt/browser";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("Baize Agent Content Script Loaded");

    browser.runtime.onMessage.addListener(
      (
        request: any,
        _sender: any, // Browser namespace uses different types, keep simple
        sendResponse: (response?: any) => void
      ) => {
        if (request.action === "get_page_content") {
          // specific formatting to reduce tokens maybe?
          // For now simple innerText
          const content = document.body.innerText.slice(0, 50000); // Limit size
          sendResponse({ content });
        } else if (request.action === "click_link") {
          const { target } = request;
          console.log("Attempting to click:", target);

          // Try to find by selector first if it looks like one
          let element: HTMLElement | null = null;
          try {
            element = document.querySelector(target);
          } catch (e) {
            // ignore invalid selector
          }

          // specific strategy: find link by text
          if (!element) {
            const links = Array.from(
              document.querySelectorAll('a, button, [role="button"]')
            );
            element = links.find((el) =>
              (el as HTMLElement).innerText
                .toLowerCase()
                .includes(target.toLowerCase())
            ) as HTMLElement;
          }

          if (element) {
            element.click();
            // Also try to focus
            element.focus();
            sendResponse({
              success: true,
              message: `Clicked element matching "${target}"`,
            });
          } else {
            sendResponse({
              success: false,
              message: `Could not find element matching "${target}"`,
            });
          }
        }
        return true; // async response
      }
    );
  },
});
