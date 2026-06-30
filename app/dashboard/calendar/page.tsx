"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { cn, formatShortTime } from "@/lib/utils";
import { Calendar, RefreshCw, Sparkles, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { AIDailyPlanResult, TimeBlock } from "@/types";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7am to 10pm

function blockColor(type: TimeBlock["type"]) {
  const map = {
    deep_work: "bg-glow/20 border-glow/40 text-glow",
    review: "bg-calm/15 border-calm/30 text-calm",
    buffer: "bg-fog/10 border-fog/20 text-fog",
    break: "bg-pulse/10 border-pulse/20 text-pulse",
  };
  return map[type] ?? "bg-slate border-white/10 text-snow";
}

export default function CalendarPage() {
  const { tasks, calendarEvents, user } = useAppStore();
  const [plan, setPlan] = useState<AIDailyPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  async function generatePlan() {
    if (!tasks.filter(t => t.status !== "completed").length) return toast("Add tasks first!");
    setLoading(true);
    try {
      const res = await fetch("/api/gemini/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter(t => t.status !== "completed"),
          date: selectedDate,
          calendarEvents,
          preferences: user?.preferences,
        }),
      });
      const data: AIDailyPlanResult = await res.json();
      setPlan(data);
      toast.success("Daily plan generated!");
    } catch {
      toast.error("Plan generation failed");
    } finally {
      setLoading(false);
    }
  }

  const workloadColor = plan
    ? plan.workloadLabel === "comfortable" ? "text-pulse"
      : plan.workloadLabel === "busy" ? "text-warn"
      : "text-risk"
    : "";

  const todayEvents = calendarEvents.filter((e) => {
    const d = new Date(e.startTime);
    return d.toISOString().split("T")[0] === selectedDate;
  });

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl">Daily Planner</h1>
          <p className="text-fog text-sm mt-1">AI-generated schedule based on your tasks and calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input py-2 text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button onClick={generatePlan} disabled={loading} className="btn-primary">
            {loading
              ? <div className="ai-thinking flex gap-1"><span /><span /><span /></div>
              : <Sparkles className="w-4 h-4" />}
            Generate Plan
          </button>
        </div>
      </div>

      {/* Plan summary */}
      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="ai-chip"><Sparkles className="w-3 h-3" /> AI Plan Summary</span>
              <span className={cn("ml-auto text-sm font-semibold", workloadColor)}>
                {plan.workloadLabel.charAt(0).toUpperCase() + plan.workloadLabel.slice(1)}
              </span>
            </div>
            <p className="text-sm text-cloud">{plan.summary}</p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-glow/5 border border-glow/15">
              <Sparkles className="w-3.5 h-3.5 text-glow mt-0.5 flex-shrink-0" />
              <p className="text-xs text-cloud">{plan.reasoning}</p>
            </div>
            {plan.warnings.length > 0 && (
              <div className="space-y-1.5">
                {plan.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-warn">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <p className="text-sm font-medium">Workload</p>
            <div className="text-3xl font-display font-bold">{plan.workloadScore}<span className="text-lg text-fog">/100</span></div>
            <div className="w-full h-2 bg-slate rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  plan.workloadLabel === "comfortable" ? "bg-pulse" :
                  plan.workloadLabel === "busy" ? "bg-warn" : "bg-risk"
                )}
                style={{ width: `${plan.workloadScore}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-1 text-center mt-2">
              {[
                { label: "Blocks", value: plan.blocks.filter(b => b.type === "deep_work").length },
                { label: "Breaks", value: plan.blocks.filter(b => b.type === "break").length },
                { label: "Hours", value: Math.round(plan.blocks.reduce((acc, b) => {
                  return acc + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3600000;
                }, 0) * 10) / 10 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate rounded-lg py-2">
                  <div className="font-mono font-bold text-lg">{value}</div>
                  <div className="text-xs text-fog">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-fog" />
          <h2 className="font-display font-semibold text-base">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h2>
        </div>

        <div className="space-y-1">
          {HOURS.map((hour) => {
            const hourBlocks = plan?.blocks.filter((b) => {
              const bHour = new Date(b.startTime).getHours();
              return bHour === hour;
            }) ?? [];

            const calBlocks = todayEvents.filter((e) => {
              const eHour = new Date(e.startTime).getHours();
              return eHour === hour;
            });

            return (
              <div key={hour} className="flex gap-3 min-h-[44px]">
                <div className="w-14 flex-shrink-0 text-xs text-fog font-mono pt-1 text-right">
                  {hour % 12 || 12}{hour < 12 ? "am" : "pm"}
                </div>
                <div className="flex-1 border-t border-white/5 pt-1 space-y-1">
                  {hourBlocks.map((block, i) => (
                    <div key={i} className={cn("time-block", blockColor(block.type))}>
                      <span className="font-medium">{block.taskTitle}</span>
                      <span className="ml-2 opacity-60">
                        {formatShortTime(block.startTime)} – {formatShortTime(block.endTime)}
                      </span>
                      <span className="ml-2 opacity-60 capitalize">({block.type.replace("_", " ")})</span>
                    </div>
                  ))}
                  {calBlocks.map((event) => (
                    <div key={event.id} className="time-block bg-blue-500/10 border-blue-500/30 text-blue-300">
                      📅 {event.title} · {formatShortTime(event.startTime)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!plan && (
          <div className="text-center py-8 text-fog">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Click "Generate Plan" to build your AI schedule</p>
          </div>
        )}
      </div>
    </div>
  );
}
