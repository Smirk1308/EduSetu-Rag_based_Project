"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bot, FileText, RefreshCw, Send, User, Zap } from "lucide-react";

interface SourceCitation {
  source: string;
  page?: number;
  similarity?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  isOffline: boolean;
  onToggleOffline: () => void;
}

const QUICK_PROMPTS = [
  { label: "Find scholarship options", prompt: "What scholarships may be available to students from Jammu & Kashmir, and how can I check eligibility?" },
  { label: "Explore NIT Srinagar cutoffs", prompt: "What JEE Main opening and closing ranks are listed for Home State candidates at NIT Srinagar? Please include sources." },
  { label: "Understand seat categories", prompt: "Explain Jammu & Kashmir seat reservation categories in simple language and include sources." },
  { label: "PMSSS application steps", prompt: "What are the steps and required documents for an AICTE PMSSS application? Please include sources." },
];

const cleanPlainText = (content: string) =>
  content
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\n)\s{0,3}#{1,6}\s+/g, "$1");

const MAX_HISTORY_MESSAGE_LENGTH = 3500;
const HISTORY_TRUNCATION_MARKER = "\n[Earlier response shortened for conversation context]\n";

function boundHistoryMessage(content: string) {
  if (content.length <= MAX_HISTORY_MESSAGE_LENGTH) return content;

  const available = MAX_HISTORY_MESSAGE_LENGTH - HISTORY_TRUNCATION_MARKER.length;
  const startLength = Math.ceil(available / 2);
  const endLength = Math.floor(available / 2);
  return `${content.slice(0, startLength)}${HISTORY_TRUNCATION_MARKER}${content.slice(-endLength)}`;
}

export const ChatInterface = ({ isOffline, onToggleOffline }: ChatInterfaceProps) => {
  const idPrefix = useId();
  const messageSequence = useRef(0);
  const streamBuffer = useRef("");
  const responseText = useRef("");
  const responseSources = useRef<SourceCitation[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        "Salaam, and welcome to J&K EduSetu.\n\nAsk about scholarships, admission steps, colleges, or seat categories. Share your study stage or exam if it helps us give more relevant guidance.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? input).trim();
    if (!textToSend || isLoading) return;

    setInput("");
    messageSequence.current += 1;
    const requestId = `${idPrefix}-${messageSequence.current}`;
    const userMessage: Message = {
      id: `${requestId}-user`,
      role: "user",
      content: textToSend,
    };
    const assistantPlaceholderId = `${requestId}-assistant`;
    streamBuffer.current = "";
    responseText.current = "";
    responseSources.current = [];
    setMessages((previous) => [
      ...previous,
      userMessage,
      { id: assistantPlaceholderId, role: "assistant", content: "", isStreaming: true, sources: [] },
    ]);
    setIsLoading(true);

    try {
      const history = messages
        .filter((message) => message.id !== "initial-welcome" && (message.role === "user" || message.role === "assistant") && message.content.trim())
        .slice(-6)
        .map(({ role, content }) => ({ role, content: boundHistoryMessage(content) }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          language: "English",
          offline_mode: isOffline,
        }),
      });

      if (!response.ok || !response.body) {
        const message = response.status === 422
          ? "This question or its conversation context is too long. Try shortening the question and send it again."
          : response.status === 429
            ? "The advisor is handling several questions right now. Please wait a moment and try again."
            : response.status >= 500
              ? "The advisor service is temporarily unavailable. Please try again shortly."
              : "We couldn't send that question. Please try again.";
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let finished = false;
      let receivedTerminalEvent = false;

      while (!finished) {
        const { value, done } = await reader.read();
        finished = done;
        streamBuffer.current += decoder.decode(value, { stream: !done });
        const lines = streamBuffer.current.split("\n");
        streamBuffer.current = done ? "" : lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6).trim());
            if (typeof data.chunk === "string") responseText.current += data.chunk;
            if (Array.isArray(data.sources)) responseSources.current = data.sources;
            if (data.done === true) receivedTerminalEvent = true;

            setMessages((previous) => previous.map((message) =>
              message.id === assistantPlaceholderId
                ? { ...message, content: responseText.current, sources: responseSources.current, isStreaming: !data.done }
                : message
            ));
          } catch {
            // Ignore incomplete or non-JSON server-sent events.
          }
        }
      }

      if (!receivedTerminalEvent) {
        throw new Error("The connection ended before the answer finished. Please try again.");
      }

      setMessages((previous) => previous.map((message) =>
        message.id === assistantPlaceholderId
          ? { ...message, content: responseText.current, sources: responseSources.current, isStreaming: false }
          : message
      ));
    } catch (error) {
      console.error("Chat request failed:", error);
      setMessages((previous) => previous.map((message) =>
        message.id === assistantPlaceholderId
          ? {
              ...message,
              content: responseText.current
                ? `${responseText.current}\n\n${error instanceof Error ? error.message : "The connection was interrupted. Please try again."}`
                : error instanceof Error
                  ? error.message
                  : "We couldn't connect just now. Please try again, or switch on Low-data mode for locally available guidance.",
              isStreaming: false,
            }
          : message
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-panel mx-auto flex h-[min(650px,78vh)] min-h-[540px] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--bg-surface)] shadow-[var(--shadow-elevated)]">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] bg-[var(--bg-surface)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="eyebrow">Independent Student Guidance Advisor</p>
          </div>
          <h3 className="font-display mt-1 text-xl font-bold sm:text-2xl">Ask an education or policy question</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Answers are indicative guidelines retrieved from public notifications with document citations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleOffline}
            aria-pressed={isOffline}
            className={`mode-toggle ${isOffline ? "mode-toggle-active" : ""}`}
            title="Use locally available guidance when connectivity is limited"
          >
            <Zap aria-hidden="true" className="h-4 w-4" />
            <span>Low-data mode</span>
            <span className="mode-state">{isOffline ? "On" : "Off"}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation">
        {messages.map((message) => (
            <div key={message.id} className={`flex max-w-[92%] gap-3 sm:max-w-[84%] ${message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
            <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${message.role === "user" ? "bg-gradient-to-br from-[var(--brand-button)] to-[var(--brand-strong)] text-white" : "border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--brand)]"}`}>
              {message.role === "user" ? <User aria-hidden="true" className="h-4 w-4" /> : <Bot aria-hidden="true" className="h-4 w-4" />}
            </span>
            <div className={`min-w-0 rounded-2xl px-4 py-3.5 text-sm leading-6 sm:px-5 shadow-sm ${message.role === "user" ? "rounded-tr-sm bg-gradient-to-br from-[var(--brand-button)] to-[var(--brand-strong)] text-white" : "rounded-tl-sm border border-[var(--line)] bg-[var(--bg-surface)] text-[var(--text-primary)]"}`}>
              {message.role === "assistant" && (
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[var(--brand)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
                  <span>EduSetu Guidance</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{cleanPlainText(message.content) || <span className="inline-flex items-center gap-2 text-[var(--text-muted)]"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> Finding relevant guidance…</span>}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Sources to check</p>
                  <ul className="flex flex-wrap gap-2">
                    {message.sources.map((source, index) => (
                      <li key={`${source.source}-${index}`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[var(--bg-soft)] px-2.5 py-1 text-xs text-[var(--brand)]" title={source.page ? `Page ${source.page}` : source.source}>
                        <FileText aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                        <span className="max-w-[220px] truncate">{source.source}</span>
                        {source.page && <span className="shrink-0">· p. {source.page}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[var(--line)] bg-[var(--bg-body)] px-4 py-3 sm:px-6">
        <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Try asking</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map((prompt) => (
            <button key={prompt.label} type="button" onClick={() => void handleSend(prompt.prompt)} disabled={isLoading} className="prompt-chip">
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); void handleSend(); }}
        className="flex items-end gap-3 border-t border-[var(--line)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="advisor-question" className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Your question</label>
          <input
            id="advisor-question"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={isOffline ? "Ask about information available offline…" : "Ask about scholarships, admissions, colleges…"}
            maxLength={4000}
            disabled={isLoading}
            className="text-input"
          />
        </div>
        <button type="submit" disabled={!input.trim() || isLoading} className="send-button" aria-label="Send question">
          {isLoading ? <RefreshCw aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Send aria-hidden="true" className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
