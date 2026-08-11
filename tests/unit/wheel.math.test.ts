import { describe, expect, it } from "vitest";
import {
  getLetterAngle,
  getMappedLetter,
  getShiftFromDrag,
  getWheelRotationDegrees,
  getWheelStepDegrees,
  normalizeAngleDelta
} from "@/activity-engine/cipher/wheel.math";

describe("Caesar wheel mathematics", () => {
  it("positions letters in equal steps and rotates the secret alphabet", () => {
    expect(getWheelStepDegrees(26)).toBeCloseTo(13.846);
    expect(getLetterAngle(0, 26)).toBe(0);
    expect(getLetterAngle(3, 26)).toBeCloseTo(41.538);
    expect(getWheelRotationDegrees(3, 26)).toBeCloseTo(-41.538);
  });

  it("returns the same mapping as the cipher engine", () => {
    expect(getMappedLetter("A", 0, "ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe("A");
    expect(getMappedLetter("A", 3, "ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe("D");
    expect(getMappedLetter("Z", 3, "ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe("C");
  });

  it("turns pointer angle movement into wrapped shift steps", () => {
    expect(getShiftFromDrag(3, 0, -13.9, 26)).toBe(4);
    expect(getShiftFromDrag(0, 0, 13.9, 26)).toBe(25);
    expect(normalizeAngleDelta(190)).toBe(-170);
  });
});
