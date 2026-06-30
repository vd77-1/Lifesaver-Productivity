import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  Task,
  CalendarEvent,
  AIPrioritizationResult,
  AIDailyPlanResult,
  AIRescueResult,
  AIWhatIfResult,
  UserPreferences,
} from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getModel() {
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  });
}

function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    console.error("JSON parse failed:", text);
    return fallback;
  }
}

function formatTasksForPrompt(tasks: Task[]): string {
  return tasks
    .filter((t) => t.status !== "completed")
    .map((t) => {
      const hoursUntilDeadline = Math.round(
        (new Date(t.deadline).getTime() - Date.now()) / 3600000
      );
      return `- ID: ${t.id} | "${t.title}" | Deadline: ${new Date(t.deadline).toLocaleString()} (${hoursUntilDeadline}h from now) | Estimated: ${t.estimatedHours}h | Category: ${t.category} | Status: ${t.status}`;
    })
    .join("\n");
}

// ─── 1. Prioritize & Assess Risk ───────────────────────────────────────────────

export async function prioritizeTasks(
  tasks: Task[],
  calendarEvents: CalendarEvent[] = [],
  prefs: Partial<UserPreferences> = {}
): Promise<AIPrioritizationResult> {
  const model = getModel();
  const now = new Date().toLocaleString();
  const calendarContext = calendarEvents.length
    ? `\nUpcoming Calendar Events:\n${calendarEvents.map((e) => `- "${e.title}" at ${new Date(e.startTime).toLocaleString()}`).join("\n")}`
    : "";

  const prompt = `You are an expert AI productivity coach. Analyze the user's tasks and return a prioritized plan with risk assessment.

Current Time: ${now}
User's Preferred Work Hours: ${prefs.workStartHour ?? 8}:00 - ${prefs.workEndHour ?? 22}:00
${calendarContext}

Tasks to analyze:
${formatTasksForPrompt(tasks)}

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "rankedTasks": [
    {
      "taskId": "string",
      "priority": "critical|high|medium|low",
      "riskLevel": "safe|watch|at_risk|overdue",
      "reasoning": "1-2 sentence explanation of why this priority and risk level",
      "urgencyScore": 0-100,
      "suggestedSchedule": "e.g. Tonight 8-10 PM"
    }
  ],
  "overallInsight": "2-3 sentence summary of the user's current situation",
  "deadlineRisks": ["specific risk 1", "specific risk 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
}

Rules:
- urgencyScore 90-100 = deadline within 12h
- urgencyScore 70-89 = deadline within 24h  
- urgencyScore 50-69 = deadline within 48h
- urgencyScore below 50 = deadline 48h+
- Consider calendar conflicts when assessing risk
- Be specific and direct in reasoning, not generic`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const fallback: AIPrioritizationResult = {
    rankedTasks: tasks.map((t) => ({
      taskId: t.id,
      priority: "medium",
      riskLevel: "watch",
      reasoning: "Unable to analyze. Please try again.",
      urgencyScore: 50,
    })),
    overallInsight: "Analysis unavailable. Please try again.",
    deadlineRisks: [],
    recommendations: [],
  };

  return safeParseJSON<AIPrioritizationResult>(text, fallback);
}

// ─── 2. Generate Daily Plan ────────────────────────────────────────────────────

export async function generateDailyPlan(
  tasks: Task[],
  date: string,
  calendarEvents: CalendarEvent[] = [],
  prefs: Partial<UserPreferences> = {}
): Promise<AIDailyPlanResult> {
  const model = getModel();
  const workStart = prefs.workStartHour ?? 8;
  const workEnd = prefs.workEndHour ?? 22;
  const peakHours = prefs.peakHours ?? [9, 10, 20, 21];

  const blockedSlots = calendarEvents.map(
    (e) =>
      `- BLOCKED: "${e.title}" from ${new Date(e.startTime).toLocaleTimeString()} to ${new Date(e.endTime).toLocaleTimeString()}`
  );

  const prompt = `You are an expert AI scheduler. Create an optimized daily schedule for ${date}.

Available Hours: ${workStart}:00 to ${workEnd}:00
Peak Focus Hours: ${peakHours.map((h) => `${h}:00`).join(", ")}
Blocked Slots (Calendar):
${blockedSlots.join("\n") || "None"}

Tasks to schedule:
${formatTasksForPrompt(tasks)}

Return ONLY valid JSON:
{
  "blocks": [
    {
      "taskId": "string or 'break'",
      "taskTitle": "string",
      "startTime": "ISO datetime string",
      "endTime": "ISO datetime string",
      "type": "deep_work|review|buffer|break"
    }
  ],
  "summary": "2-3 sentence overview of today's plan",
  "workloadScore": 0-100,
  "workloadLabel": "comfortable|busy|overloaded",
  "reasoning": "2-3 sentences explaining key scheduling decisions",
  "warnings": ["any scheduling conflicts or concerns"]
}

Rules:
- Schedule highest urgency tasks during peak hours
- Add 15-min buffers between deep work blocks
- Don't schedule during blocked calendar slots
- Include at least 2 short breaks (15 min each)
- Overloaded = more than 8 hours of work
- Busy = 5-8 hours
- Comfortable = under 5 hours
- Use today's date (${date}) for all times`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const fallback: AIDailyPlanResult = {
    blocks: [],
    summary: "Could not generate plan. Please try again.",
    workloadScore: 50,
    workloadLabel: "busy",
    reasoning: "Plan generation failed.",
    warnings: ["Unable to generate plan. Check API connection."],
  };

  return safeParseJSON<AIDailyPlanResult>(text, fallback);
}

// ─── 3. Deadline Rescue Mode ───────────────────────────────────────────────────

export async function runDeadlineRescue(tasks: Task[]): Promise<AIRescueResult> {
  const model = getModel();
  const atRiskTasks = tasks.filter(
    (t) =>
      t.status !== "completed" &&
      (t.riskLevel === "at_risk" || t.riskLevel === "overdue" ||
        (new Date(t.deadline).getTime() - Date.now()) / 3600000 < 36)
  );

  if (!atRiskTasks.length) {
    return {
      atRiskTasks: [],
      rescueplan: "All your tasks look safe! You're on track. Keep it up.",
      confidence: 0.95,
    };
  }

  const prompt = `You are an AI crisis manager for productivity. Analyze these at-risk tasks and create a rescue plan.

Current Time: ${new Date().toLocaleString()}

At-risk tasks:
${formatTasksForPrompt(atRiskTasks)}

All tasks context:
${formatTasksForPrompt(tasks)}

Return ONLY valid JSON:
{
  "atRiskTasks": [
    {
      "taskId": "string",
      "taskTitle": "string",
      "riskReason": "specific reason why this is at risk",
      "suggestedAction": "concrete action the user should take RIGHT NOW",
      "newSchedule": "suggested new time slot if rescheduling needed"
    }
  ],
  "rescueplan": "2-3 sentence overall rescue strategy - be direct and actionable",
  "confidence": 0.0-1.0
}

Be direct, urgent, and specific. This is a crisis management mode.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return safeParseJSON<AIRescueResult>(text, {
    atRiskTasks: [],
    rescueplan: "Rescue analysis failed. Please check your tasks manually.",
    confidence: 0,
  });
}

// ─── 4. What-If Simulation ─────────────────────────────────────────────────────

export async function simulateWhatIf(
  scenario: string,
  tasks: Task[],
  calendarEvents: CalendarEvent[] = []
): Promise<AIWhatIfResult> {
  const model = getModel();

  const prompt = `You are an AI productivity simulator. The user wants to know the impact of a hypothetical scenario.

Current Time: ${new Date().toLocaleString()}

User's Scenario: "${scenario}"

Current Tasks:
${formatTasksForPrompt(tasks)}

Calendar Events:
${calendarEvents.map((e) => `- "${e.title}" at ${new Date(e.startTime).toLocaleString()}`).join("\n") || "None"}

Return ONLY valid JSON:
{
  "scenario": "restate the scenario clearly",
  "impactedTasks": [
    {
      "taskId": "string",
      "taskTitle": "string",
      "impact": "specific impact description",
      "newRiskLevel": "safe|watch|at_risk|overdue"
    }
  ],
  "overallImpact": "2-3 sentence summary of what happens if this scenario occurs",
  "suggestion": "2-3 sentences on what the user should do to mitigate risks",
  "revisedPlan": "optional: brief revised schedule if needed"
}

Be specific about which tasks are affected and how. Quantify when possible (e.g. "you'd lose 2 hours of study time").`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return safeParseJSON<AIWhatIfResult>(text, {
    scenario,
    impactedTasks: [],
    overallImpact: "Simulation failed. Please try again.",
    suggestion: "Unable to simulate. Check your API connection.",
  });
}

// ─── 5. Natural Language Chat ──────────────────────────────────────────────────

export async function chatWithAgent(
  message: string,
  tasks: Task[],
  history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  calendarEvents: CalendarEvent[] = []
): Promise<{ response: string; actionTaken?: string }> {
  const model = getModel();

  const systemContext = `You are LifeSaver, an AI productivity companion. You help users manage tasks, beat deadlines, and stay on track. You are direct, motivating, and action-oriented. You can:
- Analyze and prioritize tasks
- Suggest schedule changes  
- Warn about deadline risks
- Help break down complex tasks
- Motivate users who are procrastinating

Current Context:
Time: ${new Date().toLocaleString()}
Active Tasks: ${formatTasksForPrompt(tasks)}
Calendar: ${calendarEvents.map((e) => `"${e.title}" at ${new Date(e.startTime).toLocaleString()}`).join(", ") || "No events"}

Always be specific to the user's actual tasks. When you suggest changes, explain WHY. Keep responses concise (under 150 words) but impactful.`;

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemContext }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I'm LifeSaver, ready to help you crush your deadlines. What do you need?" }],
      },
      ...history,
    ],
  });

  const result = await chat.sendMessage(message);
  const response = result.response.text();

  // Detect if AI took an action (simple heuristic)
  const actionTaken = response.toLowerCase().includes("rescheduled") ||
    response.toLowerCase().includes("moved") ||
    response.toLowerCase().includes("updated")
    ? "Schedule updated"
    : undefined;

  return { response, actionTaken };
}

// ─── 6. AI Daily Briefing ──────────────────────────────────────────────────────

export async function generateDailyBriefing(
  tasks: Task[],
  calendarEvents: CalendarEvent[] = []
): Promise<string> {
  const model = getModel();
  const today = new Date();
  const todayTasks = tasks.filter((t) => {
    const deadline = new Date(t.deadline);
    return (
      t.status !== "completed" &&
      deadline >= today &&
      deadline <= new Date(today.getTime() + 7 * 24 * 3600000)
    );
  });

  const prompt = `Generate a morning briefing for a productivity app. Be concise, motivating, and specific.

Current Time: ${today.toLocaleString()}
Today's Date: ${today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}

Upcoming Tasks (next 7 days):
${formatTasksForPrompt(todayTasks)}

Today's Calendar:
${calendarEvents.filter((e) => {
    const d = new Date(e.startTime);
    return d.toDateString() === today.toDateString();
  }).map((e) => `- "${e.title}" at ${new Date(e.startTime).toLocaleTimeString()}`).join("\n") || "No meetings today"}

Write a 4-6 line morning briefing. Format:
Good [morning/afternoon]! 
• [X tasks due today/this week]
• [Most critical task and why]
• [One strategic tip or warning]
• Estimated workload: [X hours]

Be direct. No fluff. Name the actual tasks.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
