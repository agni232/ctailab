"use client";

import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, Lightbulb } from "lucide-react";
import type { CipherPracticeQuestion } from "@/activity-engine/cipher/cipher.types";
import { validateCipherQuestion } from "@/activity-engine/cipher/cipher.validation";
import { track } from "@/lib/analytics/client";

interface QuestionProgress {
  attempts: number;
  hintsUsed: number;
  correct: boolean;
  firstTry: boolean;
}

export interface PracticeSummary {
  score: number;
  maxScore: number;
  attempts: number;
  hintsUsed: number;
}

interface CipherPracticeProps {
  activityId: string;
  questions: CipherPracticeQuestion[];
  onActivityStart: () => void;
  onComplete: (summary: PracticeSummary) => void;
}

const emptyProgress: QuestionProgress = {
  attempts: 0,
  hintsUsed: 0,
  correct: false,
  firstTry: false
};

export function CipherPractice({
  activityId,
  questions,
  onActivityStart,
  onComplete
}: CipherPracticeProps) {
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [lastAttemptCorrect, setLastAttemptCorrect] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<Record<string, QuestionProgress>>({});
  const currentQuestion = questions[questionIndex];
  const currentProgress = currentQuestion ? progress[currentQuestion.id] ?? emptyProgress : emptyProgress;
  const visibleHints = currentQuestion?.hints.slice(0, currentProgress.hintsUsed) ?? [];

  function startPractice() {
    onActivityStart();
    setStarted(true);
    track("practice_started", {
      activityId,
      metadata: { questionCount: questions.length }
    });
  }

  function submitAnswer() {
    if (!currentQuestion || !answer.trim() || currentProgress.correct) {
      return;
    }

    onActivityStart();
    const result = validateCipherQuestion(currentQuestion, answer);
    const nextQuestionProgress: QuestionProgress = {
      ...currentProgress,
      attempts: currentProgress.attempts + 1,
      correct: result.correct,
      firstTry: currentProgress.firstTry || (result.correct && currentProgress.attempts === 0)
    };
    setProgress({ ...progress, [currentQuestion.id]: nextQuestionProgress });
    setFeedback(result.feedback);
    setLastAttemptCorrect(result.correct);

    track("question_answered", {
      activityId,
      metadata: {
        questionId: currentQuestion.id,
        questionNumber: questionIndex + 1,
        correct: result.correct,
        attemptNumber: nextQuestionProgress.attempts
      }
    });

    if (result.correct) {
      track("question_completed", {
        activityId,
        metadata: {
          questionId: currentQuestion.id,
          questionNumber: questionIndex + 1,
          firstTry: nextQuestionProgress.firstTry
        }
      });
    }
  }

  function showHint() {
    if (!currentQuestion || currentProgress.hintsUsed >= currentQuestion.hints.length) {
      return;
    }

    onActivityStart();
    const nextHintCount = currentProgress.hintsUsed + 1;
    setProgress({
      ...progress,
      [currentQuestion.id]: { ...currentProgress, hintsUsed: nextHintCount }
    });
    track("hint_used", {
      activityId,
      metadata: {
        questionId: currentQuestion.id,
        questionNumber: questionIndex + 1,
        hintNumber: nextHintCount
      }
    });
  }

  function continuePractice() {
    if (!currentQuestion || !currentProgress.correct) {
      return;
    }

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setAnswer("");
      setFeedback("");
      setLastAttemptCorrect(null);
      return;
    }

    const summary = summarizePractice(progress, questions.length);
    setFinished(true);
    track("practice_completed", { activityId, metadata: { ...summary } });
    onComplete(summary);
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <section className="practice-band" id="challenge" aria-labelledby="practice-heading">
      <div className="content-frame stage-heading">
        <span className="stage-number stage-number-violet" aria-hidden="true">4</span>
        <div>
          <p className="eyebrow">Challenge</p>
          <h2 id="practice-heading">Crack the code</h2>
        </div>
      </div>

      <div className="content-frame practice-content">
        {!started ? (
          <div className="practice-start">
            <div className="practice-count" aria-hidden="true">
              <strong>{questions.length}</strong>
              <span>CHALLENGES</span>
            </div>
            <p>Start with one letter, then work up to secret messages and a missing key.</p>
            <button className="button button-dark" type="button" onClick={startPractice}>
              Start challenge <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
        ) : finished ? (
          <div className="practice-finished" aria-live="polite">
            <CheckCircle2 size={38} aria-hidden="true" />
            <div>
              <p className="eyebrow">Challenge complete</p>
              <h3>You cracked every code.</h3>
            </div>
            <a className="button button-dark" href="#create">
              Make a secret <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        ) : (
          <div className="question-panel">
            <div className="question-progress">
              <div className="question-meta">
                <span>Challenge {questionIndex + 1} of {questions.length}</span>
                <span className="difficulty-pill">{currentQuestion.difficulty}</span>
              </div>
              <div className="practice-progress-track" aria-hidden="true">
                <span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
              </div>
            </div>

            <QuestionVisual question={currentQuestion} />
            <h3>{currentQuestion.prompt}</h3>
            <AnswerControl
              answer={answer}
              disabled={currentProgress.correct}
              question={currentQuestion}
              onAnswerChange={(nextAnswer) => {
                setAnswer(nextAnswer);
                setFeedback("");
                setLastAttemptCorrect(null);
              }}
              onSubmit={submitAnswer}
            />

            <div className="question-actions">
              {!currentProgress.correct ? (
                <button className="button" type="button" onClick={submitAnswer} disabled={!answer.trim()}>
                  <Check size={18} aria-hidden="true" /> Check
                </button>
              ) : null}
              {!currentProgress.correct && currentProgress.hintsUsed < currentQuestion.hints.length ? (
                <button className="button button-quiet" type="button" onClick={showHint}>
                  <Lightbulb size={18} aria-hidden="true" /> Hint
                </button>
              ) : null}
              {currentProgress.correct ? (
                <button className="button button-dark next-button" type="button" onClick={continuePractice}>
                  {questionIndex === questions.length - 1 ? "Finish challenge" : "Next challenge"}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {feedback ? (
              <div
                className={`feedback-area ${lastAttemptCorrect ? "feedback-correct" : "feedback-incorrect"}`}
                aria-live="polite"
              >
                <div className="feedback-message">
                  {lastAttemptCorrect ? <CheckCircle2 size={24} aria-hidden="true" /> : <Lightbulb size={24} aria-hidden="true" />}
                  <div>
                    <strong>{lastAttemptCorrect ? "You got it" : "Try once more"}</strong>
                    <p>{feedback}</p>
                    {lastAttemptCorrect ? <p>{currentQuestion.explanation}</p> : null}
                  </div>
                </div>
              </div>
            ) : null}

            {visibleHints.length > 0 ? (
              <div className="hint-list" aria-live="polite">
                <strong><Lightbulb size={18} aria-hidden="true" /> Hint</strong>
                <ul>
                  {visibleHints.map((hint) => <li key={hint}>{hint}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

interface AnswerControlProps {
  answer: string;
  disabled: boolean;
  question: CipherPracticeQuestion;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
}

function AnswerControl({ answer, disabled, question, onAnswerChange, onSubmit }: AnswerControlProps) {
  if (question.kind === "multiple-choice") {
    return (
      <div className="answer-choices" role="radiogroup" aria-label="Choose an answer">
        {question.choices.map((choice) => (
          <button
            className={answer === choice ? "is-selected" : ""}
            type="button"
            role="radio"
            aria-checked={answer === choice}
            disabled={disabled}
            onClick={() => onAnswerChange(choice)}
            key={choice}
          >
            {choice}
          </button>
        ))}
      </div>
    );
  }

  return (
    <input
      aria-label={question.kind === "find-shift" ? "Shift key answer" : "Cipher answer"}
      autoComplete="off"
      disabled={disabled}
      inputMode={question.kind === "find-shift" ? "numeric" : "text"}
      maxLength={question.kind === "find-shift" ? 2 : 80}
      placeholder={question.kind === "find-shift" ? "Type the key" : "Type your answer"}
      value={answer}
      onChange={(event) => onAnswerChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onSubmit();
        }
      }}
    />
  );
}

function QuestionVisual({ question }: { question: CipherPracticeQuestion }) {
  if (question.kind === "find-shift") {
    return (
      <div className="question-visual" aria-label={`${question.input} becomes ${question.output}`}>
        <strong>{question.input}</strong>
        <ArrowRight size={24} aria-hidden="true" />
        <strong>{question.output}</strong>
        <span>Key ?</span>
      </div>
    );
  }

  return (
    <div className="question-visual" aria-label={`${question.mode} ${question.input} using shift ${question.shift}`}>
      <span>{question.mode === "encode" ? "Encode" : "Decode"}</span>
      <strong>{question.input}</strong>
      <span>Key {question.shift}</span>
    </div>
  );
}

function summarizePractice(
  progress: Record<string, QuestionProgress>,
  questionCount: number
): PracticeSummary {
  const values = Object.values(progress);

  return {
    score: values.filter((item) => item.firstTry).length,
    maxScore: questionCount,
    attempts: values.reduce((sum, item) => sum + item.attempts, 0),
    hintsUsed: values.reduce((sum, item) => sum + item.hintsUsed, 0)
  };
}
