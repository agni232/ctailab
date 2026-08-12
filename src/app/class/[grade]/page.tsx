import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Play,
  Sparkles
} from "lucide-react";

import { SiteHeader } from "@/app/SiteHeader";
import { getPublishedGradeCatalog } from "@/server/content/grade-catalog-service";

interface ClassPageProps {
  params: Promise<{ grade: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ClassPageProps): Promise<Metadata> {
  const { grade } = await params;

  return {
    title: `Class ${grade}`,
    description: `Explore chapter-wise activities and questions for Class ${grade}.`
  };
}

export default async function ClassPage({ params }: ClassPageProps) {
  const { grade } = await params;
  const gradeLevel = Number(grade);

  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) {
    notFound();
  }

  const catalog = await getPublishedGradeCatalog(gradeLevel);
  if (!catalog) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="class-overview-page">
        <section className="class-overview-hero" aria-labelledby="class-title">
          <div className="content-frame class-overview-hero-inner">
            <Link className="class-overview-back" href="/#choose-class">
              <ArrowLeft size={18} aria-hidden="true" />
              All classes
            </Link>
            <div className="class-overview-number" aria-hidden="true">
              {catalog.grade.level}
            </div>
            <div className="class-overview-copy">
              <p className="eyebrow">CBSE · {catalog.academicSession}</p>
              <h1 id="class-title">{catalog.grade.label}</h1>
              <p>Choose a chapter, learn by doing, then try the questions.</p>
            </div>
          </div>
        </section>

        <section className="class-curriculum" aria-label={`${catalog.grade.label} subjects`}>
          <div className="content-frame">
            {catalog.courses.map((course) => (
              <section className="subject-section" key={course.id} aria-labelledby={`subject-${course.id}`}>
                <header className="subject-heading">
                  <span className="subject-icon" aria-hidden="true">
                    <BrainCircuit size={30} />
                  </span>
                  <div>
                    <p className="eyebrow">Subject</p>
                    <h2 id={`subject-${course.id}`}>{course.subject.name}</h2>
                    <p>{course.description ?? course.subject.description}</p>
                  </div>
                </header>

                <div className="chapter-list">
                  {course.chapters.map((chapter) => (
                    <article className="chapter-row" key={chapter.id}>
                      <div className="chapter-number">
                        <span>Chapter</span>
                        <strong>{chapter.displayNumber ?? chapter.title}</strong>
                      </div>

                      <div className="chapter-main">
                        <div className="chapter-copy">
                          <p className="eyebrow">Ready to explore</p>
                          <h3>{chapter.title}</h3>
                          {chapter.summary ? <p>{chapter.summary}</p> : null}
                        </div>

                        <div className="chapter-resources" aria-label={`${chapter.title} learning choices`}>
                          {chapter.activities.map((activity) => (
                            <Link
                              className="chapter-resource chapter-resource-learn"
                              href={`/activity/${activity.slug}`}
                              key={activity.id}
                            >
                              <span className="chapter-resource-icon" aria-hidden="true">
                                <Play size={22} fill="currentColor" />
                              </span>
                              <span>
                                <small>{activity.displayLabel ?? "Learn"}</small>
                                <strong>{activity.title}</strong>
                              </span>
                              <ArrowRight size={21} aria-hidden="true" />
                            </Link>
                          ))}

                          {chapter.handbookSets.map((questionSet) => (
                            <Link
                              className="chapter-resource chapter-resource-practice"
                              href={`/class/${catalog.grade.level}/${course.subject.slug}/${chapter.slug}/questions`}
                              key={questionSet.id}
                            >
                              <span className="chapter-resource-icon" aria-hidden="true">
                                <BookOpenCheck size={23} />
                              </span>
                              <span>
                                <small>Practice · {questionSet.questionCount} questions</small>
                                <strong>{questionSet.title}</strong>
                              </span>
                              <ArrowRight size={21} aria-hidden="true" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            <div className="class-more-band">
              <Sparkles size={24} aria-hidden="true" />
              <div>
                <strong>More chapters are on the way</strong>
                <p>New activities and practice will appear here as they are ready.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
