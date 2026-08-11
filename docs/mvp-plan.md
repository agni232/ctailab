# MVP Plan — CBSE CT & AI Learning Platform

**Version:** 1.0  
**Status:** Ready for implementation  
**Scope:** CBSE Computational Thinking & Artificial Intelligence, Classes 3–8  
**MVP:** Class 3 Caesar Cipher interactive learning experience

## 1. MVP Goal

The MVP is not the full platform. It is the smallest real product that can validate whether students will:

1. discover an interactive activity through YouTube,
2. understand it without a teacher,
3. practice it,
4. complete it,
5. return later.

The primary objective is **learning-product validation**, not revenue or feature count.

## 2. MVP Scope

### Included

- Public student-facing activity page
- Short Caesar Cipher explanation
- Interactive alphabet/shift simulation
- Guided example
- 5–10 practice questions
- Immediate feedback
- Retry
- Hints
- Basic score/result
- Mobile/tablet support
- Anonymous usage
- First-party analytics
- Reusable Activity Engine foundation
- Unit/component/E2E tests
- Vercel deployment

### Explicitly excluded

- Student login
- Teacher login
- Parent login
- Student database profiles
- Teacher dashboard
- Parent dashboard
- Classes
- Assignments
- Test Series
- Payments/subscriptions
- AI-generated questions
- AI tutor
- Leaderboards
- Native mobile app
- Microservices
- Redis/Kafka
- CMS/admin dashboard
- Complete Classes 3–8 content
- Class 9/10 content

## 3. Core User Journey

```text
YouTube Video
     ↓
Activity link
     ↓
Public Caesar Cipher page
     ↓
Learn
     ↓
Interactive example
     ↓
Try it
     ↓
Practice
     ↓
Immediate feedback
     ↓
Completion
     ├── Retry
     └── More practice
```

No mandatory registration should appear in this flow.

## 4. Page Structure

Recommended URL:

```text
/activity/caesar-cipher
```

Structure:

```text
Introduction
     ↓
Interactive simulation
     ↓
Guided example
     ↓
Practice
     ↓
Result
```

The page should be useful even without the interactive component.

## 5. Learning Experience

The experience should follow:

```text
Discover → See → Try → Practice → Challenge
```

### Simulation

Example:

```text
Shift = 3

Original:  HELLO
Encrypted: KHOOR
```

Changing the shift should update the result immediately.

The student should be able to experiment rather than only read an explanation.

## 6. Practice

Suggested progression:

### Level 1 — Single letters

```text
A + 2 = ?
```

### Level 2 — Short words

```text
CAT + 2 = ?
```

### Level 3 — Decode

```text
FDW with shift 2 = ?
```

### Level 4 — Mixed challenges

Encode/decode based on the instruction.

Use a small question set initially.

## 7. Hints

Hints should teach the process instead of immediately revealing the answer.

Example:

```text
Hint 1: Start at C.
Hint 2: Move two places to the right.
Answer: E
```

Track hint usage as an analytics signal.

## 8. Completion

Example:

```text
Great work!

Score: 8/10

✓ Encoding
✓ Decoding
✓ Alphabet shifting

[Try Again]
```

Do not build a complex competency dashboard in the MVP.

## 9. Anonymous Usage

Students can use the activity without an account.

Use:

```text
visitorId
sessionId
```

for anonymous product analytics.

Later, authenticated students can use `studentId`.

## 10. Analytics

The MVP should answer:

- How many visitors arrive?
- How many start?
- How many complete?
- How many retry?
- How many questions are attempted?
- How often are hints used?
- How many return?

### Core events

```text
page_view
activity_started
practice_started
question_answered
hint_used
question_completed
activity_completed
activity_retried
```

Do not create dozens of events.

### Event envelope

```json
{
  "event": "question_answered",
  "eventVersion": 1,
  "sessionId": "...",
  "visitorId": "...",
  "activityId": "caesar-cipher",
  "metadata": {
    "questionNumber": 3,
    "correct": true,
    "attemptNumber": 1
  }
}
```

Do not send unnecessary personal information.

## 11. First-Party Analytics

Do not use Segment for the MVP.

Implement:

```text
track()
   ↓
POST /api/events
   ↓
validate
   ↓
persist
```

Analytics failure must never prevent the student from completing the activity.

## 12. Returning User

For anonymous users:

```text
Day 1:
visitorId = ABC
session = S1

Day 3:
visitorId = ABC
session = S2

→ Returning visitor
```

Later, authenticated students can be measured by `studentId`.

## 13. Activity Engine

The MVP must establish the reusable foundation.

```text
activity-engine/
 ├── types.ts
 ├── registry.ts
 └── runtime.ts
```

Caesar Cipher:

```text
activity-engine/
 └── cipher/
      ├── cipher.engine.ts
      ├── cipher.types.ts
      └── CipherActivity.tsx
```

The algorithm should be independent of React.

## 14. Activity Contract

Minimum conceptual interface:

```ts
interface ActivityDefinition {
  type: string;
  version: number;

  createInitialState(config: unknown): unknown;

  validateAnswer(
    state: unknown,
    answer: unknown,
    config: unknown
  ): ValidationResult;

  calculateResult(
    state: unknown,
    answer: unknown,
    config: unknown
  ): ActivityResult;
}
```

The exact types can be refined during implementation.

## 15. Caesar Cipher Engine

Pure functions:

```ts
encode(text, shift)
decode(text, shift)
transform(text, shift)
```

Required behaviour:

- alphabet wrapping
- spaces preserved
- punctuation handled consistently
- case handled consistently
- deterministic output

Examples:

```text
encode("ABC", 3) → "DEF"
encode("XYZ", 3) → "ABC"
decode("KHOOR", 3) → "HELLO"
```

## 16. Testing

### Unit tests

Test:

```text
A + 1 = B
A + 3 = D
Z + 1 = A
Z + 3 = C
HELLO + 3 = KHOOR
decode(KHOOR, 3) = HELLO
spaces
punctuation
case
```

### Component tests

Test:

- activity rendering
- shift changes
- input changes
- output updates
- correct feedback
- incorrect feedback
- retry
- hints
- completion event

### E2E

One critical journey:

```text
Open activity
 → start
 → complete practice
 → see result
```

## 17. Content

Create the first activity from the reviewed CBSE Class 3 material and maintain source references.

Keep:

```text
Student content
Teacher notes
Learning objective
Instructions
Practice
Hints
Expected result
Source reference
```

Teacher content should exist in the content model even though teacher accounts are not part of the MVP.

## 18. Content Storage

Do not build a CMS.

Use version-controlled content/configuration.

Example:

```text
content/
 └── activities/
      └── class-3/
           └── caesar-cipher.ts
```

The exact format can be TypeScript, JSON, or another simple structured format.

The important rule is:

> Content is separate from the activity implementation.

## 19. Database

MongoDB is **not required for the core Caesar Cipher experience**.

Do not build student profiles or persistent progress yet.

If event persistence requires MongoDB, use it only for the event data initially.

Student/application persistence can be introduced with authentication later.

## 20. Development Phases

### Phase 0 — Setup

- Next.js
- TypeScript
- linting
- formatting
- testing
- Vercel
- repository documentation

Acceptance:

```text
dev
lint
typecheck
test
build
```

all pass.

### Phase 1 — Activity Engine

Implement:

```text
ActivityDefinition
ActivityRegistry
ActivityResult
ValidationResult
```

Acceptance: a test activity can be registered and rendered.

### Phase 2 — Cipher Engine

Implement pure Caesar Cipher functions and tests.

### Phase 3 — Cipher UI

Implement:

- explanation
- alphabet visualisation
- shift control
- input/output
- interactive demonstration

### Phase 4 — Practice

Implement:

- question model
- answer input
- validation
- feedback
- retry
- hints
- score
- completion

### Phase 5 — Analytics

Implement:

- visitor/session identification
- `track()`
- `/api/events`
- validation
- persistence

### Phase 6 — Public Page

Implement:

```text
/activity/caesar-cipher
```

with SEO metadata and sharing CTA.

### Phase 7 — Responsive/Accessibility

Test desktop, tablet and mobile, including touch and keyboard interaction.

### Phase 8 — Production

```text
Git
 ↓
Vercel Preview
 ↓
QA
 ↓
Production
```

### Phase 9 — YouTube Launch

Create one educational video demonstrating the concept and interactive simulation, then link directly to the activity.

## 21. Launch Checklist

### Product

- [ ] Student can understand the activity without a teacher
- [ ] Curriculum mapping is documented
- [ ] Practice works
- [ ] Feedback works
- [ ] Retry works
- [ ] Hints work
- [ ] Completion works

### Technical

- [ ] TypeScript passes
- [ ] Lint passes
- [ ] Unit tests pass
- [ ] E2E test passes
- [ ] Production build passes
- [ ] Vercel deployment works

### Analytics

- [ ] Visitor ID works
- [ ] Session ID works
- [ ] Activity start tracked
- [ ] Questions tracked
- [ ] Completion tracked
- [ ] Retry tracked
- [ ] Returning visitor measurable

### UX

- [ ] Desktop
- [ ] Tablet
- [ ] Mobile
- [ ] Touch
- [ ] Keyboard
- [ ] Loading/error states

## 22. Definition of Done

A real student can:

```text
Watch YouTube video
       ↓
Open activity
       ↓
Understand Caesar Cipher
       ↓
Experiment
       ↓
Answer practice questions
       ↓
Receive feedback
       ↓
Complete activity
       ↓
Retry
```

The system can measure:

```text
Who arrived
↓
Who started
↓
Who practiced
↓
Who completed
↓
Who returned
```

without requiring login.

## 23. Post-MVP Decision Gate

Do not immediately build the entire Classes 3–8 platform.

First analyse:

### Acquisition

- link clicks
- activity starts

### Engagement

- completion rate
- drop-off point
- retry rate

### Learning

- difficult questions
- hint usage
- encoding/decoding errors

### Retention

- returning visitors
- 7-day return behaviour

### Distribution

- teacher sharing
- parent sharing
- student sharing

A weak traffic result should not automatically mean the product failed; first determine whether enough students actually reached it.

## 24. Possible Next Features

Based on real usage, choose one:

```text
More Class 3 activities
More Caesar Cipher practice
Complete Class 3 learning sequence
Teacher sharing/tests
Student accounts + saved progress
```

Do not build all of them simultaneously.

## 25. Recommended First Week

### Day 1
Project setup, architecture, activity contract.

### Day 2
Caesar Cipher engine, tests, initial UI.

### Day 3
Simulation, practice, feedback and hints.

### Day 4
Analytics, visitor/session tracking, public page.

### Day 5
Responsive design, accessibility, E2E tests.

### Day 6
Vercel deployment, domain and QA.

### Day 7
YouTube video, launch and observation.

This is a target, not a reason to ship unfinished work.

## 26. Final MVP Architecture

```text
                    YouTube
                       │
                       ▼
              /activity/caesar-cipher
                       │
                       ▼
                 Next.js Page
                       │
                       ▼
                Activity Engine
                       │
                       ▼
              Caesar Cipher Activity
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
    Local Activity State       Analytics API
          │                         │
          ▼                         ▼
      Result/Score             Event Storage
```

## 27. Final Principle

> **Do not build the platform first and then search for students. Build one excellent learning experience, put it in front of real students, measure what happens, and let that evidence determine what the platform becomes.**
