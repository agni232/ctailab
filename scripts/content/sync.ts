import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  ActivityVersion,
  AssetProvider,
  AssetRole,
  AssetVisibility,
  ContentAccessTier,
  ContentStatus,
  Difficulty,
  Prisma,
  QuestionOrigin,
  QuestionSetKind,
  ResponseType,
  SourceDocumentType
} from "../../src/generated/prisma/client";
import {
  contentHash,
  loadContentCatalog,
  type LoadedActivity,
  type LoadedChapter,
  type LoadedCourse,
  type LoadedFile
} from "../../src/content-authoring/loader";
import type {
  QuestionFile,
  QuestionSetFile,
  SourceReference
} from "../../src/content-authoring/schemas";
import { createPrismaClient } from "../../src/server/db/prisma";
import { getDatabaseEnv } from "../../src/server/env";
import type { ContentBucket } from "../../src/server/storage/content-storage";
import { SupabaseContentStorage } from "../../src/server/storage/supabase-content-storage";

interface PreparedAsset {
  id: string;
  ref: string;
  role: AssetRole;
  visibility: AssetVisibility;
  bucket: ContentBucket;
  objectKey: string;
  sha256: string;
  mimeType: string;
  altText: string;
  originalFileName: string;
  position: number;
}

const statusMap = {
  draft: ContentStatus.DRAFT,
  published: ContentStatus.PUBLISHED,
  archived: ContentStatus.ARCHIVED
} as const;

const accessTierMap = {
  public: ContentAccessTier.PUBLIC,
  account: ContentAccessTier.ACCOUNT,
  premium: ContentAccessTier.PREMIUM
} as const;

const originMap = {
  "official-handbook": QuestionOrigin.OFFICIAL_HANDBOOK,
  "platform-created": QuestionOrigin.PLATFORM_CREATED,
  adapted: QuestionOrigin.ADAPTED
} as const;

const difficultyMap = {
  easy: Difficulty.EASY,
  medium: Difficulty.MEDIUM,
  difficult: Difficulty.DIFFICULT
} as const;

const questionSetKindMap = {
  handbook: QuestionSetKind.HANDBOOK,
  "topic-practice": QuestionSetKind.TOPIC_PRACTICE,
  "chapter-practice": QuestionSetKind.CHAPTER_PRACTICE,
  revision: QuestionSetKind.REVISION,
  challenge: QuestionSetKind.CHALLENGE,
  mixed: QuestionSetKind.MIXED
} as const;

const sourceDocumentTypeMap = {
  "student-handbook": SourceDocumentType.STUDENT_HANDBOOK,
  "teacher-handbook": SourceDocumentType.TEACHER_HANDBOOK,
  "platform-created": SourceDocumentType.PLATFORM_CREATED,
  other: SourceDocumentType.OTHER
} as const;

const assetRoleMap = {
  stem: AssetRole.STEM,
  option: AssetRole.OPTION,
  supporting: AssetRole.SUPPORTING,
  solution: AssetRole.SOLUTION,
  source: AssetRole.SOURCE
} as const;

const mimeTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

function parseArguments() {
  const targetArg = process.argv.find((argument) => argument.startsWith("--target="));
  const target = targetArg?.split("=")[1];
  if (target !== "local" && target !== "production") {
    throw new Error("Use --target=local or --target=production");
  }
  if (target === "production" && !process.argv.includes("--confirm")) {
    throw new Error("Production synchronization requires --confirm");
  }
  return { target };
}

function publishedAt(status: ContentStatus, value?: string): Date | null {
  if (status !== ContentStatus.PUBLISHED) {
    return null;
  }
  return value ? new Date(value) : new Date();
}

function responseType(question: QuestionFile): ResponseType {
  switch (question.response.type) {
    case "single-choice":
      return ResponseType.SINGLE_CHOICE;
    case "multiple-choice":
      return ResponseType.MULTIPLE_CHOICE;
    case "fill-in-blanks":
      return ResponseType.FILL_IN_BLANKS;
    case "short-text":
      return ResponseType.SHORT_TEXT;
    case "numeric":
      return ResponseType.NUMERIC;
    case "self-review":
      return ResponseType.SELF_REVIEW;
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function versionId(id: string, version: number): string {
  return `${id}-v${version}`;
}

function assertPublishedVersionUnchanged(
  existing: Pick<ActivityVersion, "status" | "contentHash"> | null,
  nextHash: string,
  label: string
): void {
  if (existing?.status === ContentStatus.PUBLISHED && existing.contentHash !== nextHash) {
    throw new Error(`${label} is already published. Create a new version instead of editing it.`);
  }
}

async function replaceSourceReferences(
  tx: Prisma.TransactionClient,
  target: { chapterId?: string; activityVersionId?: string; questionVersionId?: string },
  targetId: string,
  references: SourceReference[]
): Promise<void> {
  await tx.sourceReference.deleteMany({ where: target });
  if (references.length === 0) {
    return;
  }
  await tx.sourceReference.createMany({
    data: references.map((reference, index) => ({
      id: `${targetId}-source-${index + 1}`,
      sourceDocumentId: reference.sourceId,
      page: reference.page,
      pageEnd: reference.pageEnd,
      section: reference.section,
      notes: reference.notes,
      ...target
    }))
  });
}

async function prepareQuestionAssets(
  question: LoadedFile<QuestionFile>,
  storage: SupabaseContentStorage
): Promise<PreparedAsset[]> {
  const prepared: PreparedAsset[] = [];
  for (const asset of question.data.assets) {
    const filePath = path.resolve(question.directory, asset.file);
    const body = await readFile(filePath);
    const sha256 = createHash("sha256").update(body).digest("hex");
    const extension = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[extension];
    if (!mimeType) {
      throw new Error(`${question.path}: unsupported asset type ${extension}`);
    }

    const visibility = asset.visibility === "public"
      ? AssetVisibility.PUBLIC
      : AssetVisibility.PRIVATE;
    const bucket: ContentBucket = visibility === AssetVisibility.PUBLIC
      ? "content-public"
      : "content-private";
    const originalFileName = path.basename(filePath);
    const objectKey = [
      "questions",
      question.data.id,
      `v${question.data.version}`,
      `${sha256.slice(0, 16)}-${originalFileName}`
    ].join("/");

    await storage.upload({ bucket, objectKey, body, contentType: mimeType });
    prepared.push({
      id: `asset-${asset.visibility}-${sha256.slice(0, 24)}`,
      ref: asset.ref,
      role: assetRoleMap[asset.role],
      visibility,
      bucket,
      objectKey,
      sha256,
      mimeType,
      altText: asset.alt,
      originalFileName,
      position: asset.position
    });
  }
  return prepared;
}

function questionContentHash(question: QuestionFile, assets: PreparedAsset[]): string {
  return contentHash({
    renderer: question.renderer,
    origin: question.origin,
    language: question.language,
    content: question.content,
    response: question.response,
    answer: question.answer,
    solution: question.solution,
    assets: assets.map(({ ref, role, sha256, visibility, altText, position }) => ({
      ref,
      role,
      sha256,
      visibility,
      altText,
      position
    }))
  });
}

async function syncActivity(
  tx: Prisma.TransactionClient,
  chapter: LoadedChapter,
  activity: LoadedActivity
): Promise<void> {
  const data = activity.data;
  const activityVersionId = versionId(data.id, data.version);
  const hash = contentHash({ ...data, configuration: activity.configuration });
  const status = statusMap[data.status];
  const existing = await tx.activityVersion.findUnique({ where: { id: activityVersionId } });
  assertPublishedVersionUnchanged(existing, hash, `Activity ${data.id} version ${data.version}`);

  await tx.activity.upsert({
    where: { id: data.id },
    create: { id: data.id, slug: data.slug, engineKey: data.engineKey },
    update: { slug: data.slug, engineKey: data.engineKey }
  });
  await tx.activityVersion.upsert({
    where: { id: activityVersionId },
    create: {
      id: activityVersionId,
      activityId: data.id,
      version: data.version,
      title: data.title,
      description: data.description,
      configuration: toJson(activity.configuration),
      contentHash: hash,
      studentContent: toJson(data.studentContent),
      teacherContent: data.teacherContent ? toJson(data.teacherContent) : Prisma.JsonNull,
      accessTier: accessTierMap[data.accessTier],
      status,
      publishedAt: publishedAt(status, data.publishedAt)
    },
    update: {
      title: data.title,
      description: data.description,
      configuration: toJson(activity.configuration),
      contentHash: hash,
      studentContent: toJson(data.studentContent),
      teacherContent: data.teacherContent ? toJson(data.teacherContent) : Prisma.JsonNull,
      accessTier: accessTierMap[data.accessTier],
      status,
      publishedAt: existing?.publishedAt ?? publishedAt(status, data.publishedAt)
    }
  });
  await tx.chapterActivityItem.upsert({
    where: {
      chapterId_activityVersionId: {
        chapterId: chapter.data.id,
        activityVersionId
      }
    },
    create: {
      id: `${chapter.data.id}-${activityVersionId}`,
      chapterId: chapter.data.id,
      activityVersionId,
      position: data.position,
      displayLabel: data.displayLabel
    },
    update: { position: data.position, displayLabel: data.displayLabel }
  });
  await replaceSourceReferences(
    tx,
    { activityVersionId },
    activityVersionId,
    data.sourceReferences
  );
}

async function syncQuestion(
  tx: Prisma.TransactionClient,
  course: LoadedCourse,
  question: LoadedFile<QuestionFile>,
  assets: PreparedAsset[]
): Promise<void> {
  const data = question.data;
  const questionVersionId = versionId(data.id, data.version);
  const hash = questionContentHash(data, assets);
  const status = statusMap[data.status];
  const existing = await tx.questionVersion.findUnique({ where: { id: questionVersionId } });
  assertPublishedVersionUnchanged(existing, hash, `Question ${data.id} version ${data.version}`);

  await tx.question.upsert({
    where: { id: data.id },
    create: { id: data.id, slug: data.slug },
    update: { slug: data.slug }
  });
  await tx.questionVersion.upsert({
    where: { id: questionVersionId },
    create: {
      id: questionVersionId,
      questionId: data.id,
      version: data.version,
      renderer: data.renderer,
      responseType: responseType(data),
      content: toJson(data.content),
      responseConfig: toJson(data.response),
      contentHash: hash,
      origin: originMap[data.origin],
      language: data.language,
      status,
      publishedAt: publishedAt(status)
    },
    update: {
      renderer: data.renderer,
      responseType: responseType(data),
      content: toJson(data.content),
      responseConfig: toJson(data.response),
      contentHash: hash,
      origin: originMap[data.origin],
      language: data.language,
      status,
      publishedAt: existing?.publishedAt ?? publishedAt(status)
    }
  });
  await tx.questionAnswerKey.upsert({
    where: { questionVersionId },
    create: { questionVersionId, gradingConfig: toJson(data.answer) },
    update: { gradingConfig: toJson(data.answer) }
  });
  await tx.questionSolution.upsert({
    where: { questionVersionId },
    create: { questionVersionId, content: toJson(data.solution) },
    update: { content: toJson(data.solution) }
  });

  const profileId = `${questionVersionId}-${course.data.id}`;
  const profile = await tx.questionCourseProfile.upsert({
    where: {
      questionVersionId_courseId: {
        questionVersionId,
        courseId: course.data.id
      }
    },
    create: {
      id: profileId,
      questionVersionId,
      courseId: course.data.id,
      difficulty: difficultyMap[data.courseProfile.difficulty],
      estimatedMinutes: data.courseProfile.estimatedMinutes
    },
    update: {
      difficulty: difficultyMap[data.courseProfile.difficulty],
      estimatedMinutes: data.courseProfile.estimatedMinutes
    }
  });
  await tx.questionTopicLink.deleteMany({ where: { questionCourseProfileId: profile.id } });
  await tx.questionTopicLink.createMany({
    data: data.courseProfile.topics.map((topicId) => ({
      questionCourseProfileId: profile.id,
      topicId,
      isPrimary: topicId === data.courseProfile.primaryTopic
    }))
  });

  await tx.questionAsset.deleteMany({ where: { questionVersionId } });
  for (const asset of assets) {
    await tx.contentAsset.upsert({
      where: {
        sha256_visibility: {
          sha256: asset.sha256,
          visibility: asset.visibility
        }
      },
      create: {
        id: asset.id,
        sha256: asset.sha256,
        mimeType: asset.mimeType,
        visibility: asset.visibility,
        originalFileName: asset.originalFileName
      },
      update: {
        mimeType: asset.mimeType,
        originalFileName: asset.originalFileName
      }
    });
    await tx.assetLocation.upsert({
      where: {
        provider_bucket_objectKey: {
          provider: AssetProvider.SUPABASE_STORAGE,
          bucket: asset.bucket,
          objectKey: asset.objectKey
        }
      },
      create: {
        id: `${asset.id}-supabase`,
        assetId: asset.id,
        provider: AssetProvider.SUPABASE_STORAGE,
        bucket: asset.bucket,
        objectKey: asset.objectKey,
        isPrimary: true
      },
      update: { assetId: asset.id, isPrimary: true }
    });
    await tx.questionAsset.create({
      data: {
        questionVersionId,
        assetId: asset.id,
        role: asset.role,
        refKey: asset.ref,
        altText: asset.altText,
        position: asset.position
      }
    });
  }

  await replaceSourceReferences(
    tx,
    { questionVersionId },
    questionVersionId,
    data.sourceReferences
  );
}

async function syncQuestionSet(
  tx: Prisma.TransactionClient,
  chapter: LoadedChapter,
  questionSet: LoadedFile<QuestionSetFile>
): Promise<void> {
  const data = questionSet.data;
  const questionSetVersionId = versionId(data.id, data.version);
  const hash = contentHash(data);
  const status = statusMap[data.status];
  const existing = await tx.questionSetVersion.findUnique({ where: { id: questionSetVersionId } });
  assertPublishedVersionUnchanged(existing, hash, `Question set ${data.id} version ${data.version}`);

  await tx.questionSet.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      chapterId: chapter.data.id,
      slug: data.slug,
      title: data.title,
      description: data.description,
      kind: questionSetKindMap[data.kind]
    },
    update: {
      chapterId: chapter.data.id,
      slug: data.slug,
      title: data.title,
      description: data.description,
      kind: questionSetKindMap[data.kind]
    }
  });
  await tx.questionSetVersion.upsert({
    where: { id: questionSetVersionId },
    create: {
      id: questionSetVersionId,
      questionSetId: data.id,
      version: data.version,
      instructions: data.instructions ? toJson(data.instructions) : Prisma.JsonNull,
      contentHash: hash,
      accessTier: accessTierMap[data.accessTier],
      status,
      publishedAt: publishedAt(status, data.publishedAt)
    },
    update: {
      instructions: data.instructions ? toJson(data.instructions) : Prisma.JsonNull,
      contentHash: hash,
      accessTier: accessTierMap[data.accessTier],
      status,
      publishedAt: existing?.publishedAt ?? publishedAt(status, data.publishedAt)
    }
  });
  await tx.questionSetItem.deleteMany({ where: { questionSetVersionId } });
  await tx.questionSetItem.createMany({
    data: data.items.map((item) => ({
      id: `${questionSetVersionId}-item-${item.position}`,
      questionSetVersionId,
      questionVersionId: versionId(item.questionId, item.questionVersion),
      position: item.position,
      displayNumber: item.displayNumber,
      sourcePage: item.sourcePage,
      sourceSection: item.sourceSection
    }))
  });
}

async function main() {
  const { target } = parseArguments();
  const catalog = await loadContentCatalog();
  const storage = new SupabaseContentStorage();
  const env = getDatabaseEnv();
  const prisma = createPrismaClient(env.DIRECT_URL);

  const assetMap = new Map<string, PreparedAsset[]>();
  const allQuestions = catalog.editions.flatMap((edition) =>
    edition.courses.flatMap((course) =>
      course.chapters.flatMap((chapter) => chapter.questions)
    )
  );

  await storage.ensureBuckets();
  for (const question of allQuestions) {
    assetMap.set(
      `${question.data.id}@${question.data.version}`,
      await prepareQuestionAssets(question, storage)
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const edition of catalog.editions) {
        const curriculum = edition.curriculum.data;
        await tx.curriculum.upsert({
          where: { id: curriculum.curriculum.id },
          create: curriculum.curriculum,
          update: { code: curriculum.curriculum.code, name: curriculum.curriculum.name }
        });
        await tx.curriculumEdition.upsert({
          where: { id: curriculum.edition.id },
          create: {
            id: curriculum.edition.id,
            curriculumId: curriculum.curriculum.id,
            academicSession: curriculum.edition.academicSession,
            status: statusMap[curriculum.edition.status]
          },
          update: {
            academicSession: curriculum.edition.academicSession,
            status: statusMap[curriculum.edition.status]
          }
        });
        for (const source of curriculum.sourceDocuments) {
          await tx.sourceDocument.upsert({
            where: { id: source.id },
            create: {
              id: source.id,
              curriculumEditionId: curriculum.edition.id,
              title: source.title,
              fileName: source.fileName,
              documentType: sourceDocumentTypeMap[source.documentType],
              rightsNotes: source.rightsNotes
            },
            update: {
              curriculumEditionId: curriculum.edition.id,
              title: source.title,
              fileName: source.fileName,
              documentType: sourceDocumentTypeMap[source.documentType],
              rightsNotes: source.rightsNotes
            }
          });
        }

        for (const course of edition.courses) {
          const data = course.data;
          await tx.grade.upsert({
            where: { id: data.grade.id },
            create: data.grade,
            update: { level: data.grade.level, label: data.grade.label }
          });
          await tx.subject.upsert({
            where: { id: data.subject.id },
            create: data.subject,
            update: {
              code: data.subject.code,
              slug: data.subject.slug,
              name: data.subject.name,
              description: data.subject.description
            }
          });
          await tx.course.upsert({
            where: { id: data.id },
            create: {
              id: data.id,
              curriculumEditionId: curriculum.edition.id,
              gradeId: data.grade.id,
              subjectId: data.subject.id,
              slug: data.slug,
              title: data.title,
              description: data.description,
              status: statusMap[data.status],
              position: data.position
            },
            update: {
              slug: data.slug,
              title: data.title,
              description: data.description,
              status: statusMap[data.status],
              position: data.position
            }
          });

          for (const chapter of course.chapters) {
            const chapterData = chapter.data;
            await tx.chapter.upsert({
              where: { id: chapterData.id },
              create: {
                id: chapterData.id,
                courseId: data.id,
                slug: chapterData.slug,
                displayNumber: chapterData.displayNumber,
                title: chapterData.title,
                summary: chapterData.summary,
                position: chapterData.position,
                status: statusMap[chapterData.status]
              },
              update: {
                slug: chapterData.slug,
                displayNumber: chapterData.displayNumber,
                title: chapterData.title,
                summary: chapterData.summary,
                position: chapterData.position,
                status: statusMap[chapterData.status]
              }
            });
            await replaceSourceReferences(
              tx,
              { chapterId: chapterData.id },
              chapterData.id,
              chapterData.sourceReferences
            );

            for (const topic of chapter.topics.data.topics) {
              await tx.topic.upsert({
                where: { id: topic.id },
                create: {
                  id: topic.id,
                  chapterId: chapterData.id,
                  slug: topic.slug,
                  title: topic.title,
                  position: topic.position,
                  status: statusMap[topic.status]
                },
                update: {
                  slug: topic.slug,
                  title: topic.title,
                  position: topic.position,
                  status: statusMap[topic.status],
                  parentId: null
                }
              });
            }
            for (const topic of chapter.topics.data.topics) {
              if (topic.parentId) {
                await tx.topic.update({ where: { id: topic.id }, data: { parentId: topic.parentId } });
              }
            }

            for (const activity of chapter.activities) {
              await syncActivity(tx, chapter, activity);
            }
            for (const question of chapter.questions) {
              const key = `${question.data.id}@${question.data.version}`;
              await syncQuestion(tx, course, question, assetMap.get(key) ?? []);
            }
          }
        }
      }

      for (const edition of catalog.editions) {
        for (const course of edition.courses) {
          for (const chapter of course.chapters) {
            for (const questionSet of chapter.questionSets) {
              await syncQuestionSet(tx, chapter, questionSet);
            }
          }
        }
      }
    }, { maxWait: 20_000, timeout: 120_000 });

    console.log(
      `Content synchronized to ${target}: ${catalog.editions.length} edition(s), ` +
        `${allQuestions.length} question(s).`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
