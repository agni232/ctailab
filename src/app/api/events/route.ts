import { NextResponse } from "next/server";
import { addServerTimestamp, validateAnalyticsEventPayload } from "@/features/analytics/events";

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const validation = validateAnalyticsEventPayload(payload);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const event = addServerTimestamp(validation.event);

  if (process.env.NODE_ENV !== "production") {
    console.info("analytics:event", event);
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
