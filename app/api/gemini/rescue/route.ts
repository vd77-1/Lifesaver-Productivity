import { NextRequest, NextResponse } from "next/server";
import { runDeadlineRescue } from "@/lib/gemini";
import type { Task } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { tasks } = await req.json() as { tasks: Task[] };
    if (!tasks) return NextResponse.json({ error: "tasks required" }, { status: 400 });

    const result = await runDeadlineRescue(tasks);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Rescue API error:", err);
    return NextResponse.json({ error: "Failed to run rescue analysis" }, { status: 500 });
  }
}
