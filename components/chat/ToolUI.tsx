import React, { useState, useEffect } from "react";
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
  const isFinished = !!toolCall.result;
  // Default: Expanded when running, collapsed when finished (initial state)
  const [isExpanded, setIsExpanded] = useState(!isFinished);

  // Auto-collapse when finished
  useEffect(() => {
    if (isFinished) {
      setIsExpanded(false);
    }
  }, [isFinished]);

  return (
    <div className="flex flex-col border border-gray-100 dark:border-gray-800 rounded-md overflow-hidden bg-transparent mb-2 last:mb-0">
      {/* Header - Subtle & Compact */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          {/* Status Icon - Minimal */}
          <div
            className={`flex items-center justify-center w-4 h-4 rounded-full ${
              isFinished
                ? "bg-gray-200 dark:bg-gray-700"
                : "bg-blue-100 dark:bg-blue-900/30"
            }`}
          >
            {isFinished ? (
              <Check className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
            ) : (
              <Loader2 className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 animate-spin" />
            )}
          </div>

          {/* Tool Name - Subtle Gray */}
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {toolCall.toolName}
          </span>
        </div>

        {/* Toggle Icon */}
        <div className="text-gray-300 dark:text-gray-600">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {/* Expanded Content - Minimalist */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2">
          {/* Separator */}
          <div className="h-px bg-gray-50 dark:bg-gray-800 mb-2" />

          {/* Arguments Section */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
              Args
            </div>
            <pre className="text-[10px] text-gray-500 dark:text-gray-400 font-mono whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
              {typeof toolCall.args === "string"
                ? toolCall.args
                : JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>

          {/* Response Section */}
          {isFinished && toolCall.result && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Result
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800 max-h-40 overflow-y-auto scrollbar-none">
                <pre className="text-[10px] text-gray-500 dark:text-gray-400 font-mono whitespace-pre-wrap break-all">
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
