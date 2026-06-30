"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/planner", icon: ListTodo, label: "Planner" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
  { href: "/dashboard/chat", icon: MessageSquare, label: "AI Agent" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, tasks, sidebarOpen, setSidebarOpen } = useAppStore();

  const atRiskCount = tasks.filter(
    (t) => t.status !== "completed" && (t.riskLevel === "at_risk" || t.riskLevel === "overdue")
  ).length;

  async function handleSignOut() {
    await signOut(auth);
    toast.success("Signed out");
    router.push("/");
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-ink border-r border-white/5 flex flex-col z-40 transition-all duration-300",
        sidebarOpen ? "w-56" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-white/5">
        <div className="w-7 h-7 rounded-lg bg-pulse/20 flex items-center justify-center flex-shrink-0 glow-pulse">
          <Zap className="w-3.5 h-3.5 text-pulse" />
        </div>
        {sidebarOpen && (
          <span className="font-display font-bold text-sm tracking-tight truncate">LifeSaver</span>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn("ml-auto text-fog hover:text-snow transition-colors flex-shrink-0", !sidebarOpen && "ml-0 w-full flex justify-center")}
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                active
                  ? "bg-pulse/10 text-pulse font-medium"
                  : "text-fog hover:text-snow hover:bg-slate",
                !sidebarOpen && "justify-center px-0"
              )}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {/* At-risk badge on Planner */}
              {label === "Planner" && atRiskCount > 0 && sidebarOpen && (
                <span className="ml-auto flex items-center gap-1 text-xs bg-risk/20 text-risk px-1.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {atRiskCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: User + Signout */}
      <div className="p-2 border-t border-white/5 space-y-0.5">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-fog hover:text-snow hover:bg-slate transition-all",
            !sidebarOpen && "justify-center px-0"
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-fog hover:text-risk transition-all",
            !sidebarOpen && "justify-center px-0"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span>Sign out</span>}
        </button>

        {sidebarOpen && user && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <div className="w-6 h-6 rounded-full bg-glow/20 flex items-center justify-center text-xs font-bold text-glow flex-shrink-0">
              {user.displayName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="text-xs text-fog truncate">{user.displayName ?? user.email}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
