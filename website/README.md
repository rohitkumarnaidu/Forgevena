# Documentation Website

MkDocs Material was selected instead of Docusaurus because the platform already maintains a large Markdown-first documentation corpus, does not require a React/Node website runtime, and benefits from Material's built-in search, navigation, dark mode, Mermaid support, Git metadata, and Mike versioning.

## Local development

```powershell
python -m venv .venv-docs
.\.venv-docs\Scripts\Activate.ps1
pip install -r website/requirements.txt
mkdocs serve --config-file website/mkdocs.yml
```

Run `node scripts/validate-docs.js` before building. Strict production build: `mkdocs build --strict --config-file website/mkdocs.yml`.

## Versioning

```powershell
mike deploy --config-file website/mkdocs.yml --push --update-aliases 1.0 latest
mike set-default --config-file website/mkdocs.yml --push latest
```

Version publication modifies the `gh-pages` branch and therefore requires maintainer approval. GitHub Pages deployment from `main` is handled by `.github/workflows/pages.yml`.
