import { test, expect } from "./fixtures";

test("chat flow", async ({ page, extensionId }) => {
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  // 1. Open Sidepanel
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // 2. Initial State: Chat Interface should load with defaults
  // We expect "Start a conversation..." from Thread empty state
  // Wait a bit for React hydration and storage load
  await page.waitForTimeout(1000);

  // NOTE: If storage takes too long or defaults fail, this might flake.
  // But our StorageService uses browser.storage.local mock or real.
  // In real ext, it persists.
  // Fresh install -> defaults loaded.
  // Wait for header
  await expect(page.locator("h1")).toHaveText(/Chat|对话/);

  // Check if loading
  const loading = await page.getByText("Loading Agent...").isVisible();
  if (loading) {
    console.log("Still loading...");
    await page.waitForTimeout(2000);
  }

  await expect(page.getByText("Start a conversation...")).toBeVisible({
    timeout: 10000,
  });

  // 3. Go to Settings (Gear icon)
  // Our ChatInterface uses a button with "⚙️".
  await page.click('button:has-text("⚙️")');
  await expect(page.getByText("Settings")).toBeVisible();

  // 4. Check Language Switch
  await page.selectOption("select", "en");

  // 5. Back to Chat (Cancel button acts as back)
  await page.click("text=Cancel");

  // 6. Verify Back in Chat
  await expect(page.getByText("Start a conversation...")).toBeVisible();
});
