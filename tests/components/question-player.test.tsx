// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import type { PublicQuestionSet } from "@/features/questions/contracts";
import { QuestionPlayer } from "@/features/questions/components/QuestionPlayer";
import { renderComponent } from "../helpers/react";

const questionSet: PublicQuestionSet = {
  id: "handbook-set",
  slug: "handbook-questions",
  version: 1,
  title: "Handbook Questions",
  description: null,
  introduction: null,
  grade: { level: 3, label: "Class 3" },
  subject: { slug: "computational-thinking-ai", name: "Computational Thinking and AI" },
  chapter: { id: "chapter-1", slug: "whats-in-a-name", displayNumber: "1", title: "What's in a Name?" },
  activities: [{ id: "activity-v1", slug: "caesar-cipher", title: "Caesar Cipher" }],
  questions: [
    {
      id: "set-item-1",
      questionId: "question-1",
      position: 1,
      displayNumber: "1",
      sourcePage: 12,
      renderer: "single-choice-text",
      content: {
        prompt: "Which number is hidden?",
        stimulus: { text: "ONETWOTHREE", assetRefs: [] },
        options: [
          { id: "option-a", text: "1" },
          { id: "option-b", text: "2" }
        ]
      },
      difficulty: "easy",
      estimatedMinutes: 1,
      topics: [],
      assets: []
    },
    {
      id: "set-item-2",
      questionId: "question-2",
      position: 2,
      displayNumber: "2",
      sourcePage: 12,
      renderer: "single-choice-image",
      content: {
        prompt: "Choose the matching picture.",
        options: [
          { id: "option-a", assetRef: "picture-a", accessibleLabel: "A circle" },
          { id: "option-b", text: "None" }
        ]
      },
      difficulty: "medium",
      estimatedMinutes: 1,
      topics: [],
      assets: [{
        id: "asset-a",
        ref: "picture-a",
        role: "option",
        altText: "A circle",
        url: "/api/v1/assets/asset-a"
      }]
    }
  ]
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("QuestionPlayer", () => {
  it("checks a selected answer and shows the learning explanation", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: {
          correct: true,
          correctOptionId: "option-a",
          solution: { text: "ONE appears at the start.", assets: [] }
        }
      })
    })));

    const view = await renderComponent(<QuestionPlayer questionSet={questionSet} />);
    const firstOption = view.container.querySelector<HTMLButtonElement>(".handbook-choice");
    expect(firstOption).not.toBeNull();

    await view.click(firstOption as HTMLButtonElement);
    const checkButton = Array.from(view.container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Check answer")
    );
    expect(checkButton).not.toBeUndefined();
    await view.click(checkButton as HTMLButtonElement);

    expect(view.container.textContent).toContain("You found it!");
    expect(view.container.textContent).toContain("ONE appears at the start.");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/questions/set-item-1/check",
      expect.objectContaining({ method: "POST" })
    );

    await view.unmount();
  });

  it("opens a requested question number and renders image answer text", async () => {
    const view = await renderComponent(
      <QuestionPlayer questionSet={questionSet} initialQuestionNumber="2" />
    );

    expect(view.container.textContent).toContain("Choose the matching picture.");
    expect(view.container.querySelector('img[alt="A circle"]')).not.toBeNull();
    expect(view.container.querySelector('[aria-current="step"]')?.getAttribute("aria-label"))
      .toContain("Question 2");

    await view.unmount();
  });
});
