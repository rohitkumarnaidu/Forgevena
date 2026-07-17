# Prompts and Engineering Skills

Forgevena stores prompts and engineering skills as versioned, signed, non-executable assets. Every manifest contains provenance, declared variables, capabilities, platform compatibility, and an Ed25519 publisher signature.

Installation requires both a trusted publisher and an explicit allow decision from the active local organization policy. Unknown principals, absent policies, and implicit permissions fail closed.

```powershell
forgevena skills trust official --public-key-file .\official-public-key.pem --apply
forgevena skills verify .\secure-review.skill.json
forgevena skills install .\secure-review.skill.json --principal dev@example.com --dry-run
forgevena skills install .\secure-review.skill.json --principal dev@example.com --apply
forgevena skills list skill
forgevena skills status skill secure-review
forgevena skills remove skill secure-review --apply
```

Removal changes only the managed registry. Immutable signed package evidence remains cached for audit and rollback analysis. Asset content is never included in status output.
