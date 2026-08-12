-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentAccessTier" AS ENUM ('PUBLIC', 'ACCOUNT', 'PREMIUM');

-- CreateEnum
CREATE TYPE "QuestionOrigin" AS ENUM ('OFFICIAL_HANDBOOK', 'PLATFORM_CREATED', 'ADAPTED');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_IN_BLANKS', 'SHORT_TEXT', 'NUMERIC', 'SELF_REVIEW');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'DIFFICULT');

-- CreateEnum
CREATE TYPE "QuestionSetKind" AS ENUM ('HANDBOOK', 'TOPIC_PRACTICE', 'CHAPTER_PRACTICE', 'REVISION', 'CHALLENGE', 'MIXED');

-- CreateEnum
CREATE TYPE "AssetVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "AssetProvider" AS ENUM ('SUPABASE_STORAGE', 'AWS_S3');

-- CreateEnum
CREATE TYPE "AssetRole" AS ENUM ('STEM', 'OPTION', 'SUPPORTING', 'SOLUTION', 'SOURCE');

-- CreateEnum
CREATE TYPE "SourceDocumentType" AS ENUM ('STUDENT_HANDBOOK', 'TEACHER_HANDBOOK', 'PLATFORM_CREATED', 'OTHER');

-- CreateTable
CREATE TABLE "curricula" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "curricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_editions" (
    "id" TEXT NOT NULL,
    "curriculum_id" TEXT NOT NULL,
    "academic_session" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "curriculum_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "curriculum_edition_id" TEXT NOT NULL,
    "grade_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_number" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "position" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "engine_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_versions" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "content_hash" TEXT NOT NULL,
    "student_content" JSONB NOT NULL,
    "teacher_content" JSONB,
    "access_tier" "ContentAccessTier" NOT NULL DEFAULT 'PUBLIC',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "activity_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_activity_items" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "activity_version_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "display_label" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_activity_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_versions" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "renderer" TEXT NOT NULL,
    "response_type" "ResponseType" NOT NULL,
    "content" JSONB NOT NULL,
    "response_config" JSONB NOT NULL,
    "content_hash" TEXT NOT NULL,
    "origin" "QuestionOrigin" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_answer_keys" (
    "question_version_id" TEXT NOT NULL,
    "grading_config" JSONB NOT NULL,
    "max_score" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "question_answer_keys_pkey" PRIMARY KEY ("question_version_id")
);

-- CreateTable
CREATE TABLE "question_solutions" (
    "question_version_id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "question_solutions_pkey" PRIMARY KEY ("question_version_id")
);

-- CreateTable
CREATE TABLE "question_course_profiles" (
    "id" TEXT NOT NULL,
    "question_version_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "estimated_minutes" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "question_course_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_topic_links" (
    "question_course_profile_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "question_topic_links_pkey" PRIMARY KEY ("question_course_profile_id","topic_id")
);

-- CreateTable
CREATE TABLE "question_sets" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "QuestionSetKind" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "question_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_set_versions" (
    "id" TEXT NOT NULL,
    "question_set_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "instructions" JSONB,
    "content_hash" TEXT NOT NULL,
    "access_tier" "ContentAccessTier" NOT NULL DEFAULT 'PUBLIC',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "question_set_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_set_items" (
    "id" TEXT NOT NULL,
    "question_set_version_id" TEXT NOT NULL,
    "question_version_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "display_number" TEXT,
    "source_page" INTEGER,
    "source_section" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_set_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_assets" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "visibility" "AssetVisibility" NOT NULL,
    "original_file_name" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "content_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_locations" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "provider" "AssetProvider" NOT NULL,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_assets" (
    "question_version_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "role" "AssetRole" NOT NULL,
    "ref_key" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_assets_pkey" PRIMARY KEY ("question_version_id","ref_key")
);

-- CreateTable
CREATE TABLE "source_documents" (
    "id" TEXT NOT NULL,
    "curriculum_edition_id" TEXT,
    "asset_id" TEXT,
    "title" TEXT NOT NULL,
    "file_name" TEXT,
    "document_type" "SourceDocumentType" NOT NULL,
    "rights_notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_references" (
    "id" TEXT NOT NULL,
    "source_document_id" TEXT NOT NULL,
    "page" INTEGER,
    "page_end" INTEGER,
    "section" TEXT,
    "notes" TEXT,
    "chapter_id" TEXT,
    "activity_version_id" TEXT,
    "question_version_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curricula_code_key" ON "curricula"("code");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_editions_curriculum_id_academic_session_key" ON "curriculum_editions"("curriculum_id", "academic_session");

-- CreateIndex
CREATE UNIQUE INDEX "grades_level_key" ON "grades"("level");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_slug_key" ON "subjects"("slug");

-- CreateIndex
CREATE INDEX "courses_grade_id_subject_id_idx" ON "courses"("grade_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_curriculum_edition_id_grade_id_subject_id_key" ON "courses"("curriculum_edition_id", "grade_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_curriculum_edition_id_slug_key" ON "courses"("curriculum_edition_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_course_id_slug_key" ON "chapters"("course_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_course_id_position_key" ON "chapters"("course_id", "position");

-- CreateIndex
CREATE INDEX "topics_parent_id_idx" ON "topics"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_chapter_id_slug_key" ON "topics"("chapter_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "topics_chapter_id_position_key" ON "topics"("chapter_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "activities_slug_key" ON "activities"("slug");

-- CreateIndex
CREATE INDEX "activity_versions_status_published_at_idx" ON "activity_versions"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "activity_versions_activity_id_version_key" ON "activity_versions"("activity_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_activity_items_chapter_id_position_key" ON "chapter_activity_items"("chapter_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_activity_items_chapter_id_activity_version_id_key" ON "chapter_activity_items"("chapter_id", "activity_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "questions_slug_key" ON "questions"("slug");

-- CreateIndex
CREATE INDEX "question_versions_renderer_response_type_status_idx" ON "question_versions"("renderer", "response_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "question_versions_question_id_version_key" ON "question_versions"("question_id", "version");

-- CreateIndex
CREATE INDEX "question_course_profiles_course_id_difficulty_idx" ON "question_course_profiles"("course_id", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "question_course_profiles_question_version_id_course_id_key" ON "question_course_profiles"("question_version_id", "course_id");

-- CreateIndex
CREATE INDEX "question_topic_links_topic_id_idx" ON "question_topic_links"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_sets_chapter_id_slug_key" ON "question_sets"("chapter_id", "slug");

-- CreateIndex
CREATE INDEX "question_set_versions_status_published_at_idx" ON "question_set_versions"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "question_set_versions_question_set_id_version_key" ON "question_set_versions"("question_set_id", "version");

-- CreateIndex
CREATE INDEX "question_set_items_question_set_version_id_display_number_idx" ON "question_set_items"("question_set_version_id", "display_number");

-- CreateIndex
CREATE UNIQUE INDEX "question_set_items_question_set_version_id_position_key" ON "question_set_items"("question_set_version_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "question_set_items_question_set_version_id_question_version_key" ON "question_set_items"("question_set_version_id", "question_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_assets_sha256_visibility_key" ON "content_assets"("sha256", "visibility");

-- CreateIndex
CREATE INDEX "asset_locations_asset_id_is_primary_idx" ON "asset_locations"("asset_id", "is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "asset_locations_provider_bucket_object_key_key" ON "asset_locations"("provider", "bucket", "object_key");

-- CreateIndex
CREATE INDEX "question_assets_asset_id_idx" ON "question_assets"("asset_id");

-- CreateIndex
CREATE INDEX "source_documents_curriculum_edition_id_idx" ON "source_documents"("curriculum_edition_id");

-- CreateIndex
CREATE INDEX "source_references_source_document_id_idx" ON "source_references"("source_document_id");

-- CreateIndex
CREATE INDEX "source_references_question_version_id_idx" ON "source_references"("question_version_id");

-- AddForeignKey
ALTER TABLE "curriculum_editions" ADD CONSTRAINT "curriculum_editions_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_curriculum_edition_id_fkey" FOREIGN KEY ("curriculum_edition_id") REFERENCES "curriculum_editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_versions" ADD CONSTRAINT "activity_versions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_activity_items" ADD CONSTRAINT "chapter_activity_items_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_activity_items" ADD CONSTRAINT "chapter_activity_items_activity_version_id_fkey" FOREIGN KEY ("activity_version_id") REFERENCES "activity_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_answer_keys" ADD CONSTRAINT "question_answer_keys_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_solutions" ADD CONSTRAINT "question_solutions_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_course_profiles" ADD CONSTRAINT "question_course_profiles_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_course_profiles" ADD CONSTRAINT "question_course_profiles_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_topic_links" ADD CONSTRAINT "question_topic_links_question_course_profile_id_fkey" FOREIGN KEY ("question_course_profile_id") REFERENCES "question_course_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_topic_links" ADD CONSTRAINT "question_topic_links_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_set_versions" ADD CONSTRAINT "question_set_versions_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_set_items" ADD CONSTRAINT "question_set_items_question_set_version_id_fkey" FOREIGN KEY ("question_set_version_id") REFERENCES "question_set_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_set_items" ADD CONSTRAINT "question_set_items_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_locations" ADD CONSTRAINT "asset_locations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "content_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_assets" ADD CONSTRAINT "question_assets_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_assets" ADD CONSTRAINT "question_assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "content_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_curriculum_edition_id_fkey" FOREIGN KEY ("curriculum_edition_id") REFERENCES "curriculum_editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "content_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "source_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_activity_version_id_fkey" FOREIGN KEY ("activity_version_id") REFERENCES "activity_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
