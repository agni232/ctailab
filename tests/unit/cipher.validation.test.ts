import { describe, expect, it } from "vitest";
import { expectedCipherAnswer, validateCipherQuestion } from "@/activity-engine/cipher/cipher.validation";
import type { CipherPracticeQuestion } from "@/activity-engine/cipher/cipher.types";

const question: CipherPracticeQuestion = {
  id: "test-question",
  mode: "encode",
  input: "HELLO",
  shift: 3,
  prompt: "Encode HELLO with a shift of 3.",
  difficulty: "practice",
  hints: [],
  explanation: "HELLO becomes KHOOR."
};

describe("cipher validation", () => {
  it("calculates expected answers from question data", () => {
    expect(expectedCipherAnswer(question)).toBe("KHOOR");
  });

  it("accepts answers case-insensitively", () => {
    expect(validateCipherQuestion(question, "khoor").correct).toBe(true);
  });

  it("rejects incorrect answers with feedback", () => {
    const result = validateCipherQuestion(question, "HELLO");

    expect(result.correct).toBe(false);
    expect(result.expectedAnswer).toBe("KHOOR");
    expect(result.feedback.length).toBeGreaterThan(0);
  });
});
