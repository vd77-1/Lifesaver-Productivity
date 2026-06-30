import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/calendar";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.nextUrl.searchParams.get("accessToken");
    const refreshToken = req.nextUrl.searchParams.get("refreshToken") ?? undefined;
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "7");

    if (!accessToken) {
      return NextResponse.json({ error: "accessToken required" }, { status: 400 });
    }

    const events = await getUpcomingEvents(accessToken, refreshToken, days);
    return NextResponse.json(events);
  } catch (err) {
    console.error("Calendar route error:", err);
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}
