import React from "react";
import { Thread } from "./Thread";
import { useBaizeRuntime } from "./BaizeRuntime";
import { useAgent } from "../AgentContext";
import { useTranslation, t as staticT } from "@/utils/i18n";
import "@/assets/styles/assistant-ui-overrides.css";
import { AssistantRuntimeProvider } from "@assistant-ui/react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ChatInterface Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/10 rounded overflow-auto">
          <h2 className="font-bold">Something went wrong.</h2>
          <pre className="text-xs mt-2">{this.state.error?.message}</pre>
          <pre className="text-xs mt-1 opacity-70">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ChatInterface({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const { isLoading } = useAgent();
  const runtime = useBaizeRuntime();
  const { t } = useTranslation();

  if (isLoading) return <div className="p-4">Loading Agent...</div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <header className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50 flex justify-between items-center glass-panel z-10 shrink-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
          <h1 className="font-semibold text-sm tracking-wide text-gray-700 dark:text-gray-200">
            {t("chat_title")}
          </h1>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          title="Settings"
        >
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
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <ErrorBoundary>
          <AssistantRuntimeProvider runtime={runtime}>
            <Thread />
          </AssistantRuntimeProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
}
