import type { ComponentType } from "react";
import type { LearningExperience } from "@/content/types";

export interface ValidationResult {
  correct: boolean;
  feedback: string;
  expectedAnswer?: string;
}

export interface ActivityResult {
  completed: boolean;
  score: number;
  maxScore: number;
  competencyEvidence?: CompetencyEvidence[];
}

export interface CompetencyEvidence {
  competencyId: string;
  status: "practicing" | "demonstrated";
  score?: number;
  attempts?: number;
  hintsUsed?: number;
}

export interface ActivityDefinition<TConfig, TState, TAnswer, TResult extends ActivityResult> {
  type: string;
  version: number;
  createInitialState(config: TConfig): TState;
  validateAnswer(state: TState, answer: TAnswer, config: TConfig): ValidationResult;
  calculateResult(state: TState, answer: TAnswer, config: TConfig): TResult;
}

export interface ActivityComponentProps<TConfig = unknown> {
  experience: LearningExperience<TConfig>;
}

export interface RegisteredActivity<TConfig = unknown, TState = unknown, TAnswer = unknown, TResult extends ActivityResult = ActivityResult> {
  type: string;
  version: number;
  component: ComponentType<ActivityComponentProps<TConfig>>;
  engine: ActivityDefinition<TConfig, TState, TAnswer, TResult>;
}
