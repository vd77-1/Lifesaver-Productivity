import { NextRequest, NextResponse } from "next/server";
import { simulateWhatIf } from "@/lib/gemini";
import type { Task, CalendarEvent } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { scenario, tasks, calendarEvents } = await req.json() as {
      scenario: string;
      tasks: Task[];
      calendarEvents?: CalendarEvent[];
    };

    if (!scenario || !tasks) {
      return NextResponse.json({ error: "scenario and tasks required" }, { status: 400 });
    }

    const result = await simulateWhatIf(scenario, tasks, calendarEvents ?? []);
    return NextResponse.json(result);
  } catch (err) {
    console.error("What-if API error:", err);
    return NextResponse.json({ error: "Failed to simulate scenario" }, { status: 500 });
  }
}
