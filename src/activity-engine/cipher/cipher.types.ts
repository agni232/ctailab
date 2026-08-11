import type { ActivityResult } from "@/activity-engine/types";

export type CipherMode = "encode" | "decode";

interface CipherQuestionBase {
  id: string;
  prompt: string;
  difficulty: "warm-up" | "practice" | "challenge";
  hints: string[];
  explanation: string;
  correctFeedback: string;
  incorrectFeedback: string;
}

export interface CipherTransformQuestion extends CipherQuestionBase {
  kind: "text";
  mode: CipherMode;
  input: string;
  shift: number;
}

export interface CipherMultipleChoiceQuestion extends CipherQuestionBase {
  kind: "multiple-choice";
  mode: CipherMode;
  input: string;
  shift: number;
  choices: string[];
}

export interface CipherFindShiftQuestion extends CipherQuestionBase {
  kind: "find-shift";
  input: string;
  output: string;
  expectedShift: number;
}

export type CipherPracticeQuestion =
  | CipherTransformQuestion
  | CipherMultipleChoiceQuestion
  | CipherFindShiftQuestion;

export interface CipherDiscoverConfig {
  title: string;
  prompt: string;
  normalMessage: string;
  shift: number;
  keyExplanation: string;
}

export interface CipherWheelChallenge {
  id: string;
  kind: "align" | "answer";
  prompt: string;
  fromLetter: string;
  expectedLetter: string;
  targetShift: number;
  hint: string;
  successMessage: string;
}

export interface CipherCreateConfig {
  title: string;
  prompt: string;
  defaultText: string;
  defaultShift: number;
  friendPrompt: string;
}

export interface CipherReflectionConfig {
  title: string;
  prompt: string;
  learningPoints: string[];
}

export interface CipherActivityConfig {
  alphabet: string;
  minShift: number;
  maxShift: number;
  defaultShift: number;
  defaultText: string;
  quickMessages: string[];
  discover: CipherDiscoverConfig;
  wheelChallenges: CipherWheelChallenge[];
  practiceQuestions: CipherPracticeQuestion[];
  create: CipherCreateConfig;
  reflection: CipherReflectionConfig;
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
