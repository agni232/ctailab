import "dotenv/config";

import { loadContentCatalog } from "../../src/content-authoring/loader";

async function main() {
  const catalog = await loadContentCatalog();
  const summary = catalog.editions.reduce(
    (totals, edition) => {
      totals.courses += edition.courses.length;
      for (const course of edition.courses) {
        totals.chapters += course.chapters.length;
        for (const chapter of course.chapters) {
          totals.activities += chapter.activities.length;
          totals.questions += chapter.questions.length;
          totals.questionSets += chapter.questionSets.length;
        }
      }
      return totals;
    },
    { courses: 0, chapters: 0, activities: 0, questions: 0, questionSets: 0 }
  );

  console.log(
    `Content valid: ${catalog.editions.length} edition(s), ${summary.courses} course(s), ` +
      `${summary.chapters} chapter(s), ${summary.activities} activity, ` +
      `${summary.questions} question(s), ${summary.questionSets} question set(s).`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
