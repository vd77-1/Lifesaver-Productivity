"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getGreeting, formatTimeUntilDeadline, getRiskColor, getPriorityDot, cn } from "@/lib/utils";
import {
  Zap, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  RefreshCw, ChevronRight, Sparkles, Calendar
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { tasks, user, calendarEvents } = useAppStore();
  const [briefing, setBriefing] = useState<string>("");
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [priorityResult, setPriorityResult] = useState<any>(null);
  const [loadingPriority, setLoadingPriority] = useState(false);

  const pending = tasks.filter((t) => t.status !== "completed");
  const overdue = tasks.filter((t) => t.riskLevel === "overdue");
  const atRisk = tasks.filter((t) => t.riskLevel === "at_risk");
  const completed = tasks.filter((t) => t.status === "completed");
  const todayTasks = pending.filter((t) => {
    const diff = new Date(t.deadline).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600000;
  });

  async function fetchBriefing() {
    if (!tasks.length) return;
    setLoadingBriefing(true);
    try {
      const res = await fetch("/api/gemini/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          date: new Date().toISOString().split("T")[0],
          calendarEvents,
        }),
      });
      const data = await res.json();
      setBriefing(data.summary ?? "");
    } catch {
      toast.error("Could not fetch briefing");
    } finally {
      setLoadingBriefing(false);
    }
  }

  async function fetchPriorities() {
    if (!tasks.length) return toast("Add some tasks first!");
    setLoadingPriority(true);
    try {
      const res = await fetch("/api/gemini/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, calendarEvents }),
      });
      const data = await res.json();
      setPriorityResult(data);
      toast.success("AI analysis complete");
    } catch {
      toast.error("Analysis failed");
    } finally {
      setLoadingPriority(false);
    }
  }

  useEffect(() => {
    if (tasks.length > 0 && !briefing) fetchBriefing();
  }, [tasks.length]);

  const productivityScore = user?.stats?.productivityScore ?? 0;
  const streak = user?.stats?.currentStreak ?? 0;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">
            {getGreeting()}, {user?.displayName?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-fog text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={fetchPriorities}
          disabled={loadingPriority}
          className="btn-primary"
        >
          {loadingPriority ? (
            <div className="ai-thinking flex gap-1"><span /><span /><span /></div>
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          AI Analyze
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Tasks", value: pending.length, icon: Clock, color: "text-calm", bg: "bg-calm/10" },
          { label: "Due Today", value: todayTasks.length, icon: AlertTriangle, color: "text-warn", bg: "bg-warn/10" },
          { label: "At Risk", value: atRisk.length + overdue.length, icon: Zap, color: "text-risk", bg: "bg-risk/10" },
          { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-pulse", bg: "bg-pulse/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", bg)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <div className="font-display font-bold text-2xl">{value}</div>
            <div className="text-fog text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Briefing */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="ai-chip"><Sparkles className="w-3 h-3" /> AI Briefing</span>
            </div>
            <button onClick={fetchBriefing} className="btn-ghost text-xs">
              <RefreshCw className={cn("w-3.5 h-3.5", loadingBriefing && "animate-spin")} />
              Refresh
            </button>
          </div>

          {loadingBriefing ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-slate rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />
              ))}
            </div>
          ) : briefing ? (
            <p className="text-sm text-cloud leading-relaxed whitespace-pre-line">{briefing}</p>
          ) : (
            <div className="text-center py-6 text-fog">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Add tasks to get your AI briefing</p>
            </div>
          )}

          {/* Priority insights */}
          {priorityResult && (
            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-xs text-fog font-medium uppercase tracking-wider">AI Insights</p>
              <p className="text-sm text-cloud">{priorityResult.overallInsight}</p>
              {priorityResult.recommendations?.length > 0 && (
                <ul className="space-y-1.5">
                  {priorityResult.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-fog">
                      <span className="text-pulse mt-0.5">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Productivity score */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Productivity Score</span>
              <TrendingUp className="w-4 h-4 text-fog" />
            </div>
            <div className="font-display font-bold text-3xl gradient-text">{productivityScore}</div>
            <div className="w-full h-1.5 bg-slate rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pulse to-calm rounded-full transition-all duration-700"
                style={{ width: `${productivityScore}%` }}
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-fog">
              <Zap className="w-3 h-3 text-pulse" />
              {streak} day streak
            </div>
          </div>

          {/* At-risk tasks quick view */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Needs Attention</span>
              <Link href="/dashboard/planner" className="text-xs text-pulse hover:underline">
                View all
              </Link>
            </div>
            {[...overdue, ...atRisk].length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-pulse">
                <CheckCircle2 className="w-4 h-4" />
                All tasks are on track!
              </div>
            ) : (
              <div className="space-y-2">
                {[...overdue, ...atRisk].slice(0, 4).map((task) => (
                  <div key={task.id} className={cn("flex items-center gap-2 text-xs p-2 rounded-lg", task.riskLevel === "overdue" ? "bg-risk/10" : "bg-warn/10")}>
                    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", task.riskLevel === "overdue" ? "bg-risk" : "bg-warn")} />
                    <span className="truncate text-cloud">{task.title}</span>
                    <span className={cn("ml-auto flex-shrink-0", getRiskColor(task.riskLevel))}>
                      {formatTimeUntilDeadline(task.deadline)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card p-4 space-y-1">
            {[
              { href: "/dashboard/planner", label: "Manage Tasks", icon: Clock },
              { href: "/dashboard/chat", label: "Ask AI Agent", icon: Sparkles },
              { href: "/dashboard/calendar", label: "View Calendar", icon: Calendar },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate text-sm text-fog hover:text-snow transition-all group">
                <Icon className="w-4 h-4" />
                {label}
                <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Today's tasks */}
      {pending.length > 0 && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base">All Active Tasks</h2>
            <Link href="/dashboard/planner" className="btn-ghost text-xs">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 6).map((task) => (
              <div key={task.id} className={cn("flex items-center gap-3 p-3 rounded-lg bg-slate border border-white/5", `risk-${task.riskLevel}`)}>
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getPriorityDot(task.priority))} />
                <span className="text-sm text-snow truncate flex-1">{task.title}</span>
                <span className="text-xs text-fog">{task.category}</span>
                <span className={cn("text-xs font-mono flex-shrink-0", getRiskColor(task.riskLevel))}>
                  {formatTimeUntilDeadline(task.deadline)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
