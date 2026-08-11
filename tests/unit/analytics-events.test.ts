import { describe, expect, it } from "vitest";
import {
  allowedAnalyticsEvents,
  validateAnalyticsEventPayload
} from "@/features/analytics/events";

describe("activity analytics events", () => {
  it("allows each event emitted by the Caesar Cipher journey", () => {
    const journeyEvents = [
      "explore_started",
      "wheel_shift_changed",
      "wheel_challenge_completed",
      "message_encoded",
      "message_decoded",
      "practice_completed",
      "custom_message_created",
      "reflection_completed"
    ] as const;

    expect(allowedAnalyticsEvents).toEqual(expect.arrayContaining([...journeyEvents]));

    journeyEvents.forEach((event) => {
      expect(validateAnalyticsEventPayload({
        event,
        eventVersion: 1,
        sessionId: "test-session",
        activityId: "caesar-cipher-001",
        metadata: { shift: 3 }
      }).ok).toBe(true);
    });
  });

  it("rejects unsupported activity events", () => {
    expect(validateAnalyticsEventPayload({
      event: "student_message_content",
      eventVersion: 1,
      sessionId: "test-session"
    }).ok).toBe(false);
  });
});
