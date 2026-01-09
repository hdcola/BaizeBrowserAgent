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
      let maxSteps = 5;

      while (keepGenerating && maxSteps > 0) {
        maxSteps--;
        keepGenerating = false;

        try {
          const tools = BrowserTools;
          const stream = llmService.stream({
            messages: currentMessages,
            tools,
          });

          const toolCallsMap: Record<string, ToolCall> = {};
          let textBuffer = "";

          for await (const chunk of stream) {
            if (abortSignal.aborted) return;

            if (chunk.content) {
              textBuffer += chunk.content;
              yield {
                content: [{ type: "text", text: chunk.content }],
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
              // Indicate tool execution in UI
              yield {
                content: [
                  { type: "text", text: `\n\n_Running ${tc.name}..._\n\n` },
                ],
              };

              const result = await ToolsService.executeTool(tc);

              currentMessages.push({
                role: "tool",
                content: result,
                toolCallId: tc.id,
              });
            }
            keepGenerating = true;
          }
        } catch (e: any) {
          yield {
            content: [{ type: "text", text: `Error: ${e.message}` }],
          };
          return;
        }
      }
    },
  } satisfies ChatModelAdapter;

  return useLocalRuntime(adapter);
}
