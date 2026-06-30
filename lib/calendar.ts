import { google } from "googleapis";
import type { CalendarEvent } from "@/types";

export function getOAuthClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

export async function getUpcomingEvents(
  accessToken: string,
  refreshToken?: string,
  daysAhead = 7
): Promise<CalendarEvent[]> {
  try {
    const auth = getOAuthClient(accessToken, refreshToken);
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 3600000);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });

    const events = response.data.items ?? [];
    return events
      .filter((e) => e.start && e.summary)
      .map((e) => ({
        id: e.id ?? crypto.randomUUID(),
        title: e.summary ?? "Untitled",
        startTime: e.start?.dateTime ?? e.start?.date ?? now.toISOString(),
        endTime: e.end?.dateTime ?? e.end?.date ?? now.toISOString(),
        isAllDay: !e.start?.dateTime,
        source: "google_calendar" as const,
      }));
  } catch (err) {
    console.error("Calendar API error:", err);
    return [];
  }
}

export async function createCalendarEvent(
  accessToken: string,
  title: string,
  startTime: string,
  endTime: string,
  description?: string,
  refreshToken?: string
): Promise<string | null> {
  try {
    const auth = getOAuthClient(accessToken, refreshToken);
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description,
        start: { dateTime: startTime, timeZone: "UTC" },
        end: { dateTime: endTime, timeZone: "UTC" },
        colorId: "9", // Blueberry - visually distinct
      },
    });

    return response.data.id ?? null;
  } catch (err) {
    console.error("Create calendar event error:", err);
    return null;
  }
}
