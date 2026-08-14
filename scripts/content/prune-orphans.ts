/**
 * Removes courses and subjects that no longer appear in the authored content.
 *
 * `content:sync` only ever upserts, so renaming a course or subject ID leaves the
 * old row behind — still marked published, and still rendered by the catalog. This
 * script deletes exactly the rows the catalog no longer describes. Chapters, topics
 * and question sets hang off a course with `onDelete: Cascade`, so removing a stale
 * course takes its subtree with it.
 *
 * Run with --target=local (or --target=production --confirm) and --dry-run to see
 * what would go before anything is deleted.
 */
import "dotenv/config";

import { loadContentCatalog } from "../../src/content-authoring/loader";
import { createPrismaClient } from "../../src/server/db/prisma";
import { getDatabaseEnv } from "../../src/server/env";

function parseArguments() {
  const targetArg = process.argv.find((argument) => argument.startsWith("--target="));
  const target = targetArg?.split("=")[1];
  if (target !== "local" && target !== "production") {
    throw new Error("Use --target=local or --target=production");
  }
  if (target === "production" && !process.argv.includes("--confirm")) {
    throw new Error("Production pruning requires --confirm");
  }
  return { target, dryRun: process.argv.includes("--dry-run") };
}

async function main() {
  const { target, dryRun } = parseArguments();
  const catalog = await loadContentCatalog();
  const env = getDatabaseEnv();
  const prisma = createPrismaClient(env.DIRECT_URL);

  const authoredCourseIds = new Set(
    catalog.editions.flatMap((edition) => edition.courses.map(({ data }) => data.id))
  );
  const authoredSubjectIds = new Set(
    catalog.editions.flatMap((edition) => edition.courses.map(({ data }) => data.subject.id))
  );

  try {
    const staleCourses = (
      await prisma.course.findMany({
        select: { id: true, slug: true, _count: { select: { chapters: true } } }
      })
    ).filter((course) => !authoredCourseIds.has(course.id));

    for (const course of staleCourses) {
      console.log(
        `${dryRun ? "would delete" : "deleting"} course ${course.id} ` +
          `(${course.slug}, ${course._count.chapters} chapter(s))`
      );
      if (!dryRun) {
        await prisma.course.delete({ where: { id: course.id } });
      }
    }

    // Subjects are only removable once nothing references them, which is why this
    // runs after the course deletions rather than alongside them.
    const staleSubjects = (
      await prisma.subject.findMany({ select: { id: true, slug: true, _count: { select: { courses: true } } } })
    ).filter((subject) => !authoredSubjectIds.has(subject.id) && subject._count.courses === 0);

    for (const subject of staleSubjects) {
      console.log(`${dryRun ? "would delete" : "deleting"} subject ${subject.id} (${subject.slug})`);
      if (!dryRun) {
        await prisma.subject.delete({ where: { id: subject.id } });
      }
    }

    if (staleCourses.length === 0 && staleSubjects.length === 0) {
      console.log(`Nothing to prune on ${target}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
