import type {
  CipherActivityConfig,
  CipherActivityResult,
  CipherAnswer,
  CipherState
} from "@/activity-engine/cipher/cipher.types";
import type { ActivityDefinition } from "@/activity-engine/types";
import { validateCipherQuestion } from "@/activity-engine/cipher/cipher.validation";

export const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function normalizeShift(shift: number, alphabetLength = DEFAULT_ALPHABET.length): number {
  if (!Number.isFinite(shift)) {
    return 0;
  }

  const wholeShift = Math.trunc(shift);
  return ((wholeShift % alphabetLength) + alphabetLength) % alphabetLength;
}

export function transform(text: string, shift: number, alphabet = DEFAULT_ALPHABET): string {
  const normalizedShift = normalizeShift(shift, alphabet.length);

  return Array.from(text)
    .map((character) => transformCharacter(character, normalizedShift, alphabet))
    .join("");
}

export function encode(text: string, shift: number, alphabet = DEFAULT_ALPHABET): string {
  return transform(text, shift, alphabet);
}

export function decode(text: string, shift: number, alphabet = DEFAULT_ALPHABET): string {
  return transform(text, -shift, alphabet);
}

export function getAlphabetMapping(shift: number, alphabet = DEFAULT_ALPHABET): Array<{ from: string; to: string }> {
  return Array.from(alphabet).map((letter) => ({
    from: letter,
    to: encode(letter, shift, alphabet)
  }));
}

function transformCharacter(character: string, shift: number, alphabet: string): string {
  const upperCharacter = character.toUpperCase();
  const currentIndex = alphabet.indexOf(upperCharacter);

  if (currentIndex === -1) {
    return character;
  }

  const nextIndex = (currentIndex + shift) % alphabet.length;
  const transformed = alphabet[nextIndex];
  return isLowercaseAsciiLetter(character) ? transformed.toLowerCase() : transformed;
}

function isLowercaseAsciiLetter(character: string): boolean {
  return character >= "a" && character <= "z";
}

export const cipherEngine: ActivityDefinition<CipherActivityConfig, CipherState, CipherAnswer, CipherActivityResult> = {
  type: "cipher",
  version: 1,
  createInitialState(config) {
    return {
      mode: "encode",
      shift: config.defaultShift,
      input: config.defaultText,
      score: 0,
      attempts: 0,
      hintsUsed: 0
    };
  },
  validateAnswer(_state, answer) {
    return validateCipherQuestion(answer.question, answer.value);
  },
  calculateResult(state, _answer, config) {
    return {
      completed: state.score >= config.practiceQuestions.length,
      score: state.score,
      maxScore: config.practiceQuestions.length,
      attempts: state.attempts,
      hintsUsed: state.hintsUsed,
      competencyEvidence: [
        {
          competencyId: "algorithmic-thinking",
          status: state.score >= config.practiceQuestions.length ? "demonstrated" : "practicing",
          score: state.score,
          attempts: state.attempts,
          hintsUsed: state.hintsUsed
        }
      ]
    };
  }
};
