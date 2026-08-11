"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { normalizeShift } from "@/activity-engine/cipher/cipher.engine";
import {
  getLetterAngle,
  getMappedLetter,
  getShiftFromDrag,
  getWheelRotationDegrees
} from "@/activity-engine/cipher/wheel.math";

type WheelChangeMethod = "button" | "drag" | "keyboard" | "slider";

interface CaesarWheelProps {
  alphabet: string;
  shift: number;
  minShift: number;
  maxShift: number;
  highlightedLetter?: string;
  variant?: "large" | "compact";
  onInteractionStart?: () => void;
  onShiftChange: (shift: number) => void;
  onShiftCommit?: (shift: number, method: WheelChangeMethod) => void;
}

interface DragState {
  pointerId: number;
  startAngle: number;
  startShift: number;
}

export function CaesarWheel({
  alphabet,
  shift,
  minShift,
  maxShift,
  highlightedLetter = "A",
  variant = "large",
  onInteractionStart,
  onShiftChange,
  onShiftCommit
}: CaesarWheelProps) {
  const labelId = useId();
  const dragState = useRef<DragState | null>(null);
  const latestDragShift = useRef(shift);
  const [isDragging, setIsDragging] = useState(false);
  const letters = useMemo(() => Array.from(alphabet), [alphabet]);
  const normalizedHighlight = alphabet.includes(highlightedLetter.toUpperCase())
    ? highlightedLetter.toUpperCase()
    : alphabet[0];
  const mappedLetter = getMappedLetter(normalizedHighlight, shift, alphabet);
  const rotation = getWheelRotationDegrees(shift, letters.length);
  const normalizedShift = normalizeShift(shift, letters.length);
  const stepDegrees = 360 / letters.length;

  function updateShift(nextShift: number, method: WheelChangeMethod, commit = false) {
    const boundedShift = Math.max(minShift, Math.min(maxShift, nextShift));
    onInteractionStart?.();
    onShiftChange(boundedShift);

    if (commit) {
      onShiftCommit?.(boundedShift, method);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const startAngle = getPointerAngle(event);
    dragState.current = {
      pointerId: event.pointerId,
      startAngle,
      startShift: shift
    };
    latestDragShift.current = shift;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    onInteractionStart?.();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const activeDrag = dragState.current;

    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const draggedShift = getShiftFromDrag(
      activeDrag.startShift,
      activeDrag.startAngle,
      getPointerAngle(event),
      letters.length
    );
    const nextShift = Math.max(minShift, Math.min(maxShift, draggedShift));
    latestDragShift.current = nextShift;
    onShiftChange(nextShift);
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const activeDrag = dragState.current;

    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    dragState.current = null;
    setIsDragging(false);
    onShiftCommit?.(latestDragShift.current, "drag");

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleWheelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const keyActions: Record<string, number> = {
      ArrowRight: shift + 1,
      ArrowUp: shift + 1,
      ArrowLeft: shift - 1,
      ArrowDown: shift - 1,
      Home: minShift,
      End: maxShift
    };
    const nextShift = keyActions[event.key];

    if (nextShift === undefined) {
      return;
    }

    event.preventDefault();
    updateShift(nextShift, "keyboard", true);
  }

  return (
    <div className={`caesar-wheel caesar-wheel-${variant}`}>
      <div className="wheel-legend" aria-hidden="true">
        <span><i className="legend-dot legend-dot-outer" />Normal</span>
        <span><i className="legend-dot legend-dot-inner" />Secret</span>
      </div>
      <div
        className={`wheel-stage ${isDragging ? "is-dragging" : ""}`}
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={minShift}
        aria-valuemax={maxShift}
        aria-valuenow={shift}
        aria-valuetext={`Shift ${shift}. ${normalizedHighlight} becomes ${mappedLetter}.`}
        onKeyDown={handleWheelKeyDown}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        <span className="wheel-indicator" aria-hidden="true"><ChevronDown size={25} strokeWidth={3} /></span>
        <div className="wheel-ring wheel-outer-ring" aria-hidden="true">
          {letters.map((letter, index) => {
            const angle = getLetterAngle(index, letters.length);
            return (
              <span className="wheel-letter-slot" style={{ transform: `rotate(${angle}deg)` }} key={`outer-${letter}`}>
                <span
                  className={`wheel-letter wheel-outer-letter ${letter === normalizedHighlight ? "is-highlighted" : ""}`}
                  style={{ transform: `translate(-50%, -50%) translateY(var(--outer-letter-radius)) rotate(${-angle}deg)` }}
                >
                  {letter}
                </span>
              </span>
            );
          })}
        </div>
        <div className="wheel-number-ring" aria-hidden="true">
          {letters.map((letter, index) => {
            const angle = getLetterAngle(index, letters.length);
            return (
              <span className="wheel-letter-slot" style={{ transform: `rotate(${angle}deg)` }} key={`number-${letter}`}>
                <span
                  className={`wheel-number ${index === normalizedShift ? "is-highlighted" : ""}`}
                  style={{ transform: `translate(-50%, -50%) translateY(var(--number-radius)) rotate(${-angle}deg)` }}
                >
                  {index}
                </span>
              </span>
            );
          })}
        </div>
        <div
          className="wheel-ring wheel-inner-ring"
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-hidden="true"
        >
          {letters.map((letter, index) => {
            const angle = getLetterAngle(index, letters.length);
            return (
              <span className="wheel-letter-slot" style={{ transform: `rotate(${angle}deg)` }} key={`inner-${letter}`}>
                <span
                  className={`wheel-letter wheel-inner-letter ${letter === mappedLetter ? "is-highlighted" : ""}`}
                  style={{ transform: `translate(-50%, -50%) translateY(var(--inner-letter-radius)) rotate(${-angle - rotation}deg)` }}
                >
                  {letter}
                </span>
              </span>
            );
          })}
        </div>
        <div className="wheel-partitions" aria-hidden="true">
          {letters.map((letter, index) => {
            const boundaryAngle = getLetterAngle(index, letters.length) - stepDegrees / 2 + 180;
            return <i className="wheel-spoke" style={{ transform: `rotate(${boundaryAngle}deg)` }} key={`spoke-${letter}`} />;
          })}
        </div>
        <div className="wheel-hub" aria-hidden="true">
          <small>Key</small>
          <strong>{shift}</strong>
        </div>
      </div>

      <div className="wheel-readout" id={labelId} aria-live="polite">
        <span>Shift <strong>{shift}</strong></span>
        <span className="wheel-mapping"><strong>{normalizedHighlight}</strong><i>→</i><strong>{mappedLetter}</strong></span>
      </div>

      <div className="wheel-controls">
        <button
          className="wheel-step-button"
          type="button"
          onClick={() => updateShift(shift - 1, "button", true)}
          disabled={shift <= minShift}
          aria-label="Decrease wheel shift"
        >
          <Minus size={21} aria-hidden="true" />
        </button>
        <input
          aria-label="Wheel shift"
          min={minShift}
          max={maxShift}
          type="range"
          value={shift}
          onChange={(event) => updateShift(Number(event.target.value), "slider")}
          onKeyUp={(event) => onShiftCommit?.(Number(event.currentTarget.value), "slider")}
          onPointerUp={(event) => onShiftCommit?.(Number(event.currentTarget.value), "slider")}
        />
        <button
          className="wheel-step-button"
          type="button"
          onClick={() => updateShift(shift + 1, "button", true)}
          disabled={shift >= maxShift}
          aria-label="Increase wheel shift"
        >
          <Plus size={21} aria-hidden="true" />
        </button>
      </div>
      <p className="wheel-help">Drag the inner wheel or use the controls.</p>
    </div>
  );
}

function getPointerAngle(event: React.PointerEvent<HTMLElement>): number {
  const rect = event.currentTarget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI);
}
