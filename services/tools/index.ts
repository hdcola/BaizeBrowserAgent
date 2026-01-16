import { Tool, ToolCall } from "@/services/llm/types";
import { browser } from "wxt/browser";
import type { MessagePayload, GetPageContentResponse } from "@/utils/messaging";

export const BrowserTools: Tool[] = [
  {
    name: "get_page_content",
    description:
      "Read the content of the current active tab as markdown. Use this to understand the page context.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "click_element",
    description: "Click an element on the page using a CSS selector.",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description:
            "The CSS selector of the element to click. Must be a valid standard CSS selector (no :has-text or xpath).",
        },
      },
      required: ["selector"],
    },
  },
];

export class ToolsService {
  static async executeTool(call: ToolCall): Promise<string> {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTab = tabs[0];

    if (!activeTab?.id) {
      return "Error: No active tab found.";
    }

    if (call.name === "get_page_content") {
      try {
        const response = await browser.tabs.sendMessage(activeTab.id, {
          type: "GET_PAGE_CONTENT",
        } as MessagePayload);

        const data = response as GetPageContentResponse;
        return `Page Title: ${data.title}\nURL: ${
          data.url
        }\n\nContent:\n${data.content.slice(0, 15000)}`; // Limit context
      } catch (e: any) {
        return `Error reading page content: ${e.message}. Is the content script loaded?`;
      }
    }

    if (call.name === "click_element") {
      try {
        const args =
          typeof call.args === "string" ? JSON.parse(call.args) : call.args;
        const res = await browser.tabs.sendMessage(activeTab.id, {
          type: "CLICK_ELEMENT",
          payload: { selector: args.selector },
        } as MessagePayload);

        const response = res as { success: boolean; error?: string };
        if (response.success) {
          return "Clicked element successfully.";
        } else {
          return `Error clicking element: ${response.error}`;
        }
      } catch (e: any) {
        return `Error clicking element: ${e.message}`;
      }
    }

    return "Error: Tool not found.";
  }
}
