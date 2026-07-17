# Versioned Template Packages

Template packages use `template.json` schema version 1 and keep their source assets beside the manifest.

Each package declares an id, semantic version, compatibility metadata, optional parent manifest, dependency-lock policy, and unique source-to-target asset mappings. Source paths cannot escape the package directory and project targets cannot be absolute or contain parent traversal.

Forgevena calculates SHA-256 integrity for every asset and rejects declared integrity mismatches. Child packages inherit parent assets and may replace an inherited target explicitly.

```powershell
forgevena templates catalog
forgevena templates export react --output .\template-packages
forgevena templates export react --output .\template-packages --apply
forgevena templates verify .\templates\example\template.json
forgevena templates inspect .\templates\example\template.json
forgevena templates test .\templates\example\template.json
```

Export is preview-first. `--apply` writes a package manifest and assets with exclusive-create semantics; existing files are reported as skipped and are never replaced. The exported package can be verified, inspected, and tested through the same package lifecycle as independently authored packages.

Built-in templates remain available during migration. The export command is the supported bridge from embedded templates to independently versioned local packages.

## Signed catalogs

Remote catalogs require HTTPS, an Ed25519 signature, and a publisher key explicitly trusted in the current workspace. Fetching is preview-first and requires external-action consent. Verified catalogs are cached immutably and can be revalidated offline against their recorded checksum and publisher signature.

```powershell
forgevena templates trust official --public-key-file .\official-public-key.pem --apply
forgevena templates fetch https://templates.example/catalog.json --dry-run
forgevena templates fetch https://templates.example/catalog.json --apply --yes
forgevena templates catalogs
forgevena templates verify-cache official
```

Catalogs contain metadata and signed HTTPS package references. Downloading and installing referenced packages remains a separate consent-gated lifecycle.
