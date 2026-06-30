"use client";

import { useState } from "react";
import { X, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface Props {
  onAdd: (task: Omit<Task, "id" | "userId" | "status" | "riskLevel" | "scheduledBlocks" | "rescheduleHistory" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}

const CATEGORIES = ["assignment", "project", "meeting", "exam", "personal", "work", "other"];

export default function AddTaskModal({ onAdd, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [category, setCategory] = useState("assignment");
  const [priority, setPriority] = useState<Task["priority"]>("medium");

  function handleSubmit() {
    if (!title.trim() || !deadline) return;
    onAdd({
      title: title.trim(),
      description,
      deadline: new Date(deadline).toISOString(),
      estimatedHours,
      priority,
      category,
      subtasks: [],
      tags: [],
      aiReasoning: undefined,
    });
    onClose();
  }

  // Minimum datetime = now
  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md space-y-5 animate-in">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Add Task</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-fog mb-1.5 block">Task title *</label>
            <input
              autoFocus
              className="input"
              placeholder="e.g. Submit assignment 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-fog mb-1.5 block">Description</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fog mb-1.5 block">Deadline *</label>
              <input
                type="datetime-local"
                className="input"
                min={minDateTime}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-fog mb-1.5 block">Estimated hours</label>
              <input
                type="number"
                className="input"
                min={0.5}
                max={24}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fog mb-1.5 block">Category</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-fog mb-1.5 block">Priority</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
              >
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !deadline}
            className="btn-primary flex-1 justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}
