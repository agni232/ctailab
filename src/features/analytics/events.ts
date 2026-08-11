export const allowedAnalyticsEvents = [
  "page_view",
  "activity_started",
  "explore_started",
  "wheel_shift_changed",
  "wheel_challenge_completed",
  "message_encoded",
  "message_decoded",
  "practice_started",
  "question_answered",
  "hint_used",
  "question_completed",
  "practice_completed",
  "custom_message_created",
  "reflection_completed",
  "activity_completed",
  "activity_retried"
] as const;

export type AnalyticsEventName = (typeof allowedAnalyticsEvents)[number];

export interface AnalyticsEventPayload {
  event: AnalyticsEventName;
  eventVersion: 1;
  eventId?: string;
  timestamp?: string;
  visitorId?: string;
  sessionId: string;
  userId?: string;
  activityId?: string;
  metadata?: Record<string, unknown>;
}

export interface ServerAnalyticsEvent extends AnalyticsEventPayload {
  receivedAt: string;
}

export function validateAnalyticsEventPayload(payload: unknown):
  | { ok: true; event: AnalyticsEventPayload }
  | { ok: false; error: string } {
  if (!isRecord(payload)) {
    return { ok: false, error: "Expected a JSON object." };
  }

  if (!isAllowedEvent(payload.event)) {
    return { ok: false, error: "Unsupported event name." };
  }

  if (payload.eventVersion !== 1) {
    return { ok: false, error: "Unsupported event version." };
  }

  if (!isNonEmptyString(payload.sessionId, 160)) {
    return { ok: false, error: "sessionId is required." };
  }

  if (payload.eventId !== undefined && !isNonEmptyString(payload.eventId, 160)) {
    return { ok: false, error: "eventId must be a string." };
  }

  if (payload.visitorId !== undefined && !isNonEmptyString(payload.visitorId, 160)) {
    return { ok: false, error: "visitorId must be a string." };
  }

  if (payload.activityId !== undefined && !isNonEmptyString(payload.activityId, 160)) {
    return { ok: false, error: "activityId must be a string." };
  }

  if (payload.userId !== undefined && !isNonEmptyString(payload.userId, 160)) {
    return { ok: false, error: "userId must be a string." };
  }

  if (payload.metadata !== undefined && !isRecord(payload.metadata)) {
    return { ok: false, error: "metadata must be an object." };
  }

  if (payload.metadata && JSON.stringify(payload.metadata).length > 4096) {
    return { ok: false, error: "metadata is too large." };
  }

  return {
    ok: true,
    event: {
      event: payload.event,
      eventVersion: 1,
      eventId: typeof payload.eventId === "string" ? payload.eventId : undefined,
      timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
      visitorId: typeof payload.visitorId === "string" ? payload.visitorId : undefined,
      sessionId: payload.sessionId,
      userId: typeof payload.userId === "string" ? payload.userId : undefined,
      activityId: typeof payload.activityId === "string" ? payload.activityId : undefined,
      metadata: isRecord(payload.metadata) ? payload.metadata : undefined
    }
  };
}

export function addServerTimestamp(event: AnalyticsEventPayload): ServerAnalyticsEvent {
  return {
    ...event,
    receivedAt: new Date().toISOString()
  };
}

function isAllowedEvent(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && allowedAnalyticsEvents.includes(value as AnalyticsEventName);
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
