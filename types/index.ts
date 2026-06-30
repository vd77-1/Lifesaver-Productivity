// ─── Task Types ───────────────────────────────────────────────────────────────

export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue" | "snoozed";
export type RiskLevel = "safe" | "watch" | "at_risk" | "overdue";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  deadline: string; // ISO string
  estimatedHours: number;
  priority: Priority;
  status: TaskStatus;
  riskLevel: RiskLevel;
  category: string; // "assignment" | "meeting" | "project" | "personal" | "work" | etc.
  subtasks: Subtask[];
  scheduledBlocks: TimeBlock[];
  aiReasoning?: string; // Why AI prioritized this way
  rescheduleHistory: RescheduleEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  calendarEventId?: string; // Google Calendar event ID
  tags: string[];
}

// ─── Time & Schedule Types ─────────────────────────────────────────────────────

export interface TimeBlock {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  type: "deep_work" | "review" | "buffer" | "break";
  calendarEventId?: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  blocks: TimeBlock[];
  aiSummary: string;
  workloadScore: number; // 0-100
  workloadLabel: "comfortable" | "busy" | "overloaded";
  tasksScheduled: string[]; // task IDs
  generatedAt: string;
  calendarEvents?: CalendarEvent[];
}

export interface RescheduleEvent {
  timestamp: string;
  reason: string;
  fromTime: string;
  toTime: string;
  triggeredBy: "user" | "ai" | "deadline_change";
}

// ─── Calendar Types ────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  source: "google_calendar" | "lifesaver";
}

// ─── AI Response Types ─────────────────────────────────────────────────────────

export interface AIPrioritizationResult {
  rankedTasks: Array<{
    taskId: string;
    priority: Priority;
    riskLevel: RiskLevel;
    reasoning: string;
    urgencyScore: number; // 0-100
    suggestedSchedule?: string;
  }>;
  overallInsight: string;
  deadlineRisks: string[];
  recommendations: string[];
}

export interface AIDailyPlanResult {
  blocks: Omit<TimeBlock, "id">[];
  summary: string;
  workloadScore: number;
  workloadLabel: "comfortable" | "busy" | "overloaded";
  reasoning: string;
  warnings: string[];
}

export interface AIRescueResult {
  atRiskTasks: Array<{
    taskId: string;
    taskTitle: string;
    riskReason: string;
    suggestedAction: string;
    newSchedule?: string;
  }>;
  rescueplan: string;
  confidence: number; // 0-1
}

export interface AIWhatIfResult {
  scenario: string;
  impactedTasks: Array<{
    taskId: string;
    taskTitle: string;
    impact: string;
    newRiskLevel: RiskLevel;
  }>;
  overallImpact: string;
  suggestion: string;
  revisedPlan?: string;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actionTaken?: string; // e.g. "rescheduled 2 tasks"
}

// ─── User Types ────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  googleAccessToken?: string; // For Calendar API
  googleRefreshToken?: string;
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: string;
}

export interface UserPreferences {
  workStartHour: number; // 8 = 8 AM
  workEndHour: number;   // 22 = 10 PM
  peakHours: number[];   // [9, 10, 20, 21] = peak focus hours
  timezone: string;
  dailyBriefingEnabled: boolean;
  calendarConnected: boolean;
}

export interface UserStats {
  tasksCompleted: number;
  tasksOnTime: number;
  currentStreak: number;
  longestStreak: number;
  productivityScore: number; // 0-100
  lastUpdated: string;
}

// ─── Store Types ───────────────────────────────────────────────────────────────

export interface AppState {
  tasks: Task[];
  todayPlan: DailyPlan | null;
  chatHistory: AIChatMessage[];
  user: UserProfile | null;
  calendarEvents: CalendarEvent[];
  isLoading: boolean;
  aiThinking: boolean;
}
