"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { cn, getRiskColor } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Sparkles, FlaskConical, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import type { AIWhatIfResult } from "@/types";

const RISK_COLORS = { safe: "#4CC9F0", watch: "#FBBF24", at_risk: "#FF6B35", overdue: "#FF2D55" };
const PRIORITY_COLORS = { critical: "#FF2D55", high: "#FF6B35", medium: "#FBBF24", low: "#8892A4" };

export default function AnalyticsPage() {
  const { tasks, user } = useAppStore();
  const [whatIfScenario, setWhatIfScenario] = useState("");
  const [whatIfResult, setWhatIfResult] = useState<AIWhatIfResult | null>(null);
  const [loadingWhatIf, setLoadingWhatIf] = useState(false);

  // Chart data
  const riskData = Object.entries(
    tasks.reduce((acc, t) => {
      acc[t.riskLevel] = (acc[t.riskLevel] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const priorityData = Object.entries(
    tasks.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, fill: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS] }));

  // Category breakdown
  const categoryData = Object.entries(
    tasks.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const completionRate = tasks.length
    ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100)
    : 0;

  async function runWhatIf() {
    if (!whatIfScenario.trim()) return toast("Describe a scenario first");
    setLoadingWhatIf(true);
    try {
      const res = await fetch("/api/gemini/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: whatIfScenario, tasks }),
      });
      const data: AIWhatIfResult = await res.json();
      setWhatIfResult(data);
    } catch {
      toast.error("Simulation failed");
    } finally {
      setLoadingWhatIf(false);
    }
  }

  const stats = user?.stats;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-display font-bold text-2xl">Analytics</h1>
        <p className="text-fog text-sm mt-1">Productivity insights and AI scenario simulation</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Productivity Score", value: `${stats?.productivityScore ?? 0}`, sub: "out of 100", color: "text-pulse" },
          { label: "Completion Rate", value: `${completionRate}%`, sub: `${tasks.filter(t => t.status === "completed").length} done`, color: "text-calm" },
          { label: "Current Streak", value: `${stats?.currentStreak ?? 0}d`, sub: `Best: ${stats?.longestStreak ?? 0}d`, color: "text-glow" },
          { label: "On-time Rate", value: tasks.length ? `${Math.round((stats?.tasksOnTime ?? 0) / Math.max(stats?.tasksCompleted ?? 1, 1) * 100)}%` : "—", sub: "tasks on time", color: "text-warn" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-fog mb-1">{label}</p>
            <p className={cn("font-display font-bold text-2xl", color)}>{value}</p>
            <p className="text-xs text-fog mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk distribution */}
        <div className="card p-5 space-y-4">
          <h2 className="font-display font-semibold text-base">Risk Distribution</h2>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {riskData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] ?? "#8892A4"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1A2236", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#EEF2F7" }}
                />
                <Legend formatter={(v) => <span style={{ color: "#8892A4", fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-fog text-sm">No task data yet</div>
          )}
        </div>

        {/* Priority breakdown */}
        <div className="card p-5 space-y-4">
          <h2 className="font-display font-semibold text-base">By Priority</h2>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1A2236", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-fog text-sm">No task data yet</div>
          )}
        </div>
      </div>

      {/* What-If Simulator */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-glow" />
          <h2 className="font-display font-semibold text-base">What-If Simulator</h2>
          <span className="ai-chip ml-auto">Gemini AI</span>
        </div>
        <p className="text-sm text-fog">
          Ask "what if?" questions to see how hypothetical changes would affect your deadlines and priorities.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            "What if I skip today's study session?",
            "What if I spend 3 extra hours on my project?",
            "What if my meeting runs 2 hours over?",
            "What if I take tomorrow off?",
            "What if I finish the assignment early?",
            "What if I get sick for 2 days?",
          ].map((p) => (
            <button
              key={p}
              onClick={() => setWhatIfScenario(p)}
              className={cn(
                "text-left text-xs p-2.5 rounded-lg border transition-all",
                whatIfScenario === p
                  ? "bg-glow/10 border-glow/40 text-glow"
                  : "bg-slate border-white/5 text-fog hover:text-snow hover:border-white/20"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Or type your own scenario..."
            value={whatIfScenario}
            onChange={(e) => setWhatIfScenario(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runWhatIf()}
          />
          <button onClick={runWhatIf} disabled={loadingWhatIf || !whatIfScenario.trim()} className="btn-primary">
            {loadingWhatIf
              ? <div className="ai-thinking flex gap-1"><span /><span /><span /></div>
              : <><Sparkles className="w-4 h-4" />Simulate</>
            }
          </button>
        </div>

        {whatIfResult && (
          <div className="space-y-4 border-t border-white/5 pt-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-glow/5 border border-glow/15">
              <Sparkles className="w-4 h-4 text-glow mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-glow mb-1">Scenario: {whatIfResult.scenario}</p>
                <p className="text-sm text-cloud">{whatIfResult.overallImpact}</p>
              </div>
            </div>

            {whatIfResult.impactedTasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-fog font-medium uppercase tracking-wider">Impacted Tasks</p>
                {whatIfResult.impactedTasks.map((item) => (
                  <div key={item.taskId} className={cn("p-3 rounded-lg border text-sm", getRiskColor(item.newRiskLevel))}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-medium">{item.taskTitle}</span>
                      <span className="ml-auto text-xs opacity-70">{item.newRiskLevel}</span>
                    </div>
                    <p className="text-xs opacity-80 pl-5">{item.impact}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-pulse/5 border border-pulse/15">
              <CheckCircle2 className="w-4 h-4 text-pulse mt-0.5 flex-shrink-0" />
              <p className="text-sm text-cloud">{whatIfResult.suggestion}</p>
            </div>

            {whatIfResult.revisedPlan && (
              <div className="p-3 rounded-lg bg-slate border border-white/5">
                <p className="text-xs text-fog font-medium mb-1">Revised Plan</p>
                <p className="text-sm text-cloud">{whatIfResult.revisedPlan}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
