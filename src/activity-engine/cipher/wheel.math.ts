import { encode, normalizeShift } from "@/activity-engine/cipher/cipher.engine";

export function getWheelStepDegrees(alphabetLength: number): number {
  return alphabetLength > 0 ? 360 / alphabetLength : 0;
}

export function getWheelRotationDegrees(shift: number, alphabetLength: number): number {
  return -normalizeShift(shift, alphabetLength) * getWheelStepDegrees(alphabetLength);
}

export function getLetterAngle(index: number, alphabetLength: number): number {
  return index * getWheelStepDegrees(alphabetLength);
}

export function getMappedLetter(letter: string, shift: number, alphabet: string): string {
  return encode(letter, shift, alphabet).toUpperCase();
}

export function getShiftFromDrag(
  startShift: number,
  startAngle: number,
  currentAngle: number,
  alphabetLength: number
): number {
  if (alphabetLength <= 0) {
    return 0;
  }

  const delta = normalizeAngleDelta(currentAngle - startAngle);
  const shiftDelta = Math.round(-delta / getWheelStepDegrees(alphabetLength));
  return normalizeShift(startShift + shiftDelta, alphabetLength);
}

export function normalizeAngleDelta(angle: number): number {
  return ((angle + 180) % 360 + 360) % 360 - 180;
}
