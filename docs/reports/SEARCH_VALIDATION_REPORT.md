# Search Validation Report

MkDocs' built-in search plugin indexes all navigation and page content. CI fails unless `dist/docs-site/search/search_index.json` exists and is non-empty after a strict build.

Search highlighting, suggestions, and shareable query URLs are enabled. No hosted search account or API key is required.
