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
    name: "scroll_page",
    description: "Scroll the page up or down to see more content.",
    parameters: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["up", "down"],
          description: "The direction to scroll.",
        },
      },
      required: ["direction"],
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

    if (call.name === "scroll_page") {
      try {
        const args =
          typeof call.args === "string" ? JSON.parse(call.args) : call.args;
        await browser.tabs.sendMessage(activeTab.id, {
          type: "SCROLL_PAGE",
          payload: { direction: args.direction },
        } as MessagePayload);
        return "Scrolled page successfully.";
      } catch (e: any) {
        return `Error scrolling page: ${e.message}`;
      }
    }

    return "Error: Tool not found.";
  }
}
