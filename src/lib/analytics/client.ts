"use client";

import type { AnalyticsEventName, AnalyticsEventPayload } from "@/features/analytics/events";

const VISITOR_STORAGE_KEY = "ctailab.visitorId";
const SESSION_STORAGE_KEY = "ctailab.sessionId";

export function track(
  event: AnalyticsEventName,
  input: {
    activityId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: AnalyticsEventPayload = {
    event,
    eventVersion: 1,
    eventId: createId("event"),
    timestamp: new Date().toISOString(),
    visitorId: getOrCreateVisitorId(),
    sessionId: getOrCreateSessionId(),
    activityId: input.activityId,
    metadata: input.metadata
  };

  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    const queued = navigator.sendBeacon("/api/events", blob);

    if (queued) {
      return;
    }
  }

  fetch("/api/events", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body,
    keepalive: true
  }).catch(() => {
    // Analytics must never block the learning experience.
  });
}

function getOrCreateVisitorId(): string {
  return getOrCreateStoredId("local", VISITOR_STORAGE_KEY, "visitor");
}

function getOrCreateSessionId(): string {
  return getOrCreateStoredId("session", SESSION_STORAGE_KEY, "session");
}

function getOrCreateStoredId(storageType: "local" | "session", key: string, prefix: string): string {
  const storage = getStorage(storageType);
  const existing = storage?.getItem(key);

  if (existing) {
    return existing;
  }

  const id = createId(prefix);
  storage?.setItem(key, id);
  return id;
}

function getStorage(storageType: "local" | "session"): Storage | undefined {
  try {
    return storageType === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

function createId(prefix: string): string {
  if (crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}
