"use client";

import { useState } from "react";
import { Check, Copy, Minus, Plus, RotateCcw } from "lucide-react";
import { encode } from "@/activity-engine/cipher/cipher.engine";
import type { CipherCreateConfig } from "@/activity-engine/cipher/cipher.types";
import { track } from "@/lib/analytics/client";

interface CreateSecretMessageProps {
  activityId: string;
  alphabet: string;
  config: CipherCreateConfig;
  minShift: number;
  maxShift: number;
  onActivityStart: () => void;
}

export function CreateSecretMessage({
  activityId,
  alphabet,
  config,
  minShift,
  maxShift,
  onActivityStart
}: CreateSecretMessageProps) {
  const [message, setMessage] = useState(config.defaultText);
  const [shift, setShift] = useState(config.defaultShift);
  const [copyStatus, setCopyStatus] = useState("");
  const output = encode(message, shift, alphabet);

  function changeShift(nextShift: number) {
    onActivityStart();
    setShift(Math.max(minShift, Math.min(maxShift, nextShift)));
    setCopyStatus("");
  }

  async function copySecret() {
    onActivityStart();

    try {
      await navigator.clipboard.writeText(output);
      setCopyStatus("Secret copied");
    } catch {
      setCopyStatus("Secret ready to share");
    }

    track("custom_message_created", {
      activityId,
      metadata: { shift, characterCount: message.length }
    });
  }

  function resetMessage() {
    setMessage(config.defaultText);
    setShift(config.defaultShift);
    setCopyStatus("");
  }

  return (
    <section className="create-band" id="create" aria-labelledby="create-heading">
      <div className="content-frame stage-heading">
        <span className="stage-number stage-number-coral" aria-hidden="true">5</span>
        <div>
          <p className="eyebrow">Create</p>
          <h2 id="create-heading">{config.title}</h2>
        </div>
      </div>

      <div className="content-frame create-layout">
        <div className="create-inputs">
          <p>{config.prompt}</p>
          <label className="field-label" htmlFor="create-message">Your normal message</label>
          <textarea
            id="create-message"
            maxLength={80}
            rows={3}
            spellCheck={false}
            value={message}
            onChange={(event) => {
              onActivityStart();
              setMessage(event.target.value);
              setCopyStatus("");
            }}
          />

          <div className="create-key-control">
            <span>Secret key</span>
            <div className="shift-stepper">
              <button type="button" onClick={() => changeShift(shift - 1)} disabled={shift <= minShift} aria-label="Decrease secret key">
                <Minus size={20} aria-hidden="true" />
              </button>
              <output aria-live="polite">{shift}</output>
              <button type="button" onClick={() => changeShift(shift + 1)} disabled={shift >= maxShift} aria-label="Increase secret key">
                <Plus size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
          <input
            aria-label="Secret key"
            type="range"
            min={minShift}
            max={maxShift}
            value={shift}
            onChange={(event) => changeShift(Number(event.target.value))}
          />
        </div>

        <div className="created-message">
          <span>Your secret message</span>
          <strong aria-live="polite">{output || "..."}</strong>
          <p>{config.friendPrompt}</p>
          <div className="create-actions">
            <button className="button button-dark" type="button" onClick={copySecret} disabled={!message.trim()}>
              {copyStatus ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              {copyStatus || "Copy secret"}
            </button>
            <button className="icon-button" type="button" onClick={resetMessage} aria-label="Reset secret message" title="Reset">
              <RotateCcw size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
