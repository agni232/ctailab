import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Play } from "lucide-react";

import { SiteHeader } from "@/app/SiteHeader";
import { QuestionPlayer } from "@/features/questions/components/QuestionPlayer";
import { getPublishedHandbookQuestionSet } from "@/server/content/question-set-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    grade: string;
    subject: string;
    chapter: string;
  }>;
  searchParams: Promise<{ question?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { grade } = await params;

  return {
    title: `Class ${grade} Handbook Questions`,
    description: `Practise handbook questions for Class ${grade}.`
  };
}

export default async function HandbookQuestionsPage({ params, searchParams }: PageProps) {
  const [route, query] = await Promise.all([params, searchParams]);
  const gradeLevel = Number(route.grade);

  if (!Number.isInteger(gradeLevel)) {
    notFound();
  }

  const questionSet = await getPublishedHandbookQuestionSet({
    gradeLevel,
    subjectSlug: route.subject,
    chapterSlug: route.chapter
  });

  if (!questionSet) {
    notFound();
  }

  const relatedActivity = questionSet.activities[0];

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="handbook-page">
        <section className="handbook-hero" aria-labelledby="handbook-title">
          <div className="content-frame handbook-hero-inner">
            <Link className="handbook-back-link" href={`/class/${questionSet.grade.level}`}>
              <ArrowLeft size={18} aria-hidden="true" />
              {questionSet.grade.label} chapters
            </Link>
            <div className="handbook-hero-copy">
              <span className="handbook-hero-icon" aria-hidden="true">
                <BookOpen size={34} />
              </span>
              <div>
                <p className="eyebrow">
                  {questionSet.grade.label} · Chapter {questionSet.chapter.displayNumber}
                </p>
                <h1 id="handbook-title">{questionSet.chapter.title}</h1>
                <p>{questionSet.title} · {questionSet.questions.length} questions</p>
              </div>
            </div>
            {relatedActivity ? (
              <Link className="button button-dark" href={`/activity/${relatedActivity.slug}`}>
                <Play size={18} fill="currentColor" aria-hidden="true" />
                Try {relatedActivity.title}
              </Link>
            ) : null}
          </div>
        </section>

        <section className="handbook-learning-band" aria-label="Practice instructions">
          <div className="content-frame">
            <p>{questionSet.introduction ?? "Choose an answer, check it, and learn from the explanation."}</p>
          </div>
        </section>

        <section className="handbook-workspace">
          <div className="content-frame">
            <QuestionPlayer
              questionSet={questionSet}
              initialQuestionNumber={query.question}
            />
          </div>
        </section>
      </main>
    </>
  );
}
