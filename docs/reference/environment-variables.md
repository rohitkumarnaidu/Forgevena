# Environment Variable Reference

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAI and optional Codex API access |
| `ANTHROPIC_API_KEY` | Claude API access |
| `GEMINI_API_KEY` | Gemini API access |
| `OPENROUTER_API_KEY` | OpenRouter API access |
| `CURSOR_API_KEY` | Cursor agent host access where supported |
| `RENDER_API_KEY` | Render API operations |
| `VERCEL_TOKEN` | Vercel CLI/API operations |
| `RAILWAY_TOKEN` | Railway CLI/API operations |
| `FLY_API_TOKEN` | Fly.io CLI/API operations |
| `AZURE_CLIENT_SECRET` | Azure service principal secret |
| `AWS_SECRET_ACCESS_KEY` | AWS credential secret component |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Google Cloud application credentials |
| `DIGITALOCEAN_ACCESS_TOKEN` | DigitalOcean API access |
| `OLLAMA_HOST` | Optional Ollama endpoint override |

Never commit values. Use process environment, masked local setup, encrypted local storage, or an approved secret manager. `.env.example` contains names only.
