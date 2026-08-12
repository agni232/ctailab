import { learningExperiences } from "@/content/activities";
import { domains, grades, learningObjectives } from "@/content/curricula/cbse-ctai-2026";
import type { DomainCode, LearningExperience } from "@/content/types";

export function getPublishedLearningExperiences(): LearningExperience[] {
  return learningExperiences.filter((experience) => experience.status === "published");
}

export function getLearningExperienceBySlug(slug: string): LearningExperience | undefined {
  return getPublishedLearningExperiences().find((experience) => experience.slug === slug);
}

export function getLearningExperiencesByGrade(gradeId: string): LearningExperience[] {
  return getPublishedLearningExperiences().filter((experience) => experience.gradeIds.includes(gradeId));
}

export function getLearningExperiencesByDomain(domainCode: DomainCode): LearningExperience[] {
  return getPublishedLearningExperiences().filter((experience) => experience.domainIds.includes(domainCode));
}

export function getGradeName(gradeId: string): string {
  return grades.find((grade) => grade.id === gradeId)?.name ?? gradeId;
}

export function getGradeLevel(gradeId: string): number | undefined {
  return grades.find((grade) => grade.id === gradeId)?.level;
}

export function getDomainTitle(domainCode: DomainCode): string {
  return domains.find((domain) => domain.code === domainCode)?.title ?? domainCode;
}

export function getLearningObjectiveTitle(objectiveId: string): string {
  return learningObjectives.find((objective) => objective.id === objectiveId)?.title ?? objectiveId;
}

export { domains, grades, learningObjectives };
