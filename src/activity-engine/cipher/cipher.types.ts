import type { ActivityResult } from "@/activity-engine/types";

export type CipherMode = "encode" | "decode";

export interface CipherPracticeQuestion {
  id: string;
  mode: CipherMode;
  input: string;
  shift: number;
  prompt: string;
  difficulty: "warm-up" | "practice" | "challenge";
  hints: string[];
  explanation: string;
}

export interface CipherActivityConfig {
  alphabet: string;
  minShift: number;
  maxShift: number;
  defaultShift: number;
  defaultText: string;
  practiceQuestions: CipherPracticeQuestion[];
}

export interface CipherState {
  mode: CipherMode;
  shift: number;
  input: string;
  score: number;
  attempts: number;
  hintsUsed: number;
}

export interface CipherAnswer {
  question: CipherPracticeQuestion;
  value: string;
}

export interface CipherActivityResult extends ActivityResult {
  attempts: number;
  hintsUsed: number;
}
