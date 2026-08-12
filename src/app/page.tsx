import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpenCheck, Bot, BrainCircuit, Check, LockKeyhole, Play } from "lucide-react";
import { SiteHeader } from "@/app/SiteHeader";
import { getLearningExperiencesByGrade, grades } from "@/features/curriculum/catalog";

const gradeThemes = ["teal", "blue", "coral", "yellow", "violet", "green"];

export default function HomePage() {
  const classThreeExperiences = getLearningExperiencesByGrade("grade-3");
  const featuredExperience = classThreeExperiences[0];

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="home-hero" aria-labelledby="home-title">
          <Image
            className="desktop-hero-art"
            src="/learning-lab-hero.png"
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 1px, 820px"
          />
          <div className="mobile-hero-art" aria-hidden="true">
            <Image
              src="/learning-lab-hero.png"
              alt=""
              width={1680}
              height={941}
              priority
              sizes="(max-width: 760px) 100vw, 1px"
            />
          </div>
          <div className="content-frame home-hero-inner">
            <div className="home-hero-copy">
              <p className="hero-label">For curious minds in Classes 3–8</p>
              <h1 id="home-title">Computational Thinking &amp; AI Lab</h1>
              <p>Experiment, spot patterns, and solve one mission at a time.</p>
              <div className="hero-actions">
                {featuredExperience ? (
                  <Link className="button button-primary" href={`/activity/${featuredExperience.slug}`}>
                    <Play size={19} fill="currentColor" aria-hidden="true" />
                    Start first mission
                  </Link>
                ) : null}
                <a className="text-link" href="#choose-class">
                  Choose a class
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="class-picker" id="choose-class" aria-labelledby="classes-heading">
          <div className="content-frame">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Pick your level</p>
                <h2 id="classes-heading">Choose your class</h2>
              </div>
              <p>Start where you are. New missions will appear here.</p>
            </div>

            <div className="class-grid">
              {grades.map((grade, index) => {
                const experiences = getLearningExperiencesByGrade(grade.id);
                const available = grade.status === "available" && experiences.length > 0;

                return (
                  <article className={`class-card class-card-${gradeThemes[index]}`} key={grade.id}>
                    <span className="class-number" aria-hidden="true">
                      {grade.level}
                    </span>
                    <div className="class-card-copy">
                      <h3>{grade.name}</h3>
                      <p>{available ? "Start with Chapter 1" : "Missions coming soon"}</p>
                    </div>
                    {available ? (
                      <Link className="class-action" href={`/class/${grade.level}`}>
                        Explore class
                        <ArrowRight size={19} aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="class-status">
                        <LockKeyhole size={15} aria-hidden="true" />
                        Soon
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="learning-paths" aria-labelledby="paths-heading">
          <div className="content-frame learning-paths-inner">
            <div className="section-heading section-heading-light">
              <div>
                <p className="eyebrow">Two learning paths</p>
                <h2 id="paths-heading">Think clearly. Build thoughtfully.</h2>
              </div>
            </div>
            <div className="path-grid">
              <div className="path-item">
                <span className="path-icon path-icon-coral" aria-hidden="true">
                  <BrainCircuit size={28} />
                </span>
                <div>
                  <h3>Computational Thinking</h3>
                  <p>Break problems down, find patterns, and design steps.</p>
                </div>
                <span className="path-state">
                  <Check size={16} aria-hidden="true" /> Ready
                </span>
              </div>
              <div className="path-item">
                <span className="path-icon path-icon-yellow" aria-hidden="true">
                  <Bot size={28} />
                </span>
                <div>
                  <h3>Artificial Intelligence</h3>
                  <p>Explore data, smart systems, and responsible choices.</p>
                </div>
                <span className="path-state path-state-muted">Coming soon</span>
              </div>
            </div>
          </div>
        </section>

        {featuredExperience ? (
          <section className="featured-mission" aria-labelledby="mission-heading">
            <div className="content-frame featured-mission-inner">
              <div className="mission-visual" aria-hidden="true">
                <span>A</span>
                <ArrowRight size={36} strokeWidth={2.5} />
                <span>D</span>
                <small>Shift 3</small>
              </div>
              <div className="mission-copy">
                <p className="eyebrow">Mission 01 · Class 3</p>
                <h2 id="mission-heading">Crack a secret message</h2>
                <p>{featuredExperience.description}</p>
              </div>
              <div className="mission-actions">
                <Link className="button button-dark" href={`/activity/${featuredExperience.slug}`}>
                  <Play size={19} fill="currentColor" aria-hidden="true" />
                  Start Caesar Cipher
                </Link>
                <Link
                  className="text-link"
                  href="/class/3/computational-thinking-ai/whats-in-a-name/questions"
                >
                  <BookOpenCheck size={18} aria-hidden="true" />
                  Handbook questions
                </Link>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
