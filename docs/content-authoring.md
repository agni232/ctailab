# Content Authoring

CTAI Lab currently authors curriculum content as reviewed YAML files and publishes it to PostgreSQL and object storage. The future admin portal must use the same validation and application services rather than introducing a second content model.

## Commands

```bash
pnpm content:validate
pnpm content:sync -- --target=local
pnpm content:sync -- --target=production --confirm
```

Validation is offline and safe to run frequently. Synchronization requires the database and Storage environment variables. Production synchronization is always explicit and never runs during `next build`.

## Directory Structure

```text
content/
  cbse-ctai-2026-27/
    curriculum.yaml
    class-3/
      course.yaml
      chapters/
        01-whats-in-a-name/
          chapter.yaml
          topics.yaml
          activities/
          questions/
          question-sets/
          assets/
```

Each curriculum edition has its own courses and chapter order. Activities reference an existing activity-engine configuration or a validated JSON configuration.

## Question Identity

A question ID describes the question itself and must remain stable. A version changes only when the wording, renderer, options, answer, solution, or assets change.

```text
cube-combination-001-v1
cube-combination-001-v2
```

Handbook numbers belong to `question-set` items, not to questions:

```yaml
items:
  - questionId: cube-combination-001
    questionVersion: 1
    position: 10
    displayNumber: "10"
```

If the same question becomes Question 4 next year, the new edition places the same version at position 4. Published historical versions are immutable.

## Questions and Answers

The public question body, response configuration, answer key, and solution are stored separately. Initial renderer support includes:

- `single-choice-text`
- `single-choice-image`
- `multiple-choice-text`
- `multiple-choice-image`
- `number-sequence-pattern`
- `fill-in-blanks`
- `short-answer`

Difficulty is assigned through a course profile because a question can be easy for one class and medium for another. Questions may link to multiple topics, with exactly one primary topic in the authoring file.

## Assets

Question YAML declares logical asset references. Never place a Supabase URL in question content.

```yaml
assets:
  - ref: option-a
    file: assets/q010-option-a.png
    role: option
    visibility: public
    alt: Block shape shown in option A
```

The importer hashes each file, uploads it to `content-public` or `content-private`, and stores a provider-neutral location. Source scans, draft assets, answer keys, and solution images stay private. Handbook PDFs are provenance records only and are not uploaded automatically.

## Publishing Rules

- Run validation before synchronization.
- Never edit a published activity, question, or set version in place.
- Increase `version` when published content changes.
- Use stable lowercase kebab-case IDs.
- Keep answer and solution data out of public API projections.
- Do not manually delete production records through the importer.
