import { describe, expect, it } from "vitest";

import { contentHash, loadContentCatalog } from "@/content-authoring/loader";
import { questionFileSchema } from "@/content-authoring/schemas";

const baseQuestion = {
  id: "sample-question",
  slug: "sample-question",
  version: 1,
  origin: "platform-created",
  language: "en",
  status: "draft",
  courseProfile: {
    difficulty: "easy",
    topics: ["sample-topic"],
    primaryTopic: "sample-topic"
  },
  assets: [],
  sourceReferences: []
} as const;

describe("content authoring", () => {
  it("loads the reference curriculum and reuses the Caesar activity config", async () => {
    const catalog = await loadContentCatalog();
    const chapter = catalog.editions[0]?.courses[0]?.chapters[0];

    expect(chapter?.data.title).toBe("What's in a Name?");
    expect(chapter?.activities[0]?.configuration).toMatchObject({
      defaultShift: 3,
      defaultText: "HELLO"
    });
    expect(chapter?.questions).toHaveLength(17);

    const chapterPractice = chapter?.questionSets.find(
      (questionSet) => questionSet.data.slug === "chapter-practice"
    );
    const handbookQuestions = chapter?.questionSets.find(
      (questionSet) => questionSet.data.slug === "handbook-questions"
    );
    const thinkingSpot = chapter?.questionSets.find(
      (questionSet) => questionSet.data.slug === "thinking-spot"
    );

    expect(chapterPractice?.data.items.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(handbookQuestions?.data.items.map((item) => item.position)).toEqual(
      Array.from({ length: 13 }, (_, index) => index + 1)
    );
    expect(handbookQuestions?.data.items.map((item) => item.displayNumber)).toEqual(
      Array.from({ length: 13 }, (_, index) => String(index + 1))
    );
    expect(handbookQuestions?.data.items.map((item) => item.sourcePage)).toEqual([
      12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 14, 14, 14
    ]);

    // The Thinking Spot is a bonus puzzle, so it stays out of the handbook
    // numbering and carries no display number of its own.
    expect(thinkingSpot?.data.kind).toBe("challenge");
    expect(thinkingSpot?.data.items).toHaveLength(1);
    expect(thinkingSpot?.data.items[0]?.displayNumber).toBeUndefined();
  });

  it("rejects a choice answer that does not reference an option", () => {
    const result = questionFileSchema.safeParse({
      ...baseQuestion,
      renderer: "single-choice-text",
      content: {
        prompt: "Choose one.",
        options: [
          { id: "option-a", text: "A" },
          { id: "option-b", text: "B" }
        ]
      },
      response: { type: "single-choice" },
      answer: { optionId: "option-c" },
      solution: { text: "A is correct.", assetRefs: [] }
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched fill-in-the-blank IDs", () => {
    const result = questionFileSchema.safeParse({
      ...baseQuestion,
      renderer: "fill-in-blanks",
      content: {
        segments: [
          { type: "text", value: "A becomes" },
          { type: "blank", id: "blank-one", label: "secret letter" }
        ]
      },
      response: {
        type: "fill-in-blanks",
        blanks: [{ id: "blank-two", input: "text" }]
      },
      answer: {
        blanks: { "blank-one": { accepted: ["D"] } },
        scoring: "per-blank"
      },
      solution: { text: "A becomes D.", assetRefs: [] }
    });

    expect(result.success).toBe(false);
  });

  it("accepts a multiple-choice question with bounded selections", () => {
    const result = questionFileSchema.safeParse({
      ...baseQuestion,
      renderer: "multiple-choice-text",
      content: {
        prompt: "Choose both letters that wrap around with key 3.",
        options: [
          { id: "option-w", text: "W" },
          { id: "option-x", text: "X" },
          { id: "option-y", text: "Y" }
        ]
      },
      response: { type: "multiple-choice", minimumSelections: 2, maximumSelections: 2 },
      answer: { optionIds: ["option-x", "option-y"], scoring: "all-or-nothing" },
      solution: { text: "X and Y cross Z when moved three places.", assetRefs: [] }
    });

    expect(result.success).toBe(true);
  });

  it("creates stable hashes regardless of object key order", () => {
    expect(contentHash({ a: 1, b: { c: 2 } })).toBe(contentHash({ b: { c: 2 }, a: 1 }));
  });
});
