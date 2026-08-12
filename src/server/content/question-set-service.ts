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
  publicChoiceContentSchema,
  questionSolutionSchema,
  type ChoiceCheckResult,
  type PublicQuestionAsset,
  type PublicQuestionItem,
  type PublicQuestionSet
} from "@/features/questions/contracts";
import { prisma } from "@/server/db/prisma";
import { contentAssetApiPath } from "@/server/storage/content-asset-url";

const supportedRenderers = new Set(["single-choice-text", "single-choice-image"]);

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
    if (!supportedRenderers.has(questionVersion.renderer)) {
      throw new Error(`Question renderer ${questionVersion.renderer} is not supported by this experience.`);
    }

    const profile = questionVersion.courseProfiles[0];
    if (!profile) {
      throw new Error(`Question ${questionVersion.id} has no course profile.`);
    }

    return {
      id: item.id,
      questionId: questionVersion.questionId,
      position: item.position,
      displayNumber: item.displayNumber ?? String(item.position),
      sourcePage: item.sourcePage,
      renderer: questionVersion.renderer as PublicQuestionItem["renderer"],
      content: publicChoiceContentSchema.parse(questionVersion.content),
      difficulty: difficultyMap[profile.difficulty],
      estimatedMinutes: profile.estimatedMinutes,
      topics: profile.topicLinks.map((link) => ({
        id: link.topicId,
        title: link.topic.title,
        isPrimary: link.isPrimary
      })),
      assets: questionVersion.assetLinks.map(toPublicAsset)
    };
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

export async function checkChoiceQuestion(
  itemId: string,
  selectedOptionId: string
): Promise<ChoiceCheckResult | null> {
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
  if (!supportedRenderers.has(questionVersion.renderer)) {
    throw new InvalidQuestionResponseError("This question does not accept a choice response.");
  }

  const content = publicChoiceContentSchema.parse(questionVersion.content);
  if (!content.options.some((option) => option.id === selectedOptionId)) {
    throw new InvalidQuestionResponseError("The selected option does not belong to this question.");
  }
  if (!questionVersion.answerKey || !questionVersion.solution) {
    throw new Error(`Question ${questionVersion.id} is missing its answer or solution.`);
  }

  const answer = choiceAnswerKeySchema.parse(questionVersion.answerKey.gradingConfig);
  const solution = questionSolutionSchema.parse(questionVersion.solution.content);
  const publicAssets = questionVersion.assetLinks.map(toPublicAsset);

  return {
    correct: selectedOptionId === answer.optionId,
    correctOptionId: answer.optionId,
    solution: {
      text: solution.text,
      assets: solution.assetRefs
        .map((ref) => publicAssets.find((asset) => asset.ref === ref))
        .filter((asset): asset is PublicQuestionAsset => Boolean(asset))
    }
  };
}
