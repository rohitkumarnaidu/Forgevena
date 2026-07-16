# Markdown Quality Report

Markdownlint applies the repository policy in `.markdownlint-cli2.jsonc`. The source validator checks heading progression, duplicate anchors, local references, required website features, and Mermaid block discovery. CI uses a workspace-isolated Puppeteer cache, an exact Chrome Headless Shell revision, and Mermaid CLI 11.16.0 to render every extracted diagram. Strict MkDocs builds validate navigation and page rendering.

Long-line enforcement is disabled for tables, URLs, and command examples. Inline HTML is allowed for existing documentation compatibility.
