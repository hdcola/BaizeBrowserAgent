export default defineBackground(() => {
  // Chrome/Edge: Open side panel on action click
  // @ts-ignore: setPanelBehavior might be missing in some type definitions
  if (browser.sidePanel?.setPanelBehavior) {
    browser.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error: unknown) =>
        console.error("Failed to set panel behavior:", error)
      );
  }

  // Firefox: Open sidebar on action click (if supported)
  // Only triggered if no popup is defined (which is true for non-Safari builds)
  browser.action.onClicked.addListener((tab) => {
    // @ts-ignore: sidebarAction is Firefox specific
    const firefoxBrowser = browser as any;
    if (firefoxBrowser.sidebarAction?.open) {
      firefoxBrowser.sidebarAction.open();
    }
  });
});
