"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { createTask, updateTask, deleteTask } from "@/lib/db";
import { computeRiskLevel } from "@/lib/utils";
import TaskCard from "@/components/ui/TaskCard";
import AddTaskModal from "@/components/ui/AddTaskModal";
import {
  Plus, Shield, Sparkles, Filter, SortAsc, AlertTriangle,
  CheckCircle2, Clock, Search
} from "lucide-react";
import toast from "react-hot-toast";
import type { Task, AIRescueResult, AIPrioritizationResult } from "@/types";

type Filter = "all" | "active" | "at_risk" | "completed";
type Sort = "deadline" | "priority" | "risk";

export default function PlannerPage() {
  const { tasks, user, calendarEvents, addTask, updateTask: storeUpdate, removeTask, setTasks } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<Filter>("active");
  const [sort, setSort] = useState<Sort>("deadline");
  const [search, setSearch] = useState("");
  const [rescueResult, setRescueResult] = useState<AIRescueResult | null>(null);
  const [priorityResult, setPriorityResult] = useState<AIPrioritizationResult | null>(null);
  const [loadingRescue, setLoadingRescue] = useState(false);
  const [loadingPriority, setLoadingPriority] = useState(false);

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const riskOrder = { overdue: 0, at_risk: 1, watch: 2, safe: 3 };

  const filtered = tasks
    .filter((t) => {
      if (filter === "active") return t.status !== "completed";
      if (filter === "at_risk") return t.riskLevel === "at_risk" || t.riskLevel === "overdue";
      if (filter === "completed") return t.status === "completed";
      return true;
    })
    .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sort === "priority") return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sort === "risk") return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      return 0;
    });

  async function handleAddTask(taskData: Omit<Task, "id" | "userId" | "status" | "riskLevel" | "scheduledBlocks" | "rescheduleHistory" | "createdAt" | "updatedAt">) {
    if (!user) return toast.error("Not signed in");
    try {
      const now = new Date().toISOString();
      const full: Omit<Task, "id"> = {
        ...taskData,
        userId: user.uid,
        status: "pending",
        riskLevel: "watch",
        scheduledBlocks: [],
        rescheduleHistory: [],
        createdAt: now,
        updatedAt: now,
      };
      const id = await createTask(full);
      const newTask: Task = { ...full, id, riskLevel: computeRiskLevel({ ...full, id }) };
      addTask(newTask);
      toast.success("Task added");
    } catch {
      toast.error("Failed to add task");
    }
  }

  async function handleComplete(taskId: string) {
    try {
      await updateTask(taskId, { status: "completed", completedAt: new Date().toISOString() });
      storeUpdate(taskId, { status: "completed" });
      toast.success("Task completed! 🎉");
    } catch {
      toast.error("Update failed");
    }
  }

  async function handleDelete(taskId: string) {
    try {
      await deleteTask(taskId);
      removeTask(taskId);
      toast.success("Task deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  async function runRescue() {
    if (!tasks.length) return toast("No tasks to analyze");
    setLoadingRescue(true);
    try {
      const res = await fetch("/api/gemini/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      const data: AIRescueResult = await res.json();
      setRescueResult(data);
      if (data.atRiskTasks.length === 0) toast.success("All tasks are on track!");
      else toast.error(`${data.atRiskTasks.length} tasks need attention`);
    } catch {
      toast.error("Rescue analysis failed");
    } finally {
      setLoadingRescue(false);
    }
  }

  async function runPrioritize() {
    if (!tasks.length) return toast("No tasks to analyze");
    setLoadingPriority(true);
    try {
      const res = await fetch("/api/gemini/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, calendarEvents }),
      });
      const data: AIPrioritizationResult = await res.json();
      setPriorityResult(data);

      // Apply AI priorities back to tasks
      const updated = tasks.map((t) => {
        const aiTask = data.rankedTasks.find((r) => r.taskId === t.id);
        if (aiTask) return { ...t, priority: aiTask.priority, riskLevel: aiTask.riskLevel };
        return t;
      });
      setTasks(updated);
      toast.success("Tasks re-prioritized by AI");
    } catch {
      toast.error("Prioritization failed");
    } finally {
      setLoadingPriority(false);
    }
  }

  const aiReasoningMap = priorityResult
    ? Object.fromEntries(priorityResult.rankedTasks.map((r) => [r.taskId, r.reasoning]))
    : {};

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Task Planner</h1>
          <p className="text-fog text-sm mt-1">{tasks.filter((t) => t.status !== "completed").length} active tasks</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runRescue} disabled={loadingRescue} className="btn-danger">
            {loadingRescue ? <div className="ai-thinking flex gap-1"><span /><span /><span /></div> : <Shield className="w-4 h-4" />}
            Rescue Mode
          </button>
          <button onClick={runPrioritize} disabled={loadingPriority} className="btn-secondary">
            {loadingPriority ? <div className="ai-thinking flex gap-1"><span /><span /><span /></div> : <Sparkles className="w-4 h-4" />}
            AI Prioritize
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Rescue Mode Result */}
      {rescueResult && rescueResult.atRiskTasks.length > 0 && (
        <div className="card p-5 border-risk/30 bg-risk/5 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-risk" />
            <h2 className="font-display font-semibold text-base text-risk">Rescue Mode Active</h2>
            <span className="ai-chip ml-auto">AI Analysis</span>
          </div>
          <p className="text-sm text-cloud">{rescueResult.rescueplan}</p>
          <div className="space-y-3">
            {rescueResult.atRiskTasks.map((item) => (
              <div key={item.taskId} className="p-3 rounded-lg bg-slate border border-warn/20 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-warn" />
                  <span className="text-sm font-medium text-warn">{item.taskTitle}</span>
                </div>
                <p className="text-xs text-fog pl-5">{item.riskReason}</p>
                <p className="text-xs text-cloud pl-5 font-medium">→ {item.suggestedAction}</p>
                {item.newSchedule && (
                  <p className="text-xs text-calm pl-5">Suggested: {item.newSchedule}</p>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setRescueResult(null)} className="btn-ghost text-xs">Dismiss</button>
        </div>
      )}

      {rescueResult && rescueResult.atRiskTasks.length === 0 && (
        <div className="card p-4 border-pulse/20 bg-pulse/5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-pulse" />
          <p className="text-sm text-pulse">{rescueResult.rescueplan}</p>
          <button onClick={() => setRescueResult(null)} className="ml-auto btn-ghost text-xs">Dismiss</button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fog" />
          <input
            className="input pl-9 py-2 text-xs"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-slate rounded-lg p-1">
          {(["all", "active", "at_risk", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                filter === f ? "bg-pulse text-void" : "text-fog hover:text-snow"
              )}
            >
              {f === "at_risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select
          className="input py-2 text-xs w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          <option value="deadline">Sort: Deadline</option>
          <option value="priority">Sort: Priority</option>
          <option value="risk">Sort: Risk</option>
        </select>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock className="w-10 h-10 mx-auto mb-3 text-fog opacity-30" />
          <p className="text-fog">No tasks found. Add one to get started.</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4 mx-auto">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              aiReasoning={aiReasoningMap[task.id]}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTaskModal onAdd={handleAddTask} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
