# Product Specification — CBSE Computational Thinking & Artificial Intelligence Learning Platform

**Status:** Draft for implementation  
**Version:** 1.1  
**Current curriculum scope:** CBSE CT & AI Classes 3–8, academic session 2026–27  
**MVP:** Class 3 Caesar Cipher interactive learning experience  
**Primary stack:** Next.js + TypeScript + Vercel  
**Database:** MongoDB, introduced when persistent application data is required  
**Product model:** Student + Teacher, with a parent view inside the student's account  
**Owner:** One-person development team

---

## 1. Product Vision

Build an interactive learning platform for **CBSE Computational Thinking (CT) and Artificial Intelligence (AI)** for Classes 3–8.

The platform should not be a conventional question bank or a collection of PDF pages converted to HTML.

The core learning model is:

> **Explain → Explore → Interact → Practice → Reflect → Assess → Track progress**

The platform should convert appropriate CBSE CT & AI concepts into interactive learning experiences such as:

- puzzles
- simulations
- games
- visual reasoning activities
- step-by-step algorithm activities
- data activities
- AI simulations
- scenario/case-study activities
- assessments
- projects

The product should complement classroom teaching and CBSE handbook content rather than attempt to replace the teacher or textbook.

---

# 2. Curriculum Basis

The current product is based on the official **CBSE 2026–27 Computational Thinking and Artificial Intelligence Student and Teacher Handbooks for Classes 3–8**.

CBSE describes CT as the intellectual foundation for AI readiness and emphasises logical thinking, problem solving, pattern recognition, digital literacy, responsible technology use, innovation, critical thinking and ethical decision-making. The curriculum is implemented for Classes 3–8 in 2026–27. 

The handbooks emphasise:

- activity-based learning
- inquiry and experiential learning
- complex puzzles, riddles and games
- real-world problems
- collaborative work
- data collection and analysis
- AI demonstrations and hands-on experiences
- ethical discussions and case studies
- continuous, formative and competency-based assessment
- teacher facilitation rather than simply giving answers

The Class 6–8 handbooks allocate 100 hours annually:
- 40 hours Advanced CT
- 20 hours introductory AI
- 40 hours interdisciplinary projects

The exact content, terminology and sequence must remain grounded in the official handbooks.

### Important scope rule

**Current curriculum content: Classes 3–8 only.**

Class 9 and Class 10 are intentionally outside the current curriculum/content scope. When official CBSE/NCERT material is released and reviewed, it can be added without changing the core platform architecture.

Do not invent Class 9 or Class 10 curriculum content in the current system.

---

# 3. Product Goals

## 3.1 Primary goals

1. Make CT & AI concepts more engaging through interaction.
2. Convert suitable handbook activities into digital experiences.
3. Give students immediate feedback and opportunities to retry.
4. Give teachers a simple way to assign activities/tests and view student progress.
5. Track meaningful learning activity, not just page visits.
6. Build a reusable activity engine rather than hard-coding every activity.
7. Keep infrastructure and operating cost extremely low.
8. Make the platform extensible to Classes 3–8 without redesigning the core system.

## 3.2 Public Learning Library

The platform is a **public learning library for Classes 3–8**, not only an enrolled-course system. A student should be able to enter the platform, choose any available grade, browse its CT & AI content, open an activity, and practice without first creating an account.

The student is not required to select or declare their actual school grade. A student may explore a lower or higher grade when the content is available.

The primary public learning flow is:

```text
Choose Class
    ↓
Choose Domain / Topic
    ↓
Learn
    ↓
Interactive Activity
    ↓
Practice Questions
    ↓
Result / Feedback
```

### Access modes

**Explore / Practice**
- No login required.
- Browse Classes 3–8.
- Open public learning experiences.
- Attempt activities and questions.
- Share direct activity/test links.

**My Progress**
- Login is optional for basic learning.
- A student account enables saved progress, history, assignments and teacher-class participation.

Login should therefore be a way to unlock persistence and additional features, not a barrier to learning.

### Grade selection

The UI may present Classes 3–8 even when some grades are not yet fully published. Unavailable grades can be marked as coming soon rather than requiring a different application architecture.

Grade is a **curriculum mapping**, not a hard-coded behaviour switch. An activity may eventually be mapped to one or more grades when the curriculum supports it.

## 3.3 Business validation goal

The initial product should validate:

> Will students actually use an interactive CT/AI experience after discovering it through a YouTube video?

The first experiment is intentionally small:

**YouTube Caesar Cipher video → interactive web activity → practice → result**

Only after usage is demonstrated should more content be produced.

---

# 4. Non-Goals

The current product will NOT initially:

- cover NEET/JEE preparation
- become a general-purpose competitive-exam platform
- become a generic AI tutor
- provide unrestricted AI chat for children
- depend on expensive AI APIs
- recreate every CBSE textbook page
- attempt to replace classroom teachers
- build Class 9/10 content before official curriculum material is available
- implement a separate parent account
- implement a complicated school ERP
- implement a full LMS in the MVP
- build native Android/iOS apps initially

---

# 5. Target Users

## 5.1 Student

Primary learner.

The student can:

- browse available content
- learn a concept
- perform interactive activities
- answer questions
- retry activities
- use hints
- view their own progress
- join a teacher's class/test using a shared code/link
- complete assigned activities/tests

## 5.2 Teacher

Teacher can:

- create/manage a class
- add students through a class code/link
- assign activities
- create test series
- share assignment/test links
- view submissions
- view student progress
- identify strengths and weak areas
- review project/assignment work
- provide teacher feedback

## 5.3 Parent

There is **no separate parent account in the initial product**.

A parent can use the student's account and open a clearly separated parent/progress section.

The parent view should focus on:

- completed activities
- scores
- progress
- areas needing practice
- recent activity

Do not introduce a separate parent authentication flow unless a future product requirement justifies it.

---

# 6. Core Product Philosophy

## 6.1 Learning experience over question bank

The fundamental content object is a **Learning Experience**, not just a Question.

Supported experience categories may include:

```text
lesson
activity
puzzle
simulation
question
assessment
assignment
project
scenario
```

A question is one type of learning experience.

## 6.2 Thinking before correctness

The handbooks explicitly encourage students to think independently, try different approaches and discuss reasoning.

Therefore the platform should not immediately reveal the answer after every failed attempt.

A preferred interaction pattern is:

```text
Try
 ↓
Feedback
 ↓
Hint (optional)
 ↓
Retry
 ↓
Success
 ↓
Explanation / reflection
```

## 6.3 Activity before question where appropriate

If the handbook recommends an activity before the questions, the digital learning flow should preserve that intent.

Example:

```text
Explore Caesar Cipher
        ↓
Try encoding
        ↓
Try decoding
        ↓
Understand shift
        ↓
Practice questions
```

---

# 7. Curriculum Model

The curriculum hierarchy should be data-driven.

```text
Curriculum
 └── Grade
      └── Domain
           └── Unit
                └── Learning Objective
                     └── Learning Experience
```

### Domain

The top-level domains are:

```text
Computational Thinking
Artificial Intelligence
```

### Example

```text
Grade 3
 └── Computational Thinking
      └── Unit
           └── Learning Objective
                └── Caesar Cipher Activity
```

The actual unit/chapter names and learning objectives must be entered from the official handbook rather than invented by developers.

---

# 8. CT & AI Competency Model

The competency system should be generic enough to support Classes 3–8.

Potential CT competencies:

```text
Decomposition
Pattern Recognition
Abstraction
Algorithmic Thinking
Data Representation
Generalisation
Logical Reasoning
Spatial / Visual Reasoning
Problem Solving
Troubleshooting
```

Potential AI competencies:

```text
AI Concepts
Data Literacy
AI Domains
Prediction
Classification
Regression
Clustering
Data Visualisation
AI Applications
Bias and Fairness
Privacy
Responsible AI
Digital Citizenship
```

Not every grade must expose every competency.

Competencies should be mapped to activities based on the official handbook learning outcomes.

Do not create a fake numerical "intelligence score".

The system should report demonstrated competencies based on completed activities and assessments.

---

# 9. Activity Engine

The Activity Engine is the most important reusable technical component.

The UI/logic for an activity type should be implemented once and reused across many pieces of content.

Possible activity types:

```text
Question
MCQ
Puzzle
Pattern
Grid
Cipher
Sorting
Search
Spatial Manipulation
Representation / Transformation
Logic / Boolean
Simulation
Classification
Regression
Clustering
Data Explorer
Chart Builder
AI Model Simulator
Scenario / Case Study
Ethics Decision
Project
```

This is a catalogue, not an MVP implementation list.

Only implement an activity type when actual curriculum content requires it.

---

# 10. Activity Architecture

An activity should consist of:

```text
Activity Definition
 ├── metadata
 ├── curriculum mapping
 ├── learning objective
 ├── competency mapping
 ├── activity type
 ├── configuration
 ├── interaction rules
 ├── validation rules
 ├── feedback
 ├── hints
 ├── scoring
 └── analytics configuration
```

Example conceptual structure:

```json
{
  "type": "cipher",
  "version": 1,
  "title": "Caesar Cipher",
  "grade": 3,
  "domain": "computational-thinking",
  "objectiveIds": ["..."],
  "competencyIds": ["algorithmic-thinking"],
  "config": {
    "alphabet": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "minShift": 1,
    "maxShift": 25
  }
}
```

The actual runtime UI is implemented by a React component associated with the activity type.

---

# 11. Content vs Code

Do NOT create one custom HTML/React implementation for every question.

Instead:

### Content lives as data

Examples:

- title
- instructions
- questions
- answers
- hints
- explanations
- activity configuration
- curriculum mappings

### Activity behaviour lives in code

Examples:

- Caesar cipher engine
- grid engine
- sorting engine
- classification simulator
- chart builder

This gives us:

```text
Many activities
      ↓
Few reusable activity engines
```

This is essential for a one-person development team.

---

# 12. Student Experience

## 12.1 Public Home / Explore

The public home should first help a student start learning, not force account creation.

```text
Choose your class

[Class 3] [Class 4] [Class 5] [Class 6] [Class 7] [Class 8]

Then choose:
[Computational Thinking] [Artificial Intelligence]
```

A student can explore any available grade. The interface should not assume that the selected grade is necessarily the student's enrolled school grade.

After selecting a grade/domain, show the available learning experiences and allow direct practice.

## 12.2 Activity page

```text
Title
Short explanation
Interactive area
Instructions
Hint
Check
Retry
Explanation
Practice
Result
```

## 12.3 Progress

Progress is optional for anonymous learners and persistent for logged-in students.

Anonymous learners can see the current activity result. Logged-in students can save activity attempts and view progress across sessions/devices.

Avoid a complex dashboard for younger students.

## 12.2 Activity page

```text
Title
Short explanation
Interactive area
Instructions
Hint
Check
Retry
Explanation
```

## 12.3 Progress

Progress should be understandable to children.

For Classes 3–5:

- completed
- practice more
- score
- badges/milestones where useful

For Classes 6–8:

- competency progress can become more detailed.

Do not expose complicated analytics terminology to younger students.

---

# 13. Parent View

Parent view is a section within the student's account.

Example:

```text
Parent / Progress View

Activities completed: 18
Practice sessions: 24

Strong areas:
- Pattern recognition
- Algorithmic thinking

Needs practice:
- Spatial reasoning

Recent activity:
- Caesar Cipher: 92%
- Grid Puzzle: 80%
```

No separate parent login in MVP.

No public ranking.

No comparison with other children unless explicitly designed later and appropriate.

---

# 14. Teacher Experience

Teacher dashboard:

```text
Teacher
 ├── Classes
 ├── Activities
 ├── Assignments
 ├── Test Series
 ├── Students
 └── Progress
```

## 14.1 Class

A teacher can create a class:

```text
Class 3A
Invite code: ABC123
```

Students join using the code.

## 14.2 Assignment

Teacher selects:

```text
Activity
or
Test Series
```

and generates a shareable link.

Example:

```text
/test/abc123
```

The link should work well when shared through WhatsApp.

## 14.3 Student progress

Teacher should be able to see:

```text
Student
Completed
Score
Attempts
Weak competencies
Last activity
```

Aggregate class view:

```text
Class 3A

Pattern Recognition      Strong
Algorithmic Thinking     Medium
Spatial Reasoning        Needs Practice
```

---

# 15. Test Series

Test Series is an important future feature but should use the same content/assessment engine.

```text
Test Series
 ├── title
 ├── grade
 ├── curriculum mappings
 ├── questions/activities
 ├── duration (optional)
 ├── attempts allowed
 ├── start/end dates (optional)
 └── assignment settings
```

A teacher should be able to:

1. create/select questions
2. publish test
3. generate share link
4. share in WhatsApp/school communication system
5. students submit
6. teacher sees results

The test engine should not require a separate activity engine.

---

# 16. Assessment Model

Assessment should support more than correctness.

Possible metrics:

```text
score
attempts
timeSpent
hintsUsed
completed
retries
```

Where useful, an activity can report:

```text
competencyEvidence
```

Example:

```json
{
  "competency": "algorithmic-thinking",
  "evidence": {
    "success": true,
    "attempts": 2,
    "hintsUsed": 1
  }
}
```

Do not claim that this is a scientifically validated measure of a child's ability.

It is an internal learning-progress indicator.

---

# 17. Analytics Strategy

## 17.1 Do not use Segment initially

For a one-person project, Segment adds infrastructure and operational complexity that is unnecessary for the MVP.

Use:

1. **Vercel Analytics / equivalent basic traffic analytics** for high-level website traffic where available.
2. A small **first-party event API** for product-specific learning events.

Example:

```text
POST /api/events
```

Event:

```json
{
  "event": "activity_completed",
  "activityId": "caesar-cipher-001",
  "attemptId": "...",
  "sessionId": "...",
  "metadata": {
    "score": 92,
    "attempts": 2,
    "hintsUsed": 1
  }
}
```

## 17.2 Important events

Start with:

```text
page_view
activity_started
activity_completed
activity_failed
hint_used
activity_retried
test_started
test_submitted
assignment_opened
assignment_submitted
student_joined_class
teacher_created_test
```

Do not track every mouse movement or keystroke.

Track events that answer product questions.

---

# 18. Measuring Visitors and Returning Users

Use two separate concepts.

### Anonymous website visitor

A browser/session-level identifier can be used before login.

```text
visitorId
```

Store a random first-party identifier in a cookie/local storage where appropriate.

Do not use email or personal information as the visitor identifier.

### Logged-in student

Use:

```text
studentId
```

for product activity tracking.

### Returning user

A returning user is someone who has previously visited/used the product and comes back in a later session or visit window.

The product should measure:

```text
new visitors
returning visitors
new students
returning students
active students
activity completion rate
```

The exact retention windows can be defined later:

```text
D1
D7
D30
```

For the MVP, simply recording session/visit timestamps is enough.

---

# 19. Analytics Privacy Principles

Because the product is intended for school-age students:

- collect the minimum data required
- avoid unnecessary personal information
- do not collect precise location
- do not collect contacts
- do not expose student data publicly
- do not build public leaderboards in MVP
- avoid advertising/tracking SDKs
- do not send child activity data to third-party analytics platforms unnecessarily
- keep product analytics first-party where practical

Any production deployment should separately review applicable privacy, child-safety, consent, school-data and data-retention requirements before collecting identifiable student information.

---

# 20. Authentication

The platform has two roles:

```text
STUDENT
TEACHER
```

No parent role initially.

### Student

A student account should require minimal information.

Recommended initial fields:

```text
studentId
displayName
username/auth credential
grade
createdAt
```

Avoid requiring phone number, address, date of birth, etc.

### Teacher

Recommended:

```text
teacherId
name
email
credential
createdAt
```

Authentication implementation can start simple and be replaced/extended later without changing curriculum/content models.

---

# 21. Classroom Model

```text
Teacher
   │
   └── Class
        │
        ├── Student
        ├── Student
        └── Student
```

A student may eventually belong to multiple classes.

Do not embed the full student object inside the class document.

Use references/IDs.

---

# 22. Suggested MongoDB Collections

Initial logical model:

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
activities
activityVersions

assignments
tests
testQuestions
submissions

activityAttempts
progress

analyticsEvents
```

This can be simplified during MVP.

### MVP minimum

```text
users
learningExperiences
activityAttempts
analyticsEvents
```

Add teacher/class/test collections only when those features are implemented.

Do not build the complete database before validating the first activity.

---

# 23. Content Versioning

Curriculum content must be versioned.

Example:

```text
curriculumVersion: "CBSE-2026-27"
```

Activity:

```text
activityVersion: 1
```

If an activity changes later:

```text
activityVersion: 2
```

Existing attempt records should retain the version used by the student.

This matters because CBSE content may be revised.

---

# 24. Curriculum Source Tracking

Every curriculum item should optionally store:

```text
sourceDocument
sourcePage
sourceSection
sourceType
```

Example:

```json
{
  "sourceDocument": "CTAI_Pri3SH_2026-27.pdf",
  "sourceSection": "Activity Time",
  "sourcePage": 12
}
```

This is important for content maintenance and verification.

The platform should never silently claim that developer-created material is official CBSE wording.

---

# 25. Teacher Content vs Student Content

Maintain separate content representations.

## Student content

Designed for:

- simple instructions
- exploration
- hints
- feedback
- age-appropriate explanations
- practice

## Teacher content

Designed for:

- learning objective
- preparation
- activity setup
- facilitation prompts
- expected observations
- common misconceptions
- discussion questions
- solution/explanation
- assessment guidance
- extension activities

The same learning experience can reference both.

```text
Learning Experience
 ├── Student Content
 └── Teacher Guide
```

---

# 26. AI Features

AI should NOT be required for the core learning experience.

For example:

### Classification

Use a deterministic/simplified browser simulation.

### Regression

Use a simple mathematical model.

### Clustering

Use a lightweight client-side implementation.

### Bias

Use predefined datasets/scenarios.

### AI project lifecycle

Use a simulation.

This keeps the product:

- cheap
- predictable
- fast
- safe
- independent of AI API costs

Actual generative AI can be introduced later for carefully controlled use cases.

---

# 27. Future AI-Generated Content

A future system may generate:

- practice questions
- test variants
- hints
- explanations
- teacher drafts

But AI-generated content must not automatically become published curriculum content.

Future workflow:

```text
AI generates draft
      ↓
Validation
      ↓
Teacher/content review
      ↓
Publish
```

For CBSE-aligned content, human review is mandatory before publication.

---

# 28. YouTube-to-Learning Funnel

The content strategy is closely connected to YouTube.

Example:

```text
YouTube
  ↓
Explain concept
  ↓
Show interactive simulation
  ↓
Link to web activity
  ↓
Student practices
  ↓
Student creates account (optional initially)
  ↓
Progress saved
  ↓
More activities
```

Each video should ideally have one clear corresponding interactive activity.

Example:

```text
Video:
"Caesar Cipher Explained"

CTA:
"Try the Caesar Cipher yourself"

Link:
yourdomain.com/activity/caesar-cipher
```

---

# 29. MVP Definition

## MVP objective

Validate whether students will use an interactive CBSE CT learning experience after watching a video.

## MVP activity

**Class 3 — Caesar Cipher**

### Student flow

```text
Landing page
 ↓
Short explanation
 ↓
Interactive Caesar Cipher wheel/simulation
 ↓
Encode a message
 ↓
Decode a message
 ↓
Challenge
 ↓
Score/result
```

### Required functionality

- responsive UI
- tablet support
- desktop support
- Caesar cipher simulation
- configurable shift
- encode/decode
- practice questions
- hints
- immediate feedback
- score
- basic anonymous activity analytics
- shareable URL

### Not required for first MVP

- teacher login
- parent login
- full student dashboard
- MongoDB
- test series
- subscriptions
- payments
- AI generation
- complex competency analytics

The MVP should work even without an account.

---

# 30. MVP Success Metrics

The first release should answer:

### Discovery

- How many visitors arrive from YouTube?

### Engagement

- How many start the activity?
- How many complete it?
- How many retry?

### Learning interaction

- Average attempts
- Hint usage
- Completion rate
- Average time spent

### Return

- How many visitors return?
- How many students return to the activity?

### Conversion

Later:

- account creation
- teacher class joins
- paid subscription

Do not optimise for revenue before establishing engagement.

---

# 31. Recommended Technical Architecture

```text
                     Vercel
                       │
                    Next.js
                       │
          ┌────────────┴────────────┐
          │                         │
       Web UI                 API Routes
          │                         │
          │                  ┌──────┴──────┐
          │                  │             │
          │              MongoDB       Event API
          │
          └── Activity Engine
                 │
       ┌─────────┼─────────┐
       │         │         │
    Cipher     Grid     Simulation
```

Use TypeScript throughout.

---

# 32. Next.js Structure

Suggested conceptual structure:

```text
src/
  app/
    (public)/
    activities/
    learn/
    student/
    teacher/
    api/
      events/
      attempts/

  components/
    activity/
    ui/
    student/
    teacher/

  features/
    curriculum/
    activities/
    assessments/
    analytics/
    authentication/
    progress/

  lib/
    db/
    auth/
    analytics/
    validation/

  activity-engine/
    registry.ts
    types.ts
    cipher/
    puzzle/
    simulation/
```

The exact folder structure can be adjusted by the implementation agent.

---

# 33. Activity Registry

Use a registry rather than large conditional statements.

Conceptually:

```ts
registerActivity("cipher", CipherActivity);
registerActivity("grid", GridActivity);
registerActivity("classification", ClassificationActivity);
```

Then:

```text
activity.type
     ↓
registry
     ↓
React activity component
```

This allows new activity types to be added without rewriting the content system.

---

# 34. Rendering Strategy

Use server rendering/static rendering where useful for content pages.

Interactive activities run on the client.

Prefer:

```text
Content page → server rendered
Activity → client component
```

This keeps pages fast and SEO-friendly.

---

# 35. Performance Requirements

Target:

- fast initial page load
- mobile/tablet friendly
- no large JavaScript bundle for simple content
- lazy-load complex simulations
- avoid unnecessary third-party scripts
- cache static curriculum content
- optimise images
- minimise API calls

The platform should work comfortably on:

- Android tablets
- desktop browsers
- laptops
- modern mobile browsers

---

# 36. Responsive Design

Priority devices:

1. Tablet
2. Desktop/laptop
3. Mobile

The Samsung Galaxy Tab/S6 Lite class of device should be considered a useful reference device for interactive activities because handwriting/stylus interaction may be valuable for future activities.

Do not make stylus input a requirement for the MVP.

---

# 37. Accessibility

Activities should support:

- readable text
- sufficient contrast
- keyboard navigation where practical
- clear instructions
- non-colour-only indicators
- accessible buttons
- responsive layouts
- screen-reader-friendly basic content

Interactive simulations should have a non-interactive explanation/fallback where practical.

---

# 38. Security

Minimum requirements:

- server-side authorization checks
- validate all user input
- never trust client-provided scores
- calculate important assessment results server-side where persistence matters
- protect teacher/student data
- rate-limit public event endpoints
- avoid exposing internal IDs unnecessarily
- secure authentication credentials
- restrict teacher data to their classes
- restrict student data to their own records

---

# 39. Analytics Event Design

All product events should have a common envelope.

Example:

```json
{
  "event": "activity_completed",
  "eventVersion": 1,
  "timestamp": "...",
  "sessionId": "...",
  "visitorId": "...",
  "userId": null,
  "activityId": "...",
  "metadata": {}
}
```

Do not put unnecessary personal information in analytics metadata.

---

# 40. Progress Calculation

Progress should be derived from evidence rather than a manually maintained percentage wherever possible.

Possible activity evidence:

```text
completed
score
attempts
hints
time
competencies
```

A simple initial competency model can be:

```text
Not started
Practicing
Demonstrated
```

Avoid overly precise values such as:

```text
Algorithmic Thinking = 73.428%
```

unless there is a meaningful scoring methodology behind them.

---

# 41. Teacher Weakness Detection

The first teacher version should use simple signals.

Example:

```text
Needs Practice if:
- low score across multiple activities
OR
- repeated failures
OR
- high hint usage
OR
- incomplete assigned activities
```

Do not claim a student has a learning disorder or any clinical/psychological condition.

Use neutral wording:

> "Needs more practice with this skill."

---

# 42. Subscription Model

The long-term hypothesis is:

> **₹100 per student per year**

with a target of approximately:

> **10,000 paying students**

Potential annual gross revenue at that target:

```text
10,000 × ₹100 = ₹10,00,000/year
```

This is a business hypothesis, not an assumption of guaranteed demand.

The product should first validate:

1. engagement
2. repeat usage
3. teacher adoption
4. willingness to pay

Payments are out of the MVP.

---

# 43. Teacher/Coaching Expansion

The platform should support teachers and coaching classes without changing the core activity model.

Future:

```text
Teacher
 ├── School Class
 ├── Coaching Batch
 └── Independent Students
```

A coaching teacher can create:

```text
Test Series
Assignment
Practice Set
```

and share a link.

This is a future extension, not an MVP requirement.

---

# 44. Project Model

Classes 6–8 include interdisciplinary projects.

The platform should eventually support:

```text
Project
 ├── Problem
 ├── Objectives
 ├── Instructions
 ├── Steps
 ├── Resources
 ├── Student submission
 ├── Reflection
 ├── Teacher rubric
 └── Feedback
```

Projects should not be reduced to MCQs.

---

# 45. Content Authoring

Do not require developers to edit React components to create ordinary content.

Long-term content authoring should allow:

```text
Create Learning Experience
 ↓
Select grade
 ↓
Select domain
 ↓
Select unit
 ↓
Select objective
 ↓
Select activity type
 ↓
Configure content
 ↓
Preview
 ↓
Publish
```

For the first stage, content can be stored as JSON/TypeScript seed data.

A CMS/admin interface can be added later.

---

# 46. Content Quality Workflow

For each new activity:

```text
CBSE source
 ↓
Identify objective
 ↓
Identify competency
 ↓
Design learning experience
 ↓
Create student content
 ↓
Create teacher guide
 ↓
Implement activity
 ↓
Test correctness
 ↓
Age-appropriateness review
 ↓
Publish
```

Do not create content solely because it is technically interesting.

It must have a clear learning purpose.

---

# 47. Source Fidelity

The platform should distinguish:

### Official curriculum content

Directly based on CBSE handbook material.

### Platform-created activity

An original interactive representation of the concept.

### Platform-created extension

Additional practice inspired by the concept.

Example:

```text
Official concept:
Caesar Cipher

Platform activity:
Interactive Caesar Cipher wheel

Extension:
Decode progressively harder messages
```

Do not present platform-created explanations as official CBSE text.

---

# 48. Intellectual Property / Content Policy

Do not copy entire CBSE handbook pages into the application.

Instead:

- reference curriculum concepts
- create original explanations
- create original interactive implementations
- use official terminology where necessary
- maintain source references internally

Any reproduction of copyrighted material should be reviewed before publication.

---

# 49. Testing Strategy

## Unit tests

For:

- cipher algorithms
- scoring
- validation
- progress calculations
- event generation

## Component tests

For:

- activity UI
- answer submission
- feedback
- retry

## End-to-end tests

For:

```text
Open activity
→ interact
→ complete
→ score
→ analytics event
```

Teacher workflows can be added later.

---

# 50. MVP Acceptance Criteria

The Caesar Cipher MVP is complete when:

- [ ] A public activity URL exists.
- [ ] Page loads correctly on desktop.
- [ ] Page works on tablet.
- [ ] Student can select/change shift.
- [ ] Student can encode text.
- [ ] Student can decode text.
- [ ] Student receives immediate feedback.
- [ ] Student can retry.
- [ ] Student can complete a challenge.
- [ ] Score/result is displayed.
- [ ] Basic activity events are recorded.
- [ ] No account is required to try the activity.
- [ ] Activity is usable from a YouTube link.
- [ ] No unnecessary paid service is required.
- [ ] Core activity logic has automated tests.

---

# 51. Development Phases

## Phase 0 — Product foundation

- repository
- Next.js
- TypeScript
- UI foundation
- deployment
- basic analytics
- activity registry

## Phase 1 — Caesar Cipher

- activity engine
- cipher logic
- UI
- practice
- scoring
- analytics

## Phase 2 — Validate

Publish:

```text
YouTube video
+
activity URL
```

Measure usage.

Do not immediately build dozens of activities.

## Phase 3 — Student accounts

If repeat usage is demonstrated:

- authentication
- saved attempts
- progress
- student dashboard

## Phase 4 — Teacher

- teacher authentication
- classes
- student enrollment
- assignment
- test series
- results

## Phase 5 — Class 3 content expansion

Add the highest-value interactive experiences from the Class 3 handbook.

## Phase 6 — Classes 4–5

Expand the activity library.

## Phase 7 — Classes 6–8

Introduce:

- data activities
- AI simulations
- classification
- regression
- clustering
- data visualisation
- bias/fairness
- responsible AI
- AI project lifecycle
- project submissions

## Phase 8 — Curriculum expansion

When official Class 9/10 CT & AI curriculum/modules are available:

```text
Review
 ↓
Map
 ↓
Design
 ↓
Implement
```

Do not assume continuity without reviewing the official material.

---

# 52. MVP Activity Example — Caesar Cipher

## Learning objective

Help students understand that a cipher can transform a message using a key/shift and that the receiver needs the key to decode it.

## Core interaction

```text
Plain Text
    ↓
Shift
    ↓
Encrypted Text
```

and:

```text
Encrypted Text
    ↓
Shift
    ↓
Plain Text
```

## Suggested stages

### Stage 1

Visual alphabet wheel.

### Stage 2

Encode a simple word.

### Stage 3

Decode a message.

### Stage 4

Find the missing shift.

### Stage 5

Challenge.

The activity should prioritise discovery and interaction over a long textual explanation.

---

# 53. Future Activity Examples

These are examples of product direction, not commitments to exact implementation.

### Class 3

- Caesar Cipher
- patterns
- grids
- sequencing
- decomposition puzzles

### Class 4–5

- sorting
- pathfinding
- constraints
- search
- optimisation
- visual reasoning

### Class 6

- AI vs automation
- data/pattern activities
- introductory AI concepts
- simple prediction
- ethics

### Class 7

- classification
- regression
- clustering
- data visualisation
- AI domains
- bias/fairness
- digital citizenship

### Class 8

- AI project lifecycle
- no-code AI concepts
- model testing
- data quality
- data fairness
- bias
- responsible AI
- AI application scenarios

These must always be mapped back to the official curriculum before implementation.

---

# 54. Architecture Principle for Future Expansion

The system should follow:

> **Generic engine, curriculum-specific content.**

Do not create:

```text
if grade === 3 ...
if grade === 4 ...
if grade === 5 ...
```

throughout the application.

Instead:

```text
Curriculum data
+
Activity engine
+
Assessment engine
+
Progress engine
```

The grade should primarily be content/configuration.

---

# 55. What Must Remain Simple

Because this is a one-person project:

Avoid premature infrastructure.

Do not start with:

- microservices
- Kafka
- Redis
- Kubernetes
- separate analytics service
- event streaming infrastructure
- complex CMS
- AI orchestration service
- native mobile applications

Start with:

```text
Next.js
+
Vercel
+
MongoDB when needed
+
First-party event API
```

Move to more infrastructure only when actual usage requires it.

---

# 56. Definition of Done for Product Architecture

The architecture is considered ready when:

- curriculum is data-driven
- activity types are reusable
- student/teacher content is separated
- activities are versioned
- source references can be stored
- attempts are persistent
- analytics events are standardised
- teacher assignments can reference activities
- test series can reuse the assessment engine
- new grades can be added without code restructuring
- Class 9/10 can be added later without assuming today's unknown curriculum

---

# 57. Final Product Direction

The platform should be thought of as:

> **An interactive CBSE CT & AI learning lab for Classes 3–8.**

Not:

> a question bank

Not:

> a generic AI chatbot

Not:

> a conventional LMS

Not:

> an exam-preparation platform

The core differentiator is:

```text
CBSE concept
     ↓
Interactive experience
     ↓
Student experimentation
     ↓
Practice
     ↓
Assessment
     ↓
Teacher insight
```

---

# 58. Product North Star

The long-term goal is:

> A student should be able to learn a CT or AI concept by **doing something**, not merely reading about it or selecting an answer.

For the teacher:

> A teacher should be able to assign that experience with a link and understand which students need more practice.

For the parent:

> A parent should be able to see meaningful progress without needing another complicated account.

For the product:

> Every new activity should reuse the same curriculum, activity, assessment and analytics infrastructure.

---

# 59. Current Decision Log

| Decision | Decision |
|---|---|
| Current curriculum | CBSE Classes 3–8 |
| Future Class 9/10 | Add only after official curriculum is available/reviewed |
| Product focus | CT & AI |
| NEET/JEE | Out of scope |
| Primary users | Student + Teacher |
| Parent account | No separate account initially |
| Parent progress | Accessible from student account |
| Initial platform | Web |
| Framework | Next.js + TypeScript |
| Deployment | Vercel |
| Database | MongoDB when persistent data is required |
| Analytics | First-party events + basic traffic analytics |
| Segment | Not required for MVP |
| Content storage | Data-driven |
| Activity implementation | Reusable activity engine |
| Teacher content | Separate from student content |
| Test series | Future feature |
| AI-generated questions | Future feature, human review required |
| Public learning model | Open learning library for Classes 3–8 |
| Grade selection | Student may freely explore any available grade |
| Public activities | No account required |
| Persistent progress | Account required |
| MVP | Class 3 Caesar Cipher |
| MVP account requirement | No account required |
| Initial business investment | Domain + development/content time |
| Architecture style | Modular monolith, not microservices |
| Mobile app | Future |
| Class 9/10 architecture | Supported generically, content deferred |

---

# 60. Immediate Next Step

The platform is designed as a Classes 3–8 learning library, but implementation remains incremental. The first release is a vertical slice of that platform.

Build the first slice as:

```text
Next.js
  ↓
Activity Engine
  ↓
Cipher Activity
  ↓
Basic Event Tracking
  ↓
Vercel
  ↓
YouTube
```

Then validate the real-world behaviour.

If students actually use the Caesar Cipher activity, the next step is **not automatically "build 20 more activities."**

First analyse:

- where students drop off
- whether they retry
- whether they finish
- whether they return
- which interaction they enjoy
- whether teachers find it useful

Then expand the product based on evidence.

---

## Appendix A — Curriculum Design Principles

The official handbooks provide a consistent progression:

```text
Classes 3–5
Basic CT
 ↓
Classes 6–8
Advanced CT + AI
```

CT is presented as a foundation for AI. The curriculum progressively develops decomposition, pattern recognition, abstraction, algorithms and related reasoning before moving into more explicit AI concepts.

The middle-stage handbooks explicitly describe activity-based, experiential, collaborative, inquiry-based and ethical learning approaches.

---

## Appendix B — Important Product Rule

> **Do not confuse curriculum coverage with product value.**

Having every handbook question online would technically provide high coverage but would not necessarily create a useful product.

The product value should come from:

```text
Good curriculum mapping
+
Good interaction design
+
Good feedback
+
Good practice
+
Useful teacher insight
```

That is the core of the product.

---

## Appendix C — Future Architecture

The eventual platform can grow toward:

```text
                         CT & AI LAB
                              │
              ┌───────────────┴───────────────┐
              │                               │
       Computational Thinking          Artificial Intelligence
              │                               │
        Learning Experiences            Learning Experiences
              │                               │
              └───────────────┬───────────────┘
                              │
                      Activity Engine
                              │
                ┌─────────────┼─────────────┐
                │             │             │
             Student       Teacher        Assessment
                │             │             │
                └─────────────┼─────────────┘
                              │
                         Progress Data
                              │
                           Analytics
```

The architecture should remain simple until actual scale justifies additional infrastructure.
