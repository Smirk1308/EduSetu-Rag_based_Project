"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, FileText, Globe, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  sources?: Array<{ source: string; page?: number; similarity?: number }>;
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  isOffline: boolean;
  onToggleOffline: () => void;
  onModelActive?: (model: string) => void;
}

const QUICK_PROMPTS = [
  { label: "79% PCM Scholarships", prompt: "I got 79% in Class 12 (PCM) with family income under ₹3 Lakh. What scholarships and PMSSS benefits am I eligible for?" },
  { label: "NIT Srinagar Cutoffs", prompt: "What are the JEE Main opening and closing ranks for Home State candidates at NIT Srinagar?" },
  { label: "S.O. 176 Reservation Quotas", prompt: "Explain the updated Jammu & Kashmir reservation policy under S.O. 176 (2024) for OM, RBA, and ST categories." },
  { label: "AICTE PMSSS Step-by-Step", prompt: "Give me the step-by-step application procedure, mandatory documents, and stipend disbursement for AICTE PMSSS." },
];

const LANGUAGES = [
  { code: "English", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "Urdu", label: "اردو", flag: "🇵🇰", dir: "rtl" },
  { code: "Hindi", label: "हिंदी", flag: "🇮🇳", dir: "ltr" },
  { code: "Kashmiri", label: "کٲشُر", flag: "🏔️", dir: "rtl" },
];

export const ChatInterface = ({
  isOffline,
  onToggleOffline,
  onModelActive,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        "**Salaam & Welcome to J&K EduSetu.**\n\nI am your verified AI Advisor for Higher Education, AICTE PMSSS Scholarships, BOPEE Seat Matrices, and the updated S.O. 176 reservation rules across Jammu, Kashmir & Ladakh.\n\nAsk me about your percentage, preferred branches, cutoff ranks, or government financial aid.",
      model: "J&K EduSetu Core AI",
    },
  ]);

  const [input, setInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };

    const assistantPlaceholderId = (Date.now() + 1).toString();
    const assistantPlaceholder: Message = {
      id: assistantPlaceholderId,
      role: "assistant",
      content: "",
      model: isOffline ? "⚡ 2G Mountain Edge" : "Connecting to Gemini Fleet...",
      isStreaming: true,
      sources: [],
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsLoading(true);

    try {
      // Connect to FastAPI backend endpoint (defaults to http://localhost:8000)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const historyPayload = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          language: selectedLanguage,
          offline_mode: isOffline,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";
      let activeModel = isOffline ? "⚡ 2G Mountain Edge" : "Gemini 3.8 Flash";
      let receivedSources: Array<any> = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        const lines = rawChunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", "").trim());

              if (data.chunk) {
                accumulatedText += data.chunk;
              }
              if (data.model) {
                activeModel = data.model;
                if (onModelActive) onModelActive(activeModel);
              }
              if (data.sources) {
                receivedSources = data.sources;
              }

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantPlaceholderId
                    ? {
                        ...msg,
                        content: accumulatedText,
                        model: activeModel,
                        sources: receivedSources,
                        isStreaming: !data.done,
                      }
                    : msg
                )
              );
            } catch (e) {
              // Ignore partial JSON parse splits
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Chat streaming error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? {
                ...msg,
                content:
                  "⚠️ **Could not connect to the backend server.**\n\nPlease ensure `python server.py` is running on port 8000, or toggle **⚡ 2G Edge Mode** for immediate offline gazette answers.",
                isStreaming: false,
                model: "Offline Fallback",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl glass-panel border border-emerald-500/25 shadow-2xl overflow-hidden flex flex-col h-[750px]">
      {/* Chat Window Top Bar */}
      <div className="px-6 py-4 border-b border-emerald-500/20 bg-emerald-950/10 dark:bg-emerald-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full bg-emerald-500/20 p-1 flex items-center justify-center border border-emerald-500/40">
            <Image src="/jk_emblem.png" alt="Advisor Avatar" width={24} height={24} className="object-contain" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-emerald-100 flex items-center gap-2">
              J&K EduSetu AI Assistant
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-semibold text-emerald-700 dark:text-emerald-300">
                Official Gazette Verified
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ChromaDB Hybrid RAG • S.O. 176 (2024) Rules • 5-Model Gemini Fleet
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 hidden sm:inline" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="text-xs bg-white/70 dark:bg-emerald-950/60 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "flex gap-3 max-w-[88%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border",
                  msg.role === "user"
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                    : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                )}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={cn(
                  "rounded-2xl p-4 text-sm leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-white dark:bg-[#0b291f] text-slate-800 dark:text-slate-100 border border-emerald-500/20 rounded-tl-none"
                )}
              >
                {/* Active Model Header (for Assistant) */}
                {msg.role === "assistant" && msg.model && (
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-emerald-500/15 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{msg.model}</span>
                    {msg.isStreaming && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                    )}
                  </div>
                )}

                {/* Body Text */}
                <div className="whitespace-pre-wrap font-normal">
                  {msg.content || (
                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs italic">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Retrieving verified official gazette records...
                    </span>
                  )}
                </div>

                {/* Document Citations Card */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-500/15">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Verified Gazette Citations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium"
                          title={`Page ${s.page || 1}`}
                        >
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{s.source}</span>
                          {s.page && <span className="opacity-75">· P.{s.page}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Recommendation Chips */}
      <div className="px-6 py-2.5 border-t border-emerald-500/15 bg-white/40 dark:bg-emerald-950/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          Quick Ask:
        </span>
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.prompt)}
            disabled={isLoading}
            className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 transition duration-150 disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-emerald-500/20 bg-white/80 dark:bg-[#072118] flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              isOffline
                ? "Ask offline records (PMSSS, NIT cutoffs, Reservation)..."
                : "Ask about college cutoffs, PMSSS eligibility, S.O. 176..."
            }
            disabled={isLoading}
            className="w-full pl-4 pr-10 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-normal"
          />
        </div>

        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 shrink-0"
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
};
