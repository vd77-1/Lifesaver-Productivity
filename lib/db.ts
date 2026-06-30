import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Task, DailyPlan, UserProfile, AIChatMessage } from "@/types";

// ─── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(userId: string): Promise<Task[]> {
  const q = query(
    collection(db, "tasks"),
    where("userId", "==", userId),
    orderBy("deadline", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

export async function createTask(task: Omit<Task, "id">): Promise<string> {
  const ref = doc(collection(db, "tasks"));
  await setDoc(ref, { ...task, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return ref.id;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", taskId));
}

// ─── Daily Plans ───────────────────────────────────────────────────────────────

export async function getDailyPlan(userId: string, date: string): Promise<DailyPlan | null> {
  const ref = doc(db, "dailyPlans", `${userId}_${date}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as DailyPlan;
}

export async function saveDailyPlan(plan: DailyPlan): Promise<void> {
  const ref = doc(db, "dailyPlans", `${plan.userId}_${plan.date}`);
  await setDoc(ref, plan);
}

// ─── User Profile ──────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function upsertUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(ref, data, { merge: true });
}

// ─── Chat History ──────────────────────────────────────────────────────────────

export async function getChatHistory(userId: string): Promise<AIChatMessage[]> {
  const q = query(
    collection(db, "chatHistory"),
    where("userId", "==", userId),
    orderBy("timestamp", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AIChatMessage);
}

export async function saveChatMessage(userId: string, message: AIChatMessage): Promise<void> {
  const ref = doc(collection(db, "chatHistory"));
  await setDoc(ref, { ...message, userId });
}
