# Third-Party Licenses

The distributed npm package uses `@node-rs/argon2` under the MIT license for the versioned credential-vault key-derivation path. Release engineering uses the development-only `@yao-pkg/pkg` tool under the MIT license to produce standalone executables. Exact transitive versions and integrity hashes are recorded in `package-lock.json` and release SBOM/provenance evidence.

Generated project templates reference third-party packages and container images. Their licenses apply only when an operator creates a template and installs or pulls those dependencies. Review generated manifests and lock files before distribution.

External integrations and provider services are not bundled. They remain governed by their upstream licenses and terms. See [Acknowledgements](ACKNOWLEDGEMENTS.md) and the generated dependency/license reports under `docs/v1/`.
