import { useLocalRuntime, ChatModelAdapter } from "@assistant-ui/react";
import { useAgent } from "../AgentContext";
import { Message, ToolCall } from "@/services/llm/types";
import { BrowserTools, ToolsService } from "@/services/tools";

export function useBaizeRuntime() {
  const { llmService } = useAgent();

  const adapter = {
    run: async function* ({ messages, abortSignal }) {
      if (!llmService) {
        yield {
          content: [
            { type: "text", text: "Please select a model in settings first." },
          ],
        };
        return;
      }

      // 1. Map messages to LLMService format
      const history: Message[] = messages.map((m) => {
        // Simple mapping for now - assumes text content
        // TODO: Handle complex content (images, tool calls)
        const textContent = m.content
          .filter((c) => c.type === "text")
          .map((c) => (c as any).text)
          .join("\n");

        return {
          role: m.role as "user" | "assistant" | "system",
          content: textContent,
          // TODO: map tool calls from m.content if existing
        };
      });

      // 2. Stream from LLMService (Agent Loop)
      let currentMessages = [...history];
      let keepGenerating = true;
      let maxSteps = 10; // Increased to allow more tool iterations
      let lastIterationHadTools = false;
      const allToolCallsForUI: any[] = []; // MOVED OUTSIDE: Persist ALL tool calls across loop iterations

      while (keepGenerating && maxSteps > 0) {
        maxSteps--;
        keepGenerating = false;

        try {
          const tools = BrowserTools;
          console.log(
            "[BaizeRuntime] Starting new stream iteration. Messages:",
            currentMessages.length
          );
          const stream = llmService.stream({
            messages: currentMessages,
            tools,
          });

          const toolCallsMap: Record<string, ToolCall> = {};
          let textBuffer = "";

          for await (const chunk of stream) {
            if (abortSignal.aborted) return;

            if (chunk.content) {
              // console.log("Yielding text chunk:", chunk.content);
              textBuffer += chunk.content;
              yield {
                content: [
                  ...allToolCallsForUI, // Keep tools at the top
                  { type: "text", text: textBuffer }, // Text follows tools
                ],
              };
            }

            if (chunk.toolCalls) {
              chunk.toolCalls.forEach((tc) => {
                if (!toolCallsMap[tc.id]) {
                  toolCallsMap[tc.id] = { ...tc, args: "" };
                }
                if (tc.name) toolCallsMap[tc.id].name = tc.name;
                if (tc.args) toolCallsMap[tc.id].args += tc.args;
              });

              // Yield tool calls to the UI as they arrive
              // CRITICAL: We must include ALL previous tool calls in the array
              if (chunk.toolCalls.length > 0) {
                console.log(
                  "[BaizeRuntime] Yielding tool calls to UI:",
                  chunk.toolCalls.map((t) => t.name)
                );

                // Add new tool calls to the accumulated array
                chunk.toolCalls.forEach((tc) => {
                  allToolCallsForUI.push({
                    type: "tool-call",
                    toolName: tc.name,
                    toolCallId: tc.id,
                    args: tc.args,
                  } as any);
                });
              }

              // Yield the COMPLETE array (all tool calls so far + text)
              yield {
                content: [
                  ...allToolCallsForUI,
                  { type: "text", text: textBuffer },
                ],
              };
            }
          }

          const toolCalls = Object.values(toolCallsMap);
          if (toolCalls.length > 0) {
            // Append the Assistant's message (text + tool calls) to state
            currentMessages.push({
              role: "assistant",
              content: textBuffer,
              toolCalls: toolCalls,
            });

            for (const tc of toolCalls) {
              console.log(
                `[BaizeRuntime] Executing tool: ${tc.name} with args:`,
                tc.args
              );
              // Execute the tool
              // Note: We don't yield text here anymore as the user wants a dedicated UI
              // which should be handled by the UI component rendering the 'tool-call' part of the message.
              // However, useLocalRuntime expects us to yield something?
              // Actually, we yielded the tool call part in the previous loop? NO.
              // We need to yield the TOOL CALL itself if we want the UI to show it?
              // The `chunk.toolCalls` handling above accumulates them but doesn't necessarily yield them to runtime?

              // Let's first remove the text bubble.
              const result = await ToolsService.executeTool(tc);
              console.log(
                `[BaizeRuntime] Tool Result for ${tc.name}:`,
                result.slice(0, 200) + (result.length > 200 ? "..." : "")
              );

              // Update the UI state with the result
              // Find the existing tool call in the array and attach the result
              const existingToolIndex = allToolCallsForUI.findIndex(
                (t) => t.toolCallId === tc.id
              );
              if (existingToolIndex !== -1) {
                allToolCallsForUI[existingToolIndex] = {
                  ...allToolCallsForUI[existingToolIndex],
                  result: result, // Attach the full result here
                };
              }

              // Yield the updated content with tools (now containing results) FIRST, then text
              // Note: We DO NOT append the result to textBuffer anymore, as ToolUI will display it.
              yield {
                content: [
                  ...allToolCallsForUI,
                  { type: "text", text: textBuffer },
                ],
              };

              // Check for critical connection errors
              if (result.includes("Receiving end does not exist")) {
                yield {
                  content: [
                    {
                      type: "text",
                      text: "\n\n> [!WARNING]\n> **Connection Lost**: The extension is disconnected from the page. Please **REFRESH** the page to allow the extension to inject, then try again.",
                    },
                  ],
                };
              }

              currentMessages.push({
                role: "tool",
                content: result,
                toolCallId: tc.id,
                name: tc.name, // Required for Gemini functionResponse
              });
            }
            keepGenerating = true;
            lastIterationHadTools = true;
          } else {
            lastIterationHadTools = false;
          }
        } catch (e: any) {
          yield {
            content: [{ type: "text", text: `Error: ${e.message}` }],
          };
          return;
        }
      }

      // CRITICAL: If the loop ended because of maxSteps but we just executed tools,
      // we need ONE MORE call to get the final text response from the LLM.
      if (lastIterationHadTools && maxSteps <= 0) {
        console.log(
          "[BaizeRuntime] Loop ended with tools executed. Making final call for text response..."
        );
        try {
          const stream = llmService.stream({
            messages: currentMessages,
            tools: BrowserTools,
          });

          let finalText = "";
          for await (const chunk of stream) {
            if (abortSignal.aborted) return;
            if (chunk.content) {
              finalText += chunk.content;
              yield {
                content: [{ type: "text", text: finalText }],
              };
            }
          }
        } catch (e: any) {
          yield {
            content: [
              { type: "text", text: `Error in final response: ${e.message}` },
            ],
          };
        }
      }
    },
  } satisfies ChatModelAdapter;

  return useLocalRuntime(adapter);
}
