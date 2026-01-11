import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessage,
} from "@assistant-ui/react";
import React from "react";
import { ToolUI } from "./ToolUI";

export const Thread = (props: any) => {
  return (
    <ThreadPrimitive.Root
      className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50"
      {...props}
    >
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth">
        <ThreadPrimitive.Empty>
          <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
            <div className="text-4xl mb-4">👋</div>
            <p className="font-medium text-lg">How can I help you today?</p>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            Message: () => {
              const message = useMessage();
              if (!message) return null;

              // Special handling for tool outputs which are separate messages in assistant-ui (or mapped as such)
              if (message.role === "tool") {
                return <ToolUI />;
              }

              return (
                <MessagePrimitive.Root className="group relative mb-4">
                  <div
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl shadow-sm leading-relaxed text-sm overflow-hidden ${
                        message.role === "user"
                          ? "bg-blue-600 text-white rounded-br-sm p-3"
                          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                      }`}
                    >
                      {/* Render Tool Calls attached to assistant message */}
                      {message.role === "assistant" && (
                        <div className="px-3 pt-3">
                          <ToolUI />
                        </div>
                      )}

                      {/* For assistant messages, we render text content AND tool calls if any */}
                      <div className={message.role !== "user" ? "p-3" : ""}>
                        <MessagePrimitive.Content />
                      </div>
                    </div>
                  </div>
                </MessagePrimitive.Root>
              );
            },
          }}
        />
      </ThreadPrimitive.Viewport>

      <ComposerPrimitive.Root className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
        <div className="relative flex items-end gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-transparent focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <ComposerPrimitive.Input
            className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none focus:ring-0 p-2 text-sm text-gray-800 dark:text-gray-100 resize-none placeholder-gray-400"
            placeholder="Ask anything..."
            rows={1}
          />
          <ComposerPrimitive.Send className="p-2 mb-0.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  );
};
