import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Task, RiskLevel, Priority } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeUntilDeadline(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return "Overdue";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 48) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getRiskColor(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    safe: "text-calm",
    watch: "text-yellow-400",
    at_risk: "text-warn",
    overdue: "text-risk",
  };
  return map[risk];
}

export function getRiskBg(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    safe: "bg-calm/10 border-calm/20",
    watch: "bg-yellow-400/10 border-yellow-400/20",
    at_risk: "bg-warn/10 border-warn/20",
    overdue: "bg-risk/10 border-risk/20",
  };
  return map[risk];
}

export function getPriorityColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    critical: "text-risk",
    high: "text-warn",
    medium: "text-yellow-400",
    low: "text-fog",
  };
  return map[priority];
}

export function getPriorityDot(priority: Priority): string {
  const map: Record<Priority, string> = {
    critical: "bg-risk",
    high: "bg-warn",
    medium: "bg-yellow-400",
    low: "bg-fog",
  };
  return map[priority];
}

export function getWorkloadColor(score: number): string {
  if (score >= 80) return "text-risk";
  if (score >= 60) return "text-warn";
  return "text-pulse";
}

export function computeRiskLevel(task: Task): RiskLevel {
  if (task.status === "completed") return "safe";
  const hoursLeft = (new Date(task.deadline).getTime() - Date.now()) / 3600000;
  if (hoursLeft < 0) return "overdue";
  if (hoursLeft < task.estimatedHours * 1.5) return "at_risk";
  if (hoursLeft < task.estimatedHours * 3) return "watch";
  return "safe";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
