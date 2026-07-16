# Contributing

Use focused changes that preserve additive safety, explicit consent, secret isolation, and backward compatibility. New platform layers require an approved ADR. Do not commit credentials, generated local state, caches, logs, backups, or packaged archives.

Before submitting changes, run:

```powershell
npm test
npm run release:verify
npm pack --dry-run
```

Document requirements, architecture impact, tests, security implications, performance implications, and user-facing changes.
