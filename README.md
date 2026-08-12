# CTAI Lab

Interactive CBSE Computational Thinking and Artificial Intelligence learning for Classes 3-8.

The first vertical slice is the Class 3 Caesar Cipher activity at:

```text
/activity/caesar-cipher
```

## Development

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm content:validate
```

## Architecture Notes

- Public learning works without login.
- Curriculum and activity content live as versioned data.
- Activity behavior lives in reusable engines.
- The Caesar Cipher algorithm is independent of React.
- Analytics use a first-party event envelope and avoid personal data.
- Curriculum and questions are stored in PostgreSQL through Prisma and authored as validated YAML.
- Authentication, teacher tools and saved progress are deferred until the content foundation is established.
