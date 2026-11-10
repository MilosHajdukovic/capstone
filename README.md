
# Agentic Playwright Testing

A brief description of the project, how and Why I made certain decisions

## Authors

- [@MilosHajdukovic](https://github.com/MilosHajdukovic)

## Credentials

| Email | Password |
| --- | --- |
| `guest@booknow.com` | `stay2026` |

This is a static practice app with no backend to protect, so these credentials are public on purpose. The project still follows these good practices:

- Playwright tests read the credentials from environment variables instead of hardcoding them:
  - `process.env.BOOKNOW_EMAIL`
  - `process.env.BOOKNOW_PASSWORD`
- Prompts for generating and healing tests instruct the AI not to hardcode credentials.
- `.gitignore` excludes `.env*` files, which can contain credentials and API keys. `.env.example` is still committed.
- `.gitignore` excludes Playwright output that could expose sensitive data:
  - `/playwright/.auth/`: saved login sessions, including cookies and local storage
  - `/test-results/`, `/playwright-report/` and `/blob-report/`: screenshots, videos or traces that can capture values entered during tests. 

