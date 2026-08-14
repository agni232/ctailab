// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import type { PublicQuestionSet } from "@/features/questions/contracts";
import { QuestionPlayer } from "@/features/questions/components/QuestionPlayer";
import { renderComponent } from "../helpers/react";

function setWith(question: PublicQuestionSet["questions"][number]): PublicQuestionSet {
  return {
    id: "set",
    slug: "handbook-questions",
    version: 1,
    title: "Handbook Questions",
    description: null,
    introduction: null,
    grade: { level: 6, label: "Class 6" },
    subject: { slug: "artificial-intelligence", name: "Artificial Intelligence" },
    chapter: { id: "chapter-1", slug: "introduction-to-ai", displayNumber: "1", title: "Intro" },
    activities: [],
    questions: [question]
  };
}

function stubCheck(data: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ data }) })));
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.includes(label)
  );
  if (!button) {
    throw new Error(`No button labelled ${label}`);
  }
  return button;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fill-in-blanks renderer", () => {
  const question: PublicQuestionSet["questions"][number] = {
    id: "item-blank",
    questionId: "q-blank",
    position: 1,
    displayNumber: "1",
    sourcePage: 58,
    renderer: "fill-in-blanks",
    content: {
      prompt: "Fill in the blank.",
      segments: [
        { type: "text", value: "Intelligence includes the ability to learn and " },
        { type: "blank", id: "blank-1", label: "missing word" },
        { type: "text", value: " problems." }
      ]
    },
    difficulty: "easy",
    estimatedMinutes: 1,
    topics: [],
    assets: []
  };

  it("keeps Check disabled until the blank is filled, then reports the verdict", async () => {
    stubCheck({
      outcome: "correct",
      blanks: { "blank-1": { correct: true, expected: "solve" } },
      solution: { text: "Intelligence lets us solve problems.", assets: [] }
    });

    const view = await renderComponent(<QuestionPlayer questionSet={setWith(question)} />);
    expect(findButton(view.container, "Check answer").disabled).toBe(true);

    const input = view.container.querySelector<HTMLInputElement>(".fill-blank-input");
    expect(input).not.toBeNull();
    await view.input(input as HTMLInputElement, "solve");

    expect(findButton(view.container, "Check answer").disabled).toBe(false);
    await view.click(findButton(view.container, "Check answer"));

    expect(view.container.textContent).toContain("You found it!");
    await view.unmount();
  });

  it("shows the expected word when a blank is wrong", async () => {
    stubCheck({
      outcome: "incorrect",
      blanks: { "blank-1": { correct: false, expected: "solve" } },
      solution: { text: "Intelligence lets us solve problems.", assets: [] }
    });

    const view = await renderComponent(<QuestionPlayer questionSet={setWith(question)} />);
    await view.input(view.container.querySelector(".fill-blank-input") as HTMLInputElement, "run");
    await view.click(findButton(view.container, "Check answer"));

    expect(view.container.querySelector(".fill-blank-input.is-wrong")).not.toBeNull();
    expect(view.container.textContent).toContain("solve");
    await view.unmount();
  });
});

describe("short-answer renderer", () => {
  const question: PublicQuestionSet["questions"][number] = {
    id: "item-short",
    questionId: "q-short",
    position: 1,
    displayNumber: "1",
    sourcePage: 58,
    renderer: "short-answer",
    content: { prompt: "Define intelligence in your own words." },
    difficulty: "medium",
    estimatedMinutes: 3,
    topics: [],
    assets: []
  };

  it("returns a self-review outcome with the model answer", async () => {
    stubCheck({
      outcome: "self-review",
      modelAnswer: {
        text: "Intelligence is the ability to learn, think and solve problems.",
        keyIdeas: ["learn", "solve problems"]
      },
      solution: { text: "Compare your wording.", assets: [] }
    });

    const view = await renderComponent(<QuestionPlayer questionSet={setWith(question)} />);
    expect(findButton(view.container, "Check answer").disabled).toBe(true);

    const textarea = view.container.querySelector<HTMLTextAreaElement>(".short-answer-input");
    await view.input(textarea as HTMLTextAreaElement, "Being able to think and solve things");
    await view.click(findButton(view.container, "Check answer"));

    expect(view.container.textContent).toContain("Compare your answer");
    expect(view.container.textContent).toContain("Intelligence is the ability to learn");
    expect(view.container.textContent).toContain("solve problems");
    await view.unmount();
  });
});

describe("classification renderer", () => {
  const question: PublicQuestionSet["questions"][number] = {
    id: "item-classify",
    questionId: "q-classify",
    position: 1,
    displayNumber: "1",
    sourcePage: 59,
    renderer: "classification",
    content: {
      prompt: "Classify each example.",
      rowHeading: "Example",
      categoryHeading: "AI or Automation?",
      categories: [
        { id: "ai", label: "AI" },
        { id: "automation", label: "Automation" }
      ],
      rows: [
        { id: "row-1", label: "Face recognition system" },
        { id: "row-2", label: "Washing machine with preset timer" }
      ]
    },
    difficulty: "medium",
    estimatedMinutes: 3,
    topics: [],
    assets: []
  };

  it("requires every row before checking and marks each row afterwards", async () => {
    stubCheck({
      outcome: "incorrect",
      rows: {
        "row-1": { correct: true, expectedCategoryId: "ai" },
        "row-2": { correct: false, expectedCategoryId: "automation" }
      },
      solution: { text: "Automation follows fixed rules.", assets: [] }
    });

    const view = await renderComponent(<QuestionPlayer questionSet={setWith(question)} />);
    expect(findButton(view.container, "Check answer").disabled).toBe(true);

    const pills = view.container.querySelectorAll<HTMLButtonElement>(".classification-pill");
    await view.click(pills[0]);
    expect(findButton(view.container, "Check answer").disabled).toBe(true);
    await view.click(pills[2]);
    expect(findButton(view.container, "Check answer").disabled).toBe(false);

    await view.click(findButton(view.container, "Check answer"));
    expect(view.container.querySelector(".classification-row.is-correct")).not.toBeNull();
    expect(view.container.querySelector(".classification-row.is-wrong")).not.toBeNull();
    expect(view.container.textContent).toContain("Answer: Automation");
    await view.unmount();
  });

  it("keeps every row when several are answered without a render in between", async () => {
    stubCheck({
      outcome: "correct",
      rows: {
        "row-1": { correct: true, expectedCategoryId: "ai" },
        "row-2": { correct: true, expectedCategoryId: "automation" }
      },
      solution: { text: "Automation follows fixed rules.", assets: [] }
    });

    const view = await renderComponent(<QuestionPlayer questionSet={setWith(question)} />);
    const pills = view.container.querySelectorAll<HTMLButtonElement>(".classification-pill");

    // Both rows answered in one batch: the second must not discard the first.
    await view.clickAll([pills[0], pills[3]]);

    expect(findButton(view.container, "Check answer").disabled).toBe(false);
    await view.click(findButton(view.container, "Check answer"));
    expect(view.container.textContent).toContain("You found it!");
    await view.unmount();
  });
});
