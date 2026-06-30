"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { getUserProfile, getTasks } from "@/lib/db";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { computeRiskLevel } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { sidebarOpen, setUser, setTasks, setLoading } = useAppStore();
  const [authChecked, setAuthChecked] = useState(false);

  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
  //     if (!firebaseUser) {
  //       router.push("/");
  //       return;
  //     }
  //     setLoading(true);
  //     try {
  //       const profile = await getUserProfile(firebaseUser.uid);
  //       if (profile) setUser(profile);

  //       const tasks = await getTasks(firebaseUser.uid);
  //       const tasksWithRisk = tasks.map((t) => ({ ...t, riskLevel: computeRiskLevel(t) }));
  //       setTasks(tasksWithRisk);
  //     } catch (err) {
  //       console.error("Init error:", err);
  //     } finally {
  //       setLoading(false);
  //       setAuthChecked(true);
  //     }
  //   });
  //   return () => unsub();
  // }, []);

  useEffect(() => {
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (demo) {
    setUser({
      uid: "demo-user",
      email: "demo@lifesaver.app",
      displayName: "Demo User",
      preferences: {
        workStartHour: 8,
        workEndHour: 22,
        peakHours: [9, 10, 20, 21],
        timezone: "Asia/Kolkata",
        dailyBriefingEnabled: true,
        calendarConnected: false,
      },
      stats: {
        tasksCompleted: 12,
        tasksOnTime: 9,
        currentStreak: 4,
        longestStreak: 7,
        productivityScore: 74,
        lastUpdated: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    });

    // Seed demo tasks
    const now = Date.now();
    setTasks([
      {
        id: "t1", userId: "demo-user", title: "Submit Assignment 2",
        description: "Data structures assignment", deadline: new Date(now + 18 * 3600000).toISOString(),
        estimatedHours: 3, priority: "critical", status: "pending", riskLevel: "at_risk",
        category: "assignment", subtasks: [], scheduledBlocks: [], rescheduleHistory: [], tags: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: "t2", userId: "demo-user", title: "Prepare for ML Interview",
        description: "Review ML concepts", deadline: new Date(now + 36 * 3600000).toISOString(),
        estimatedHours: 5, priority: "high", status: "pending", riskLevel: "watch",
        category: "work", subtasks: [], scheduledBlocks: [], rescheduleHistory: [], tags: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: "t3", userId: "demo-user", title: "DSA Problem Set",
        deadline: new Date(now + 72 * 3600000).toISOString(),
        estimatedHours: 2, priority: "medium", status: "pending", riskLevel: "safe",
        category: "assignment", subtasks: [], scheduledBlocks: [], rescheduleHistory: [], tags: [],
        description: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: "t4", userId: "demo-user", title: "Team Project Meeting Prep",
        deadline: new Date(now + 8 * 3600000).toISOString(),
        estimatedHours: 1, priority: "high", status: "pending", riskLevel: "at_risk",
        category: "meeting", subtasks: [], scheduledBlocks: [], rescheduleHistory: [], tags: [],
        description: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ]);

    setAuthChecked(true);
    return;
  }

  const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
    // ... rest of existing auth code unchanged
  });
  return () => unsub();
}, []);


  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="ai-thinking flex gap-1.5">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300 overflow-y-auto",
          sidebarOpen ? "ml-56" : "ml-16"
        )}
      >
        <div className="max-w-6xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
