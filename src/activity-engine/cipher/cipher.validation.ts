import { decode, encode } from "@/activity-engine/cipher/cipher.engine";
import type { CipherPracticeQuestion } from "@/activity-engine/cipher/cipher.types";
import type { ValidationResult } from "@/activity-engine/types";

export function expectedCipherAnswer(question: CipherPracticeQuestion): string {
  return question.mode === "encode"
    ? encode(question.input, question.shift)
    : decode(question.input, question.shift);
}

export function validateCipherQuestion(question: CipherPracticeQuestion, answer: string): ValidationResult {
  const expectedAnswer = expectedCipherAnswer(question);
  const normalizedAnswer = normalizeStudentAnswer(answer);
  const normalizedExpected = normalizeStudentAnswer(expectedAnswer);
  const correct = normalizedAnswer === normalizedExpected;

  return {
    correct,
    expectedAnswer,
    feedback: correct
      ? "Correct. You used the shift key carefully."
      : "Not yet. Check one letter at a time and keep the same shift for every letter."
  };
}

function normalizeStudentAnswer(value: string): string {
  return value.trim().toUpperCase();
}
