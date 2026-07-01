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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/");
        return;
      }
      setLoading(true);
      try {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) setUser(profile);

        const tasks = await getTasks(firebaseUser.uid);
        const tasksWithRisk = tasks.map((t) => ({ ...t, riskLevel: computeRiskLevel(t) }));
        setTasks(tasksWithRisk);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
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
