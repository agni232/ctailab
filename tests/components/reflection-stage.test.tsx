// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { ReflectionStage } from "@/activity-engine/cipher/components/ReflectionStage";
import { getButton, renderComponent } from "../helpers/react";

describe("ReflectionStage", () => {
  it("collects a reflection before completing the mission", async () => {
    const onComplete = vi.fn();
    const view = await renderComponent(
      <ReflectionStage
        activityId="test-activity"
        config={{
          title: "What rule did you discover?",
          prompt: "Write the rule in your own words.",
          learningPoints: ["Every letter uses the same shift."]
        }}
        summary={{ score: 1, maxScore: 1, attempts: 1, hintsUsed: 0 }}
        onComplete={onComplete}
        onRetry={vi.fn()}
      />
    );
    const textarea = view.container.querySelector("textarea");
    const finishButton = getButton(view.container, "Finish mission");

    expect(finishButton.disabled).toBe(true);
    expect(view.container.textContent).not.toContain("Every letter uses the same shift.");
    await view.input(textarea as HTMLTextAreaElement, "Every letter moves three places.");
    await view.click(finishButton);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(view.container.textContent).toContain("Every letter uses the same shift.");
    expect(view.container.textContent).toContain("Mission complete");
    await view.unmount();
  });
});
