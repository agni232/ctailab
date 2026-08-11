// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { CipherPractice } from "@/activity-engine/cipher/components/CipherPractice";
import type { CipherPracticeQuestion } from "@/activity-engine/cipher/cipher.types";
import { getButton, renderComponent } from "../helpers/react";

const question: CipherPracticeQuestion = {
  id: "one-letter",
  kind: "text",
  mode: "encode",
  input: "A",
  shift: 3,
  prompt: "What does A become?",
  difficulty: "warm-up",
  hints: ["Move forward three places."],
  explanation: "A moves to D.",
  correctFeedback: "Correct.",
  incorrectFeedback: "Move forward, not backward."
};

describe("CipherPractice", () => {
  it("gives feedback and hints, then reports completion results", async () => {
    const onComplete = vi.fn();
    const view = await renderComponent(
      <CipherPractice
        activityId="test-activity"
        questions={[question]}
        onActivityStart={vi.fn()}
        onComplete={onComplete}
      />
    );

    await view.click(getButton(view.container, "Start challenge"));
    const input = view.container.querySelector('[aria-label="Cipher answer"]');
    expect(input).toBeInstanceOf(HTMLInputElement);

    await view.input(input as HTMLInputElement, "B");
    await view.click(getButton(view.container, "Check"));
    expect(view.container.textContent).toContain("Move forward, not backward.");

    await view.click(getButton(view.container, "Hint"));
    expect(view.container.textContent).toContain("Move forward three places.");

    await view.input(input as HTMLInputElement, "D");
    await view.click(getButton(view.container, "Check"));
    expect(view.container.textContent).toContain("A moves to D.");

    await view.click(getButton(view.container, "Finish challenge"));
    expect(onComplete).toHaveBeenCalledWith({
      score: 0,
      maxScore: 1,
      attempts: 2,
      hintsUsed: 1
    });
    expect(view.container.textContent).toContain("You cracked every code.");
    await view.unmount();
  });
});
