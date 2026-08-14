import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { parse } from "yaml";
import type { z } from "zod";

import {
  activityFileSchema,
  chapterFileSchema,
  courseFileSchema,
  curriculumFileSchema,
  questionFileSchema,
  questionSetFileSchema,
  topicsFileSchema,
  type ActivityFile,
  type ChapterFile,
  type CourseFile,
  type CurriculumFile,
  type QuestionFile,
  type QuestionSetFile,
  type TopicsFile
} from "@/content-authoring/schemas";

export interface LoadedFile<T> {
  data: T;
  path: string;
  directory: string;
}

export interface LoadedActivity extends LoadedFile<ActivityFile> {
  configuration: unknown;
}

export interface LoadedChapter extends LoadedFile<ChapterFile> {
  topics: LoadedFile<TopicsFile>;
  activities: LoadedActivity[];
  questions: LoadedFile<QuestionFile>[];
  questionSets: LoadedFile<QuestionSetFile>[];
}

export interface LoadedCourse extends LoadedFile<CourseFile> {
  chapters: LoadedChapter[];
}

export interface CurriculumBundle {
  root: string;
  curriculum: LoadedFile<CurriculumFile>;
  courses: LoadedCourse[];
}

export interface ContentCatalog {
  root: string;
  editions: CurriculumBundle[];
}

function formatIssues(filePath: string, error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const location = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `  - ${location}: ${issue.message}`;
  });

  return `${filePath}\n${issues.join("\n")}`;
}

async function loadYaml<T>(filePath: string, schema: z.ZodType<T>): Promise<LoadedFile<T>> {
  const source = await readFile(filePath, "utf8");
  const parsed = parse(source);
  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw new Error(formatIssues(filePath, result.error));
  }

  return {
    data: result.data,
    path: filePath,
    directory: path.dirname(filePath)
  };
}

async function listDirectories(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

async function listYamlFiles(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
      .map((entry) => path.join(directory, entry.name))
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function assertUnique(values: string[], label: string): void {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate ${label}: ${[...new Set(duplicates)].join(", ")}`);
  }
}

function collectAssetRefs(question: QuestionFile): string[] {
  const refs = [...question.solution.assetRefs];

  if ("stimulus" in question.content && question.content.stimulus) {
    refs.push(...question.content.stimulus.assetRefs);
  }

  if ("options" in question.content) {
    for (const option of question.content.options) {
      if ("assetRef" in option && option.assetRef) {
        refs.push(option.assetRef);
      }
    }
  }

  return refs;
}

function assertPathInsideRoot(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Content file points outside the content root: ${candidate}`);
  }
}

async function loadChapter(chapterDirectory: string, root: string): Promise<LoadedChapter> {
  const chapter = await loadYaml(path.join(chapterDirectory, "chapter.yaml"), chapterFileSchema);
  const topics = await loadYaml(path.join(chapterDirectory, "topics.yaml"), topicsFileSchema);

  const activities: LoadedActivity[] = [];
  for (const filePath of await listYamlFiles(path.join(chapterDirectory, "activities"))) {
    const activity = await loadYaml(filePath, activityFileSchema);
    const configurationPath = activity.data.configuration.kind === "json"
      ? path.resolve(activity.directory, activity.data.configuration.file)
      : path.resolve(process.cwd(), activity.data.configuration.file);
    assertPathInsideRoot(
      activity.data.configuration.kind === "json" ? root : process.cwd(),
      configurationPath
    );
    let configuration: unknown;
    if (activity.data.configuration.kind === "json") {
      configuration = JSON.parse(await readFile(configurationPath, "utf8")) as unknown;
    } else {
      const importedModule = await import(pathToFileURL(configurationPath).href) as Record<string, unknown>;
      const exported = importedModule[activity.data.configuration.exportName];
      if (exported === undefined) {
        throw new Error(`${activity.path}: missing export ${activity.data.configuration.exportName}`);
      }
      if (activity.data.configuration.property) {
        if (exported === null || typeof exported !== "object") {
          throw new Error(`${activity.path}: exported value is not an object`);
        }
        configuration = (exported as Record<string, unknown>)[activity.data.configuration.property];
      } else {
        configuration = exported;
      }
      if (configuration === undefined) {
        throw new Error(`${activity.path}: missing configuration property ${activity.data.configuration.property}`);
      }
    }
    activities.push({ ...activity, configuration });
  }

  const questions = await Promise.all(
    (await listYamlFiles(path.join(chapterDirectory, "questions"))).map((filePath) =>
      loadYaml(filePath, questionFileSchema)
    )
  );
  const questionSets = await Promise.all(
    (await listYamlFiles(path.join(chapterDirectory, "question-sets"))).map((filePath) =>
      loadYaml(filePath, questionSetFileSchema)
    )
  );

  const topicIds = topics.data.topics.map((topic) => topic.id);
  assertUnique(topicIds, `topic IDs in ${topics.path}`);
  assertUnique(topics.data.topics.map((topic) => String(topic.position)), `topic positions in ${topics.path}`);

  for (const topic of topics.data.topics) {
    if (topic.parentId && !topicIds.includes(topic.parentId)) {
      throw new Error(`${topics.path}: topic ${topic.id} references unknown parent ${topic.parentId}`);
    }
  }

  const questionKeys = questions.map(({ data }) => `${data.id}@${data.version}`);
  assertUnique(questionKeys, `question versions in ${chapterDirectory}`);

  for (const question of questions) {
    for (const topicId of question.data.courseProfile.topics) {
      if (!topicIds.includes(topicId)) {
        throw new Error(`${question.path}: unknown topic ${topicId}`);
      }
    }

    const declaredRefs = question.data.assets.map((asset) => asset.ref);
    assertUnique(declaredRefs, `asset refs in ${question.path}`);
    for (const referencedAsset of collectAssetRefs(question.data)) {
      if (!declaredRefs.includes(referencedAsset)) {
        throw new Error(`${question.path}: undeclared asset ref ${referencedAsset}`);
      }
    }

    for (const asset of question.data.assets) {
      const assetPath = path.resolve(question.directory, asset.file);
      assertPathInsideRoot(root, assetPath);
      await access(assetPath);
    }
  }

  for (const questionSet of questionSets) {
    const positions = questionSet.data.items.map((item) => String(item.position));
    assertUnique(positions, `question positions in ${questionSet.path}`);
    if (questionSet.data.kind === "handbook") {
      for (const item of questionSet.data.items) {
        if (!item.displayNumber) {
          throw new Error(`${questionSet.path}: handbook items require displayNumber`);
        }
      }
    }
    for (const item of questionSet.data.items) {
      const key = `${item.questionId}@${item.questionVersion}`;
      if (!questionKeys.includes(key)) {
        throw new Error(`${questionSet.path}: unknown question version ${key}`);
      }
    }
  }

  return {
    ...chapter,
    topics,
    activities,
    questions,
    questionSets
  };
}

async function loadCourse(courseDirectory: string, root: string): Promise<LoadedCourse> {
  const course = await loadYaml(path.join(courseDirectory, "course.yaml"), courseFileSchema);
  const chapterDirectories = await listDirectories(path.join(courseDirectory, "chapters"));
  const chapters = await Promise.all(
    chapterDirectories.map((chapterDirectory) => loadChapter(chapterDirectory, root))
  );

  assertUnique(chapters.map(({ data }) => data.id), `chapter IDs in ${courseDirectory}`);
  assertUnique(chapters.map(({ data }) => String(data.position)), `chapter positions in ${courseDirectory}`);

  return { ...course, chapters };
}

async function loadCurriculumBundle(editionDirectory: string, root: string): Promise<CurriculumBundle> {
  const curriculum = await loadYaml(path.join(editionDirectory, "curriculum.yaml"), curriculumFileSchema);
  const courseDirectories = (await listDirectories(editionDirectory)).filter((directory) =>
    path.basename(directory).startsWith("class-")
  );
  const courses = await Promise.all(courseDirectories.map((directory) => loadCourse(directory, root)));

  const sourceIds = curriculum.data.sourceDocuments.map((source) => source.id);
  assertUnique(sourceIds, `source document IDs in ${curriculum.path}`);
  assertUnique(courses.map(({ data }) => data.id), `course IDs in ${editionDirectory}`);

  // Chapters, topics, questions, and question sets are all stored under a global
  // primary key, but each is only authored inside one course directory. Checking
  // per directory would let two courses claim the same ID, and sync would then
  // quietly upsert one over the other instead of failing, so the checks have to
  // span the whole edition.
  const allChapters = courses.flatMap((course) => course.chapters);
  assertUnique(
    allChapters.map(({ data }) => data.id),
    `chapter IDs in ${editionDirectory}`
  );
  assertUnique(
    allChapters.flatMap((chapter) => chapter.topics.data.topics.map((topic) => topic.id)),
    `topic IDs in ${editionDirectory}`
  );
  assertUnique(
    allChapters.flatMap((chapter) =>
      chapter.questions.map(({ data }) => `${data.id}@${data.version}`)
    ),
    `question versions in ${editionDirectory}`
  );
  // A question's slug is globally unique in the database, so two chapters cannot
  // both carry the same one even when their IDs differ. Handbooks do repeat a
  // question verbatim across chapters, which makes this easy to trip over.
  assertUnique(
    [
      ...new Map(
        allChapters.flatMap((chapter) =>
          chapter.questions.map(({ data }) => [data.id, data.slug] as const)
        )
      ).values()
    ],
    `question slugs in ${editionDirectory}`
  );
  assertUnique(
    allChapters.flatMap((chapter) => chapter.questionSets.map(({ data }) => data.id)),
    `question set IDs in ${editionDirectory}`
  );
  // Activities are deliberately left out: one activity version can be attached to
  // several chapters, and a content-hash check already guards against two copies
  // of the same version disagreeing.

  for (const course of courses) {
    for (const chapter of course.chapters) {
      const references = [
        ...chapter.data.sourceReferences,
        ...chapter.activities.flatMap(({ data }) => data.sourceReferences),
        ...chapter.questions.flatMap(({ data }) => data.sourceReferences)
      ];
      for (const reference of references) {
        if (!sourceIds.includes(reference.sourceId)) {
          throw new Error(`Unknown source document ${reference.sourceId} in course ${course.data.id}`);
        }
      }
    }
  }

  return { root, curriculum, courses };
}

export async function loadContentCatalog(root = path.resolve(process.cwd(), "content")): Promise<ContentCatalog> {
  const editionDirectories = await listDirectories(root);
  if (editionDirectories.length === 0) {
    throw new Error(`No curriculum editions found under ${root}`);
  }

  const editions = await Promise.all(
    editionDirectories.map((editionDirectory) => loadCurriculumBundle(editionDirectory, root))
  );
  const editionIds = editions.map(({ curriculum }) => curriculum.data.edition.id);
  assertUnique(editionIds, `curriculum edition IDs under ${root}`);

  return { root, editions };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

export function contentHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}
