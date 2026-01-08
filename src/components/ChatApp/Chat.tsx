import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { sendMessage, clearHistory } from "../../services/gemini";
import type { StreamUpdate } from "../../services/gemini";
import { useTranslation } from "../../utils/i18n";
import "./Sidepanel.css";
import { Send, ExternalLink, MousePointerClick, Trash2 } from "lucide-react";

interface ToolCall {
  name: string;
  args: any;
  result?: any;
}

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  toolCalls?: ToolCall[];
  error?: string;
}

export const Chat: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClear = () => {
    clearHistory();
    setMessages([]);
  };

  const handleSend = async () => {
    console.log("[Chat] handleSend called, input:", input);
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsg: Message = {
      id: modelMsgId,
      role: "model",
      content: "",
      toolCalls: [],
    };

    setMessages((prev) => [...prev, modelMsg]);

    console.log("[Chat] Calling sendMessage service...");
    await sendMessage(userMsg.content, (update: StreamUpdate) => {
      // console.log('[Chat] Received update:', update.type);
      setMessages((prev) => {
        const newMsgs = [...prev];
        const msgIndex = newMsgs.findIndex((m) => m.id === modelMsgId);
        if (msgIndex === -1) return prev;

        const msg = { ...newMsgs[msgIndex] };

        if (update.type === "text") {
          msg.content += update.content;
        } else if (update.type === "tool_call") {
          console.log("[Chat] Tool call update:", update.name, update.args);
          if (!msg.toolCalls) msg.toolCalls = [];
          msg.toolCalls.push({ name: update.name, args: update.args });
        } else if (update.type === "tool_result") {
          console.log("[Chat] Tool result update:", update.name, update.result);
          if (msg.toolCalls) {
            const tool = msg.toolCalls.find(
              (tc) => tc.name === update.name && !tc.result
            );
            if (tool) {
              tool.result = update.result;
            }
          }
        } else if (update.type === "error") {
          console.error("[Chat] Error update:", update.error);
          msg.error = update.error;
        } else if (update.type === "done") {
          console.log("[Chat] Done update received");
          // loading handled outside
        }

        newMsgs[msgIndex] = msg;
        return newMsgs;
      });
    });
    console.log("[Chat] sendMessage promise resolved");
    setLoading(false);
  };

  return (
    <div className="chat-container">
      <div
        className="chat-header-actions"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "0.5rem",
        }}
      >
        <button
          className="icon-btn"
          onClick={handleClear}
          title={t("clearHistory") || "Clear History"}
          disabled={loading || messages.length === 0}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className={`message ${m.role}`}>
            {m.toolCalls && m.toolCalls.length > 0 && (
              <div className="tool-calls">
                {m.toolCalls.map((tc, idx) => (
                  <div key={idx} className="tool-call">
                    <div className="tool-header">
                      {tc.name === "click_link" ? (
                        <MousePointerClick size={14} />
                      ) : (
                        <ExternalLink size={14} />
                      )}
                      <span>{tc.name}</span>
                    </div>
                    <div className="tool-args">{JSON.stringify(tc.args)}</div>
                    {tc.result && (
                      <div className="tool-result">
                        <span className="label">{t("toolOutput")}:</span>{" "}
                        {JSON.stringify(tc.result).slice(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="content markdown-content">
              {m.role === "model" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              ) : (
                m.content
              )}
            </div>

            {m.error && (
              <div className="error-msg">
                {t("error")}: {m.error}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="loading-indicator">{t("thinking")}</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t("placeholder")}
          disabled={loading}
        />
        <button
          className="icon-btn primary-text"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
