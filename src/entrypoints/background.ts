import { browser } from "wxt/browser";

export default defineBackground(() => {
  // Enable the side panel to open when the action icon is clicked
  // Only available in Chrome-based browsers with sidePanel permission
  if (import.meta.env.CHROME && browser.sidePanel) {
    browser.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));
  }
});
