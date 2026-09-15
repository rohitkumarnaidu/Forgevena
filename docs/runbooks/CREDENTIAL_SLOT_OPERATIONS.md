# Credential Slot Operations

## Purpose

Operate provider credential slots without displaying, exporting, or logging their values. This runbook applies to managed local and encrypted slots only.

## Inspect

```powershell
forgevena credentials keys gemini
```

The result contains slot identifiers, active state, storage mode, validation and recovery metadata, plus bounded metadata-only audit events. It never contains a key value.

## Add or rotate

Preview first, then apply. Values are requested through a masked prompt.

```powershell
forgevena credentials configure gemini --key-id work --storage encrypted --dry-run
forgevena credentials configure gemini --key-id work --storage encrypted --apply
forgevena credentials rotate gemini --key-id work --apply
```

`primary` is the legacy-compatible default. Suggested additional IDs are `personal`, `work`, and `staging`; custom IDs use lowercase letters, numbers, and hyphens.

## Activate

```powershell
forgevena credentials activate gemini --key-id work --apply
```

Activation is explicit and audited. A process-environment key takes precedence but remains owned by the environment and cannot be changed through Forgevena.

## Quarantine and recovery

```powershell
forgevena credentials remove gemini --key-id work --next-key-id primary --apply
forgevena credentials recover gemini --key-id work --apply
```

Removal quarantines a managed value for 30 days. Removing an active slot requires an explicit replacement when another managed slot exists. Expired quarantine material is automatically removed and leaves only a metadata audit event.

## Incident response

If a credential may be exposed, revoke it at the provider first. Then quarantine or rotate the affected slot, activate a known-good replacement, validate the provider, and review only redacted diagnostics. Do not recover a suspected exposed value.

See [Security Guide](../security/guide.md), [Provider Configuration](../PROVIDER_CONFIGURATION.md), and [ADR 0023](../adr/0023-named-provider-credential-slots.md).
