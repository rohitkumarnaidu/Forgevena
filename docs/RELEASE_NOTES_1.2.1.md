# Forgevena 1.2.1

Forgevena 1.2.1 is a backward-compatible reliability and security-maintenance release.

## Highlights

- Portable hosted validation across Windows, Ubuntu, and macOS with Node.js 20 and 22.
- Production documentation deployment through GitHub Pages and GitHub Actions.
- Explicit, preview-first schema-v1 vault migration with `--apply --yes`, encrypted backup retention, and immediate Argon2id/PBKDF2 schema-v2 re-encryption.
- Updated CodeQL, GitHub Actions, Docker publication, and MkDocs toolchain dependencies.
- Restored canonical generated CLI, provider, module, template, schema, registry, and template-package references.

## Compatibility

- No breaking CLI changes.
- `forgevena` remains the preferred executable.
- `ai-workspace` remains supported throughout the 1.x compatibility period.
- Existing `.ai-workspace/` project state paths remain unchanged.
- Existing source and project files remain additive-only and are never overwritten automatically.

## Upgrade

```powershell
npm install --global forgevena@1.2.1
forgevena version
forgevena doctor
```

Legacy encrypted vaults are not decrypted during normal reads. Preview and apply migration explicitly:

```powershell
forgevena vault migrate <credential>
forgevena vault migrate <credential> --apply --yes
```

Configure `AI_WORKSPACE_CREDENTIAL_KEY` through an approved OS credential store or secret manager before encrypted vault operations.
