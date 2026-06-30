"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { upsertUserProfile } from "@/lib/db";
import { Settings, Calendar, Bell, User, Save, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, setUser } = useAppStore();
  const prefs = user?.preferences;

  const [workStart, setWorkStart] = useState(prefs?.workStartHour ?? 8);
  const [workEnd, setWorkEnd] = useState(prefs?.workEndHour ?? 22);
  const [briefingEnabled, setBriefingEnabled] = useState(prefs?.dailyBriefingEnabled ?? true);
  const [saving, setSaving] = useState(false);

  async function savePrefs() {
    if (!user) return;
    setSaving(true);
    try {
      const updated = {
        ...user,
        preferences: {
          ...user.preferences,
          workStartHour: workStart,
          workEndHour: workEnd,
          dailyBriefingEnabled: briefingEnabled,
        },
      };
      await upsertUserProfile(user.uid, updated);
      setUser(updated);
      toast.success("Settings saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl">Settings</h1>
        <p className="text-fog text-sm mt-1">Personalize your LifeSaver experience</p>
      </div>

      {/* Profile */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-fog" />
          <h2 className="font-display font-semibold text-base">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-glow/20 flex items-center justify-center text-lg font-bold text-glow">
            {user?.displayName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-medium">{user?.displayName ?? "User"}</p>
            <p className="text-fog text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Work Hours */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-fog" />
          <h2 className="font-display font-semibold text-base">Work Preferences</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-fog mb-1.5 block">Work start time</label>
            <select className="input" value={workStart} onChange={(e) => setWorkStart(+e.target.value)}>
              {Array.from({ length: 18 }, (_, i) => i + 5).map((h) => (
                <option key={h} value={h}>{h % 12 || 12}:00 {h < 12 ? "AM" : "PM"}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-fog mb-1.5 block">Work end time</label>
            <select className="input" value={workEnd} onChange={(e) => setWorkEnd(+e.target.value)}>
              {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => (
                <option key={h} value={h}>{h % 12 || 12}:00 {h < 12 ? "AM" : "PM"}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-fog" />
          <h2 className="font-display font-semibold text-base">Notifications</h2>
        </div>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Daily AI Briefing</p>
            <p className="text-xs text-fog mt-0.5">Get a morning summary of your day's tasks</p>
          </div>
          <button
            onClick={() => setBriefingEnabled(!briefingEnabled)}
            className={`w-11 h-6 rounded-full transition-colors ${briefingEnabled ? "bg-pulse" : "bg-slate"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-void mx-1 transition-transform ${briefingEnabled ? "translate-x-5" : ""}`} />
          </button>
        </label>
      </div>

      {/* Google Calendar */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-fog" />
          <h2 className="font-display font-semibold text-base">Google Calendar</h2>
        </div>
        {prefs?.calendarConnected ? (
          <div className="flex items-center gap-2 text-sm text-pulse">
            <div className="w-2 h-2 rounded-full bg-pulse" />
            Connected — your calendar events are synced
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-fog">Connect your Google Calendar to let AI plan around your existing events.</p>
            <p className="text-xs text-fog/60">Sign in with Google on the login page to grant calendar access.</p>
          </div>
        )}
      </div>

      {/* Google Tech Stack */}
      <div className="card p-5 space-y-3">
        <h2 className="font-display font-semibold text-base">Powered by Google</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "Google Gemini 1.5 Flash", desc: "AI planning & reasoning" },
            { name: "Firebase Auth", desc: "Google Sign-In" },
            { name: "Cloud Firestore", desc: "Real-time database" },
            { name: "Google Calendar API", desc: "Calendar sync" },
            { name: "Google Cloud Run", desc: "Serverless deployment" },
            { name: "Firebase Hosting", desc: "Frontend hosting" },
          ].map(({ name, desc }) => (
            <div key={name} className="bg-slate rounded-lg p-3">
              <p className="text-xs font-medium text-snow">{name}</p>
              <p className="text-xs text-fog mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={savePrefs} disabled={saving} className="btn-primary">
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
