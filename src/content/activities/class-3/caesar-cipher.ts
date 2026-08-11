import type { CipherActivityConfig } from "@/activity-engine/cipher/cipher.types";
import type { LearningExperience } from "@/content/types";

export const caesarCipherExperience: LearningExperience<CipherActivityConfig> = {
  id: "caesar-cipher-001",
  slug: "caesar-cipher",
  version: 3,
  title: "Caesar Cipher",
  description: "Crack a secret message by moving every letter with one shift key.",
  curriculumVersion: "CBSE-CTAI-2026-27",
  gradeIds: ["grade-3"],
  domainIds: ["computational-thinking"],
  objectiveIds: ["class-3-caesar-cipher-shift-key"],
  competencyIds: [
    "algorithmic-thinking",
    "decomposition",
    "pattern-recognition",
    "generalisation",
    "evaluation"
  ],
  type: "activity",
  activityType: "cipher",
  activityConfig: {
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    minShift: 0,
    maxShift: 25,
    defaultShift: 3,
    defaultText: "HELLO",
    quickMessages: ["HELLO", "SECRET", "MEET AT 4"],
    discover: {
      title: "What is a secret message?",
      prompt: "A cipher changes a normal message into a secret one using a key.",
      normalMessage: "HELLO",
      shift: 3,
      keyExplanation: "The key tells us how many places to move each letter."
    },
    wheelChallenges: [
      {
        id: "wheel-align-a-d",
        kind: "align",
        prompt: "Move the wheel until A becomes D.",
        fromLetter: "A",
        expectedLetter: "D",
        targetShift: 3,
        hint: "Use + to move the secret alphabet forward.",
        successMessage: "Great! A becomes D with a shift of 3."
      },
      {
        id: "wheel-map-b-e",
        kind: "answer",
        prompt: "Keep shift 3. What does B become?",
        fromLetter: "B",
        expectedLetter: "E",
        targetShift: 3,
        hint: "Find B on the outside and read the letter beside it.",
        successMessage: "Exactly. B moves 3 places to E."
      },
      {
        id: "wheel-wrap-z-c",
        kind: "answer",
        prompt: "What does Z become with shift 3?",
        fromLetter: "Z",
        expectedLetter: "C",
        targetShift: 3,
        hint: "After Z, start again at A.",
        successMessage: "You found the wrap-around: Z becomes C."
      }
    ],
    practiceQuestions: [
      {
        id: "cipher-q1",
        kind: "text",
        mode: "encode",
        input: "A",
        shift: 3,
        prompt: "With shift 3, what does A become?",
        difficulty: "warm-up",
        hints: ["Start at A.", "Move forward three places: B, C, D."],
        explanation: "A moves to B, then C, then D.",
        correctFeedback: "Great! A moves 3 places to D.",
        incorrectFeedback: "Start at A and move 3 places forward."
      },
      {
        id: "cipher-q2",
        kind: "text",
        mode: "encode",
        input: "X",
        shift: 3,
        prompt: "With shift 3, what does X become?",
        difficulty: "warm-up",
        hints: ["Move from X to Y, then Z.", "After Z, wrap back to A."],
        explanation: "X moves to Y, then Z, then wraps to A.",
        correctFeedback: "Nice wrap-around! X becomes A.",
        incorrectFeedback: "Move 3 places from X and remember what comes after Z."
      },
      {
        id: "cipher-q3",
        kind: "text",
        mode: "encode",
        input: "CAT",
        shift: 2,
        prompt: "Encode CAT with shift 2.",
        difficulty: "practice",
        hints: ["Move each letter separately.", "C becomes E with shift 2."],
        explanation: "C becomes E, A becomes C, and T becomes V.",
        correctFeedback: "Correct. CAT becomes ECV.",
        incorrectFeedback: "Move every letter 2 places forward and keep the same key."
      },
      {
        id: "cipher-q4",
        kind: "text",
        mode: "decode",
        input: "KHOOR",
        shift: 3,
        prompt: "Decode KHOOR with shift 3.",
        difficulty: "practice",
        hints: ["Decoding moves backward.", "K moves back to H."],
        explanation: "Moving each letter 3 places backward reveals HELLO.",
        correctFeedback: "Message revealed! KHOOR means HELLO.",
        incorrectFeedback: "For decoding, move each letter 3 places backward."
      },
      {
        id: "cipher-q5",
        kind: "multiple-choice",
        mode: "encode",
        input: "CAESAR CIPHER",
        shift: 3,
        prompt: "Choose the correct secret version of CAESAR CIPHER with shift 3.",
        difficulty: "challenge",
        choices: ["ECGUCT EKRJGT", "FDHVDU FLSKHU", "GEIWEV GMTLIV", "DBFTBS DJQIFS"],
        hints: ["C becomes F and A becomes D.", "Look for an answer that starts with FD."],
        explanation: "Every letter moves 3 places: CAESAR CIPHER becomes FDHVDU FLSKHU.",
        correctFeedback: "Correct. You kept shift 3 for the whole message.",
        incorrectFeedback: "Check the first two letters: C should become F and A should become D."
      },
      {
        id: "cipher-q6",
        kind: "find-shift",
        input: "THIS",
        output: "ESTD",
        expectedShift: 11,
        prompt: "THIS becomes ESTD. What shift key was used?",
        difficulty: "challenge",
        hints: ["Compare the first pair: T becomes E.", "Count forward from T and wrap after Z."],
        explanation: "T moves 11 places and wraps around to E. The same shift works for H, I, and S.",
        correctFeedback: "You found the key. The shift is 11.",
        incorrectFeedback: "Count forward from T to E, wrapping after Z."
      }
    ],
    create: {
      title: "Make your own secret message",
      prompt: "Write a short message for a friend and choose your own key.",
      defaultText: "MEET ME AT 4",
      defaultShift: 3,
      friendPrompt: "Can your friend decode it using the same key?"
    },
    reflection: {
      title: "What rule did you discover?",
      prompt: "Write the rule in your own words.",
      learningPoints: [
        "A cipher can hide a message.",
        "The key tells every letter how far to move.",
        "After Z, the alphabet wraps back to A.",
        "The same key can encode and decode a message."
      ]
    }
  },
  studentContent: {
    introduction:
      "A Caesar Cipher hides a message by moving every letter with one secret key.",
    keyIdeas: [
      "Use one shift for every letter.",
      "After Z, wrap back to A.",
      "Decode by moving backward.",
      "Do not shift spaces, numbers, or symbols."
    ],
    instructions:
      "Use the wheel when you need it. Try again or ask for a hint if you get stuck.",
    reflectionPrompt: "How many shifts would someone need to try if they did not know the key?"
  },
  teacherContent: {
    objective:
      "Introduce basic encryption through a concrete letter-shifting rule and connect it to algorithmic thinking.",
    preparation:
      "Students can first discuss simple secret messages, then compare a physical cipher wheel with the digital simulation.",
    facilitationNotes: [
      "Ask students to predict one letter before checking the transformed message.",
      "Encourage students to say the rule aloud: choose a shift, move each letter, keep the key.",
      "Use decoding to show that a receiver needs the same key to recover the original message."
    ],
    expectedObservations: [
      "Students notice the same letter always changes to the same new letter for a fixed shift.",
      "Students see that wrapping from Z to A is part of the rule.",
      "Students begin to compare simple classroom secrecy with stronger real-world security needs."
    ],
    commonMisconceptions: [
      "Changing the shift for each letter.",
      "Forgetting to wrap from Z back to A.",
      "Trying to shift spaces, numbers, or punctuation."
    ],
    discussionQuestions: [
      "Why does the receiver need the shift key?",
      "What happens if the shift is 26?",
      "Why might this method not be strong enough for bank information?"
    ],
    assessmentNotes: [
      "Look for consistent use of the shift rule.",
      "Notice whether students can encode and decode using inverse movement.",
      "Use hint usage and retries as formative signals, not as labels."
    ],
    extensionActivities: [
      "Ask students to write their own short encoded message for a partner.",
      "Invite students to test how quickly they can discover a missing shift."
    ]
  },
  sourceReferences: [
    {
      document: "CTAI_Pri3SH_2026-27.pdf",
      page: 9,
      pageEnd: 11,
      section: "Chapter 1: What's in a Name? / Activity: Caesar Cipher",
      sourceType: "student-handbook",
      notes: "Official Class 3 student activity introducing Caesar Cipher, shifting, encryption, and decoding."
    },
    {
      document: "CTAI_Pri3TH_2026-27.pdf",
      page: 9,
      pageEnd: 14,
      section: "Chapter 1: What's in a Name? / Activity: Caesar Cipher",
      sourceType: "teacher-handbook",
      notes: "Teacher guidance and CT competency mapping for the Class 3 Caesar Cipher activity."
    }
  ],
  status: "published",
  publishedAt: "2026-08-10",
  updatedAt: "2026-08-11"
};
