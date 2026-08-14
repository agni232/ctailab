import {
  AssetRole,
  AssetVisibility,
  ContentAccessTier,
  ContentStatus,
  Difficulty,
  Prisma,
  QuestionSetKind
} from "@/generated/prisma/client";
import {
  choiceAnswerKeySchema,
  classificationAnswerKeySchema,
  fillInBlanksAnswerKeySchema,
  publicChoiceContentSchema,
  publicClassificationContentSchema,
  publicFillInBlanksContentSchema,
  publicShortAnswerContentSchema,
  questionSolutionSchema,
  shortAnswerAnswerKeySchema,
  type PublicQuestionAsset,
  type PublicQuestionItem,
  type PublicQuestionSet,
  type QuestionCheckResult,
  type QuestionRendererKey,
  type QuestionResponse
} from "@/features/questions/contracts";
import { prisma } from "@/server/db/prisma";
import { contentAssetApiPath } from "@/server/storage/content-asset-url";

const supportedRenderers = new Set<QuestionRendererKey>([
  "single-choice-text",
  "single-choice-image",
  "fill-in-blanks",
  "short-answer",
  "classification"
]);

function isSupportedRenderer(renderer: string): renderer is QuestionRendererKey {
  return supportedRenderers.has(renderer as QuestionRendererKey);
}

/**
 * Parses the stored content for a renderer into its public shape. Each renderer
 * has its own content schema, so the payload sent to the browser stays exactly as
 * narrow as that renderer needs.
 */
function parseQuestionContent(
  renderer: QuestionRendererKey,
  content: unknown
): PublicQuestionItem["content"] {
  switch (renderer) {
    case "single-choice-text":
    case "single-choice-image":
      return publicChoiceContentSchema.parse(content);
    case "fill-in-blanks":
      return publicFillInBlanksContentSchema.parse(content);
    case "short-answer":
      return publicShortAnswerContentSchema.parse(content);
    case "classification":
      return publicClassificationContentSchema.parse(content);
  }
}

const assetRoleMap: Record<AssetRole, PublicQuestionAsset["role"]> = {
  STEM: "stem",
  OPTION: "option",
  SUPPORTING: "supporting",
  SOLUTION: "solution",
  SOURCE: "source"
};

const difficultyMap: Record<Difficulty, PublicQuestionItem["difficulty"]> = {
  EASY: "easy",
  MEDIUM: "medium",
  DIFFICULT: "difficult"
};

export class InvalidQuestionResponseError extends Error {}

function toPublicAsset(link: {
  assetId: string;
  refKey: string;
  role: AssetRole;
  altText: string;
}): PublicQuestionAsset {
  return {
    id: link.assetId,
    ref: link.refKey,
    role: assetRoleMap[link.role],
    altText: link.altText,
    url: contentAssetApiPath(link.assetId)
  };
}

async function getPublishedQuestionSetWhere(
  where: Prisma.QuestionSetWhereInput
): Promise<PublicQuestionSet | null> {
  const questionSet = await prisma.questionSet.findFirst({
    where: {
      AND: [where, { chapter: { status: ContentStatus.PUBLISHED } }]
    },
    include: {
      chapter: {
        include: {
          course: {
            include: { grade: true, subject: true }
          },
          activityItems: {
            where: {
              activityVersion: {
                status: ContentStatus.PUBLISHED,
                accessTier: ContentAccessTier.PUBLIC
              }
            },
            orderBy: { position: "asc" },
            include: {
              activityVersion: {
                include: { activity: true }
              }
            }
          }
        }
      },
      versions: {
        where: {
          status: ContentStatus.PUBLISHED,
          accessTier: ContentAccessTier.PUBLIC
        },
        orderBy: { version: "desc" },
        take: 1
      }
    }
  });

  const version = questionSet?.versions[0];
  if (!questionSet || !version) {
    return null;
  }

  const items = await prisma.questionSetItem.findMany({
    where: {
      questionSetVersionId: version.id,
      questionVersion: { status: ContentStatus.PUBLISHED }
    },
    orderBy: { position: "asc" },
    include: {
      questionVersion: {
        include: {
          assetLinks: {
            where: { asset: { visibility: AssetVisibility.PUBLIC } },
            orderBy: { position: "asc" }
          },
          courseProfiles: {
            where: { courseId: questionSet.chapter.courseId },
            take: 1,
            include: {
              topicLinks: {
                include: { topic: true }
              }
            }
          }
        }
      }
    }
  });

  const questions = items.map((item): PublicQuestionItem => {
    const questionVersion = item.questionVersion;
    if (!isSupportedRenderer(questionVersion.renderer)) {
      throw new Error(`Question renderer ${questionVersion.renderer} is not supported by this experience.`);
    }

    const profile = questionVersion.courseProfiles[0];
    if (!profile) {
      throw new Error(`Question ${questionVersion.id} has no course profile.`);
    }

    const base = {
      id: item.id,
      questionId: questionVersion.questionId,
      position: item.position,
      displayNumber: item.displayNumber ?? String(item.position),
      sourcePage: item.sourcePage,
      difficulty: difficultyMap[profile.difficulty],
      estimatedMinutes: profile.estimatedMinutes,
      topics: profile.topicLinks.map((link) => ({
        id: link.topicId,
        title: link.topic.title,
        isPrimary: link.isPrimary
      })),
      assets: questionVersion.assetLinks.map(toPublicAsset)
    };

    return {
      ...base,
      renderer: questionVersion.renderer,
      content: parseQuestionContent(questionVersion.renderer, questionVersion.content)
    } as PublicQuestionItem;
  });

  const instructions = version.instructions;
  const introduction = instructions && typeof instructions === "object" && !Array.isArray(instructions)
    && typeof (instructions as Record<string, unknown>).introduction === "string"
    ? (instructions as Record<string, string>).introduction
    : null;

  return {
    id: questionSet.id,
    slug: questionSet.slug,
    version: version.version,
    title: questionSet.title,
    description: questionSet.description,
    introduction,
    grade: {
      level: questionSet.chapter.course.grade.level,
      label: questionSet.chapter.course.grade.label
    },
    subject: {
      slug: questionSet.chapter.course.subject.slug,
      name: questionSet.chapter.course.subject.name
    },
    chapter: {
      id: questionSet.chapter.id,
      slug: questionSet.chapter.slug,
      displayNumber: questionSet.chapter.displayNumber,
      title: questionSet.chapter.title
    },
    activities: questionSet.chapter.activityItems.map((item) => ({
      id: item.activityVersion.id,
      slug: item.activityVersion.activity.slug,
      title: item.activityVersion.title
    })),
    questions
  };
}

export function getPublishedQuestionSet(identifier: string): Promise<PublicQuestionSet | null> {
  return getPublishedQuestionSetWhere({
    OR: [{ id: identifier }, { slug: identifier }]
  });
}

export function getPublishedChapterQuestionSet(params: {
  gradeLevel: number;
  subjectSlug: string;
  chapterSlug: string;
  kind: QuestionSetKind;
}): Promise<PublicQuestionSet | null> {
  return getPublishedQuestionSetWhere({
    kind: params.kind,
    chapter: {
      slug: params.chapterSlug,
      course: {
        status: ContentStatus.PUBLISHED,
        grade: { level: params.gradeLevel },
        subject: { slug: params.subjectSlug }
      }
    }
  });
}

export function getPublishedHandbookQuestionSet(params: {
  gradeLevel: number;
  subjectSlug: string;
  chapterSlug: string;
}): Promise<PublicQuestionSet | null> {
  return getPublishedChapterQuestionSet({ ...params, kind: QuestionSetKind.HANDBOOK });
}

export function getPublishedThinkingSpotQuestionSet(params: {
  gradeLevel: number;
  subjectSlug: string;
  chapterSlug: string;
}): Promise<PublicQuestionSet | null> {
  return getPublishedChapterQuestionSet({ ...params, kind: QuestionSetKind.CHALLENGE });
}

/** Trims and collapses whitespace so "  solve   " and "solve" grade the same. */
function normaliseText(value: string, rules: readonly string[]): string {
  let result = value;
  if (rules.includes("trim") || rules.length === 0) {
    result = result.trim();
  }
  if (rules.includes("collapse-whitespace") || rules.length === 0) {
    result = result.replace(/\s+/g, " ");
  }
  if (rules.includes("lowercase") || rules.length === 0) {
    result = result.toLowerCase();
  }
  return result;
}

function matchesAccepted(
  value: string,
  accepted: ReadonlyArray<string | number>,
  caseSensitive: boolean
): boolean {
  const rules = caseSensitive ? ["trim", "collapse-whitespace"] : ["trim", "collapse-whitespace", "lowercase"];
  const candidate = normaliseText(value, rules);
  return accepted.some((entry) => normaliseText(String(entry), rules) === candidate);
}

export async function checkQuestion(
  itemId: string,
  response: QuestionResponse
): Promise<QuestionCheckResult | null> {
  const item = await prisma.questionSetItem.findFirst({
    where: {
      id: itemId,
      questionSetVersion: {
        status: ContentStatus.PUBLISHED,
        accessTier: ContentAccessTier.PUBLIC
      },
      questionVersion: { status: ContentStatus.PUBLISHED }
    },
    include: {
      questionVersion: {
        include: {
          answerKey: true,
          solution: true,
          assetLinks: {
            where: { asset: { visibility: AssetVisibility.PUBLIC } },
            orderBy: { position: "asc" }
          }
        }
      }
    }
  });

  if (!item) {
    return null;
  }

  const { questionVersion } = item;
  const renderer = questionVersion.renderer;
  if (!isSupportedRenderer(renderer)) {
    throw new InvalidQuestionResponseError("This question cannot be checked here.");
  }
  if (!questionVersion.answerKey || !questionVersion.solution) {
    throw new Error(`Question ${questionVersion.id} is missing its answer or solution.`);
  }

  const solution = questionSolutionSchema.parse(questionVersion.solution.content);
  const publicAssets = questionVersion.assetLinks.map(toPublicAsset);
  const gradingConfig = questionVersion.answerKey.gradingConfig;
  const solutionPayload = {
    text: solution.text,
    assets: solution.assetRefs
      .map((ref) => publicAssets.find((asset) => asset.ref === ref))
      .filter((asset): asset is PublicQuestionAsset => Boolean(asset))
  };

  if (renderer === "single-choice-text" || renderer === "single-choice-image") {
    if (response.kind !== "choice") {
      throw new InvalidQuestionResponseError("This question expects a single choice.");
    }
    const content = publicChoiceContentSchema.parse(questionVersion.content);
    if (!content.options.some((option) => option.id === response.optionId)) {
      throw new InvalidQuestionResponseError("The selected option does not belong to this question.");
    }
    const answer = choiceAnswerKeySchema.parse(gradingConfig);
    return {
      outcome: response.optionId === answer.optionId ? "correct" : "incorrect",
      correctOptionId: answer.optionId,
      solution: solutionPayload
    };
  }

  if (renderer === "fill-in-blanks") {
    if (response.kind !== "fill-in-blanks") {
      throw new InvalidQuestionResponseError("This question expects the blanks to be filled in.");
    }
    const answer = fillInBlanksAnswerKeySchema.parse(gradingConfig);
    const blankIds = Object.keys(answer.blanks);
    const blanks: NonNullable<QuestionCheckResult["blanks"]> = {};

    for (const blankId of blankIds) {
      const expected = answer.blanks[blankId];
      const submitted = response.blanks[blankId] ?? "";
      blanks[blankId] = {
        correct: matchesAccepted(submitted, expected.accepted, expected.caseSensitive),
        expected: String(expected.accepted[0])
      };
    }

    const allCorrect = blankIds.every((blankId) => blanks[blankId].correct);
    return {
      outcome: allCorrect ? "correct" : "incorrect",
      blanks,
      solution: solutionPayload
    };
  }

  if (renderer === "classification") {
    if (response.kind !== "classification") {
      throw new InvalidQuestionResponseError("This question expects every row to be classified.");
    }
    const content = publicClassificationContentSchema.parse(questionVersion.content);
    const answer = classificationAnswerKeySchema.parse(gradingConfig);
    const categoryIds = new Set(content.categories.map((category) => category.id));
    const rows: NonNullable<QuestionCheckResult["rows"]> = {};

    for (const row of content.rows) {
      const submitted = response.assignments[row.id];
      if (submitted !== undefined && !categoryIds.has(submitted)) {
        throw new InvalidQuestionResponseError("An answer refers to a category that does not exist.");
      }
      rows[row.id] = {
        correct: submitted === answer.assignments[row.id],
        expectedCategoryId: answer.assignments[row.id]
      };
    }

    const allCorrect = content.rows.every((row) => rows[row.id].correct);
    return {
      outcome: allCorrect ? "correct" : "incorrect",
      rows,
      solution: solutionPayload
    };
  }

  if (response.kind !== "short-answer") {
    throw new InvalidQuestionResponseError("This question expects a written answer.");
  }
  const answer = shortAnswerAnswerKeySchema.parse(gradingConfig);
  if (answer.evaluation === "self-review") {
    // Open questions have no single right wording, so the learner marks their own
    // answer against the model one instead of the server guessing.
    return {
      outcome: "self-review",
      modelAnswer: { text: solution.text, keyIdeas: answer.keyIdeas },
      solution: solutionPayload
    };
  }

  const caseSensitive = !answer.normalization.includes("lowercase");
  return {
    outcome: matchesAccepted(response.text, answer.accepted, caseSensitive) ? "correct" : "incorrect",
    modelAnswer: { text: String(answer.accepted[0] ?? solution.text), keyIdeas: answer.keyIdeas },
    solution: solutionPayload
  };
}
