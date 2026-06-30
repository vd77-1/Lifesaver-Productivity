"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { upsertUserProfile } from "@/lib/db";
import toast from "react-hot-toast";
import { Zap, Shield, Brain, Clock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // @ts-ignore - credential available on Google result
      const credential = result._tokenResponse;

      await upsertUserProfile(user.uid, {
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "User",
        photoURL: user.photoURL ?? undefined,
        googleAccessToken: credential?.oauthAccessToken,
        preferences: {
          workStartHour: 8,
          workEndHour: 22,
          peakHours: [9, 10, 20, 21],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dailyBriefingEnabled: true,
          calendarConnected: true,
        },
        stats: {
          tasksCompleted: 0,
          tasksOnTime: 0,
          currentStreak: 0,
          longestStreak: 0,
          productivityScore: 0,
          lastUpdated: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      });

      toast.success("Welcome to LifeSaver!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailAuth() {
    if (!email || !password) return toast.error("Enter email and password");
    setLoading(true);
    try {
      let user;
      if (mode === "login") {
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
        await upsertUserProfile(user.uid, {
          uid: user.uid,
          email: user.email ?? "",
          displayName: email.split("@")[0],
          preferences: {
            workStartHour: 8,
            workEndHour: 22,
            peakHours: [9, 10, 20, 21],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dailyBriefingEnabled: true,
            calendarConnected: false,
          },
          stats: {
            tasksCompleted: 0,
            tasksOnTime: 0,
            currentStreak: 0,
            longestStreak: 0,
            productivityScore: 0,
            lastUpdated: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
        });
      }
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 bg-glow-pulse pointer-events-none" />

      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left: Hero */}
        <div className="hidden lg:block space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-pulse/20 flex items-center justify-center glow-pulse">
                <Zap className="w-4 h-4 text-pulse" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">LifeSaver</span>
            </div>
            <h1 className="font-display font-bold text-4xl leading-tight mb-4">
              Beat deadlines{" "}
              <span className="gradient-text">before</span>
              <br />
              they beat you.
            </h1>
            <p className="text-fog text-lg leading-relaxed">
              An AI productivity companion that thinks ahead, reschedules smart, and keeps you on track — not just another reminder app.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Brain, color: "text-glow", title: "Agentic AI Planning", desc: "Gemini analyzes your workload and builds optimized daily schedules" },
              { icon: Shield, color: "text-warn", title: "Deadline Rescue Mode", desc: "AI detects at-risk tasks and creates recovery plans before it's too late" },
              { icon: Clock, color: "text-calm", title: "What-If Simulation", desc: "Ask \"what if I skip this?\" and get instant impact analysis" },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`mt-0.5 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-snow">{title}</div>
                  <div className="text-xs text-fog mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-fog">
            <div className="flex -space-x-1">
              {["G", "F", "C", "V"].map((l) => (
                <div key={l} className="w-6 h-6 rounded-full bg-slate border border-mist flex items-center justify-center text-[10px] font-bold text-cloud">
                  {l}
                </div>
              ))}
            </div>
            <span>Powered by Google Gemini · Firebase · Cloud Run</span>
          </div>
        </div>

        {/* Right: Auth form */}
        <div className="card p-8 space-y-6 max-w-sm mx-auto w-full">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-pulse/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-pulse" />
            </div>
            <span className="font-display font-bold text-base tracking-tight">LifeSaver</span>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-1">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <p className="text-fog text-sm">
              {mode === "login" ? "Welcome back." : "Start saving your deadlines."}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn-secondary w-full justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-fog text-xs">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Email form */}
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
              className="input"
            />
            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-center text-fog text-sm hover:text-cloud transition-colors"
          >
            {mode === "login" ? "No account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
