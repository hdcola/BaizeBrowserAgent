// @ts-ignore
import { GoogleGenAI, Type } from "@google/genai";
import { getSettings } from "../utils/storage";

export type StreamUpdate =
  | { type: "text"; content: string }
  | { type: "tool_call"; name: string; args: any }
  | { type: "tool_result"; name: string; result: any }
  | { type: "error"; error: string }
  | { type: "done" };

const toolsDef = [
  {
    functionDeclarations: [
      {
        name: "get_page_content",
        description:
          "Get the text content of the visible current web page to understand what is on it.",
      },
      {
        name: "click_link",
        description:
          "Click a link, button, or interactive element on the page by matching its text content or CSS selector.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            target: {
              type: Type.STRING,
              description:
                "The visible text on the element or a CSS selector to identify the element.",
            },
          },
          required: ["target"],
        },
      },
    ],
  },
];

async function executeTool(name: string, args: any): Promise<any> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (!activeTab?.id) {
    throw new Error("No active tab found");
  }

  const sendMessage = async () => {
    return await chrome.tabs.sendMessage(activeTab.id!, {
      action: name,
      ...args,
    });
  };

  try {
    return await sendMessage();
  } catch (e: any) {
    if (e.message && e.message.includes("Receiving end does not exist")) {
      // This means the content script is NOT loaded.
      return {
        error:
          "The extension is disconnected from the page. Please REFRESH the page to allow the extension to inject only then try again.",
      };
    }
    return { error: e.message || "Failed to execute tool" };
  }
}

// We maintain history manually since we are not using ChatSession
let history: any[] = [];

export function clearHistory() {
  history = [];
}

export async function sendMessage(
  userMessage: string,
  onUpdate: (update: StreamUpdate) => void
) {
  try {
    const settings = await getSettings();
    if (!settings.geminiApiKey) {
      onUpdate({
        type: "error",
        error: "API Key not set. Please go to settings.",
      });
      return;
    }

    // Initialize client
    const ai = new GoogleGenAI({
      apiKey: settings.geminiApiKey,
      httpOptions: {
        baseUrl: settings.geminiBaseUrl,
      },
    });

    // Append user message to history
    console.log("[Baize] Adding user message to history:", userMessage);
    history.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    onUpdate({ type: "text", content: "" });

    // Loop for tool execution
    while (true) {
      console.log(
        "[Baize] Generating content with history length:",
        history.length
      );

      // Pass the ENTIRE history to generateContentStream
      const result = await ai.models.generateContentStream({
        model: settings.geminiModel,
        contents: history,
        config: {
          tools: toolsDef,
        },
      });

      let fullText = "";
      let functionCalls: any[] = [];

      console.log("[Baize] Waiting for stream...");
      for await (const chunk of result) {
        // Safe access to functionCalls property
        const calls = (chunk as any).functionCalls;

        if (calls && Array.isArray(calls) && calls.length > 0) {
          console.log("[Baize] Detected function calls:", calls);
          functionCalls.push(...calls);
          for (const call of calls) {
            onUpdate({ type: "tool_call", name: call.name, args: call.args });
          }
        } else {
          // Only access text if no function calls
          try {
            // In new SDK text is a method sometimes or property.
            // Previous error logs showed chunk.text worked when accessed as property?
            // Wait, in step 352 I changed it to property access `chunk.text`.
            // If it is a method, `chunk.text` would be the function itself and `if(text)` would be true, but appending it would append code.
            // But the user didn't complain about that.
            // However, let's be safe.
            const text = (chunk as any).text;
            if (typeof text === "string") {
              fullText += text;
              onUpdate({ type: "text", content: text });
            } else if (typeof text === "function") {
              const t = text.call(chunk);
              if (t) {
                fullText += t;
                onUpdate({ type: "text", content: t });
              }
            }
          } catch (e) {
            // Ignore
          }
        }
      }

      // Append model response to history
      // If there was text or tools, we need to add a 'model' part.
      // If there were function calls, the model message MUST contain them.

      // Construct the model message part
      const modelParts: any[] = [];
      if (fullText) {
        modelParts.push({ text: fullText });
      }

      // Add function calls to parts
      // Note: The SDK might return `functionCalls` array separately,
      // but when adding to history, we need to format them as `FunctionCall` parts.
      if (functionCalls.length > 0) {
        for (const call of functionCalls) {
          modelParts.push({
            functionCall: {
              name: call.name,
              args: call.args,
              id: call.id, // Pass ID if present
            },
          });
        }
      }

      // We only add to history if there is something to add (text or tools)
      if (modelParts.length > 0) {
        history.push({
          role: "model",
          parts: modelParts,
        });
      }

      console.log(
        "[Baize] Stream finished. Collected function calls:",
        functionCalls.length
      );
      if (functionCalls.length === 0) break;

      // Execute tools
      const toolParts: any[] = [];
      for (const call of functionCalls) {
        console.log("[Baize] Executing tool:", call.name, call.args);
        const toolResult = await executeTool(call.name, call.args);
        console.log("[Baize] Tool result:", toolResult);

        onUpdate({ type: "tool_result", name: call.name, result: toolResult });

        toolParts.push({
          functionResponse: {
            name: call.name,
            response: toolResult,
            id: call.id, // Pass ID matching the call
          },
        });
      }

      // Append tool output to history
      console.log("[Baize] Adding tool response to history:", toolParts);
      history.push({
        role: "tool",
        parts: toolParts,
      });

      // Loop continues to generate next response based on tool outputs
    }

    onUpdate({ type: "done" });
  } catch (err: any) {
    console.error("[Baize] Error:", err);
    onUpdate({ type: "error", error: err.message || String(err) });
  }
}
