import { describe, expect, it } from "vitest";

import {
  choiceAnswerKeySchema,
  choiceSubmissionSchema,
  publicChoiceContentSchema
} from "@/features/questions/contracts";

describe("question API contracts", () => {
  it("accepts a text and image choice question without exposing its answer", () => {
    const content = publicChoiceContentSchema.parse({
      prompt: "Choose one.",
      stimulus: { assetRefs: ["stem-image"] },
      options: [
        { id: "option-a", text: "A" },
        { id: "option-b", assetRef: "option-image", accessibleLabel: "Shape B" }
      ]
    });

    expect(content.options).toHaveLength(2);
    expect(content).not.toHaveProperty("answer");
  });

  it("rejects malformed answer submissions", () => {
    expect(choiceSubmissionSchema.safeParse({ response: {} }).success).toBe(false);
    expect(choiceSubmissionSchema.safeParse({ response: { optionId: "option-a" } }).success).toBe(true);
  });

  it("keeps the answer key as a separate server-side contract", () => {
    expect(choiceAnswerKeySchema.parse({ optionId: "option-c" })).toEqual({ optionId: "option-c" });
  });
});
