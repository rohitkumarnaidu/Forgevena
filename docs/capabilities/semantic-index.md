# Semantic Index

Forgevena provides an optional provider-backed embedding index for project metadata. It is disabled by default and never stores source content or credentials.

## Safety model

- Only explicitly approved metadata fields are embedded: `path`, `kind`, `symbols`, and `relationships`.
- `path` is mandatory so results remain traceable to local project files.
- OpenAI and Gemini operations require explicit external-operation consent.
- Ollama uses the configured local `OLLAMA_HOST`, defaulting to `http://127.0.0.1:11434`.
- The persisted semantic index contains approved metadata and numeric embedding vectors only.
- Queries require preview and approval because the query text is sent to the selected embedding provider.

## Providers

| Provider | Default model | Endpoint |
|---|---|---|
| OpenAI | `text-embedding-3-small` | `POST /v1/embeddings` |
| Gemini | `gemini-embedding-001` | `models.batchEmbedContents` |
| Ollama | `embeddinggemma` | `POST /api/embed` |

## Workflow

```powershell
forgevena semantic configure --enabled true --provider ollama --model embeddinggemma --metadata path,kind,symbols --apply
forgevena index build --apply
forgevena semantic plan --action build
forgevena semantic build --dry-run
forgevena semantic build --apply --yes
forgevena semantic query "provider adapter" --dry-run
forgevena semantic query "provider adapter" --apply --yes
forgevena semantic status
```

Configure OpenAI or Gemini credentials through the existing credential workflow before selecting those providers. Provider errors are reported without including credential values or response bodies.
