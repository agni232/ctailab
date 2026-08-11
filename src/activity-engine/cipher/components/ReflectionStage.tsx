"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import type { CipherReflectionConfig } from "@/activity-engine/cipher/cipher.types";
import type { PracticeSummary } from "@/activity-engine/cipher/components/CipherPractice";
import { track } from "@/lib/analytics/client";

interface ReflectionStageProps {
  activityId: string;
  config: CipherReflectionConfig;
  summary: PracticeSummary;
  onComplete: () => void;
  onRetry: () => void;
}

export function ReflectionStage({
  activityId,
  config,
  summary,
  onComplete,
  onRetry
}: ReflectionStageProps) {
  const [reflection, setReflection] = useState("");
  const [completed, setCompleted] = useState(false);

  function finishReflection() {
    if (!reflection.trim() || completed) {
      return;
    }

    setCompleted(true);
    track("reflection_completed", {
      activityId,
      metadata: { characterCount: reflection.trim().length }
    });
    onComplete();
  }

  return (
    <section className="reflect-band" id="reflect" aria-labelledby="reflect-heading">
      <div className="content-frame stage-heading">
        <span className="stage-number stage-number-green" aria-hidden="true">6</span>
        <div>
          <p className="eyebrow">Reflect</p>
          <h2 id="reflect-heading">{config.title}</h2>
        </div>
      </div>

      <div className="content-frame reflect-layout">
        <div className="reflection-input">
          <label className="field-label" htmlFor="cipher-reflection">{config.prompt}</label>
          <textarea
            id="cipher-reflection"
            maxLength={160}
            placeholder="Every letter..."
            rows={4}
            value={reflection}
            disabled={completed}
            onChange={(event) => setReflection(event.target.value)}
          />
          <button className="button button-dark" type="button" onClick={finishReflection} disabled={!reflection.trim() || completed}>
            <Check size={18} aria-hidden="true" />
            {completed ? "Mission complete" : "Finish mission"}
          </button>
        </div>

        <div className={`reflection-summary ${completed ? "is-complete" : ""}`} aria-live="polite">
          <p className="eyebrow">Your challenge</p>
          <div className="result-stats" aria-label="Challenge results">
            <span><strong>{summary.score}/{summary.maxScore}</strong> first try</span>
            <span><strong>{summary.attempts}</strong> tries</span>
            <span><strong>{summary.hintsUsed}</strong> hints</span>
          </div>
          {completed ? (
            <>
              <ul className="learning-points">
                {config.learningPoints.map((point) => (
                  <li key={point}><Check size={17} aria-hidden="true" /> {point}</li>
                ))}
              </ul>
              <strong className="reflection-complete-message">You discovered the Caesar Cipher rule.</strong>
            </>
          ) : null}
        </div>

        <div className="reflect-actions">
          <button className="button button-quiet" type="button" onClick={onRetry}>
            <RotateCcw size={18} aria-hidden="true" /> Try again
          </button>
          <Link className="button button-dark" href="/">
            <ArrowLeft size={18} aria-hidden="true" /> More missions
          </Link>
        </div>
      </div>
    </section>
  );
}
