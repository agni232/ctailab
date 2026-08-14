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

const labelledItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1)
}).strict();

export const publicChoiceContentSchema = z.object({
  prompt: z.string().min(1),
  stimulus: stimulusSchema.optional(),
  options: z.array(choiceOptionSchema).min(2)
}).strict();

export const publicFillInBlanksContentSchema = z.object({
  prompt: z.string().min(1).optional(),
  stimulus: stimulusSchema.optional(),
  segments: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.literal("text"), value: z.string().min(1) }).strict(),
    z.object({ type: z.literal("blank"), id: z.string().min(1), label: z.string().min(1) }).strict()
  ])).min(2)
}).strict();

export const publicShortAnswerContentSchema = z.object({
  prompt: z.string().min(1),
  stimulus: stimulusSchema.optional()
}).strict();

export const publicClassificationContentSchema = z.object({
  prompt: z.string().min(1),
  stimulus: stimulusSchema.optional(),
  rowHeading: z.string().min(1),
  categoryHeading: z.string().min(1),
  categories: z.array(labelledItemSchema).min(2),
  rows: z.array(labelledItemSchema).min(2)
}).strict();

export const questionSolutionSchema = z.object({
  text: z.string().min(1),
  assetRefs: z.array(z.string().min(1)).default([])
}).strict();

/* Answer keys stay server-side; they are never part of a question payload. */

export const choiceAnswerKeySchema = z.object({
  optionId: z.string().min(1)
}).strict();

export const fillInBlanksAnswerKeySchema = z.object({
  blanks: z.record(z.string().min(1), z.object({
    accepted: z.array(z.union([z.string(), z.number()])).min(1),
    caseSensitive: z.boolean().default(false)
  }).strict()),
  scoring: z.enum(["all-or-nothing", "per-blank"]).default("per-blank")
}).strict();

export const shortAnswerAnswerKeySchema = z.object({
  evaluation: z.enum(["exact", "accepted-values", "self-review"]),
  accepted: z.array(z.union([z.string(), z.number()])).default([]),
  normalization: z.array(z.enum(["trim", "lowercase", "collapse-whitespace"])).default([]),
  keyIdeas: z.array(z.string().min(1)).default([])
}).strict();

export const classificationAnswerKeySchema = z.object({
  assignments: z.record(z.string().min(1), z.string().min(1)),
  scoring: z.enum(["all-or-nothing", "per-row"]).default("all-or-nothing")
}).strict();

/* Learner submissions. */

export const questionResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), optionId: z.string().min(1) }).strict(),
  z.object({
    kind: z.literal("fill-in-blanks"),
    blanks: z.record(z.string().min(1), z.string())
  }).strict(),
  z.object({ kind: z.literal("short-answer"), text: z.string() }).strict(),
  z.object({
    kind: z.literal("classification"),
    assignments: z.record(z.string().min(1), z.string().min(1))
  }).strict()
]);

export const questionSubmissionSchema = z.object({
  response: questionResponseSchema
}).strict();

/**
 * Older clients posted `{ response: { optionId } }` with no discriminator. Kept so
 * a cached page can still check a choice answer against the widened endpoint.
 */
export const choiceSubmissionSchema = z.object({
  response: z.object({
    optionId: z.string().min(1)
  }).strict()
}).strict();

export type QuestionResponse = z.infer<typeof questionResponseSchema>;
export type ChoiceQuestionContent = z.infer<typeof publicChoiceContentSchema>;
export type FillInBlanksQuestionContent = z.infer<typeof publicFillInBlanksContentSchema>;
export type ShortAnswerQuestionContent = z.infer<typeof publicShortAnswerContentSchema>;
export type ClassificationQuestionContent = z.infer<typeof publicClassificationContentSchema>;

export type QuestionRendererKey =
  | "single-choice-text"
  | "single-choice-image"
  | "fill-in-blanks"
  | "short-answer"
  | "classification";

export interface PublicQuestionAsset {
  id: string;
  ref: string;
  role: "stem" | "option" | "supporting" | "solution" | "source";
  altText: string;
  url: string;
}

interface QuestionItemBase {
  id: string;
  questionId: string;
  position: number;
  displayNumber: string;
  sourcePage: number | null;
  difficulty: "easy" | "medium" | "difficult";
  estimatedMinutes: number | null;
  topics: Array<{ id: string; title: string; isPrimary: boolean }>;
  assets: PublicQuestionAsset[];
}

export type PublicQuestionItem = QuestionItemBase & (
  | { renderer: "single-choice-text" | "single-choice-image"; content: ChoiceQuestionContent }
  | { renderer: "fill-in-blanks"; content: FillInBlanksQuestionContent }
  | { renderer: "short-answer"; content: ShortAnswerQuestionContent }
  | { renderer: "classification"; content: ClassificationQuestionContent }
);

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

/**
 * `self-review` covers open questions that cannot be marked automatically: the
 * learner compares their own wording against the model answer and decides.
 */
export type QuestionOutcome = "correct" | "incorrect" | "self-review";

export interface QuestionCheckResult {
  outcome: QuestionOutcome;
  /** Set for single-choice questions. */
  correctOptionId?: string;
  /** Per-blank verdicts, keyed by blank ID. */
  blanks?: Record<string, { correct: boolean; expected: string }>;
  /** Per-row verdicts, keyed by row ID. */
  rows?: Record<string, { correct: boolean; expectedCategoryId: string }>;
  /** Shown for self-review questions so the learner can mark their own work. */
  modelAnswer?: { text: string; keyIdeas: string[] };
  solution: {
    text: string;
    assets: PublicQuestionAsset[];
  };
}

/** @deprecated Use QuestionCheckResult. Retained for existing imports. */
export type ChoiceCheckResult = QuestionCheckResult;
