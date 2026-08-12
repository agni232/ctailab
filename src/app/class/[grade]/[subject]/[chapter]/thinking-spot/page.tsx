import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lightbulb, Play } from "lucide-react";

import { SiteHeader } from "@/app/SiteHeader";
import { QuestionPlayer } from "@/features/questions/components/QuestionPlayer";
import { getPublishedThinkingSpotQuestionSet } from "@/server/content/question-set-service";

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
    title: `Class ${grade} Thinking Spot`,
    description: `Try the bonus brain teaser for Class ${grade}.`
  };
}

export default async function ThinkingSpotPage({ params, searchParams }: PageProps) {
  const [route, query] = await Promise.all([params, searchParams]);
  const gradeLevel = Number(route.grade);

  if (!Number.isInteger(gradeLevel)) {
    notFound();
  }

  const questionSet = await getPublishedThinkingSpotQuestionSet({
    gradeLevel,
    subjectSlug: route.subject,
    chapterSlug: route.chapter
  });

  if (!questionSet) {
    notFound();
  }

  const puzzleCount = questionSet.questions.length;
  const relatedActivity = questionSet.activities[0];

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="handbook-page">
        <section className="handbook-hero handbook-hero-challenge" aria-labelledby="thinking-spot-title">
          <div className="content-frame handbook-hero-inner">
            <Link className="handbook-back-link" href={`/class/${questionSet.grade.level}`}>
              <ArrowLeft size={18} aria-hidden="true" />
              {questionSet.grade.label} chapters
            </Link>
            <div className="handbook-hero-copy">
              <span className="handbook-hero-icon" aria-hidden="true">
                <Lightbulb size={34} />
              </span>
              <div>
                <p className="eyebrow">
                  {questionSet.grade.label} · Chapter {questionSet.chapter.displayNumber}
                </p>
                <h1 id="thinking-spot-title">{questionSet.title}</h1>
                <p>
                  {questionSet.chapter.title} · {puzzleCount} {puzzleCount === 1 ? "puzzle" : "puzzles"}
                </p>
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

        <section className="handbook-learning-band" aria-label="Puzzle instructions">
          <div className="content-frame">
            <p>{questionSet.introduction ?? "Take your time. Read it twice before you choose."}</p>
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

        <section className="handbook-workspace">
          <div className="content-frame">
            <Link
              className="handbook-back-link"
              href={`/class/${questionSet.grade.level}/${questionSet.subject.slug}/${questionSet.chapter.slug}/questions`}
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Back to the chapter questions
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
