import React from "react";
import { useMessage } from "@assistant-ui/react";

export const ToolUI = () => {
  const message = useMessage();

  if (!message) return null;

  // Find tool call parts in the message content
  // Note: BaizeRuntime yields "tool-call" type parts.
  // We also want to show tool outputs if they exist in the SAME message?
  // Actually, BaizeRuntime pushes separate messages for "tool" role (results)
  // and "assistant" role (calls).
  // So:
  // 1. If role is 'assistant', look for 'tool-call' parts.
  // 2. If role is 'tool', render the content as the result.

  if (message.role === "assistant") {
    const toolCalls = message.content.filter(
      (c: any) => c.type === "tool-call"
    );

    if (toolCalls.length === 0) return null;

    return (
      <div className="flex flex-col gap-3 mt-3 w-full">
        {toolCalls.map((tc: any, idx: number) => (
          <div
            key={tc.toolCallId || idx}
            className="flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 dark:border-blue-400 rounded-r-lg p-4 text-xs shadow-md"
          >
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-mono mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">
                {idx + 1}
              </div>
              <span className="font-semibold text-sm">Tool Call:</span>
              <span className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-700 dark:text-blue-300 font-semibold">
                {tc.toolName}
              </span>
            </div>
            {tc.args && (
              <div className="mt-1 pl-8 border-l-2 border-blue-200 dark:border-blue-700">
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                  Arguments:
                </div>
                <pre className="whitespace-pre-wrap break-all text-gray-600 dark:text-gray-300 font-mono text-xs bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                  {typeof tc.args === "string"
                    ? tc.args
                    : JSON.stringify(tc.args, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // If role is 'tool', it represents the output of a tool
  if (message.role === "tool") {
    // The content of a tool message is the result string
    // BaizeRuntime puts the result in `content`.
    // But wait, message.content is an array of parts? or string?
    // useLocalRuntime maps it.

    // Let's inspect the content.
    // In BaizeRuntime: currentMessages.push({ role: 'tool', content: result ... })

    return (
      <div className="mt-2 w-full max-w-[85%] self-start">
        <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-lg p-3 text-xs">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-mono mb-1">
            <span className="font-semibold">✓ Tool Result</span>
          </div>
          <pre className="whitespace-pre-wrap break-all text-gray-600 dark:text-gray-400 font-mono max-h-40 overflow-y-auto">
            {Array.isArray(message.content)
              ? message.content
                  .map((c: any) => c.text || JSON.stringify(c))
                  .join("")
              : String(message.content)}
          </pre>
        </div>
      </div>
    );
  }

  return null;
};
