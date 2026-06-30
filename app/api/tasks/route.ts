import { NextRequest, NextResponse } from "next/server";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/db";
import { computeRiskLevel, generateId } from "@/lib/utils";
import type { Task } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const tasks = await getTasks(userId);
    // Recompute risk levels on fetch
    const updated = tasks.map((t) => ({ ...t, riskLevel: computeRiskLevel(t) }));
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Task> & { userId: string };
    if (!body.userId || !body.title || !body.deadline) {
      return NextResponse.json({ error: "userId, title, deadline required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newTask: Omit<Task, "id"> = {
      userId: body.userId,
      title: body.title,
      description: body.description ?? "",
      deadline: body.deadline,
      estimatedHours: body.estimatedHours ?? 2,
      priority: body.priority ?? "medium",
      status: "pending",
      riskLevel: "watch",
      category: body.category ?? "general",
      subtasks: body.subtasks ?? [],
      scheduledBlocks: [],
      rescheduleHistory: [],
      tags: body.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    const id = await createTask(newTask);
    return NextResponse.json({ id, ...newTask });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { taskId, updates } = await req.json() as { taskId: string; updates: Partial<Task> };
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    await updateTask(taskId, updates);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    await deleteTask(taskId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
