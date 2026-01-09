import { test, expect } from "./fixtures";

test("Settings: save and persist configuration", async ({
  page,
  extensionId,
}) => {
  // 1. Open Sidepanel
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // Wait for load - initially it might be loading
  // We expect the Chat title (h1) to appear
  await expect(page.locator("h1")).toHaveText(/Chat|对话/);

  // 2. Open Settings
  await page.getByTitle("Settings").click();
  await expect(page.getByText(/Settings|设置/)).toBeVisible();

  // 3. Configure form to English first (to make selectors predictable)
  // The first select is Language.
  const langSelect = page.locator("select").nth(0);
  await langSelect.selectOption("en");

  // Verify labels are in English now
  await expect(page.getByText("Provider Preset")).toBeVisible();

  // 4. Edit Settings
  // Select OpenAI Preset
  // The second select is Provider Preset
  const presetSelect = page.locator("select").nth(1);
  await presetSelect.selectOption("openai");

  // Fill API Key
  // It's the only password input
  const apiKeyInput = page.locator('input[type="password"]');
  await apiKeyInput.fill("sk-test-key-12345");

  // Fill Model Name
  // We can use the placeholder which is "e.g. gpt-4o" in English
  const modelInput = page.locator('input[placeholder="e.g. gpt-4o"]');
  await modelInput.fill("gpt-4-test-custom");

  // 5. Save
  await page.click("text=Save");

  // 6. Verify returned to chat (Settings hidden)
  await expect(page.getByText("Settings")).not.toBeVisible();
  await expect(page.locator("h1")).toHaveText("Chat");

  // 7. Reload and Verify Persistence
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Chat");

  // Open Settings again
  await page.getByTitle("Settings").click();

  // Check values
  // Need to ensure we are still in English or check values?
  // Storage persists settings, including language, so it should be English.

  await expect(page.locator('input[type="password"]')).toHaveValue(
    "sk-test-key-12345"
  );
  await expect(page.locator('input[placeholder="e.g. gpt-4o"]')).toHaveValue(
    "gpt-4-test-custom"
  );
});
