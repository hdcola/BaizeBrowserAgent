import { describe, it, expect, vi } from "vitest";
import { t } from "@/utils/i18n";
import { browser } from "wxt/browser";

// Mock wxt/browser is already handled by alias in vitest.config.ts
// pointing to tests/unit/mocks/wxt-browser.ts

describe("i18n Utility", () => {
  it("should call browser.i18n.getMessage", () => {
    const spy = vi.spyOn(browser.i18n, "getMessage");
    const result = t("extensionName");

    expect(spy).toHaveBeenCalledWith("extensionName", undefined);
    expect(result).toBe("[extensionName]"); // Consistent with our mock
  });
});
