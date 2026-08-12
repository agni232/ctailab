# CTAI Lab Architecture

**Status:** Active
**Stack:** Next.js, TypeScript, Prisma, PostgreSQL, object storage
**Initial infrastructure:** Vercel and Supabase
**Architecture:** Modular monolith

## Goals

CTAI Lab serves chapter-wise Computational Thinking and AI activities and questions for Classes 3-8. The architecture must support additional subjects, curriculum editions, parent accounts, progress, Android clients, and teacher workflows without requiring those features in the initial content phase.

The priorities are:

1. Keep the public learning experience fast and understandable.
2. Keep curriculum structure separate from activity implementation code.
3. Preserve exact handbook sequence and provenance by edition.
4. Support diverse question renderers without sacrificing relational integrity.
5. Keep the database, storage, and authentication providers replaceable.
6. Avoid separate services until operational scale demonstrates a need.

## Runtime Architecture

```text
Web browser                 React Native later
      \                         /
              CTAI Lab API
            Next.js /api/v1
                   |
         Application services
                   |
          Prisma repositories
                   |
              PostgreSQL

Content import scripts -> Storage adapter -> Supabase Storage / S3 later
```

Browsers and mobile applications call only CTAI Lab endpoints. They do not query PostgreSQL or Supabase's generated Data API directly.

## Application Boundaries

```text
UI
  Pages, components, activity interactions

Application
  Catalogue, question delivery, answer checking, publishing, progress

Domain
  Activity engines, question contracts, scoring and version rules

Infrastructure
  Prisma, PostgreSQL, Storage, email and authentication providers
```

Database calls belong in server repositories and application services. Activity engines remain independent of React and persistence where practical.

## Content Hierarchy

```text
Curriculum
└── Curriculum edition
    └── Course: one class and subject
        └── Chapter
            ├── Topics
            ├── Activities
            ├── Handbook question sets
            └── Practice question sets
```

Computational Thinking and Artificial Intelligence is the first subject, not a hardcoded platform boundary. Additional subjects create new `subjects` and `courses` records.

When a class has one subject, the UI can open its chapters directly. The model and routes still retain the subject so a selector can appear later without data migration.

## Content Ownership

PostgreSQL is the runtime source of truth. Until an admin portal is worthwhile, reviewed YAML files are the authoring source.

```text
YAML and assets
      |
content:validate
      |
content:sync
      |
PostgreSQL and object storage
```

The application never parses handbooks or YAML during a student request. Production content synchronization is explicit and does not run during the application build.

## Activity Model

Interactive behavior stays in versioned activity engines registered in code. PostgreSQL stores curriculum placement, metadata, validated configuration, student/teacher content, access tier, publication status, and provenance.

An activity configuration may reference an existing module export during authoring. This keeps the current Caesar Cipher configuration canonical while it is migrated into the new catalogue.

Published activity versions are immutable. A behavioral or content change creates a new version.

## Question Model

Question data uses a relational shell with validated JSONB payloads:

```text
questions                 Stable identity
question_versions         Renderer, public content and response contract
question_answer_keys      Server-only grading configuration
question_solutions        Solution content
question_course_profiles  Difficulty and course context
question_topic_links      One or more chapter topics
question_assets           Logical asset references
```

Initial response types:

- Single choice
- Multiple choice
- Fill in the blanks
- Short text
- Numeric
- Self review

Open-ended reflection is self-reviewed initially. AI grading is not part of the content foundation.

## Handbook Sequence

Question identity and handbook numbering are deliberately separate:

```text
Question: cube-combination-001, version 1

2026-27 handbook placement: display number 10, position 10
2027-28 handbook placement: display number 4, position 4
```

`question_set_items` stores `position`, `display_number`, source page, and exact question version. This preserves historical links and lets unchanged questions move between editions.

If wording, options, media, answer, or solution changes, the new edition references a new question version. Published historical versions remain unchanged.

## Practice Content

Handbook and practice content use the same question engine but different sets:

- Handbook
- Topic practice
- Chapter practice
- Revision
- Challenge
- Mixed

A question can appear in multiple sets without duplicating its content. Difficulty belongs to the question's course profile because difficulty may change by class or curriculum context.

## Asset Model

Questions reference logical assets, never vendor URLs:

```text
content_assets
  Hash, media type and visibility

asset_locations
  Provider, bucket, object key and primary flag

question_assets
  Question-specific ref, role, alt text and position
```

Initial buckets:

- `content-public`: published stems, options and illustrations
- `content-private`: sources, solutions, drafts and restricted assets

Uploads go through a `ContentStorage` interface. Migrating to S3 adds AWS locations and switches the primary provider without changing question IDs or public application routes.

## Data Access and Security

Supabase's generated Data API is disabled. Prisma connects to PostgreSQL through server-only credentials:

- `DATABASE_URL`: pooled Vercel runtime connection
- `DIRECT_URL`: direct or session connection for migrations and imports

The initial phase has no student authentication. When accounts are introduced, the backend will derive identity from a secure session and never trust a client-supplied user ID.

Parent accounts authenticate; child profiles do not initially require child email or passwords. Authentication remains a separate module and does not own curriculum or progress identifiers.

## API Direction

The public API will be versioned under `/api/v1` and client-neutral so the future Android application can use it.

Expected resources include:

```text
/api/v1/catalog/classes
/api/v1/courses/:courseId/chapters
/api/v1/chapters/:chapterId
/api/v1/activities/:slug
/api/v1/question-sets/:slug
/api/v1/questions/:itemId
/api/v1/questions/:itemId/check
/api/v1/questions/:itemId/solution
```

Answers and private solution data must not be serialized in initial question responses.

## Availability and Portability

Supabase is the initial provider. CTAI Lab remains portable by using standard PostgreSQL migrations, Prisma, provider-neutral asset records, and server-side access only.

Before approximately 1,000 active student profiles:

1. Maintain logical PostgreSQL backups outside the provider.
2. Keep the authored content repository reproducible.
3. Mirror or test-copy Storage assets to S3.
4. Test a complete RDS and S3 restoration before the production cutover.

Provider failure must not require changing question identity, curriculum routes, or client applications.

## Deferred Features

The content foundation does not include:

- Parent or student authentication
- Progress persistence
- Teacher accounts, classes or assignments
- Premium access enforcement or payments
- React Native application
- Teacher or student uploads
- Automated question generation
- AI grading

The schema reserves access tiers and content relationships needed by these features without implementing them prematurely.

## Engineering Rules

1. Published content versions are immutable.
2. Activity scoring has one canonical engine implementation.
3. Question bodies and renderer configurations are runtime validated.
4. Answer keys remain server-only.
5. Assets require accessible alt text.
6. Handbook numbers belong to edition-specific placements.
7. Production synchronization is explicit and non-destructive.
8. New subjects and grades are data, not conditionals in UI code.
9. Provider-specific APIs remain inside infrastructure adapters.
10. Tests scale with the behavioral and data-integrity risk of each change.
