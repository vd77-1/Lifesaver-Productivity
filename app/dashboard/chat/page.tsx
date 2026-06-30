"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Send, Sparkles, Zap, Bot, User, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";
import type { AIChatMessage } from "@/types";

const QUICK_PROMPTS = [
  "What should I focus on right now?",
  "Am I going to miss any deadlines?",
  "Plan my day around my tasks",
  "What's my biggest risk today?",
  "Break down my most complex task",
  "I'm feeling overwhelmed, help me",
];

export default function ChatPage() {
  const { tasks, calendarEvents, chatHistory, addChatMessage, aiThinking, setAiThinking } = useAppStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, aiThinking]);

  async function sendMessage(text: string) {
    if (!text.trim() || aiThinking) return;
    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput("");
    setAiThinking(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          tasks,
          history: chatHistory,
          calendarEvents,
        }),
      });
      const data = await res.json();
      const aiMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        actionTaken: data.actionTaken,
      };
      addChatMessage(aiMsg);
    } catch {
      toast.error("Chat failed. Check your API key.");
    } finally {
      setAiThinking(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-glow/20 flex items-center justify-center glow-pulse">
          <Bot className="w-5 h-5 text-glow" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl">AI Agent</h1>
          <p className="text-fog text-xs">Powered by Google Gemini · {tasks.filter(t => t.status !== "completed").length} active tasks in context</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-pulse animate-pulse" />
          Live
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {chatHistory.length === 0 && (
          <div className="text-center py-12 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-glow/10 border border-glow/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-glow" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Ask me anything</h2>
              <p className="text-fog text-sm mt-1">I know all your tasks and deadlines. Ask me to plan, prioritize, or simulate scenarios.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left p-3 rounded-xl bg-slate border border-white/5 hover:border-glow/30 hover:bg-glow/5 transition-all text-sm text-fog hover:text-snow"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-3xl",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
              msg.role === "user" ? "bg-pulse/20" : "bg-glow/20"
            )}>
              {msg.role === "user"
                ? <User className="w-3.5 h-3.5 text-pulse" />
                : <Bot className="w-3.5 h-3.5 text-glow" />
              }
            </div>
            <div className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[80%]",
              msg.role === "user"
                ? "bg-pulse/15 text-snow rounded-tr-sm"
                : "bg-slate border border-white/5 text-cloud rounded-tl-sm"
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.actionTaken && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-pulse">
                  <Zap className="w-3 h-3" />
                  {msg.actionTaken}
                </div>
              )}
              <p className="text-xs text-fog/60 mt-1.5">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {aiThinking && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-glow/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-glow" />
            </div>
            <div className="bg-slate border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="ai-thinking flex gap-1.5">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts when chat has messages */}
      {chatHistory.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {QUICK_PROMPTS.slice(0, 4).map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-slate border border-white/5 hover:border-glow/30 text-fog hover:text-snow transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            className="input resize-none pr-12 min-h-[52px] max-h-32"
            placeholder="Ask me to plan, reschedule, or analyze your tasks..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            rows={1}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || aiThinking}
          className="btn-primary h-[52px] px-5 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-fog text-center mt-2">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
