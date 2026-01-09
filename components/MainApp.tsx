import React, { useState } from "react";
import { AgentProvider } from "@/components/AgentContext";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { ChatInterface } from "@/components/chat/ChatInterface";

function AppContent() {
  const [view, setView] = useState<"chat" | "settings">("chat");

  return (
    <div className="h-screen w-full bg-white dark:bg-gray-900 text-[var(--color-text-primary)] font-sans">
      {view === "chat" ? (
        <ChatInterface onOpenSettings={() => setView("settings")} />
      ) : (
        <SettingsPanel onClose={() => setView("chat")} />
      )}
    </div>
  );
}

export default function MainApp() {
  return (
    <AgentProvider>
      <AppContent />
    </AgentProvider>
  );
}
