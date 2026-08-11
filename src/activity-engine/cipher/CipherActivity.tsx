"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Lightbulb,
  LockKeyhole,
  Minus,
  Plus,
  RotateCcw,
  Trophy,
  UnlockKeyhole
} from "lucide-react";
import type { ActivityComponentProps } from "@/activity-engine/types";
import { decode, encode, getAlphabetMapping } from "@/activity-engine/cipher/cipher.engine";
import type { CipherActivityConfig, CipherMode, CipherPracticeQuestion } from "@/activity-engine/cipher/cipher.types";
import { validateCipherQuestion } from "@/activity-engine/cipher/cipher.validation";
import { track } from "@/lib/analytics/client";

type QuestionProgress = {
  attempts: number;
  hintsUsed: number;
  correct: boolean;
};

type AttemptState = "correct" | "incorrect" | null;

const quickMessages = ["HELLO", "SECRET", "MEET AT 4"];

export function CipherActivity({ experience }: ActivityComponentProps<CipherActivityConfig>) {
  const config = experience.activityConfig;
  const questions = config?.practiceQuestions ?? [];
  const minShift = config?.minShift ?? 1;
  const maxShift = config?.maxShift ?? 25;
  const [mode, setMode] = useState<CipherMode>("encode");
  const [shift, setShift] = useState(config?.defaultShift ?? 3);
  const [message, setMessage] = useState(config?.defaultText ?? "HELLO");
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lastAttempt, setLastAttempt] = useState<AttemptState>(null);
  const [questionProgress, setQuestionProgress] = useState<Record<string, QuestionProgress>>({});
  const [completed, setCompleted] = useState(false);

  const activityId = experience.id;
  const output = mode === "encode" ? encode(message, shift) : decode(message, shift);
  const alphabetMapping = useMemo(() => getAlphabetMapping(shift), [shift]);
  const currentQuestion = questions[currentQuestionIndex];
  const completedQuestions = Object.values(questionProgress).filter((progress) => progress.correct).length;
  const totalHintsUsed = Object.values(questionProgress).reduce((sum, progress) => sum + progress.hintsUsed, 0);
  const totalAttempts = Object.values(questionProgress).reduce((sum, progress) => sum + progress.attempts, 0);
  const scorePercent = questions.length > 0 ? Math.round((completedQuestions / questions.length) * 100) : 0;

  useEffect(() => {
    track("page_view", { activityId });
  }, [activityId]);

  function markStarted(metadata?: Record<string, unknown>) {
    track("activity_started", { activityId, metadata });
  }

  function handleModeChange(nextMode: CipherMode) {
    setMode(nextMode);
    markStarted({ action: "mode_changed", mode: nextMode });
  }

  function handleShiftChange(nextShift: number) {
    const boundedShift = Math.max(minShift, Math.min(maxShift, nextShift));
    setShift(boundedShift);
    markStarted({ action: "shift_changed", shift: boundedShift });
  }

  function handleMessageChange(nextMessage: string) {
    setMessage(nextMessage);
    markStarted({ action: "message_changed" });
  }

  function handlePracticeStart() {
    setPracticeStarted(true);
    track("practice_started", { activityId, metadata: { questionCount: questions.length } });
  }

  function handleAnswerSubmit() {
    if (!currentQuestion || !answer.trim()) {
      return;
    }

    const validation = validateCipherQuestion(currentQuestion, answer);
    const nextProgress = updateQuestionProgress(currentQuestion, validation.correct);
    setQuestionProgress(nextProgress);
    setFeedback(validation.feedback);
    setLastAttempt(validation.correct ? "correct" : "incorrect");

    const progress = nextProgress[currentQuestion.id];
    track("question_answered", {
      activityId,
      metadata: {
        questionId: currentQuestion.id,
        questionNumber: currentQuestionIndex + 1,
        correct: validation.correct,
        attemptNumber: progress.attempts
      }
    });

    if (validation.correct) {
      track("question_completed", {
        activityId,
        metadata: {
          questionId: currentQuestion.id,
          questionNumber: currentQuestionIndex + 1
        }
      });
    }
  }

  function updateQuestionProgress(question: CipherPracticeQuestion, correct: boolean) {
    const existing = questionProgress[question.id] ?? {
      attempts: 0,
      hintsUsed: 0,
      correct: false
    };

    return {
      ...questionProgress,
      [question.id]: {
        ...existing,
        attempts: existing.attempts + 1,
        correct: existing.correct || correct
      }
    };
  }

  function handleHint() {
    if (!currentQuestion) {
      return;
    }

    const existing = questionProgress[currentQuestion.id] ?? {
      attempts: 0,
      hintsUsed: 0,
      correct: false
    };
    const nextHintCount = Math.min(existing.hintsUsed + 1, currentQuestion.hints.length);

    setQuestionProgress({
      ...questionProgress,
      [currentQuestion.id]: {
        ...existing,
        hintsUsed: nextHintCount
      }
    });

    track("hint_used", {
      activityId,
      metadata: {
        questionId: currentQuestion.id,
        questionNumber: currentQuestionIndex + 1,
        hintNumber: nextHintCount
      }
    });
  }

  function handleNextQuestion() {
    setAnswer("");
    setFeedback("");
    setLastAttempt(null);

    if (currentQuestionIndex >= questions.length - 1) {
      setCompleted(true);
      track("activity_completed", {
        activityId,
        metadata: {
          score: completedQuestions,
          maxScore: questions.length,
          scorePercent,
          attempts: totalAttempts,
          hintsUsed: totalHintsUsed
        }
      });
      return;
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1);
  }

  function handleRetry() {
    setPracticeStarted(false);
    setCurrentQuestionIndex(0);
    setAnswer("");
    setFeedback("");
    setLastAttempt(null);
    setQuestionProgress({});
    setCompleted(false);
    track("activity_retried", { activityId });
  }

  const currentProgress = currentQuestion
    ? questionProgress[currentQuestion.id] ?? { attempts: 0, hintsUsed: 0, correct: false }
    : { attempts: 0, hintsUsed: 0, correct: false };
  const visibleHints = currentQuestion?.hints.slice(0, currentProgress.hintsUsed) ?? [];
  const practicePercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <section className="activity-workspace">
      <div className="explore-band" aria-labelledby="explore-heading">
        <div className="content-frame stage-heading">
          <span className="stage-number" aria-hidden="true">1</span>
          <div>
            <p className="eyebrow">Explore</p>
            <h2 id="explore-heading">Move the key. Watch the code change.</h2>
          </div>
        </div>

        <div className="content-frame activity-layout">
          <div className="tool-panel">
            <div className="mode-toggle" aria-label="Choose cipher mode">
              <button
                className={mode === "encode" ? "is-active" : ""}
                type="button"
                onClick={() => handleModeChange("encode")}
                aria-pressed={mode === "encode"}
              >
                <LockKeyhole size={19} aria-hidden="true" />
                Encode
              </button>
              <button
                className={mode === "decode" ? "is-active" : ""}
                type="button"
                onClick={() => handleModeChange("decode")}
                aria-pressed={mode === "decode"}
              >
                <UnlockKeyhole size={19} aria-hidden="true" />
                Decode
              </button>
            </div>

            <label className="field-label" htmlFor="cipher-message">
              {mode === "encode" ? "Message to hide" : "Code to reveal"}
            </label>
            <textarea
              id="cipher-message"
              value={message}
              onChange={(event) => handleMessageChange(event.target.value)}
              rows={3}
              maxLength={80}
              spellCheck={false}
            />

            <div className="quick-messages" aria-label="Try an example message">
              <span>Try:</span>
              {quickMessages.map((quickMessage) => (
                <button key={quickMessage} type="button" onClick={() => handleMessageChange(quickMessage)}>
                  {quickMessage}
                </button>
              ))}
            </div>

            <div className="shift-control">
              <div className="slider-row">
                <label className="field-label" htmlFor="cipher-shift">Shift key</label>
                <div className="shift-stepper">
                  <button
                    type="button"
                    onClick={() => handleShiftChange(shift - 1)}
                    disabled={shift <= minShift}
                    aria-label="Decrease shift"
                  >
                    <Minus size={20} aria-hidden="true" />
                  </button>
                  <output htmlFor="cipher-shift" aria-label={`Shift ${shift}`}>{shift}</output>
                  <button
                    type="button"
                    onClick={() => handleShiftChange(shift + 1)}
                    disabled={shift >= maxShift}
                    aria-label="Increase shift"
                  >
                    <Plus size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <input
                id="cipher-shift"
                max={maxShift}
                min={minShift}
                onChange={(event) => handleShiftChange(Number(event.target.value))}
                type="range"
                value={shift}
              />
              <div className="range-labels" aria-hidden="true"><span>1</span><span>25</span></div>
            </div>

            <div className="result-box" aria-live="polite">
              <span>{mode === "encode" ? "Secret message" : "Revealed message"}</span>
              <strong>{output || "Type a message above"}</strong>
            </div>
          </div>

          <div className="alphabet-panel" aria-label={`Alphabet shifted by ${shift}`}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Letter map</p>
                <h3>A moves to {encode("A", shift)}</h3>
              </div>
              <span className="map-key">Shift {shift}</span>
            </div>
            <div className="alphabet-grid">
              {alphabetMapping.map((pair) => (
                <div className="letter-pair" key={pair.from}>
                  <span>{pair.from}</span>
                  <ArrowDown size={12} aria-hidden="true" />
                  <strong>{pair.to}</strong>
                </div>
              ))}
            </div>
            <p className="map-tip">Every letter moves the same number of places.</p>
          </div>
        </div>
      </div>

      <div className="practice-band" aria-labelledby="practice-heading">
        <div className="content-frame stage-heading">
          <span className="stage-number stage-number-coral" aria-hidden="true">2</span>
          <div>
            <p className="eyebrow">Practice</p>
            <h2 id="practice-heading">Crack the code yourself</h2>
          </div>
        </div>

        <div className="content-frame practice-content">
          {!practiceStarted ? (
            <div className="practice-start">
              <div className="practice-count" aria-hidden="true">
                <strong>{questions.length}</strong>
                <span>questions</span>
              </div>
              <p>{experience.studentContent.instructions}</p>
              <button className="button button-coral" type="button" onClick={handlePracticeStart}>
                Start practice
                <ArrowRight size={19} aria-hidden="true" />
              </button>
            </div>
          ) : completed ? (
            <ResultSummary
              completedQuestions={completedQuestions}
              onRetry={handleRetry}
              questionsLength={questions.length}
              reflectionPrompt={experience.studentContent.reflectionPrompt}
              scorePercent={scorePercent}
              totalAttempts={totalAttempts}
              totalHintsUsed={totalHintsUsed}
            />
          ) : currentQuestion ? (
            <div className="question-panel">
              <div className="question-progress">
                <div className="question-meta">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span className="difficulty-pill">{currentQuestion.difficulty}</span>
                </div>
                <div className="practice-progress-track" aria-hidden="true">
                  <span style={{ width: `${practicePercent}%` }} />
                </div>
              </div>
              <h3>{currentQuestion.prompt}</h3>
              <label className="field-label" htmlFor="practice-answer">Your answer</label>
              <input
                id="practice-answer"
                autoComplete="off"
                autoCapitalize="characters"
                onChange={(event) => {
                  setAnswer(event.target.value);
                  setFeedback("");
                  setLastAttempt(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAnswerSubmit();
                  }
                }}
                placeholder="Type the code here"
                spellCheck={false}
                value={answer}
              />
              <div className="question-actions">
                <button className="button button-coral" type="button" onClick={handleAnswerSubmit} disabled={!answer.trim()}>
                  <Check size={19} aria-hidden="true" />
                  Check answer
                </button>
                <button
                  className="button button-quiet"
                  disabled={currentProgress.hintsUsed >= currentQuestion.hints.length}
                  type="button"
                  onClick={handleHint}
                >
                  <Lightbulb size={19} aria-hidden="true" />
                  Show hint
                </button>
                {currentProgress.correct ? (
                  <button className="button button-dark next-button" type="button" onClick={handleNextQuestion}>
                    {currentQuestionIndex >= questions.length - 1 ? "See my result" : "Next question"}
                    <ArrowRight size={19} aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              {(feedback || visibleHints.length > 0) ? (
                <div className={`feedback-area ${lastAttempt ? `feedback-${lastAttempt}` : ""}`} aria-live="polite">
                  {feedback ? (
                    <div className="feedback-message">
                      {lastAttempt === "correct" ? <CheckCircle2 size={24} aria-hidden="true" /> : <RotateCcw size={24} aria-hidden="true" />}
                      <div>
                        <strong>{lastAttempt === "correct" ? "Code cracked!" : "Try that once more"}</strong>
                        <p>{feedback}</p>
                        {lastAttempt === "correct" ? <p>{currentQuestion.explanation}</p> : null}
                      </div>
                    </div>
                  ) : null}
                  {visibleHints.length > 0 ? (
                    <div className="hint-list">
                      <strong><Lightbulb size={18} aria-hidden="true" /> Hint</strong>
                      <ul>
                        {visibleHints.map((hint) => <li key={hint}>{hint}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ResultSummary({
  completedQuestions,
  onRetry,
  questionsLength,
  reflectionPrompt,
  scorePercent,
  totalAttempts,
  totalHintsUsed
}: {
  completedQuestions: number;
  onRetry: () => void;
  questionsLength: number;
  reflectionPrompt: string;
  scorePercent: number;
  totalAttempts: number;
  totalHintsUsed: number;
}) {
  return (
    <div className="result-summary">
      <span className="trophy-mark" aria-hidden="true"><Trophy size={34} /></span>
      <p className="eyebrow">Mission complete</p>
      <h2>{completedQuestions} of {questionsLength} codes cracked</h2>
      <div className="score-meter" aria-label={`Score ${scorePercent} percent`}>
        <span style={{ width: `${scorePercent}%` }} />
      </div>
      <div className="result-stats">
        <span><strong>{scorePercent}%</strong> score</span>
        <span><strong>{totalAttempts}</strong> tries</span>
        <span><strong>{totalHintsUsed}</strong> hints</span>
      </div>
      <p className="reflection-prompt"><strong>Think about it:</strong> {reflectionPrompt}</p>
      <button className="button button-dark" type="button" onClick={onRetry}>
        <RotateCcw size={19} aria-hidden="true" />
        Practice again
      </button>
    </div>
  );
}
