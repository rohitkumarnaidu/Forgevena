# Risk Report

| ID | Risk | Likelihood | Impact | Priority | Current control |
| --- | --- | --- | --- | --- | --- |
| R-01 | AES key derivation uses a direct SHA-256 passphrase hash without salt or work factor. | Medium | High | P1 | Key is externally supplied and never stored. |
| R-02 | Credential rotation archives before replacement creation; an interrupted replacement can leave no active managed credential. | Low | High | P1 | Prior value remains archived and recoverable. |
| R-03 | Plain local credential backups copy plaintext into an ignored directory. | Medium | High | P1 | Backup output is labeled as secret-bearing and excluded from Git/package contents. |
| R-04 | Logging has no centralized recursive redaction; a future caller could pass sensitive fields. | Medium | High | P1 | Current callers intentionally pass metadata only. |
| R-05 | Safe import rejects sensitive key names but cannot prove a benignly named string does not contain a secret. | Low | High | P1 | Workspace-generated exports contain only controlled fields. |
| R-06 | Generic catch-and-default behavior may hide corrupted registry/configuration files. | Medium | Medium | P2 | Validation and tests cover normal structures. |
| R-07 | Provider retries could duplicate a request after an ambiguous network failure. | Low | Medium | P2 | Retries are bounded and only retry classified failures. |
| R-08 | Health summary counts optional unconfigured providers/clouds as attention items, potentially causing alert fatigue. | High | Low | P2 | Detailed section status explains each cause. |
| R-09 | Generic cloud preparation may be mistaken for production-ready provider configuration. | Medium | Medium | P2 | Documentation labels it preparation-only and disables automatic deployment. |
| R-10 | Third-party manual installers can change user-level agent state outside workspace rollback. | Medium | Medium | P2 | Scope, affected paths, consent, and upstream rollback are documented. |
| R-11 | Registry writes are not universally atomic and concurrent CLI processes could lose updates. | Low | High | P2 | Typical usage is single-user/sequential. |
| R-12 | Real provider/cloud contract changes can invalidate adapters between releases. | Medium | Medium | P2 | Capability checks, explicit errors, tests, and versioned release gates exist. |

No fixes were implemented during this audit stage.
