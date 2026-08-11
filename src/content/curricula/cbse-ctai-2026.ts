import type { Curriculum, Domain, Grade, LearningObjective } from "@/content/types";

export const cbseCtAiCurriculum: Curriculum = {
  id: "cbse-ctai-2026-27",
  code: "CBSE-CTAI",
  name: "CBSE Computational Thinking and Artificial Intelligence",
  academicSession: "2026-27",
  status: "published"
};

export const grades: Grade[] = [
  { id: "grade-3", curriculumId: cbseCtAiCurriculum.id, level: 3, name: "Class 3", status: "available" },
  { id: "grade-4", curriculumId: cbseCtAiCurriculum.id, level: 4, name: "Class 4", status: "coming-soon" },
  { id: "grade-5", curriculumId: cbseCtAiCurriculum.id, level: 5, name: "Class 5", status: "coming-soon" },
  { id: "grade-6", curriculumId: cbseCtAiCurriculum.id, level: 6, name: "Class 6", status: "coming-soon" },
  { id: "grade-7", curriculumId: cbseCtAiCurriculum.id, level: 7, name: "Class 7", status: "coming-soon" },
  { id: "grade-8", curriculumId: cbseCtAiCurriculum.id, level: 8, name: "Class 8", status: "coming-soon" }
];

export const domains: Domain[] = [
  {
    id: "domain-computational-thinking",
    code: "computational-thinking",
    title: "Computational Thinking"
  },
  {
    id: "domain-artificial-intelligence",
    code: "artificial-intelligence",
    title: "Artificial Intelligence"
  }
];

export const learningObjectives: LearningObjective[] = [
  {
    id: "class-3-caesar-cipher-shift-key",
    title: "Use a shift key to transform and reveal messages",
    description:
      "Students understand that a Caesar Cipher changes each letter by the same shift, and that the same key is needed to decode the message.",
    sourceReferences: [
      {
        document: "CTAI_Pri3SH_2026-27.pdf",
        page: 9,
        pageEnd: 11,
        section: "Chapter 1: What's in a Name? / Activity: Caesar Cipher",
        sourceType: "student-handbook"
      },
      {
        document: "CTAI_Pri3TH_2026-27.pdf",
        page: 9,
        pageEnd: 14,
        section: "Chapter 1: What's in a Name? / Activity: Caesar Cipher",
        sourceType: "teacher-handbook"
      }
    ]
  }
];
