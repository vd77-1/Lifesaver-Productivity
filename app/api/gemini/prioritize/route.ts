import { NextRequest, NextResponse } from "next/server";
import { prioritizeTasks } from "@/lib/gemini";
import type { Task, CalendarEvent, UserPreferences } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { tasks, calendarEvents, preferences } = await req.json() as {
      tasks: Task[];
      calendarEvents?: CalendarEvent[];
      preferences?: Partial<UserPreferences>;
    };

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: "tasks array required" }, { status: 400 });
    }

    const result = await prioritizeTasks(tasks, calendarEvents ?? [], preferences ?? {});
    return NextResponse.json(result);
  } catch (err) {
    console.error("Prioritize API error:", err);
    return NextResponse.json({ error: "Failed to prioritize tasks" }, { status: 500 });
  }
}
