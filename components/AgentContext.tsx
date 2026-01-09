import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { LLMService } from "@/services/llm";
import {
  StorageService,
  defaultSettings,
  defaultProviderConfig,
} from "@/services/storage";
import type { AppSettings, ModelConfig } from "@/services/storage/types";
import { LLMResponseChunk, Message } from "@/services/llm/types";

interface AgentContextType {
  settings: AppSettings;
  providerConfig: ModelConfig; // Replaces models[] + activeModel
  llmService: LLMService | null;
  isLoading: boolean;
  actions: {
    updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
    updateProviderConfig: (config: ModelConfig) => Promise<void>;
    sendMessage: (
      history: Message[],
      streamCallback?: (chunk: LLMResponseChunk) => void
    ) => Promise<string>;
  };
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [providerConfig, setProviderConfig] = useState<ModelConfig>(
    defaultProviderConfig
  );
  const [llmService, setLlmService] = useState<LLMService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      try {
        const s = await StorageService.getSettings();
        const c = await StorageService.getProviderConfig();
        setSettings(s);
        setProviderConfig(c);
        setLlmService(new LLMService(c));
      } catch (e) {
        console.error("Failed to initialize AgentContext", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Update LLMService when provider config changes
  useEffect(() => {
    if (providerConfig) {
      setLlmService(new LLMService(providerConfig));
    }
  }, [providerConfig]);

  const actions = {
    updateSettings: async (partial: Partial<AppSettings>) => {
      await StorageService.updateSettings(partial);
      setSettings((prev) => ({ ...prev, ...partial }));
    },
    updateProviderConfig: async (config: ModelConfig) => {
      await StorageService.saveProviderConfig(config);
      setProviderConfig(config);
    },
    sendMessage: async (
      history: Message[],
      streamCallback?: (chunk: LLMResponseChunk) => void
    ): Promise<string> => {
      if (!llmService) throw new Error("No model selected");

      const request = { messages: history, stream: !!streamCallback };

      if (streamCallback) {
        const generator = llmService.stream(request);
        let fullText = "";
        for await (const chunk of generator) {
          fullText += chunk.content;
          streamCallback(chunk);
        }
        return fullText;
      } else {
        const response = await llmService.chat(request);
        return response.content;
      }
    },
  };

  return (
    <AgentContext.Provider
      value={{ settings, providerConfig, llmService, isLoading, actions }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}
