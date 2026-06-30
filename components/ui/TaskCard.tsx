"use client";

import { useState } from "react";
import { cn, formatTimeUntilDeadline, getRiskColor, getRiskBg, getPriorityColor, getPriorityDot } from "@/lib/utils";
import type { Task } from "@/types";
import { CheckCircle2, Trash2, ChevronDown, Clock, Brain } from "lucide-react";

interface Props {
  task: Task;
  aiReasoning?: string;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, aiReasoning, onComplete, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = task.riskLevel === "overdue";
  const isAtRisk = task.riskLevel === "at_risk";

  return (
    <div className={cn(
      "card transition-all duration-200 overflow-hidden",
      isOverdue && "border-l-2 border-l-risk",
      isAtRisk && "border-l-2 border-l-warn",
      task.riskLevel === "watch" && "border-l-2 border-l-yellow-400",
      task.riskLevel === "safe" && "border-l-2 border-l-calm",
      task.status === "completed" && "opacity-50"
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Complete button */}
          <button
            onClick={() => onComplete(task.id)}
            className={cn(
              "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all",
              task.status === "completed"
                ? "bg-pulse border-pulse text-void"
                : "border-fog hover:border-pulse"
            )}
          >
            {task.status === "completed" && <CheckCircle2 className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn("text-sm font-medium leading-snug", task.status === "completed" && "line-through text-fog")}>
                {task.title}
              </h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={cn("badge text-xs", getRiskBg(task.riskLevel), getRiskColor(task.riskLevel))}>
                  {formatTimeUntilDeadline(task.deadline)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={cn("flex items-center gap-1 text-xs", getPriorityColor(task.priority))}>
                <span className={cn("w-1.5 h-1.5 rounded-full", getPriorityDot(task.priority))} />
                {task.priority}
              </span>
              <span className="text-xs text-fog flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimatedHours}h
              </span>
              <span className="text-xs text-fog bg-slate px-2 py-0.5 rounded-full">{task.category}</span>
            </div>

            {/* AI Reasoning */}
            {aiReasoning && (
              <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-glow/5 border border-glow/15">
                <Brain className="w-3.5 h-3.5 text-glow mt-0.5 flex-shrink-0" />
                <p className="text-xs text-cloud leading-relaxed">{aiReasoning}</p>
              </div>
            )}

            {/* Subtasks */}
            {task.subtasks.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-2 text-xs text-fog hover:text-snow transition-colors"
              >
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
              </button>
            )}

            {expanded && task.subtasks.length > 0 && (
              <div className="mt-2 space-y-1.5 pl-1">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 text-xs text-fog">
                    <div className={cn("w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center",
                      sub.completed ? "bg-pulse/20 border-pulse" : "border-fog/40"
                    )}>
                      {sub.completed && <CheckCircle2 className="w-2.5 h-2.5 text-pulse" />}
                    </div>
                    <span className={sub.completed ? "line-through" : ""}>{sub.title}</span>
                    <span className="ml-auto text-fog/60">{sub.estimatedMinutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={() => onDelete(task.id)}
            className="flex-shrink-0 p-1.5 text-fog hover:text-risk transition-colors rounded-lg hover:bg-risk/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
