import React, { useState } from "react";
import { useMessage } from "@assistant-ui/react";
import { ChevronDown, ChevronRight, Check, Loader2 } from "lucide-react";

export const ToolUI = () => {
  const message = useMessage();
  if (!message) return null;

  const msg = message as any;

  if (msg.role === "assistant") {
    if (!Array.isArray(msg.content)) return null;
    const toolCalls = msg.content.filter((c: any) => c.type === "tool-call");
    if (toolCalls.length === 0) return null;

    return (
      <div className="flex flex-col gap-3 mb-4 w-full border-b border-gray-100 dark:border-gray-800 pb-4">
        {toolCalls.map((tc: any, idx: number) => (
          <ToolCard key={tc.toolCallId || idx} toolCall={tc} index={idx} />
        ))}
      </div>
    );
  }
  return null;
};

const ToolCard = ({ toolCall, index }: { toolCall: any; index: number }) => {
  // If result exists, default to collapsed. If running, default to expanded.
  const isFinished = !!toolCall.result;
  const [isExpanded, setIsExpanded] = useState(!isFinished);

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full ${
              isFinished ? "bg-blue-500" : "bg-blue-100 dark:bg-blue-800"
            }`}
          >
            {isFinished ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300 animate-spin" />
            )}
          </div>

          {/* Tool Name */}
          <span className="font-semibold text-sm text-blue-700 dark:text-blue-300 font-mono">
            {toolCall.toolName}
          </span>
        </div>

        {/* Toggle Icon */}
        <div className="text-gray-400">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 border-t border-blue-100 dark:border-blue-900/30 bg-gray-50/30 dark:bg-gray-800/30 space-y-3">
          {/* Arguments Section */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Arguments
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2">
              <pre className="text-xs text-gray-600 dark:text-gray-300 font-mono whitespace-pre-wrap break-all">
                {typeof toolCall.args === "string"
                  ? toolCall.args
                  : JSON.stringify(toolCall.args, null, 2)}
              </pre>
            </div>
          </div>

          {/* Response Section (Only if finished) */}
          {isFinished && toolCall.result && (
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                Response
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-all">
                  {toolCall.result}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
