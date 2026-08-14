import { z } from "zod";

const idSchema = z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const slugSchema = idSchema;
const contentStatusSchema = z.enum(["draft", "published", "archived"]);
const accessTierSchema = z.enum(["public", "account", "premium"]);
const assetRefSchema = idSchema;

export const sourceReferenceSchema = z.object({
  sourceId: idSchema,
  page: z.int().positive().optional(),
  pageEnd: z.int().positive().optional(),
  section: z.string().min(1).optional(),
  notes: z.string().min(1).optional()
}).strict().check((context) => {
  const value = context.value;
  if (value.pageEnd !== undefined && value.page === undefined) {
    context.issues.push({
      code: "custom",
      message: "pageEnd requires page",
      path: ["pageEnd"],
      input: value
    });
  }
  if (value.page !== undefined && value.pageEnd !== undefined && value.pageEnd < value.page) {
    context.issues.push({
      code: "custom",
      message: "pageEnd must be greater than or equal to page",
      path: ["pageEnd"],
      input: value
    });
  }
});

export const assetDefinitionSchema = z.object({
  ref: assetRefSchema,
  file: z.string().min(1),
  role: z.enum(["stem", "option", "supporting", "solution", "source"]),
  visibility: z.enum(["public", "private"]),
  alt: z.string().min(1),
  position: z.int().nonnegative().default(0)
}).strict();

const solutionSchema = z.object({
  text: z.string().min(1),
  assetRefs: z.array(assetRefSchema).default([])
}).strict();

const courseProfileSchema = z.object({
  difficulty: z.enum(["easy", "medium", "difficult"]),
  topics: z.array(idSchema).min(1),
  primaryTopic: idSchema,
  estimatedMinutes: z.int().positive().optional()
}).strict().check((context) => {
  if (!context.value.topics.includes(context.value.primaryTopic)) {
    context.issues.push({
      code: "custom",
      message: "primaryTopic must also be listed in topics",
      path: ["primaryTopic"],
      input: context.value
    });
  }
});

const questionBaseShape = {
  id: idSchema,
  slug: slugSchema,
  version: z.int().positive(),
  origin: z.enum(["official-handbook", "platform-created", "adapted"]),
  language: z.string().min(2).default("en"),
  status: contentStatusSchema,
  courseProfile: courseProfileSchema,
  assets: z.array(assetDefinitionSchema).default([]),
  sourceReferences: z.array(sourceReferenceSchema).default([])
};

const stimulusSchema = z.object({
  text: z.string().min(1).optional(),
  assetRefs: z.array(assetRefSchema).default([])
}).strict();

const choiceOptionSchema = z.object({
  id: idSchema,
  text: z.string().min(1).optional(),
  assetRef: assetRefSchema.optional(),
  accessibleLabel: z.string().min(1).optional()
}).strict().check((context) => {
  if (context.value.text === undefined && context.value.assetRef === undefined) {
    context.issues.push({
      code: "custom",
      message: "An option requires text or an assetRef",
      path: [],
      input: context.value
    });
  }
  if (context.value.assetRef !== undefined && context.value.accessibleLabel === undefined) {
    context.issues.push({
      code: "custom",
      message: "Image options require an accessibleLabel",
      path: ["accessibleLabel"],
      input: context.value
    });
  }
});

const singleChoiceQuestionSchema = z.object({
  ...questionBaseShape,
  renderer: z.enum(["single-choice-text", "single-choice-image"]),
  content: z.object({
    prompt: z.string().min(1),
    stimulus: stimulusSchema.optional(),
    options: z.array(choiceOptionSchema).min(2)
  }).strict(),
  response: z.object({
    type: z.literal("single-choice")
  }).strict(),
  answer: z.object({
    optionId: idSchema
  }).strict(),
  solution: solutionSchema
}).strict().check((context) => {
  const optionIds = context.value.content.options.map((option) => option.id);
  if (new Set(optionIds).size !== optionIds.length) {
    context.issues.push({
      code: "custom",
      message: "Option IDs must be unique",
      path: ["content", "options"],
      input: optionIds
    });
  }
  if (!optionIds.includes(context.value.answer.optionId)) {
    context.issues.push({
      code: "custom",
      message: "answer.optionId must reference an option",
      path: ["answer", "optionId"],
      input: context.value.answer.optionId
    });
  }
});

const multipleChoiceQuestionSchema = z.object({
  ...questionBaseShape,
  renderer: z.enum(["multiple-choice-text", "multiple-choice-image"]),
  content: z.object({
    prompt: z.string().min(1),
    stimulus: stimulusSchema.optional(),
    options: z.array(choiceOptionSchema).min(2)
  }).strict(),
  response: z.object({
    type: z.literal("multiple-choice"),
    minimumSelections: z.int().positive().default(1),
    maximumSelections: z.int().positive().optional()
  }).strict(),
  answer: z.object({
    optionIds: z.array(idSchema).min(1),
    scoring: z.enum(["all-or-nothing", "partial"]).default("all-or-nothing")
  }).strict(),
  solution: solutionSchema
}).strict().check((context) => {
  const optionIds = context.value.content.options.map((option) => option.id);
  const answerIds = context.value.answer.optionIds;
  if (new Set(optionIds).size !== optionIds.length) {
    context.issues.push({
      code: "custom",
      message: "Option IDs must be unique",
      path: ["content", "options"],
      input: optionIds
    });
  }
  if (new Set(answerIds).size !== answerIds.length || answerIds.some((id) => !optionIds.includes(id))) {
    context.issues.push({
      code: "custom",
      message: "answer.optionIds must uniquely reference valid options",
      path: ["answer", "optionIds"],
      input: answerIds
    });
  }
  const maximum = context.value.response.maximumSelections ?? optionIds.length;
  if (context.value.response.minimumSelections > maximum || maximum > optionIds.length) {
    context.issues.push({
      code: "custom",
      message: "Selection limits must fit the available options",
      path: ["response"],
      input: context.value.response
    });
  }
  if (answerIds.length < context.value.response.minimumSelections || answerIds.length > maximum) {
    context.issues.push({
      code: "custom",
      message: "The correct answer must fit the selection limits",
      path: ["answer", "optionIds"],
      input: answerIds
    });
  }
});

const fillSegmentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: z.string().min(1) }).strict(),
  z.object({ type: z.literal("blank"), id: idSchema, label: z.string().min(1) }).strict()
]);

const acceptedAnswerSchema = z.union([z.string(), z.number()]);

const fillInBlanksQuestionSchema = z.object({
  ...questionBaseShape,
  renderer: z.literal("fill-in-blanks"),
  content: z.object({
    prompt: z.string().min(1).optional(),
    stimulus: stimulusSchema.optional(),
    segments: z.array(fillSegmentSchema).min(2)
  }).strict(),
  response: z.object({
    type: z.literal("fill-in-blanks"),
    blanks: z.array(z.object({
      id: idSchema,
      input: z.enum(["text", "number"]),
      maxLength: z.int().positive().max(200).optional()
    }).strict()).min(1)
  }).strict(),
  answer: z.object({
    blanks: z.record(idSchema, z.object({
      accepted: z.array(acceptedAnswerSchema).min(1),
      caseSensitive: z.boolean().default(false)
    }).strict()),
    scoring: z.enum(["all-or-nothing", "per-blank"]).default("per-blank")
  }).strict(),
  solution: solutionSchema
}).strict().check((context) => {
  const segmentIds = context.value.content.segments
    .filter((segment) => segment.type === "blank")
    .map((segment) => segment.id);
  const responseIds = context.value.response.blanks.map((blank) => blank.id);
  const answerIds = Object.keys(context.value.answer.blanks);

  for (const [label, ids] of [["segment", segmentIds], ["response", responseIds], ["answer", answerIds]] as const) {
    if (new Set(ids).size !== ids.length) {
      context.issues.push({
        code: "custom",
        message: `${label} blank IDs must be unique`,
        path: [],
        input: ids
      });
    }
  }

  const expected = [...segmentIds].sort().join("|");
  if ([...responseIds].sort().join("|") !== expected || [...answerIds].sort().join("|") !== expected) {
    context.issues.push({
      code: "custom",
      message: "Content, response, and answer blank IDs must match",
      path: [],
      input: context.value
    });
  }
});

const shortAnswerQuestionSchema = z.object({
  ...questionBaseShape,
  renderer: z.literal("short-answer"),
  content: z.object({
    prompt: z.string().min(1),
    stimulus: stimulusSchema.optional()
  }).strict(),
  response: z.object({
    type: z.enum(["short-text", "numeric", "self-review"]),
    multiline: z.boolean().default(false),
    maxLength: z.int().positive().max(2000).default(300)
  }).strict(),
  answer: z.object({
    evaluation: z.enum(["exact", "accepted-values", "self-review"]),
    accepted: z.array(acceptedAnswerSchema).default([]),
    normalization: z.array(z.enum(["trim", "lowercase", "collapse-whitespace"])).default([]),
    keyIdeas: z.array(z.string().min(1)).default([])
  }).strict(),
  solution: solutionSchema
}).strict().check((context) => {
  const { response, answer } = context.value;
  if (response.type === "self-review" && answer.evaluation !== "self-review") {
    context.issues.push({
      code: "custom",
      message: "A self-review response requires self-review evaluation",
      path: ["answer", "evaluation"],
      input: answer.evaluation
    });
  }
  if (answer.evaluation === "self-review" && answer.keyIdeas.length === 0) {
    context.issues.push({
      code: "custom",
      message: "Self-review questions require keyIdeas",
      path: ["answer", "keyIdeas"],
      input: answer.keyIdeas
    });
  }
  if (answer.evaluation !== "self-review" && answer.accepted.length === 0) {
    context.issues.push({
      code: "custom",
      message: "Automatically evaluated answers require accepted values",
      path: ["answer", "accepted"],
      input: answer.accepted
    });
  }
});

const sequenceLineSchema = z.object({
  input: z.array(z.union([z.int(), z.null()])).min(2),
  output: z.array(z.union([z.int(), z.null()])).min(1)
}).strict();

const numberSequenceQuestionSchema = z.object({
  ...questionBaseShape,
  renderer: z.literal("number-sequence-pattern"),
  content: z.object({
    prompt: z.string().min(1),
    examples: z.array(sequenceLineSchema).min(1),
    query: sequenceLineSchema,
    options: z.array(z.object({
      id: idSchema,
      values: z.array(z.int()).min(1)
    }).strict()).min(2)
  }).strict(),
  response: z.object({
    type: z.literal("single-choice")
  }).strict(),
  answer: z.object({ optionId: idSchema }).strict(),
  solution: solutionSchema
}).strict().check((context) => {
  const optionIds = context.value.content.options.map((option) => option.id);
  if (!optionIds.includes(context.value.answer.optionId)) {
    context.issues.push({
      code: "custom",
      message: "answer.optionId must reference an option",
      path: ["answer", "optionId"],
      input: context.value.answer.optionId
    });
  }
});

const labelledItemSchema = z.object({
  id: idSchema,
  label: z.string().min(1)
}).strict();

const classificationQuestionSchema = z.object({
  ...questionBaseShape,
  renderer: z.literal("classification"),
  content: z.object({
    prompt: z.string().min(1),
    stimulus: stimulusSchema.optional(),
    rowHeading: z.string().min(1).default("Example"),
    categoryHeading: z.string().min(1).default("Answer"),
    categories: z.array(labelledItemSchema).min(2),
    rows: z.array(labelledItemSchema).min(2)
  }).strict(),
  response: z.object({
    type: z.literal("classification")
  }).strict(),
  answer: z.object({
    assignments: z.record(idSchema, idSchema),
    scoring: z.enum(["all-or-nothing", "per-row"]).default("all-or-nothing")
  }).strict(),
  solution: solutionSchema
}).strict().check((context) => {
  const rowIds = context.value.content.rows.map((row) => row.id);
  const categoryIds = context.value.content.categories.map((category) => category.id);
  const assignments = context.value.answer.assignments;

  for (const [label, ids] of [["row", rowIds], ["category", categoryIds]] as const) {
    if (new Set(ids).size !== ids.length) {
      context.issues.push({
        code: "custom",
        message: `${label} IDs must be unique`,
        path: ["content"],
        input: ids
      });
    }
  }

  if ([...Object.keys(assignments)].sort().join("|") !== [...rowIds].sort().join("|")) {
    context.issues.push({
      code: "custom",
      message: "answer.assignments must have exactly one entry per row",
      path: ["answer", "assignments"],
      input: assignments
    });
  }

  for (const [rowId, categoryId] of Object.entries(assignments)) {
    if (!categoryIds.includes(categoryId)) {
      context.issues.push({
        code: "custom",
        message: `answer.assignments.${rowId} must reference a category`,
        path: ["answer", "assignments", rowId],
        input: categoryId
      });
    }
  }
});

export const questionFileSchema = z.discriminatedUnion("renderer", [
  singleChoiceQuestionSchema,
  multipleChoiceQuestionSchema,
  fillInBlanksQuestionSchema,
  shortAnswerQuestionSchema,
  numberSequenceQuestionSchema,
  classificationQuestionSchema
]);

export const curriculumFileSchema = z.object({
  curriculum: z.object({
    id: idSchema,
    code: z.string().min(2),
    name: z.string().min(1)
  }).strict(),
  edition: z.object({
    id: idSchema,
    academicSession: z.string().regex(/^\d{4}-\d{2}$/),
    status: contentStatusSchema
  }).strict(),
  sourceDocuments: z.array(z.object({
    id: idSchema,
    title: z.string().min(1),
    fileName: z.string().min(1).optional(),
    documentType: z.enum(["student-handbook", "teacher-handbook", "platform-created", "other"]),
    rightsNotes: z.string().min(1).optional()
  }).strict()).default([])
}).strict();

export const courseFileSchema = z.object({
  id: idSchema,
  grade: z.object({
    id: idSchema,
    level: z.int().min(3).max(12),
    label: z.string().min(1)
  }).strict(),
  subject: z.object({
    id: idSchema,
    code: z.string().min(2),
    slug: slugSchema,
    name: z.string().min(1),
    description: z.string().min(1).optional()
  }).strict(),
  slug: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  status: contentStatusSchema,
  position: z.int().nonnegative().default(0)
}).strict();

export const chapterFileSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  displayNumber: z.string().min(1).optional(),
  title: z.string().min(1),
  summary: z.string().min(1).optional(),
  position: z.int().positive(),
  status: contentStatusSchema,
  sourceReferences: z.array(sourceReferenceSchema).default([])
}).strict();

export const topicsFileSchema = z.object({
  topics: z.array(z.object({
    id: idSchema,
    slug: slugSchema,
    title: z.string().min(1),
    position: z.int().positive(),
    parentId: idSchema.optional(),
    status: contentStatusSchema
  }).strict()).default([])
}).strict();

export const activityFileSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  engineKey: idSchema,
  version: z.int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  configuration: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("json"),
      file: z.string().min(1)
    }).strict(),
    z.object({
      kind: z.literal("module"),
      file: z.string().min(1),
      exportName: z.string().min(1),
      property: z.string().min(1).optional()
    }).strict()
  ]),
  studentContent: z.record(z.string(), z.unknown()),
  teacherContent: z.record(z.string(), z.unknown()).optional(),
  accessTier: accessTierSchema,
  status: contentStatusSchema,
  publishedAt: z.iso.datetime().optional(),
  position: z.int().positive(),
  displayLabel: z.string().min(1).optional(),
  sourceReferences: z.array(sourceReferenceSchema).default([])
}).strict();

export const questionSetFileSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  version: z.int().positive(),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  kind: z.enum(["handbook", "topic-practice", "chapter-practice", "revision", "challenge", "mixed"]),
  instructions: z.record(z.string(), z.unknown()).optional(),
  accessTier: accessTierSchema,
  status: contentStatusSchema,
  publishedAt: z.iso.datetime().optional(),
  items: z.array(z.object({
    questionId: idSchema,
    questionVersion: z.int().positive(),
    position: z.int().positive(),
    displayNumber: z.string().min(1).optional(),
    sourcePage: z.int().positive().optional(),
    sourceSection: z.string().min(1).optional()
  }).strict()).min(1)
}).strict();

export type CurriculumFile = z.infer<typeof curriculumFileSchema>;
export type CourseFile = z.infer<typeof courseFileSchema>;
export type ChapterFile = z.infer<typeof chapterFileSchema>;
export type TopicsFile = z.infer<typeof topicsFileSchema>;
export type ActivityFile = z.infer<typeof activityFileSchema>;
export type QuestionFile = z.infer<typeof questionFileSchema>;
export type QuestionSetFile = z.infer<typeof questionSetFileSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
