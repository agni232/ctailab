import { describe, expect, it } from "vitest";
import { decode, encode, normalizeShift, transform } from "@/activity-engine/cipher/cipher.engine";

describe("cipher engine", () => {
  it("encodes letters with alphabet wrapping", () => {
    expect(encode("ABC", 3)).toBe("DEF");
    expect(encode("XYZ", 3)).toBe("ABC");
    expect(encode("A", 1)).toBe("B");
    expect(encode("Z", 1)).toBe("A");
    expect(encode("Z", 3)).toBe("C");
  });

  it("decodes using the inverse shift", () => {
    expect(decode("KHOOR", 3)).toBe("HELLO");
    expect(decode("FDW", 3)).toBe("CAT");
  });

  it("preserves spaces, punctuation, numbers, and case", () => {
    expect(encode("Hello, Class 3!", 3)).toBe("Khoor, Fodvv 3!");
    expect(decode("Khoor, Fodvv 3!", 3)).toBe("Hello, Class 3!");
  });

  it("normalizes large and negative shifts", () => {
    expect(normalizeShift(29)).toBe(3);
    expect(normalizeShift(-1)).toBe(25);
    expect(transform("ABC", 29)).toBe("DEF");
    expect(transform("ABC", -1)).toBe("ZAB");
  });
});
