"use client";

import { useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { CaesarWheel } from "@/activity-engine/cipher/components/CaesarWheel";
import { decode, encode } from "@/activity-engine/cipher/cipher.engine";
import type { CipherMode } from "@/activity-engine/cipher/cipher.types";
import { track } from "@/lib/analytics/client";

interface MessageEncoderProps {
  activityId: string;
  alphabet: string;
  minShift: number;
  maxShift: number;
  defaultShift: number;
  defaultText: string;
  quickMessages: string[];
  onActivityStart: () => void;
}

export function MessageEncoder({
  activityId,
  alphabet,
  minShift,
  maxShift,
  defaultShift,
  defaultText,
  quickMessages,
  onActivityStart
}: MessageEncoderProps) {
  const [mode, setMode] = useState<CipherMode>("encode");
  const [shift, setShift] = useState(defaultShift);
  const [message, setMessage] = useState(defaultText);
  const lastTrackedTransform = useRef("");
  const output = mode === "encode"
    ? encode(message, shift, alphabet)
    : decode(message, shift, alphabet);

  function recordTransform(nextMode = mode, nextShift = shift, nextMessage = message) {
    const signature = `${nextMode}:${nextShift}:${nextMessage}`;

    if (!nextMessage.trim() || lastTrackedTransform.current === signature) {
      return;
    }

    lastTrackedTransform.current = signature;
    track(nextMode === "encode" ? "message_encoded" : "message_decoded", {
      activityId,
      metadata: {
        area: "experiment",
        shift: nextShift,
        characterCount: nextMessage.length
      }
    });
  }

  function handleModeChange(nextMode: CipherMode) {
    onActivityStart();
    setMode(nextMode);
    recordTransform(nextMode);
  }

  function handleQuickMessage(nextMessage: string) {
    onActivityStart();
    setMessage(nextMessage);
    recordTransform(mode, shift, nextMessage);
  }

  return (
    <section className="experiment-band" id="experiment" aria-labelledby="experiment-heading">
      <div className="content-frame stage-heading">
        <span className="stage-number stage-number-blue" aria-hidden="true">3</span>
        <div>
          <p className="eyebrow">Experiment</p>
          <h2 id="experiment-heading">Try your own message</h2>
        </div>
      </div>

      <div className="content-frame experiment-layout">
        <div className="message-tool">
          <div className="mode-toggle" aria-label="Choose what to do">
            <button
              className={mode === "encode" ? "is-active" : ""}
              type="button"
              onClick={() => handleModeChange("encode")}
              aria-pressed={mode === "encode"}
            >
              <EyeOff size={20} aria-hidden="true" />
              Encode
            </button>
            <button
              className={mode === "decode" ? "is-active" : ""}
              type="button"
              onClick={() => handleModeChange("decode")}
              aria-pressed={mode === "decode"}
            >
              <Eye size={20} aria-hidden="true" />
              Decode
            </button>
          </div>

          <label className="field-label" htmlFor="cipher-message">
            {mode === "encode" ? "Normal message" : "Secret message"}
          </label>
          <textarea
            id="cipher-message"
            value={message}
            onBlur={() => recordTransform()}
            onChange={(event) => {
              onActivityStart();
              setMessage(event.target.value);
            }}
            rows={3}
            maxLength={80}
            spellCheck={false}
          />

          <div className="quick-messages" aria-label="Example messages">
            <span>Try</span>
            {quickMessages.map((quickMessage) => (
              <button key={quickMessage} type="button" onClick={() => handleQuickMessage(quickMessage)}>
                {quickMessage}
              </button>
            ))}
          </div>

          <div className="message-equation" aria-live="polite">
            <div>
              <span>{mode === "encode" ? "Normal" : "Secret"}</span>
              <strong>{message || "..."}</strong>
            </div>
            <span className="equation-arrow" aria-hidden="true">
              <ArrowRight size={25} />
              <b>Key {shift}</b>
            </span>
            <div className="equation-result">
              <span>{mode === "encode" ? "Secret" : "Normal"}</span>
              <strong>{output || "..."}</strong>
            </div>
          </div>
          <p className="symbol-note">Spaces, numbers, and symbols stay the same.</p>
        </div>

        <CaesarWheel
          alphabet={alphabet}
          shift={shift}
          minShift={minShift}
          maxShift={maxShift}
          highlightedLetter={firstAlphabetLetter(message, alphabet)}
          variant="compact"
          onInteractionStart={onActivityStart}
          onShiftChange={setShift}
          onShiftCommit={(nextShift, method) => {
            track("wheel_shift_changed", {
              activityId,
              metadata: { area: "experiment", shift: nextShift, method }
            });
            recordTransform(mode, nextShift);
          }}
        />
      </div>
    </section>
  );
}

function firstAlphabetLetter(message: string, alphabet: string): string {
  return Array.from(message.toUpperCase()).find((letter) => alphabet.includes(letter)) ?? alphabet[0];
}
