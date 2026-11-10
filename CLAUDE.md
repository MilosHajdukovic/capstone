# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

QA capstone: agentic Playwright testing of **BookNow**, a static hotel-booking app (login → available rooms → booking form → confirmation). `requirements.md` is the Sprint 1 spec and the source of truth. Every requirement should be covered by tests, and every deviation reported as a finding. The spec deliberately does not disclose how many bugs there are or where they are.

## Layout

- `booknow-broken/`: the app under test, with seeded bugs.
- `booknow-fixed/`: a corrected version of the same app (same structure and element IDs).
- `tests/`: Playwright specs. Currently contains only the default `example.spec.ts`, which targets playwright.dev and not BookNow.
- `prompts/`: prompts used to generate and heal tests, kept for the portfolio. Claude Code does not read this folder.
- `.claude/skills/<name>/SKILL.md`: project skills.

## App architecture

Each app is a single page made of `index.html`, `app.js` and `style.css`, with no backend and no build step.
- All four "pages" are sections in `index.html` (`#page-login`, `#page-rooms`, `#page-booking`, `#page-confirm`). `showPage(name)` in `app.js` toggles the `hidden` class and contains the auth guard (`isLoggedIn`).
- State lives only in JS globals (`isLoggedIn`, `selectedRoom`, `currentNights`, `lastBooking`). A page reload resets everything to the login page, so each test must log in through the UI.
- Room data is the hardcoded `ROOMS` array in `app.js`. Discount math is in `calcDiscounted`, totals in `updateTotal`, and validation in `placeBooking`.
- Elements have stable IDs that make good selectors: `login-user`, `login-pass`, `login-error`, `rooms-grid`, `book-<field>` with a matching `err-<field>` (fname, lname, email, phone, checkin, checkout, guests), `summary-nights`, `summary-total`, `confirm-ref`, `confirm-summary`, `main-navbar`, `toast`. There are no `data-testid` attributes.

## Commands

There are no npm scripts. Serve the app and run Playwright directly:

```bash
npx serve booknow-broken          # serves on http://localhost:3000 (default port)
npx playwright test               # all tests (Chromium only; html reporter)
npx playwright test tests/login.spec.ts          # single file
npx playwright test -g "rejects empty fields"    # single test by title
npx playwright test --headed / --ui / --debug
npx playwright show-report
```

`playwright.config.ts` currently has `baseURL` and `webServer` commented out. To make tests self-contained, set `webServer` to `npx serve booknow-broken` and `baseURL` to `http://localhost:3000`.

## Conventions

- **Git: never run `git commit` or `git push` on your own.** Do it only when the user explicitly asks for that exact action (e.g. "commit this", "push to GitHub"). Wording such as "I'd like to add the changes to GitHub" is not such a request. In that case, prepare the changes, show what would be committed, and ask first.
- Credentials come from `.env` (loaded via dotenv in the config): `process.env.BOOKNOW_EMAIL` and `process.env.BOOKNOW_PASSWORD`. Never hardcode them in tests. `.env.example` holds the public practice values.
- Chrome only, which matches the spec's scope.
- Playwright output (`test-results/`, `playwright-report/`, `blob-report/`, `playwright/.auth/`) is gitignored and must not be committed.
