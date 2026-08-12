"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, RotateCcw, Sparkles } from "lucide-react";

import type {
  ChoiceCheckResult,
  PublicQuestionItem,
  PublicQuestionSet
} from "@/features/questions/contracts";
import { QuestionRenderer } from "@/features/questions/components/QuestionRenderer";

interface QuestionPlayerProps {
  questionSet: PublicQuestionSet;
  initialQuestionNumber?: string;
}

interface CheckResponse {
  data?: ChoiceCheckResult;
  error?: string;
}

function initialIndex(questions: PublicQuestionItem[], displayNumber?: string): number {
  if (!displayNumber) {
    return 0;
  }
  const index = questions.findIndex((question) => question.displayNumber === displayNumber);
  return index >= 0 ? index : 0;
}

export function QuestionPlayer({ questionSet, initialQuestionNumber }: QuestionPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    initialIndex(questionSet.questions, initialQuestionNumber)
  );
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ChoiceCheckResult>>({});
  const [explanations, setExplanations] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);

  const currentQuestion = questionSet.questions[currentIndex];
  const selectedOptionId = selections[currentQuestion.id];
  const result = results[currentQuestion.id];
  const completedCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter((item) => item.correct).length;
  const progress = questionSet.questions.length === 0
    ? 0
    : Math.round((completedCount / questionSet.questions.length) * 100);

  function goToQuestion(index: number) {
    const boundedIndex = Math.max(0, Math.min(questionSet.questions.length - 1, index));
    setCurrentIndex(boundedIndex);
    setError(null);

    const question = questionSet.questions[boundedIndex];
    const url = new URL(window.location.href);
    url.searchParams.set("question", question.displayNumber);
    window.history.replaceState(null, "", url);

    window.requestAnimationFrame(() => {
      questionHeadingRef.current?.focus();
      questionHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function checkAnswer() {
    if (!selectedOptionId || checking) {
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/questions/${encodeURIComponent(currentQuestion.id)}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: { optionId: selectedOptionId } })
      });
      const payload = await response.json() as CheckResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to check this answer.");
      }

      setResults((current) => ({ ...current, [currentQuestion.id]: payload.data as ChoiceCheckResult }));
      if (payload.data.correct) {
        setExplanations((current) => ({ ...current, [currentQuestion.id]: true }));
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to check this answer.");
    } finally {
      setChecking(false);
    }
  }

  function retryQuestion() {
    setResults((current) => {
      const next = { ...current };
      delete next[currentQuestion.id];
      return next;
    });
    setExplanations((current) => ({ ...current, [currentQuestion.id]: false }));
    setError(null);
  }

  return (
    <div className="handbook-player">
      <nav className="question-jump-nav" aria-label="Choose a handbook question">
        <div className="question-jump-heading">
          <span>Jump to a question</span>
          <strong>{completedCount}/{questionSet.questions.length} checked</strong>
        </div>
        <div className="question-number-strip">
          {questionSet.questions.map((question, index) => {
            const checked = Boolean(results[question.id]);
            return (
              <button
                type="button"
                key={question.id}
                className={`question-number-button${index === currentIndex ? " is-current" : ""}${checked ? " is-checked" : ""}`}
                aria-label={`Question ${question.displayNumber}${checked ? ", checked" : ""}`}
                aria-current={index === currentIndex ? "step" : undefined}
                onClick={() => goToQuestion(index)}
              >
                {checked ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : question.displayNumber}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="handbook-progress" aria-label={`${progress}% of questions checked`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <article className="handbook-question-panel">
        <header className="handbook-question-header">
          <div>
            <p className="handbook-question-kicker">
              Question {currentQuestion.displayNumber} of {questionSet.questions.length}
            </p>
            <h2 ref={questionHeadingRef} tabIndex={-1}>
              {currentQuestion.content.prompt}
            </h2>
          </div>
          <div className="handbook-question-meta" aria-label="Question details">
            <span className={`difficulty difficulty-${currentQuestion.difficulty}`}>
              {currentQuestion.difficulty}
            </span>
            {currentQuestion.sourcePage ? <span>Handbook p. {currentQuestion.sourcePage}</span> : null}
          </div>
        </header>

        <QuestionRenderer
          question={currentQuestion}
          selectedOptionId={selectedOptionId}
          result={result}
          showExplanation={Boolean(explanations[currentQuestion.id])}
          onSelect={(optionId) => {
            setSelections((current) => ({ ...current, [currentQuestion.id]: optionId }));
            setError(null);
          }}
        />

        {error ? <p className="handbook-error" role="alert">{error}</p> : null}

        {result ? (
          <div className={`answer-feedback${result.correct ? " is-correct" : " is-try-again"}`} aria-live="polite">
            <span className="answer-feedback-icon" aria-hidden="true">
              {result.correct ? <Sparkles size={25} /> : <RotateCcw size={23} />}
            </span>
            <div>
              <h3>{result.correct ? "You found it!" : "Almost. Take another look."}</h3>
              {explanations[currentQuestion.id] ? <p>{result.solution.text}</p> : null}
              {!result.correct ? (
                <div className="feedback-actions">
                  <button className="button button-coral" type="button" onClick={retryQuestion}>
                    <RotateCcw size={18} aria-hidden="true" />
                    Try again
                  </button>
                  {!explanations[currentQuestion.id] ? (
                    <button
                      className="button button-quiet"
                      type="button"
                      onClick={() => setExplanations((current) => ({
                        ...current,
                        [currentQuestion.id]: true
                      }))}
                    >
                      <BookOpenCheck size={18} aria-hidden="true" />
                      Show explanation
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <footer className="handbook-question-footer">
          <button
            className="button button-quiet"
            type="button"
            disabled={currentIndex === 0}
            onClick={() => goToQuestion(currentIndex - 1)}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Previous
          </button>

          {!result ? (
            <button
              className="button button-primary"
              type="button"
              disabled={!selectedOptionId || checking}
              onClick={checkAnswer}
            >
              <Check size={19} aria-hidden="true" />
              {checking ? "Checking..." : "Check answer"}
            </button>
          ) : currentIndex < questionSet.questions.length - 1 ? (
            <button
              className="button button-primary"
              type="button"
              onClick={() => goToQuestion(currentIndex + 1)}
            >
              Next question
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : null}
        </footer>
      </article>

      {completedCount === questionSet.questions.length ? (
        <section className="handbook-complete" aria-labelledby="handbook-complete-title">
          <span aria-hidden="true"><BookOpenCheck size={30} /></span>
          <div>
            <p className="eyebrow">Chapter practice complete</p>
            <h2 id="handbook-complete-title">
              You explored all {questionSet.questions.length} questions.
            </h2>
            <p>You solved {correctCount} correctly. Revisit any number to keep practising.</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
