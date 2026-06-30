import { NextRequest, NextResponse } from "next/server";
import { generateDailyPlan } from "@/lib/gemini";
import type { Task, CalendarEvent, UserPreferences } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { tasks, date, calendarEvents, preferences } = await req.json() as {
      tasks: Task[];
      date: string;
      calendarEvents?: CalendarEvent[];
      preferences?: Partial<UserPreferences>;
    };

    if (!tasks || !date) {
      return NextResponse.json({ error: "tasks and date required" }, { status: 400 });
    }

    const result = await generateDailyPlan(tasks, date, calendarEvents ?? [], preferences ?? {});
    return NextResponse.json(result);
  } catch (err) {
    console.error("Plan API error:", err);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
