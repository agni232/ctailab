"use client";

import { useEffect, useRef, useState } from "react";
import type { ActivityComponentProps } from "@/activity-engine/types";
import type { CipherActivityConfig } from "@/activity-engine/cipher/cipher.types";
import { CipherPractice, type PracticeSummary } from "@/activity-engine/cipher/components/CipherPractice";
import { CreateSecretMessage } from "@/activity-engine/cipher/components/CreateSecretMessage";
import { DiscoverCipher } from "@/activity-engine/cipher/components/DiscoverCipher";
import { MessageEncoder } from "@/activity-engine/cipher/components/MessageEncoder";
import { ReflectionStage } from "@/activity-engine/cipher/components/ReflectionStage";
import { WheelChallenge } from "@/activity-engine/cipher/components/WheelChallenge";
import { track } from "@/lib/analytics/client";

export function CipherActivity({ experience }: ActivityComponentProps<CipherActivityConfig>) {
  const config = experience.activityConfig;
  const started = useRef(false);
  const [practiceSummary, setPracticeSummary] = useState<PracticeSummary | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    track("page_view", { activityId: experience.id });
  }, [experience.id]);

  if (!config) {
    return null;
  }

  function markActivityStarted() {
    if (started.current) {
      return;
    }

    started.current = true;
    track("activity_started", { activityId: experience.id });
  }

  function handlePracticeComplete(summary: PracticeSummary) {
    setPracticeSummary(summary);
  }

  function handleReflectionComplete() {
    if (!practiceSummary) {
      return;
    }

    track("activity_completed", {
      activityId: experience.id,
      metadata: { ...practiceSummary }
    });
  }

  function handleRetry() {
    setPracticeSummary(null);
    setRunId((current) => current + 1);
    track("activity_retried", { activityId: experience.id });
    window.setTimeout(() => {
      document.querySelector("#discover")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="activity-workspace">
      <DiscoverCipher alphabet={config.alphabet} config={config.discover} />
      <WheelChallenge
        key={`wheel-${runId}`}
        activityId={experience.id}
        alphabet={config.alphabet}
        challenges={config.wheelChallenges}
        minShift={config.minShift}
        maxShift={config.maxShift}
        onActivityStart={markActivityStarted}
      />
      <MessageEncoder
        key={`experiment-${runId}`}
        activityId={experience.id}
        alphabet={config.alphabet}
        minShift={config.minShift}
        maxShift={config.maxShift}
        defaultShift={config.defaultShift}
        defaultText={config.defaultText}
        quickMessages={config.quickMessages}
        onActivityStart={markActivityStarted}
      />
      <CipherPractice
        key={`practice-${runId}`}
        activityId={experience.id}
        questions={config.practiceQuestions}
        onActivityStart={markActivityStarted}
        onComplete={handlePracticeComplete}
      />
      <CreateSecretMessage
        key={`create-${runId}`}
        activityId={experience.id}
        alphabet={config.alphabet}
        config={config.create}
        minShift={config.minShift}
        maxShift={config.maxShift}
        onActivityStart={markActivityStarted}
      />
      {practiceSummary ? (
        <ReflectionStage
          key={`reflect-${runId}`}
          activityId={experience.id}
          config={config.reflection}
          summary={practiceSummary}
          onComplete={handleReflectionComplete}
          onRetry={handleRetry}
        />
      ) : null}
    </div>
  );
}
