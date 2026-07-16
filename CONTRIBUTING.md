# Contributing to Forgevena

Thank you for improving Forgevena. Contributions must preserve additive safety, explicit consent, secret isolation, backward compatibility, and the frozen 1.x architecture.

## Before opening an issue

- Search existing issues and discussions.
- Use Discussions for questions and early proposals.
- Use the bug template for reproducible defects.
- Never include credentials, private prompts, provider responses, or proprietary project data.

## Development

1. Fork the repository and create a focused branch.
2. Install Node.js 20.19 or newer and run `npm ci --ignore-scripts`.
3. Make the smallest coherent change.
4. Update tests and documentation in the same pull request.
5. Run:

```bash
npm test
npm run test:coverage
npm run release:verify
npm pack --dry-run
node scripts/validate-docs.js
```

## Pull requests

Describe requirements, architecture impact, security implications, performance implications, compatibility, tests, and documentation. Existing files must remain protected. New core abstractions require a demonstrated problem and an accepted ADR before implementation.

Use conventional commit-style subjects where practical: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `refactor:`, `security:`, or `chore:`.

## Review and release

Maintainers may request smaller commits, additional tests, security analysis, migration notes, or documentation. A merged change is not a release commitment. Releases follow the documented quality gates and semantic-versioning policy.
