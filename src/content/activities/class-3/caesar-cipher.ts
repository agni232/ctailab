import type { CipherActivityConfig } from "@/activity-engine/cipher/cipher.types";
import type { LearningExperience } from "@/content/types";

export const caesarCipherExperience: LearningExperience<CipherActivityConfig> = {
  id: "caesar-cipher-001",
  slug: "caesar-cipher",
  version: 1,
  title: "Caesar Cipher",
  description: "Explore how a message can be hidden and revealed with a shift key.",
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
    minShift: 1,
    maxShift: 25,
    defaultShift: 3,
    defaultText: "HELLO",
    practiceQuestions: [
      {
        id: "cipher-q1",
        mode: "encode",
        input: "A",
        shift: 2,
        prompt: "Encode A with a shift of 2.",
        difficulty: "warm-up",
        hints: ["Start at A.", "Move two places to the right."],
        explanation: "A moves to B, then C, so the encoded letter is C."
      },
      {
        id: "cipher-q2",
        mode: "encode",
        input: "CAT",
        shift: 2,
        prompt: "Encode CAT with a shift of 2.",
        difficulty: "warm-up",
        hints: ["Encode one letter at a time.", "C becomes E when it moves two places."],
        explanation: "C becomes E, A becomes C, and T becomes V."
      },
      {
        id: "cipher-q3",
        mode: "decode",
        input: "FDW",
        shift: 3,
        prompt: "Decode FDW with a shift of 3.",
        difficulty: "practice",
        hints: ["Decoding moves backward by the shift.", "F moves back to C."],
        explanation: "F moves back to C, D moves back to A, and W moves back to T."
      },
      {
        id: "cipher-q4",
        mode: "encode",
        input: "HELLO",
        shift: 3,
        prompt: "Encode HELLO with a shift of 3.",
        difficulty: "practice",
        hints: ["Keep the same shift for every letter.", "H becomes K."],
        explanation: "Each letter moves three places forward: HELLO becomes KHOOR."
      },
      {
        id: "cipher-q5",
        mode: "decode",
        input: "KHOOR",
        shift: 3,
        prompt: "Decode KHOOR with a shift of 3.",
        difficulty: "practice",
        hints: ["Undo the shift by moving backward.", "K moves back to H."],
        explanation: "Moving each letter three places backward reveals HELLO."
      },
      {
        id: "cipher-q6",
        mode: "encode",
        input: "CLASS 3!",
        shift: 4,
        prompt: "Encode CLASS 3! with a shift of 4.",
        difficulty: "challenge",
        hints: ["Spaces, numbers, and punctuation stay as they are.", "C becomes G."],
        explanation: "Only letters shift. CLASS becomes GPEWW, while the space, 3, and ! stay unchanged."
      }
    ]
  },
  studentContent: {
    introduction:
      "A Caesar Cipher hides a message by moving each letter forward by the same number of places. That number is the key.",
    keyIdeas: [
      "Use one shift for every letter.",
      "After Z, wrap back to A.",
      "Decode by moving backward.",
      "Do not shift spaces, numbers, or symbols."
    ],
    instructions:
      "Try different shifts, watch the alphabet mapping change, then solve the practice questions one step at a time.",
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
  updatedAt: "2026-08-10"
};
