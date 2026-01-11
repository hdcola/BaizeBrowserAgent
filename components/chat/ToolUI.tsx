import React from "react";
import { useMessage } from "@assistant-ui/react";

export const ToolUI = () => {
  const message = useMessage();

  if (!message) return null;

  // Use a type guard or cast to access properties safely
  const msg = message as any;

  // Find tool call parts in the message content
  // Note: BaizeRuntime yields "tool-call" type parts.
  // We also want to show tool outputs if they exist in the SAME message?
  // Actually, BaizeRuntime pushes separate messages for "tool" role (results)
  // and "assistant" role (calls).
  // So:
  // 1. If role is 'assistant', look for 'tool-call' parts.
  // 2. If role is 'tool', render the content as the result.

  if (msg.role === "tool") {
    return (
      <div className="flex flex-col gap-2 mt-2 w-full p-2 bg-gray-50 dark:bg-gray-800/50 rounded border-l-2 border-green-500">
        <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
          <span>Running Tool...</span>
        </div>
        <pre className="whitespace-pre-wrap break-all text-xs text-gray-600 dark:text-gray-300 font-mono">
          {/* Tool results usually come as content */}
          {msg.content}
        </pre>
      </div>
    );
  }

  if (msg.role === "assistant") {
    // Check if content is an array before filtering
    if (!Array.isArray(msg.content)) return null;

    const toolCalls = msg.content.filter((c: any) => c.type === "tool-call");

    if (toolCalls.length === 0) return null;

    return (
      <div className="flex flex-col gap-3 mb-4 w-full border-b border-gray-100 dark:border-gray-800 pb-4">
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

  return null;
};
