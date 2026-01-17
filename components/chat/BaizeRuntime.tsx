import { useLocalRuntime, ChatModelAdapter } from "@assistant-ui/react";
import { useAgent } from "../AgentContext";
import { Message, ToolCall } from "@/services/llm/types";
import { BrowserTools, ToolsService } from "@/services/tools";

export function useBaizeRuntime() {
  const { llmService, settings } = useAgent();

  const adapter = useMemo(() => ({
    acceptAttachments: { type: "image/*" }, // Fallback hint
    run: async function* ({ messages, abortSignal } : { messages: any[], abortSignal: AbortSignal }) {
      if (!llmService) {
        yield {
          content: [
            { type: "text", text: "Please select a model in settings first." },
          ],
        };
        return;
      }

      // 1. Map messages to LLMService format
      if (messages.length > 0) {
        // Debug incoming
        // console.log("[BaizeRuntime] Incoming:", JSON.stringify(messages[messages.length - 1], null, 2));
      }

      const history: any[] = await Promise.all(messages.map(async (m: any) => {
        // Merge attachments content into message content
        const rawContentParts = [
          ...(m.content || []),
          ...(m.attachments || []).flatMap((a: any) => a.content || [])
        ];

        const contentParts = await Promise.all(rawContentParts.map(async (c: any) => {
          if (c.type === "text") {
            return { type: "text" as const, text: c.text };
          } else if (c.type === "image") {
            const img = c as any;
            let data = img.data;
            const file = img.file;
            let url = img.url;

            // Helper to convert Blob/File to Data URL
            const blobToDataURL = async (blob: Blob): Promise<string> => {
               return new Promise((resolve, reject) => {
                   const reader = new FileReader();
                   reader.onloadend = () => resolve(reader.result as string);
                   reader.onerror = reject;
                   reader.readAsDataURL(blob);
               });
            };

            if (!url) {
                try {
                    if (file instanceof Blob) {
                        url = await blobToDataURL(file);
                    } else if (data instanceof Blob) {
                        url = await blobToDataURL(data);
                    } else if (data && typeof data === 'object' && !data.substring) {
                         // ArrayBuffer handling
                         try {
                             const bytes = new Uint8Array(data);
                             let binary = '';
                             const len = bytes.byteLength;
                             for (let i = 0; i < len; i++) {
                                 binary += String.fromCharCode(bytes[i]);
                             }
                             const base64 = window.btoa(binary);
                             url = `data:${img.mimeType || 'image/png'};base64,${base64}`;
                         } catch (e) {
                             console.error("[BaizeRuntime] Failed to convert buffer:", e);
                         }
                    } else if (typeof data === 'string') {
                         if (data.startsWith('http') || data.startsWith('data:')) {
                             url = data;
                         } else {
                             url = `data:${img.mimeType || 'image/png'};base64,${data}`;
                         }
                    }
                } catch (e) {
                     console.error("[BaizeRuntime] Failed to convert image source:", e);
                }
            }
            
            if (!url) {
              return { type: "text" as const, text: "\n\n> [!WARNING]\n> **Image Failed**: Could not process attached image." };
            }
            return { type: "image_url" as const, image_url: { url } };
          }
          return null;
        }));

        return {
          role: m.role as "user" | "assistant" | "system",
          content: contentParts.filter(Boolean) as any[],
        };
      }));

      // 2. Stream from LLMService (Agent Loop)
      let currentMessages = [...history];
      let keepGenerating = true;
      let maxSteps = settings.maxSteps || 30; 
      let lastIterationHadTools = false;
      const allToolCallsForUI: any[] = []; 

      while (keepGenerating && maxSteps > 0) {
        maxSteps--;
        keepGenerating = false;

        try {
          const tools = BrowserTools;
          console.log("[BaizeRuntime] New stream iteration");
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
                content: [
                  ...allToolCallsForUI, 
                  { type: "text", text: textBuffer }, 
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

              if (chunk.toolCalls.length > 0) {
                chunk.toolCalls.forEach((tc) => {
                  allToolCallsForUI.push({
                    type: "tool-call",
                    toolName: tc.name,
                    toolCallId: tc.id,
                    args: tc.args,
                  } as any);
                });
              }

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
            currentMessages.push({
              role: "assistant",
              content: textBuffer,
              toolCalls: toolCalls,
            });

            for (const tc of toolCalls) {
              console.log(`[BaizeRuntime] Executing tool: ${tc.name}`);
              const result = await ToolsService.executeTool(tc);
              console.log(`[BaizeRuntime] Tool Result: ${result.slice(0, 100)}...`);

              const existingToolIndex = allToolCallsForUI.findIndex(
                (t) => t.toolCallId === tc.id
              );
              if (existingToolIndex !== -1) {
                allToolCallsForUI[existingToolIndex] = {
                  ...allToolCallsForUI[existingToolIndex],
                  result: result, 
                };
              }

              yield {
                content: [
                  ...allToolCallsForUI,
                  { type: "text", text: textBuffer },
                ],
              };

              if (result.includes("Receiving end does not exist")) {
                yield {
                  content: [
                    {
                      type: "text",
                      text: "\n\n> [!WARNING]\n> **Connection Lost**: The extension is disconnected from the page. Please **REFRESH** the page.",
                    },
                  ],
                };
              }

              currentMessages.push({
                role: "tool",
                content: result,
                toolCallId: tc.id,
                name: tc.name,
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

      if (lastIterationHadTools && maxSteps <= 0) {
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
  } as any), [llmService, settings]);

  const attachmentAdapter = useMemo(() => ({
    accept: "image/*",
    async add({ file }: { file: File }) {
      return {
        id: crypto.randomUUID(),
        file,
        type: "image" as const,
        name: file.name,
        contentType: file.type,
        status: { type: "requires-action" as const, reason: "composer-send" as const },
      };
    },
    async send(attachment: any) {
      return {
        ...attachment,
        status: { type: "complete" as const },
        content: [
          {
            type: "image",
            file: attachment.file,
          },
        ],
      };
    },
    async remove() {},
  }), []);

  return useLocalRuntime(adapter, {
    adapters: {
      attachments: attachmentAdapter,
    },
  } as any);
}
