import { NextRequest, NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/gemini";
import type { Task, CalendarEvent, AIChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { message, tasks, history, calendarEvents } = await req.json() as {
      message: string;
      tasks: Task[];
      history: AIChatMessage[];
      calendarEvents?: CalendarEvent[];
    };

    if (!message || !tasks) {
      return NextResponse.json({ error: "message and tasks required" }, { status: 400 });
    }

    // Convert chat history to Gemini format
    const geminiHistory = history.slice(-10).map((msg) => ({
      role: msg.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: msg.content }],
    }));

    const result = await chatWithAgent(message, tasks, geminiHistory, calendarEvents ?? []);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
