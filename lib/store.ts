import { create } from "zustand";
import type { Task, DailyPlan, AIChatMessage, UserProfile, CalendarEvent } from "@/types";

interface AppStore {
  // State
  tasks: Task[];
  todayPlan: DailyPlan | null;
  chatHistory: AIChatMessage[];
  user: UserProfile | null;
  calendarEvents: CalendarEvent[];
  isLoading: boolean;
  aiThinking: boolean;
  sidebarOpen: boolean;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setTodayPlan: (plan: DailyPlan | null) => void;
  addChatMessage: (msg: AIChatMessage) => void;
  setChatHistory: (history: AIChatMessage[]) => void;
  setUser: (user: UserProfile | null) => void;
  setCalendarEvents: (events: CalendarEvent[]) => void;
  setLoading: (v: boolean) => void;
  setAiThinking: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  tasks: [],
  todayPlan: null,
  chatHistory: [],
  user: null,
  calendarEvents: [],
  isLoading: false,
  aiThinking: false,
  sidebarOpen: true,

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  setTodayPlan: (plan) => set({ todayPlan: plan }),
  addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  setChatHistory: (history) => set({ chatHistory: history }),
  setUser: (user) => set({ user }),
  setCalendarEvents: (events) => set({ calendarEvents: events }),
  setLoading: (isLoading) => set({ isLoading }),
  setAiThinking: (aiThinking) => set({ aiThinking }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
