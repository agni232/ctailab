export type DomainCode = "computational-thinking" | "artificial-intelligence";

export type LearningExperienceType =
  | "lesson"
  | "activity"
  | "puzzle"
  | "simulation"
  | "question"
  | "assessment"
  | "assignment"
  | "project"
  | "scenario";

export type LearningExperienceStatus = "draft" | "published" | "archived";

export interface Curriculum {
  id: string;
  code: string;
  name: string;
  academicSession: string;
  status: LearningExperienceStatus;
}

export interface Grade {
  id: string;
  curriculumId: string;
  level: number;
  name: string;
  status: "available" | "coming-soon";
}

export interface Domain {
  id: string;
  code: DomainCode;
  title: string;
}

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
  sourceReferences?: SourceReference[];
}

export interface SourceReference {
  document: string;
  page?: number;
  pageEnd?: number;
  section?: string;
  sourceType?: "student-handbook" | "teacher-handbook" | "platform-created";
  notes?: string;
}

export interface StudentContent {
  introduction: string;
  keyIdeas: string[];
  instructions: string;
  reflectionPrompt: string;
}

export interface TeacherContent {
  objective: string;
  preparation?: string;
  facilitationNotes: string[];
  expectedObservations: string[];
  commonMisconceptions: string[];
  discussionQuestions: string[];
  assessmentNotes: string[];
  extensionActivities: string[];
}

export interface LearningExperience<TConfig = unknown> {
  id: string;
  slug: string;
  version: number;
  title: string;
  description: string;
  curriculumVersion: string;
  gradeIds: string[];
  domainIds: DomainCode[];
  objectiveIds: string[];
  competencyIds: string[];
  type: LearningExperienceType;
  activityType?: string;
  activityConfig?: TConfig;
  studentContent: StudentContent;
  teacherContent?: TeacherContent;
  sourceReferences: SourceReference[];
  status: LearningExperienceStatus;
  publishedAt: string;
  updatedAt: string;
}
