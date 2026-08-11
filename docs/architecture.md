# Architecture — CBSE CT & AI Learning Platform

**Status:** Draft for implementation  
**Version:** 1.0  
**Product scope:** CBSE Computational Thinking & Artificial Intelligence, Classes 3–8  
**MVP:** Class 3 Caesar Cipher  
**Architecture style:** Modular monolith  
**Primary stack:** Next.js + TypeScript + Vercel  
**Persistence:** MongoDB when required  
**Analytics:** First-party event API  
**Team:** One-person development team

---

## 1. Architecture Goals

The architecture must support the product requirements in `product-spec.md` while remaining simple enough for one developer to build and operate.

Primary goals:

1. Start with the smallest possible infrastructure.
2. Keep curriculum/content separate from application code.
3. Build reusable activity engines.
4. Support Classes 3–8 without grade-specific code.
5. Support future teacher assignments and test series.
6. Persist student attempts and progress when accounts are introduced.
7. Track meaningful product events using first-party analytics.
8. Allow new activity types without rewriting existing activities.
9. Support future curriculum additions such as Class 9/10 without architectural redesign.
10. Avoid premature microservices and infrastructure complexity.

---

# 2. High-Level Architecture

```text
                         Internet
                            │
                            ▼
                       Vercel Edge/CDN
                            │
                            ▼
                     Next.js Application
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
        Server Components           Client Components
              │                           │
              │                    Activity Engine
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
                     Application Layer
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
      Curriculum        Activities         Assessment
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
              MongoDB             Event API
                 │                     │
                 │                     ▼
                 │              analyticsEvents
                 │
                 ▼
        Persistent application data
```

The application is a **modular monolith**.

There is one deployable Next.js application, with clear internal module boundaries.

---

# 3. Why a Modular Monolith

Do NOT start with:

```text
Next.js
 ├── User Service
 ├── Curriculum Service
 ├── Activity Service
 ├── Assessment Service
 ├── Analytics Service
 ├── Teacher Service
 └── Progress Service
```

That would introduce unnecessary:

- deployment complexity
- networking
- authentication duplication
- monitoring
- infrastructure cost
- local development complexity

Instead:

```text
Next.js
 ├── Authentication module
 ├── Curriculum module
 ├── Activity module
 ├── Assessment module
 ├── Progress module
 ├── Teacher module
 └── Analytics module
```

These are logical modules inside the same application.

If the platform later reaches a scale where a module genuinely needs independent scaling, it can be extracted.

---

# 4. Technology Decisions

| Area | Decision |
|---|---|
| Language | TypeScript |
| Framework | Next.js |
| UI | React |
| Deployment | Vercel |
| Database | MongoDB |
| API | Next.js Route Handlers / Server Actions where appropriate |
| Authentication | Pluggable authentication module |
| Analytics | First-party event API |
| Styling | Project-selected lightweight UI system |
| Validation | Zod or equivalent schema validation |
| Testing | Vitest/Jest + Playwright |
| Package manager | npm/pnpm, choose one and standardise |
| Repository | Single repository |
| Architecture | Modular monolith |

Do not introduce Redis, Kafka, Kubernetes, or a separate backend service unless an actual requirement appears.

---

# 5. Application Layers

The codebase should follow a simple layered model:

```text
UI
 ↓
Application
 ↓
Domain
 ↓
Infrastructure
```

## 5.1 UI Layer

Responsible for:

- pages
- layouts
- forms
- interactive activity components
- teacher/student screens
- loading/error states

Should not contain database queries directly.

## 5.2 Application Layer

Responsible for use cases:

```text
startActivity
submitActivity
createAssignment
joinClass
submitTest
getStudentProgress
recordEvent
```

Application functions coordinate domain logic and persistence.

## 5.3 Domain Layer

Contains business rules:

- scoring
- activity validation
- curriculum relationships
- competency evidence
- progress rules
- assignment rules

Domain logic should not depend on React.

## 5.4 Infrastructure Layer

Responsible for:

- MongoDB
- authentication provider integration
- event persistence
- external services
- caching if introduced later

---

# 6. Recommended Repository Structure

```text
/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   └── activities/
│   │
│   ├── activities/
│   │   └── [slug]/
│   │
│   ├── learn/
│   │
│   ├── student/
│   │
│   ├── teacher/
│   │
│   ├── api/
│   │   ├── events/
│   │   ├── attempts/
│   │   ├── assignments/
│   │   └── ...
│   │
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── activity/
│   ├── student/
│   └── teacher/
│
├── features/
│   ├── curriculum/
│   ├── activities/
│   ├── assessments/
│   ├── progress/
│   ├── authentication/
│   ├── classrooms/
│   ├── assignments/
│   └── analytics/
│
├── activity-engine/
│   ├── registry.ts
│   ├── types.ts
│   ├── runtime.ts
│   └── types/
│       ├── cipher/
│       ├── puzzle/
│       ├── grid/
│       └── ...
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── analytics/
│   ├── validation/
│   └── utils/
│
├── content/
│   ├── curricula/
│   ├── activities/
│   └── seeds/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
│
├── product-spec.md
├── architecture.md
└── ...
```

The exact directory layout may be adjusted during implementation. The important rule is separation of responsibilities.

---

# 7. Curriculum Architecture

Curriculum is data, not application logic.

Conceptual model:

```text
Curriculum
 └── Grade
      └── Domain
           └── Unit
                └── Learning Objective
                     └── Learning Experience
```

Example:

```text
CBSE-2026-27
 └── Grade 3
      └── Computational Thinking
           └── Unit
                └── Learning Objective
                     └── Caesar Cipher
```

The application should not contain:

```ts
if (grade === 3) ...
if (grade === 4) ...
```

to determine curriculum behaviour.

Instead:

```ts
activity.curriculumMappings
```

determines where an activity belongs.

---

# 8. Curriculum Entities

## Curriculum

```ts
interface Curriculum {
  id: string;
  code: string;
  name: string;
  academicSession: string;
  status: "draft" | "published" | "archived";
}
```

Example:

```text
code: CBSE-CTAI
academicSession: 2026-27
```

## Grade

```ts
interface Grade {
  id: string;
  curriculumId: string;
  level: number;
  name: string;
}
```

## Domain

```ts
type DomainCode =
  | "computational-thinking"
  | "artificial-intelligence";
```

## Learning Objective

```ts
interface LearningObjective {
  id: string;
  unitId: string;
  title: string;
  description: string;
  sourceReference?: SourceReference;
}
```

---

# 9. Source References

Curriculum content should maintain traceability to source material.

```ts
interface SourceReference {
  document: string;
  page?: number;
  section?: string;
  notes?: string;
}
```

Example:

```json
{
  "document": "CTAI_Pri3SH_2026-27.pdf",
  "section": "Activity Time",
  "page": 12
}
```

This is an internal content-management feature.

It allows the team to answer:

> "Why does this activity exist and which official curriculum material does it map to?"

---

# 10. Learning Experience Model

The core content object is a Learning Experience.

```ts
type LearningExperienceType =
  | "lesson"
  | "activity"
  | "puzzle"
  | "simulation"
  | "question"
  | "assessment"
  | "assignment"
  | "project"
  | "scenario";
```

Conceptual model:

```ts
interface LearningExperience {
  id: string;
  slug: string;
  version: number;

  title: string;
  description?: string;

  gradeIds: string[];
  domainIds: string[];
  objectiveIds: string[];
  competencyIds: string[];

  type: LearningExperienceType;

  studentContent: StudentContent;
  teacherContent?: TeacherContent;

  activityType?: string;
  activityConfig?: unknown;

  status: "draft" | "published" | "archived";

  sourceReferences?: SourceReference[];

  createdAt: Date;
  updatedAt: Date;
}
```

---

# 11. Student and Teacher Content

Keep the representations separate.

```text
Learning Experience
 ├── studentContent
 └── teacherContent
```

Student content:

```ts
interface StudentContent {
  instructions: string;
  introduction?: string;
  hints?: Hint[];
  explanation?: string;
}
```

Teacher content:

```ts
interface TeacherContent {
  objective?: string;
  preparation?: string;
  facilitationNotes?: string[];
  expectedObservations?: string[];
  commonMisconceptions?: string[];
  discussionQuestions?: string[];
  solution?: string;
  assessmentNotes?: string[];
  extensionActivities?: string[];
}
```

The teacher content should follow the structure and intent of the CBSE Teacher Handbook where applicable.

---

# 12. Activity Engine

The Activity Engine is the central reusable technical component.

Conceptually:

```text
Learning Experience
       │
       │ activityType
       ▼
Activity Registry
       │
       ▼
Activity Implementation
       │
       ▼
Interactive UI
```

Example:

```ts
registerActivity("cipher", CipherActivity);
registerActivity("grid", GridActivity);
registerActivity("classification", ClassificationActivity);
```

The registry maps a stable activity type to an implementation.

---

# 13. Activity Contract

Every activity should implement a common contract.

Conceptual interface:

```ts
interface ActivityDefinition<TConfig, TState, TAnswer, TResult> {
  type: string;
  version: number;

  createInitialState(
    config: TConfig
  ): TState;

  validateAnswer(
    state: TState,
    answer: TAnswer,
    config: TConfig
  ): ValidationResult;

  calculateResult(
    state: TState,
    answer: TAnswer,
    config: TConfig
  ): TResult;
}
```

The actual interface can be refined during implementation.

The key principle is:

> Every activity has a predictable runtime contract.

---

# 14. Activity Configuration vs Activity Code

Example:

```text
Code:
CipherActivity
```

Configuration:

```json
{
  "alphabet": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "minShift": 1,
  "maxShift": 25,
  "challengeCount": 5
}
```

This means one activity implementation can support multiple activities.

For example:

```text
Caesar Cipher — Introduction
Caesar Cipher — Practice
Caesar Cipher — Challenge
```

without three separate implementations.

---

# 15. Activity Registry

Use a registry rather than scattered conditionals.

```ts
const activityRegistry = {
  cipher: CipherActivity,
  grid: GridActivity,
  puzzle: PuzzleActivity,
};
```

Or an explicit registration API:

```ts
registerActivity({
  type: "cipher",
  version: 1,
  component: CipherActivity,
  engine: cipherEngine
});
```

The registry should be the single place where activity implementations are discovered.

---

# 16. Deterministic Activity Logic

Where possible, activity logic should be deterministic.

For example, Caesar Cipher:

```text
A → B
B → C
...
Z → A
```

The same input and configuration should produce the same expected result.

This makes:

- testing easier
- debugging easier
- scoring reliable
- analytics meaningful

Avoid unnecessary server calls for purely client-side mathematical/simulation logic.

---

# 17. Client vs Server Responsibilities

## Client

Use the browser for:

- interactive simulations
- visual manipulation
- immediate UI feedback
- local activity state
- animations
- client-side deterministic calculations

## Server

Use the server for:

- authentication
- authorization
- persistent attempts
- teacher/student relationships
- assignments
- test submissions
- protected progress
- trusted scoring where necessary
- analytics persistence

The client must not be trusted for security-sensitive values.

---

# 18. MVP Without Database

The first Caesar Cipher experience should work without MongoDB.

Flow:

```text
YouTube
  ↓
Next.js page
  ↓
Client-side cipher activity
  ↓
Local activity state
  ↓
Result
```

Analytics can be sent asynchronously to the event endpoint.

No account is required.

This reduces the MVP surface dramatically.

---

# 19. When MongoDB Is Introduced

MongoDB becomes useful when the product needs:

- student accounts
- saved attempts
- progress across devices
- teacher classes
- assignments
- test series
- persistent results

At that point:

```text
Next.js
   │
   ▼
Application services
   │
   ▼
MongoDB
```

The activity engine should not directly access MongoDB.

---

# 20. MongoDB Logical Model

Initial collections:

```text
users
students
teachers
classes
enrollments

curricula
grades
domains
units
learningObjectives
competencies

learningExperiences
activityAttempts
assignments
tests
submissions

analyticsEvents
```

Do not create every collection at the beginning.

Introduce collections with the feature that needs them.

---

# 21. User Model

Use a common user identity model with role-specific information.

Conceptual:

```ts
interface User {
  id: string;
  role: "student" | "teacher";
  createdAt: Date;
  updatedAt: Date;
}
```

Student profile:

```ts
interface StudentProfile {
  userId: string;
  displayName: string;
  gradeId: string;
}
```

Teacher profile:

```ts
interface TeacherProfile {
  userId: string;
  name: string;
}
```

Do not create a parent role initially.

---

# 22. Authentication Boundary

Authentication should be isolated behind an internal interface.

```ts
interface AuthService {
  getCurrentUser(): Promise<User | null>;
  requireUser(): Promise<User>;
  requireRole(role: UserRole): Promise<User>;
}
```

This avoids coupling the entire application to one authentication provider.

The actual provider can be selected during implementation.

---

# 23. Authorization

Authorization must happen on the server.

Examples:

```text
Student:
  can read own progress
  can submit own attempts

Teacher:
  can manage own classes
  can assign activities
  can view students enrolled in own classes

Student:
  cannot read another student's private progress

Teacher:
  cannot access another teacher's class data
```

Never rely only on hidden UI buttons for authorization.

---

# 24. Classroom Model

```text
Teacher
   │
   └── Class
        │
        ├── Enrollment → Student
        ├── Enrollment → Student
        └── Enrollment → Student
```

Use an enrollment relationship rather than embedding complete student objects into classes.

Conceptual:

```ts
interface Enrollment {
  classId: string;
  studentId: string;
  status: "active" | "removed";
  joinedAt: Date;
}
```

This allows a student to belong to multiple classes.

---

# 25. Class Join Flow

Teacher:

```text
Create class
 ↓
System generates join code/link
```

Student:

```text
Open link/code
 ↓
Authenticate/create student account
 ↓
Confirm class
 ↓
Create enrollment
```

The join code should not itself grant teacher privileges.

---

# 26. Assignment Model

An assignment references existing learning experiences.

```ts
interface Assignment {
  id: string;
  classId: string;
  createdBy: string;

  title: string;

  experienceIds: string[];

  dueAt?: Date;

  status: "draft" | "published" | "closed";

  createdAt: Date;
}
```

The same activity can therefore be:

- public
- assigned by a teacher
- included in a test

without duplicating the content.

---

# 27. Test Series Model

A test is a collection of assessment items/experiences.

```text
Test
 ├── metadata
 ├── experience references
 ├── settings
 └── publication state
```

Conceptually:

```ts
interface Test {
  id: string;
  title: string;
  gradeId: string;
  experienceIds: string[];
  settings: TestSettings;
  status: "draft" | "published" | "archived";
}
```

Do not create a separate question implementation for tests.

Tests reuse the activity/assessment system.

---

# 28. Attempts

An attempt records what happened during an activity.

```ts
interface ActivityAttempt {
  id: string;

  studentId?: string;
  visitorId?: string;
  sessionId: string;

  activityId: string;
  activityVersion: number;

  startedAt: Date;
  completedAt?: Date;

  attempts: number;
  hintsUsed: number;

  score?: number;
  result?: string;

  competencyEvidence?: CompetencyEvidence[];
}
```

Anonymous attempts may use `visitorId` instead of `studentId`.

---

# 29. Versioning

Curriculum and activities must be versioned.

```text
curriculumVersion
activityVersion
```

An attempt stores the exact activity version used.

Example:

```text
activityId:
caesar-cipher

activityVersion:
1
```

If the activity changes later:

```text
activityVersion:
2
```

Old attempts remain interpretable.

---

# 30. Progress Architecture

Progress should be derived from activity evidence.

```text
Activity Attempts
       │
       ▼
Progress Service
       │
       ├── completion
       ├── scores
       ├── attempts
       ├── hints
       └── competency evidence
```

The system can maintain aggregated progress records for performance, but the attempt records remain the underlying evidence.

---

# 31. Competency Evidence

Activities can emit evidence.

```ts
interface CompetencyEvidence {
  competencyId: string;
  status: "practicing" | "demonstrated";
  score?: number;
  attempts?: number;
  hintsUsed?: number;
}
```

This is an internal learning signal.

It must not be presented as a scientifically validated measurement of intelligence or ability.

---

# 32. Progress Levels

Initial model:

```text
Not Started
     ↓
Practicing
     ↓
Demonstrated
```

Additional states can be introduced later.

Avoid false precision such as:

```text
Algorithmic Thinking = 73.428%
```

unless a validated scoring methodology exists.

---

# 33. Teacher Analytics

Teacher analytics should aggregate student activity evidence.

Example:

```text
Class 3A

Student       Completion    Avg Score
-------------------------------------
A             90%           88
B             70%           72
C             100%          94
```

Competency summary:

```text
Pattern Recognition     Strong
Algorithmic Thinking    Developing
Spatial Reasoning       Needs Practice
```

These labels should be based on transparent internal rules.

---

# 34. Weakness Detection

Initial rule-based implementation:

```text
Needs Practice when:
  repeated low performance
  OR repeated failed attempts
  OR high hint usage
  OR incomplete assigned work
```

Do not diagnose students.

Use language such as:

```text
Needs more practice
Developing
Demonstrated
```

---

# 35. Analytics Architecture

Use a first-party event endpoint.

```text
Browser
  │
  │ POST /api/events
  ▼
Event Validation
  │
  ▼
Analytics Service
  │
  ▼
analyticsEvents
```

The endpoint should:

1. validate the event schema
2. add server timestamp where appropriate
3. identify authenticated user if available
4. rate-limit requests
5. persist event
6. return a lightweight response

Analytics should not block the activity experience.

---

# 36. Event Schema

Conceptual:

```ts
interface AnalyticsEvent {
  event: string;
  eventVersion: number;

  timestamp?: string;

  visitorId?: string;
  sessionId: string;
  userId?: string;

  activityId?: string;
  assignmentId?: string;
  testId?: string;

  metadata?: Record<string, unknown>;
}
```

Allowed event names should be centrally defined.

Example:

```text
page_view
activity_started
activity_completed
activity_failed
activity_retried
hint_used
assignment_opened
assignment_submitted
test_started
test_submitted
student_joined_class
```

---

# 37. Analytics Privacy

Because the platform targets school-age students:

- minimise data collection
- avoid unnecessary personal information
- avoid precise location
- avoid contacts
- avoid unnecessary third-party tracking SDKs
- avoid public student identifiers
- avoid public rankings initially
- keep event metadata minimal
- define retention policies before production scale

Do not put sensitive personal information into analytics events.

---

# 38. Visitor Identification

For anonymous usage:

```text
visitorId
sessionId
```

A random first-party identifier can be stored in a cookie/local storage as appropriate.

For logged-in users:

```text
userId
studentId
```

should be used for product activity.

Never use email as the analytics identity.

---

# 39. Returning User Measurement

A returning user is identified through previously observed visitor/session or authenticated-user activity.

Store:

```text
firstSeenAt
lastSeenAt
sessionId
```

Then calculate:

```text
new visitors
returning visitors
new students
returning students
D1 retention
D7 retention
D30 retention
```

The first MVP only needs enough raw data to calculate these later.

Do not over-engineer a retention system before traffic exists.

---

# 40. Event Idempotency

Events may be retried by the browser.

Where useful, support:

```text
eventId
```

as a client-generated UUID.

The server can ignore duplicate event IDs.

This prevents accidental duplicate counts.

---

# 41. API Design

Use resource-oriented route handlers.

Examples:

```text
POST /api/events

POST /api/activities/:id/attempts
POST /api/activities/:id/complete

POST /api/classes
POST /api/classes/:id/join

POST /api/assignments
GET  /api/assignments/:id

POST /api/tests
GET  /api/tests/:id
POST /api/tests/:id/submissions

GET /api/students/me/progress
```

These are conceptual routes.

The final API should be designed around actual implemented use cases rather than creating endpoints for every database collection.

---

# 42. Server Actions vs Route Handlers

Use Server Actions where they simplify internal authenticated application mutations.

Use Route Handlers when:

- an external/public client needs the endpoint
- analytics events are posted from the browser
- a stable HTTP API is useful
- an API may later be consumed by another client

Do not force every operation into a REST endpoint.

---

# 43. Public Activity Pages

Public activities should be accessible without authentication.

Example:

```text
/activity/caesar-cipher
```

The page should contain:

```text
SEO metadata
Introduction
Interactive activity
Practice
Result
CTA
```

The activity should not require a database account.

This is critical for the YouTube funnel.

---

# 44. URL Design

Prefer stable, human-readable URLs.

Examples:

```text
/activity/caesar-cipher
/activity/pattern-puzzle
/learn/class-3
/test/abc123
/join/abc123
```

Do not expose MongoDB ObjectIds in public URLs unless necessary.

Use stable slugs or short opaque codes.

---

# 45. Content Loading

Public curriculum/activity content should be cacheable.

Possible approach:

```text
Static/Server-rendered page
       ↓
Activity configuration
       ↓
Client activity component
```

Content that changes frequently or is teacher-specific should be loaded dynamically.

---

# 46. Caching Strategy

Initial:

```text
No custom cache layer
```

Use:

- Vercel/CDN caching
- Next.js caching
- MongoDB indexes

Only introduce Redis or another cache if actual performance data shows the need.

---

# 47. Database Access

Create a single database access module.

```text
lib/db/
 ├── client.ts
 ├── collections.ts
 └── repositories/
      ├── users.ts
      ├── activities.ts
      ├── attempts.ts
      └── ...
```

UI components must not import MongoDB directly.

Use repositories/services.

---

# 48. Repository Pattern

Example:

```ts
interface ActivityRepository {
  getById(id: string): Promise<Activity | null>;
  getBySlug(slug: string): Promise<Activity | null>;
}
```

Application code depends on the repository contract rather than MongoDB-specific calls.

This makes testing easier and keeps infrastructure isolated.

---

# 49. MongoDB Indexes

Indexes should be created based on actual query patterns.

Expected future indexes include:

```text
activities.slug
activities.status
activities.gradeIds
activities.objectiveIds

attempts.studentId + createdAt
attempts.activityId + createdAt

enrollments.classId + studentId
enrollments.studentId + classId

analyticsEvents.event + timestamp
analyticsEvents.visitorId + timestamp
analyticsEvents.userId + timestamp
```

Do not add indexes blindly.

---

# 50. Data Ownership

Define ownership clearly.

```text
Curriculum
  → platform-owned

Learning Experience
  → platform/content-team owned

Class
  → teacher-owned

Assignment
  → teacher-owned

Student Attempt
  → student/platform-owned

Analytics Event
  → platform-owned
```

Authorization should follow ownership.

---

# 51. Teacher Content Workflow

Future content-management flow:

```text
Draft
 ↓
Review
 ↓
Publish
 ↓
Archive
```

Teachers should not automatically modify official curriculum content.

Teacher-created test questions can exist separately from platform curriculum content.

---

# 52. Teacher-Created Content

Future teacher content should use the same activity engine.

Example:

```text
Teacher
 ↓
Create Test
 ↓
Select existing activities
 OR
Create supported question
 ↓
Publish
 ↓
Share
```

This prevents building a second unrelated test system.

---

# 53. Student Submission Flow

```text
Student opens assignment
       ↓
Assignment validation
       ↓
Activity loaded
       ↓
Student interacts
       ↓
Local result
       ↓
Server submission
       ↓
Server validates/stores
       ↓
Progress updated
       ↓
Analytics recorded
```

For low-stakes public activities, the result can remain client-side.

For teacher-assigned assessments, server persistence is required.

---

# 54. Scoring Trust Boundary

Client-side scoring is acceptable for:

```text
public practice
low-stakes activities
instant feedback
```

Server-side validation/scoring is required for:

```text
teacher tests
persistent assessments
official-looking results
```

Never accept a client-provided score as authoritative for a protected assessment.

---

# 55. Error Handling

The application should distinguish:

```text
User error
Validation error
Authentication error
Authorization error
Not found
Server error
```

Do not expose stack traces or internal database errors to students.

Student-facing messages should be simple.

Example:

```text
Something went wrong. Please try again.
```

Developer logs should contain enough diagnostic information.

---

# 56. Logging

Use structured server logs.

Example:

```json
{
  "level": "error",
  "operation": "submitActivity",
  "activityId": "...",
  "requestId": "...",
  "error": "..."
}
```

Never log passwords, authentication secrets, or unnecessary personal information.

---

# 57. Observability

MVP needs only:

- Vercel deployment logs
- application errors
- basic event counts
- basic traffic analytics

Future:

- error monitoring
- performance monitoring
- database monitoring
- alerting

Do not build a separate observability platform before it is needed.

---

# 58. Security Baseline

Required:

- HTTPS
- secure authentication
- server-side authorization
- input validation
- rate limiting for public APIs
- secure cookies where applicable
- CSRF protection where applicable
- no secrets in client bundles
- environment variables for credentials
- least-privilege database access

---

# 59. Rate Limiting

The first public endpoint that needs protection is:

```text
POST /api/events
```

Other public endpoints such as:

```text
join
attempt
```

should also be protected when introduced.

Start with a simple provider/platform-supported mechanism.

Do not deploy Redis solely for rate limiting unless required.

---

# 60. Environment Configuration

Use environment variables for:

```text
DATABASE_URL
AUTH_SECRET
AUTH_PROVIDER_CONFIG
ANALYTICS_CONFIG
```

Separate:

```text
development
preview
production
```

Never commit secrets.

---

# 61. Deployment

Target:

```text
Git repository
      ↓
Vercel
      ↓
Preview deployment
      ↓
Production
```

Every pull request should ideally get a preview deployment.

Production deployment should require passing tests/build checks.

---

# 62. CI/CD

Initial pipeline:

```text
Install
 ↓
Lint
 ↓
Typecheck
 ↓
Unit tests
 ↓
Build
 ↓
E2E tests where appropriate
 ↓
Deploy
```

Do not add complicated deployment orchestration.

---

# 63. Testing Architecture

## Unit

Test:

- cipher algorithm
- scoring
- validation
- competency rules
- progress calculations

## Component

Test:

- activity rendering
- answer interactions
- feedback
- retry
- hints

## Integration

Test:

- repositories
- API handlers
- authentication/authorization

## E2E

Test critical journeys:

```text
Public activity
 → complete activity

Student
 → join class
 → complete assignment

Teacher
 → create class
 → assign activity
 → view result
```

The MVP only needs the public activity journey.

---

# 64. Caesar Cipher Architecture

The first activity should be isolated as an example of the activity architecture.

```text
activity-engine/
 └── cipher/
      ├── cipher.engine.ts
      ├── cipher.types.ts
      ├── cipher.validation.ts
      └── CipherActivity.tsx
```

Responsibilities:

### Engine

Pure cipher transformations.

### Validation

Determine whether the answer is correct.

### Component

Render the interactive UI.

### Analytics adapter

Emit activity events.

This separation prevents UI code from becoming the cipher implementation.

---

# 65. Caesar Cipher Flow

```text
User
 │
 ▼
CipherActivity.tsx
 │
 ▼
cipher.engine
 │
 ├── encode()
 ├── decode()
 └── transform()
 │
 ▼
Result
 │
 ├── feedback
 ├── score
 └── event
```

No database is required for the cipher calculation itself.

---

# 66. Activity State

Activity state should be local to the activity unless persistence is required.

Example:

```ts
interface CipherState {
  mode: "encode" | "decode";
  shift: number;
  input: string;
  output: string;
  currentQuestion?: string;
  score: number;
  attempts: number;
  hintsUsed: number;
}
```

Do not put every activity's state into a global React store.

---

# 67. Activity Persistence

Use the following progression:

### MVP

```text
React state
+
optional browser storage
```

### Student accounts

```text
React state
 ↓
API
 ↓
MongoDB
```

### Teacher assessments

```text
React state
 ↓
Server validation
 ↓
MongoDB
```

This prevents premature persistence complexity.

---

# 68. Mobile/Tablet Architecture

Interactive activities should be designed for touch first where appropriate.

Avoid interactions that require:

- hover-only controls
- tiny buttons
- precise mouse movements

For a tablet:

```text
touch
stylus
keyboard
```

should work where relevant.

Stylus-specific functionality is optional future scope.

---

# 69. Accessibility Architecture

Interactive activity components should expose:

- semantic controls
- labels
- keyboard alternatives
- readable feedback
- focus states
- non-colour feedback

Where a visual simulation cannot be fully replicated for accessibility, provide an explanatory alternative.

---

# 70. SEO Architecture

Public educational activities should be indexable where appropriate.

Each activity page should have:

```text
title
description
canonical URL
structured metadata where useful
```

The actual interactive application should enhance the page rather than being the only content.

This supports discovery through:

- Google
- YouTube
- direct sharing
- WhatsApp

---

# 71. YouTube Funnel Architecture

```text
YouTube video
      │
      ▼
Activity URL
      │
      ▼
Public Next.js page
      │
      ▼
Activity Engine
      │
      ▼
Completion
      │
      ├── optional account creation
      │
      └── more practice
```

The public activity must remain usable without login.

Do not put authentication before the first learning interaction.

---

# 72. Future Account Conversion

A student can begin anonymously:

```text
Visitor
 ↓
Activity
 ↓
Completion
 ↓
"Save your progress"
 ↓
Create account
 ↓
Anonymous history can optionally be linked
```

This is preferable to forcing registration before the first activity.

If anonymous-to-account linking is implemented, it must be designed carefully to avoid account takeover or accidental history merging.

---

# 73. Future Parent View

No parent account.

```text
Student account
      │
      ▼
Progress
      │
      ├── Student view
      └── Parent view
```

Parent view should be presentation-focused.

It should not introduce a second identity model.

---

# 74. Future Subscription Architecture

Payments are not part of MVP.

When introduced:

```text
User
 ↓
Subscription
 ↓
Entitlements
 ↓
Feature access
```

Do not scatter:

```ts
if (paid) ...
```

throughout the application.

Use an entitlement service:

```ts
hasEntitlement(user, "premium");
```

This keeps future pricing changes manageable.

---

# 75. Future AI-Generated Questions

AI generation should be an application module, not embedded inside the activity engine.

```text
Question Generation
       │
       ▼
AI Provider
       │
       ▼
Generated Draft
       │
       ▼
Validation
       │
       ▼
Human Review
       │
       ▼
Published Activity
```

AI-generated material must not automatically become curriculum content.

---

# 76. Future AI Provider Abstraction

If AI is introduced:

```ts
interface QuestionGenerator {
  generate(input: GenerationRequest): Promise<GenerationResult>;
}
```

Possible providers can then be swapped.

The rest of the platform should not depend directly on OpenAI/Claude/etc.

---

# 77. Future Class 9/10 Expansion

Architecture supports additional grades through curriculum data.

Current:

```text
Grades 3–8
```

Future:

```text
Grades 9–10
```

The application should not contain assumptions such as:

```ts
const MAX_GRADE = 8;
```

Instead, available grades come from curriculum configuration.

However, Class 9/10 content must not be added until official material has been reviewed.

---

# 78. Future Extraction to Services

Only extract services when there is a concrete reason.

Potential future boundaries:

```text
Next.js Application
        │
        ├── Content Service
        ├── Assessment Service
        └── Analytics Service
```

Possible triggers:

- independent scaling requirement
- large analytics volume
- multiple client applications
- independent deployment needs
- operational ownership by different teams

None of these justify microservices at MVP stage.

---

# 79. Architectural Principles

### Principle 1

**Content is data.**

### Principle 2

**Activity behaviour is reusable code.**

### Principle 3

**Curriculum mapping is configuration.**

### Principle 4

**Student activity should be useful without login.**

### Principle 5

**Persistent assessments require server trust.**

### Principle 6

**Analytics should answer product questions.**

### Principle 7

**Do not collect unnecessary student data.**

### Principle 8

**Do not build infrastructure before usage requires it.**

### Principle 9

**Future grades should be added through content, not code branching.**

### Principle 10

**The platform should be a modular monolith until evidence says otherwise.**

---

# 80. MVP Architecture

The actual first deployment should be much smaller than the final architecture.

```text
                 Vercel
                   │
                Next.js
                   │
          ┌────────┴────────┐
          │                 │
     Public Page       Event Endpoint
          │                 │
          ▼                 ▼
   Cipher Activity    analyticsEvents*
          │
          ▼
      Local State
```

`*` Event persistence can initially use the simplest reliable storage available; MongoDB is introduced when persistent application data becomes necessary.

No:

```text
auth
MongoDB user model
teacher dashboard
parent dashboard
test series
AI service
microservices
```

are required for the first Caesar Cipher release.

---

# 81. MVP-to-Product Evolution

```text
MVP
 │
 ├── Caesar Cipher
 ├── Public activity
 └── Basic analytics
       │
       ▼
Student accounts
       │
       ▼
Saved progress
       │
       ▼
Teacher classes
       │
       ▼
Assignments
       │
       ▼
Test Series
       │
       ▼
Class 3–8 content
       │
       ▼
Projects / advanced AI activities
       │
       ▼
Future CBSE curriculum
```

Each stage should be justified by evidence from the previous stage.

---

# 82. Architecture Decision Records

## ADR-001 — Modular Monolith

**Decision:** Use a modular monolith.

**Reason:** One-person development team and early-stage product do not justify microservices.

**Consequence:** Modules must maintain clean boundaries so future extraction remains possible.

---

## ADR-002 — Next.js + Vercel

**Decision:** Use Next.js with Vercel.

**Reason:** Fast development, deployment simplicity, server/client rendering support and suitability for interactive educational pages.

**Consequence:** Avoid introducing a separate backend until required.

---

## ADR-003 — MongoDB

**Decision:** Use MongoDB for persistent application data when required.

**Reason:** Flexible content/activity models and developer familiarity.

**Consequence:** Database access must be isolated behind repositories/services.

---

## ADR-004 — First-Party Analytics

**Decision:** Do not use Segment for MVP.

**Reason:** Segment is unnecessary operational complexity for the initial traffic and product-learning stage.

**Consequence:** Build a small event endpoint and standard event schema.

---

## ADR-005 — Public Activities Without Login

**Decision:** Activities should be usable without an account.

**Reason:** YouTube/WhatsApp sharing requires a low-friction learning experience.

**Consequence:** Anonymous visitor/session tracking is required for useful product analytics.

---

## ADR-006 — Reusable Activity Engine

**Decision:** Build reusable activity types rather than custom code for every activity.

**Reason:** The platform will eventually contain many CT/AI activities.

**Consequence:** Each activity must conform to a common contract.

---

## ADR-007 — No Separate Parent Account

**Decision:** Parent progress view is inside the student account.

**Reason:** Reduces account complexity and friction for families.

**Consequence:** Parent-specific authentication and permissions are deferred.

---

## ADR-008 — Curriculum as Data

**Decision:** Curriculum hierarchy and mappings are data-driven.

**Reason:** Classes 3–8 share a platform while curriculum content changes by grade/session.

**Consequence:** Grade-specific business logic should be avoided.

---

## ADR-009 — Class 9/10 Deferred

**Decision:** Architecture supports future grades, but current content stops at Classes 3–8.

**Reason:** Official Class 9/10 material should be reviewed before implementation.

**Consequence:** No assumptions about Class 9/10 learning structure should enter the current content model.

---

# 83. Implementation Order

Recommended implementation order:

```text
1. Repository + Next.js
2. Basic UI foundation
3. Activity type contract
4. Activity registry
5. Cipher engine
6. Cipher UI
7. Activity validation/scoring
8. Public activity page
9. First-party event endpoint
10. Deployment
11. Automated tests
12. YouTube link
```

Only after MVP validation:

```text
13. Authentication
14. MongoDB
15. Student progress
16. Teacher classes
17. Assignments
18. Test Series
19. More curriculum activities
```

---

# 84. Architecture Acceptance Criteria

The architecture is ready for implementation when:

- [ ] Next.js application structure is defined.
- [ ] Modular boundaries are clear.
- [ ] Curriculum is represented as data.
- [ ] Learning Experience is the core content object.
- [ ] Student and teacher content are separated.
- [ ] Activity Engine has a stable contract.
- [ ] Activity Registry is defined.
- [ ] Activity logic can run independently of React.
- [ ] Public activities do not require authentication.
- [ ] Analytics use a standard event envelope.
- [ ] MongoDB is isolated behind infrastructure/repository code.
- [ ] Authentication is isolated behind an internal interface.
- [ ] Authorization is server-side.
- [ ] Activity versions are persisted with attempts.
- [ ] Future grades can be added through curriculum data.
- [ ] No microservice dependency exists.
- [ ] Caesar Cipher can be implemented without the full platform.

---

# 85. Final Architecture Principle

The most important architectural decision is:

> **Build the platform as an engine for interactive learning experiences, not as a collection of individual pages.**

The long-term structure should be:

```text
                 CURRICULUM
                     │
                     ▼
             LEARNING OBJECTIVES
                     │
                     ▼
          LEARNING EXPERIENCES
                     │
                     ▼
              ACTIVITY ENGINE
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     Practice     Simulation    Assessment
        │            │            │
        └────────────┼────────────┘
                     ▼
                  ATTEMPTS
                     │
                     ▼
                  PROGRESS
                     │
                     ▼
                  TEACHER
```

The implementation should start with only one vertical slice:

```text
CBSE Class 3
   ↓
Caesar Cipher
   ↓
Activity Engine
   ↓
Public Activity
   ↓
Analytics
```

Everything else should be added only when the product demonstrates real usage.
