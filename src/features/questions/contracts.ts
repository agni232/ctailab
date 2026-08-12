import { z } from "zod";

const choiceOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).optional(),
  assetRef: z.string().min(1).optional(),
  accessibleLabel: z.string().min(1).optional()
}).strict();

const stimulusSchema = z.object({
  text: z.string().min(1).optional(),
  assetRefs: z.array(z.string().min(1)).default([])
}).strict();

export const publicChoiceContentSchema = z.object({
  prompt: z.string().min(1),
  stimulus: stimulusSchema.optional(),
  options: z.array(choiceOptionSchema).min(2)
}).strict();

export const choiceAnswerKeySchema = z.object({
  optionId: z.string().min(1)
}).strict();

export const questionSolutionSchema = z.object({
  text: z.string().min(1),
  assetRefs: z.array(z.string().min(1)).default([])
}).strict();

export const choiceSubmissionSchema = z.object({
  response: z.object({
    optionId: z.string().min(1)
  }).strict()
}).strict();

export type ChoiceQuestionContent = z.infer<typeof publicChoiceContentSchema>;

export interface PublicQuestionAsset {
  id: string;
  ref: string;
  role: "stem" | "option" | "supporting" | "solution" | "source";
  altText: string;
  url: string;
}

export interface PublicQuestionItem {
  id: string;
  questionId: string;
  position: number;
  displayNumber: string;
  sourcePage: number | null;
  renderer: "single-choice-text" | "single-choice-image";
  content: ChoiceQuestionContent;
  difficulty: "easy" | "medium" | "difficult";
  estimatedMinutes: number | null;
  topics: Array<{ id: string; title: string; isPrimary: boolean }>;
  assets: PublicQuestionAsset[];
}

export interface PublicQuestionSet {
  id: string;
  slug: string;
  version: number;
  title: string;
  description: string | null;
  introduction: string | null;
  grade: { level: number; label: string };
  subject: { slug: string; name: string };
  chapter: {
    id: string;
    slug: string;
    displayNumber: string | null;
    title: string;
  };
  activities: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  questions: PublicQuestionItem[];
}

export interface ChoiceCheckResult {
  correct: boolean;
  correctOptionId: string;
  solution: {
    text: string;
    assets: PublicQuestionAsset[];
  };
}
