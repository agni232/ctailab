"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, RotateCcw, Sparkles } from "lucide-react";

import type {
  PublicQuestionItem,
  PublicQuestionSet,
  QuestionCheckResult,
  QuestionResponse
} from "@/features/questions/contracts";
import { QuestionRenderer } from "@/features/questions/components/QuestionRenderer";

interface QuestionPlayerProps {
  questionSet: PublicQuestionSet;
  initialQuestionNumber?: string;
}

interface CheckResponse {
  data?: QuestionCheckResult;
  error?: string;
}

/**
 * A question is ready to check once its renderer has enough of an answer: one
 * option, every blank filled, some text, or every row classified.
 */
function isAnswerComplete(
  question: PublicQuestionItem,
  response: QuestionResponse | undefined
): boolean {
  if (!response) {
    return false;
  }
  switch (response.kind) {
    case "choice":
      return response.optionId.length > 0;
    case "fill-in-blanks":
      return question.renderer === "fill-in-blanks"
        && question.content.segments
          .filter((segment) => segment.type === "blank")
          .every((segment) => (response.blanks[segment.id] ?? "").trim().length > 0);
    case "short-answer":
      return response.text.trim().length > 0;
    case "classification":
      return question.renderer === "classification"
        && question.content.rows.every((row) => Boolean(response.assignments[row.id]));
  }
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
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [results, setResults] = useState<Record<string, QuestionCheckResult>>({});
  const [explanations, setExplanations] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);

  const currentQuestion = questionSet.questions[currentIndex];
  const currentResponse = responses[currentQuestion.id];
  const result = results[currentQuestion.id];
  const completedCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter((item) => item.outcome === "correct").length;
  const readyToCheck = isAnswerComplete(currentQuestion, currentResponse);
  const totalQuestions = questionSet.questions.length;
  const isSingleQuestion = totalQuestions === 1;
  const progress = totalQuestions === 0
    ? 0
    : Math.round((completedCount / totalQuestions) * 100);

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
    if (!readyToCheck || checking) {
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/questions/${encodeURIComponent(currentQuestion.id)}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: currentResponse })
      });
      const payload = await response.json() as CheckResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to check this answer.");
      }

      setResults((current) => ({ ...current, [currentQuestion.id]: payload.data as QuestionCheckResult }));
      if (payload.data.outcome !== "incorrect") {
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
      {isSingleQuestion ? null : (
      <nav className="question-jump-nav" aria-label="Choose a handbook question">
        <div className="question-jump-heading">
          <span>Jump to a question</span>
          <strong>{completedCount}/{totalQuestions} checked</strong>
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
      )}

      {isSingleQuestion ? null : (
        <div className="handbook-progress" aria-label={`${progress}% of questions checked`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      <article className="handbook-question-panel">
        <header className="handbook-question-header">
          <div>
            <p className="handbook-question-kicker">
              {isSingleQuestion
                ? "Brain teaser"
                : `Question ${currentQuestion.displayNumber} of ${totalQuestions}`}
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
          response={currentResponse}
          result={result}
          showExplanation={Boolean(explanations[currentQuestion.id])}
          onRespond={(next) => {
            setResponses((current) => ({
              ...current,
              [currentQuestion.id]:
                typeof next === "function" ? next(current[currentQuestion.id]) : next
            }));
            setError(null);
          }}
        />

        {error ? <p className="handbook-error" role="alert">{error}</p> : null}

        {result ? (
          <div
            className={`answer-feedback${
              result.outcome === "correct"
                ? " is-correct"
                : result.outcome === "self-review"
                  ? " is-self-review"
                  : " is-try-again"
            }`}
            aria-live="polite"
          >
            <span className="answer-feedback-icon" aria-hidden="true">
              {result.outcome === "correct" ? <Sparkles size={25} /> : <RotateCcw size={23} />}
            </span>
            <div>
              <h3>
                {result.outcome === "correct"
                  ? "You found it!"
                  : result.outcome === "self-review"
                    ? "Compare your answer with the model answer."
                    : "Almost. Take another look."}
              </h3>
              {explanations[currentQuestion.id] && result.outcome !== "self-review"
                ? <p>{result.solution.text}</p>
                : null}
              {result.outcome !== "correct" ? (
                <div className="feedback-actions">
                  <button className="button button-coral" type="button" onClick={retryQuestion}>
                    <RotateCcw size={18} aria-hidden="true" />
                    {result.outcome === "self-review" ? "Write it again" : "Try again"}
                  </button>
                  {!explanations[currentQuestion.id] && result.outcome === "incorrect" ? (
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
          {isSingleQuestion ? <span /> : (
            <button
              className="button button-quiet"
              type="button"
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Previous
            </button>
          )}

          {!result ? (
            <button
              className="button button-primary"
              type="button"
              disabled={!readyToCheck || checking}
              onClick={checkAnswer}
            >
              <Check size={19} aria-hidden="true" />
              {checking ? "Checking..." : "Check answer"}
            </button>
          ) : currentIndex < totalQuestions - 1 ? (
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

      {completedCount === totalQuestions && !isSingleQuestion ? (
        <section className="handbook-complete" aria-labelledby="handbook-complete-title">
          <span aria-hidden="true"><BookOpenCheck size={30} /></span>
          <div>
            <p className="eyebrow">Chapter practice complete</p>
            <h2 id="handbook-complete-title">
              You explored all {totalQuestions} questions.
            </h2>
            <p>You solved {correctCount} correctly. Revisit any number to keep practising.</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
