"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, CheckCircle2, Lightbulb } from "lucide-react";
import { CaesarWheel } from "@/activity-engine/cipher/components/CaesarWheel";
import { getMappedLetter } from "@/activity-engine/cipher/wheel.math";
import type { CipherWheelChallenge } from "@/activity-engine/cipher/cipher.types";
import { track } from "@/lib/analytics/client";

interface WheelChallengeProps {
  activityId: string;
  alphabet: string;
  challenges: CipherWheelChallenge[];
  minShift: number;
  maxShift: number;
  onActivityStart: () => void;
}

export function WheelChallenge({
  activityId,
  alphabet,
  challenges,
  minShift,
  maxShift,
  onActivityStart
}: WheelChallengeProps) {
  const [shift, setShift] = useState(minShift);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [passed, setPassed] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [completed, setCompleted] = useState(false);
  const exploreStarted = useRef(false);
  const lastTrackedShift = useRef(shift);
  const currentChallenge = challenges[challengeIndex];

  function startExploring() {
    onActivityStart();

    if (!exploreStarted.current) {
      exploreStarted.current = true;
      track("explore_started", { activityId });
    }
  }

  function handleShiftChange(nextShift: number) {
    setShift(nextShift);
    setAnswer("");
    setHintVisible(false);

    if (currentChallenge?.kind === "align") {
      const matches = getMappedLetter(currentChallenge.fromLetter, nextShift, alphabet) === currentChallenge.expectedLetter;
      setPassed(matches);
      setFeedback(matches ? currentChallenge.successMessage : "");
    } else {
      setPassed(false);
      setFeedback("");
    }
  }

  function handleShiftCommit(nextShift: number, method: string) {
    if (lastTrackedShift.current === nextShift) {
      return;
    }

    lastTrackedShift.current = nextShift;
    track("wheel_shift_changed", {
      activityId,
      metadata: { area: "explore", shift: nextShift, method }
    });
  }

  function checkAnswer() {
    if (!currentChallenge || currentChallenge.kind !== "answer" || !answer.trim()) {
      return;
    }

    onActivityStart();

    if (shift !== currentChallenge.targetShift) {
      setPassed(false);
      setFeedback(`Set the wheel back to shift ${currentChallenge.targetShift}, then look again.`);
      return;
    }

    const correct = answer.trim().toUpperCase() === currentChallenge.expectedLetter;
    setPassed(correct);
    setFeedback(correct ? currentChallenge.successMessage : "Look at the highlighted letters on the wheel and try again.");
  }

  function goToNextChallenge() {
    if (!currentChallenge || !passed) {
      return;
    }

    if (challengeIndex >= challenges.length - 1) {
      setCompleted(true);
      track("wheel_challenge_completed", {
        activityId,
        metadata: { checkpointCount: challenges.length, shift }
      });
      return;
    }

    setChallengeIndex(challengeIndex + 1);
    setAnswer("");
    setFeedback("");
    setPassed(false);
    setHintVisible(false);
  }

  if (!currentChallenge) {
    return null;
  }

  return (
    <section className="explore-band" id="explore" aria-labelledby="explore-heading">
      <div className="content-frame stage-heading">
        <span className="stage-number" aria-hidden="true">2</span>
        <div>
          <p className="eyebrow">Explore</p>
          <h2 id="explore-heading">Turn the Caesar wheel</h2>
          <p className="stage-support">Discover what changes with different shift values.</p>
        </div>
      </div>
      <div className="content-frame wheel-challenge-layout">
        <CaesarWheel
          alphabet={alphabet}
          shift={shift}
          minShift={minShift}
          maxShift={maxShift}
          highlightedLetter={currentChallenge.fromLetter}
          onInteractionStart={startExploring}
          onShiftChange={handleShiftChange}
          onShiftCommit={handleShiftCommit}
        />
        <div className="wheel-checkpoint">
          <div className="checkpoint-progress" aria-label={`Wheel checkpoint ${challengeIndex + 1} of ${challenges.length}`}>
            {challenges.map((challenge, index) => (
              <span className={index <= challengeIndex ? "is-active" : ""} key={challenge.id} />
            ))}
          </div>
          {completed ? (
            <div className="checkpoint-complete" aria-live="polite">
              <CheckCircle2 size={36} aria-hidden="true" />
              <p className="eyebrow">Wheel ready</p>
              <h3>You can now read the two alphabet rings.</h3>
              <a className="button button-dark" href="#experiment">
                Try a whole message
                <ArrowRight size={19} aria-hidden="true" />
              </a>
            </div>
          ) : (
            <>
              <p className="checkpoint-label">Wheel challenge {challengeIndex + 1}</p>
              <h3>{currentChallenge.prompt}</h3>
              <div className="checkpoint-mapping" aria-live="polite">
                <strong>{currentChallenge.fromLetter}</strong>
                <span>becomes</span>
                <strong>{getMappedLetter(currentChallenge.fromLetter, shift, alphabet)}</strong>
              </div>
              {currentChallenge.kind === "answer" ? (
                <label className="checkpoint-answer">
                  <span>Your answer</span>
                  <input
                    aria-label="Wheel challenge answer"
                    autoComplete="off"
                    maxLength={1}
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      setFeedback("");
                      setPassed(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        checkAnswer();
                      }
                    }}
                  />
                </label>
              ) : null}
              <div className="checkpoint-actions">
                {currentChallenge.kind === "answer" ? (
                  <button className="button" type="button" onClick={checkAnswer} disabled={!answer.trim()}>
                    <Check size={18} aria-hidden="true" /> Check
                  </button>
                ) : null}
                <button className="button button-quiet" type="button" onClick={() => setHintVisible(true)}>
                  <Lightbulb size={18} aria-hidden="true" /> Hint
                </button>
                {passed ? (
                  <button className="button button-dark" type="button" onClick={goToNextChallenge}>
                    {challengeIndex >= challenges.length - 1 ? "Finish" : "Next"}
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              {hintVisible ? <p className="checkpoint-hint"><Lightbulb size={17} aria-hidden="true" /> {currentChallenge.hint}</p> : null}
              {feedback ? (
                <p className={`checkpoint-feedback ${passed ? "is-correct" : "is-retry"}`} aria-live="polite">
                  {feedback}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
