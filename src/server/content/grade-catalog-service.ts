import {
  ContentAccessTier,
  ContentStatus,
  QuestionSetKind
} from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

export interface ChapterQuestionSetSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  questionCount: number;
}

export interface PublicGradeCatalog {
  grade: {
    level: number;
    label: string;
  };
  academicSession: string;
  courses: Array<{
    id: string;
    slug: string;
    title: string;
    description: string | null;
    subject: {
      slug: string;
      name: string;
      description: string | null;
    };
    chapters: Array<{
      id: string;
      slug: string;
      displayNumber: string | null;
      title: string;
      summary: string | null;
      activities: Array<{
        id: string;
        slug: string;
        title: string;
        description: string;
        displayLabel: string | null;
      }>;
      handbookSets: ChapterQuestionSetSummary[];
      challengeSets: ChapterQuestionSetSummary[];
    }>;
  }>;
}

interface QuestionSetRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: QuestionSetKind;
  versions: Array<{ _count: { items: number } }>;
}

function summariseSets(
  questionSets: QuestionSetRow[],
  kind: QuestionSetKind
): ChapterQuestionSetSummary[] {
  return questionSets.flatMap((questionSet) => {
    const version = questionSet.versions[0];
    return questionSet.kind === kind && version
      ? [{
          id: questionSet.id,
          slug: questionSet.slug,
          title: questionSet.title,
          description: questionSet.description,
          questionCount: version._count.items
        }]
      : [];
  });
}

/**
 * Grade levels that actually have published, publicly readable content behind
 * them. The home page uses this so a class becomes reachable the moment its
 * content is synced, rather than waiting on a hand-maintained list.
 */
export async function getPublishedGradeLevels(): Promise<number[]> {
  const courses = await prisma.course.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      chapters: { some: { status: ContentStatus.PUBLISHED } }
    },
    select: { grade: { select: { level: true } } }
  });

  return [...new Set(courses.map((course) => course.grade.level))].sort((a, b) => a - b);
}

export async function getPublishedGradeCatalog(
  gradeLevel: number
): Promise<PublicGradeCatalog | null> {
  const edition = await prisma.curriculumEdition.findFirst({
    where: {
      status: ContentStatus.PUBLISHED,
      courses: {
        some: {
          status: ContentStatus.PUBLISHED,
          grade: { level: gradeLevel }
        }
      }
    },
    orderBy: { academicSession: "desc" },
    include: {
      courses: {
        where: {
          status: ContentStatus.PUBLISHED,
          grade: { level: gradeLevel }
        },
        orderBy: { position: "asc" },
        include: {
          grade: true,
          subject: true,
          chapters: {
            where: { status: ContentStatus.PUBLISHED },
            orderBy: { position: "asc" },
            include: {
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
              },
              questionSets: {
                where: { kind: { in: [QuestionSetKind.HANDBOOK, QuestionSetKind.CHALLENGE] } },
                orderBy: { createdAt: "asc" },
                include: {
                  versions: {
                    where: {
                      status: ContentStatus.PUBLISHED,
                      accessTier: ContentAccessTier.PUBLIC
                    },
                    orderBy: { version: "desc" },
                    take: 1,
                    include: {
                      _count: { select: { items: true } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const firstCourse = edition?.courses[0];
  if (!edition || !firstCourse) {
    return null;
  }

  return {
    grade: {
      level: firstCourse.grade.level,
      label: firstCourse.grade.label
    },
    academicSession: edition.academicSession,
    courses: edition.courses.map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      subject: {
        slug: course.subject.slug,
        name: course.subject.name,
        description: course.subject.description
      },
      chapters: course.chapters.map((chapter) => ({
        id: chapter.id,
        slug: chapter.slug,
        displayNumber: chapter.displayNumber,
        title: chapter.title,
        summary: chapter.summary,
        activities: chapter.activityItems.map((item) => ({
          id: item.activityVersion.id,
          slug: item.activityVersion.activity.slug,
          title: item.activityVersion.title,
          description: item.activityVersion.description,
          displayLabel: item.displayLabel
        })),
        handbookSets: summariseSets(chapter.questionSets, QuestionSetKind.HANDBOOK),
        challengeSets: summariseSets(chapter.questionSets, QuestionSetKind.CHALLENGE)
      }))
    }))
  };
}
