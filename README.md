# Agentic Playwright Testing

This project demonstrates setting up a Playwright testing framework with MCP and Claude Code. The demo app used for testing is BookNow, a simple hotel-booking app. There are two versions of the app, `booknow-broken` with planted bugs and `booknow-fixed` without the known defects.

## How testing works in this project


Prompts are used to direct the process. The testing process has several phases:
1. Agent-assisted exploration of the app
2. Closing the coverage gap against requirements
3. Test case design
4. Implementing the test cases as Playwright specs

### Agent-assisted exploration of the app
The initial exploration does not use any requirement document, but relies on checks conducted by agent. 
When the exploration is done, agent outputs draft notes. It is on tester to decide whether the notes are correct and useful or not before saving them in `qa-exploration-notes.md`

```mermaid
flowchart TD
    Start(["Start"])
    S1[/"1. Tester instructs agent to explore app or app section"/]
    S2["2. Playwright drives browser through MCP and collects data"]
    S3[/"3. Agent outputs notes draft"/]
    S4{"4. Is the tester satisfied with the notes?"}
    S4a{"Significant errors in the notes draft?"}
    S4b[/"Review the prompt and go to 1."/]
    S4c[/"Correct notes by hand and go to 5."/]
    S5[("5. Notes are saved in qa-exploration-notes.md")]
    End(["End"])

    Start --> S1 --> S2 --> S3 --> S4
    S4 -- Yes --> S5
    S4 -- No --> S4a
    S4a -- Yes --> S4b --> S1
    S4a -- No --> S4c --> S5
    S5 --> End

    classDef tester fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef agent fill:#E6F1FB,stroke:#185FA5,color:#042C53
    classDef artifact fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    class S1,S4b,S4c tester
    class S2,S3 agent
    class S5 artifact
```

### Closing the coverage gap against requirements

```mermaid
flowchart TD
    Start(["Start"])
    S6[/"6. Tester instructs agent to verify notes against requirements (documentation)"/]
    S7[/"7. Agent reports coverage gaps"/]
    S8{"8. Is the coverage gap closed?"}
    S8a{"Significant part of requirements is not covered?"}
    S8b[/"Review the prompt and re-run check 6."/]
    S8c[/"Correct the notes by hand and go to 9."/]
    S9[("9. Notes are saved in qa-exploration-notes.md")]
    End(["End"])

    Start --> S6 --> S7 --> S8
    S8 -- Yes --> S9
    S8 -- No --> S8a
    S8a -- Yes --> S8b --> S6
    S8a -- No --> S8c --> S9
    S9 --> End

    classDef tester fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef agent fill:#E6F1FB,stroke:#185FA5,color:#042C53
    classDef artifact fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    class S6,S8b,S8c tester
    class S7 agent
    class S9 artifact
```

### Test case design

```mermaid
flowchart TD
    Start(["Start"])
    S10[/"10. Tester instructs agent to create test cases draft based on notes + test case design skill"/]
    S11[/"11. Agent outputs the test cases draft"/]
    S12{"12. Is the tester satisfied with the test cases draft?"}
    S12a{"Significant errors in test cases draft?"}
    S12b[/"Review the test design skill and re-run check 10."/]
    S12c[/"Correct test cases by hand and go to 13."/]
    S13[("13. Test cases are reviewed and saved in test-cases-draft-review.md")]
    End(["End"])

    Start --> S10 --> S11 --> S12
    S12 -- Yes --> S13
    S12 -- No --> S12a
    S12a -- Yes --> S12b --> S10
    S12a -- No --> S12c --> S13
    S13 --> End

    classDef tester fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef agent fill:#E6F1FB,stroke:#185FA5,color:#042C53
    classDef artifact fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    class S10,S12b,S12c tester
    class S11 agent
    class S13 artifact
```


## Running the apps

Install dependencies:

    npm install
    npx playwright install chromium

BookNow is plain static files (`index.html`, `app.js`, `style.css`) with no backend or build step, so any static server works. From the repo root:

    npx serve booknow-broken     # app under test, http://localhost:3000
    npx serve booknow-fixed      # corrected app, http://localhost:3000

Both apps are served on port 3000, one at a time. `booknow-broken` is the app under test. `booknow-fixed` is used only to confirm that the tests pass once the bugs are fixed. Because both use the same URL, the same test suite runs against either app without any changes. Stop one server with `Ctrl+C` before starting the other.

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

## Playwright MCP

Claude Code drives the browser through the [Playwright MCP server](https://github.com/microsoft/playwright-mcp).
It is configured at **local scope**, so the config lives in my `~/.claude.json`, not in this repo, and there is no `.mcp.json`.

Why local scope:
- It keeps machine-specific tool config out of the repo.
- The setup is documented and reproducible through a prompt instead.

To set it up on your machine, run the prompt in [`prompts/01-set-up-mcp.md`](prompts/01-set-up-mcp.md) in Claude Code, or run:

    claude mcp add --scope local playwright -- npx @playwright/mcp@latest
    npx playwright install chromium

The MCP server writes page snapshots and screenshots to `.playwright-mcp/`, which is gitignored.


## Authors

- [@MilosHajdukovic](https://github.com/MilosHajdukovic)
