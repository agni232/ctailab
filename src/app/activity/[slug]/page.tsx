import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { requireActivityImplementation } from "@/activity-engine/registry";
import { SiteHeader } from "@/app/SiteHeader";
import {
  getDomainTitle,
  getGradeName,
  getLearningExperienceBySlug,
  getPublishedLearningExperiences
} from "@/features/curriculum/catalog";

type ActivityPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getPublishedLearningExperiences().map((experience) => ({
    slug: experience.slug
  }));
}

export async function generateMetadata({ params }: ActivityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const experience = getLearningExperienceBySlug(slug);

  if (!experience) {
    return {
      title: "Activity not found"
    };
  }

  return {
    title: experience.title,
    description: experience.description,
    alternates: {
      canonical: `/activity/${experience.slug}`
    },
    openGraph: {
      title: experience.title,
      description: experience.description,
      type: "article",
      url: `/activity/${experience.slug}`
    }
  };
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { slug } = await params;
  const experience = getLearningExperienceBySlug(slug);

  if (!experience?.activityType) {
    notFound();
  }

  const activity = requireActivityImplementation(experience.activityType);
  const ActivityComponent = activity.component;
  const grades = experience.gradeIds.map(getGradeName).join(", ");
  const domains = experience.domainIds.map(getDomainTitle).join(", ");

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="activity-hero">
          <div className="content-frame activity-heading">
            <Link className="back-link" href="/">
              <ArrowLeft size={18} aria-hidden="true" />
              All classes
            </Link>
            <p className="mission-kicker">Mission 01 · {grades}</p>
            <h1>{experience.title}</h1>
            <p className="lede">{experience.description}</p>
            <div className="metadata-row" aria-label="Activity details">
              <span>{domains}</span>
              <span>About 15 minutes</span>
            </div>
          </div>
          <div className="cipher-hero-mark" aria-hidden="true">
            <span>A</span>
            <i>+3</i>
            <span>D</span>
          </div>
        </section>

        <section className="content-frame learning-strip" aria-labelledby="learn-heading">
          <div className="learn-intro">
            <p className="eyebrow">Before you begin</p>
            <h2 id="learn-heading">The secret rule</h2>
            <p>{experience.studentContent.introduction}</p>
          </div>
          <ul className="key-ideas">
            {experience.studentContent.keyIdeas.map((idea) => (
              <li key={idea}>
                <span aria-hidden="true"><Check size={17} /></span>
                {idea}
              </li>
            ))}
          </ul>
        </section>

        <ActivityComponent experience={experience} />
      </main>
    </>
  );
}
