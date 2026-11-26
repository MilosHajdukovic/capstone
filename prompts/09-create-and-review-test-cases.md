# Create and review test cases
We have three prompts here: first to set up the shared fixtures and page objects, second to create test cases using test cases draft from `test-cases-draft-review`, and the third one to review the created test cases before their first run.


## Fixtures and page objects

```
Follow @.claude/skills/test-authoring/SKILL.md. Set up the shared test code that all
BookNow specs will use. Don't write any spec files yet.

1. Config. In playwright.config.ts, make the tests start the app on their own:
   - Choose the app with the BOOKNOW_APP env variable. Default to booknow-broken;
     the only other allowed value is booknow-fixed. Throw a clear error for anything else.
   - Give each app its own port: booknow-broken on 3000, booknow-fixed on 3001.
     That way a server you started by hand can never be the wrong app.
   - baseURL: http://localhost:<port>
   - webServer: { command: `npx serve <app> -l <port> --no-port-switching`,
     url: `http://localhost:<port>`, reuseExistingServer: !process.env.CI }
     The --no-port-switching flag makes serve fail loudly if the port is taken,
     instead of quietly moving to another port.

2. Page objects. Create LoginPage, RoomsPage, BookingPage and ConfirmPage in tests/pages/.
   - Read booknow-broken/index.html first.
   - Choose locators in the order the skill gives: role, then label, then placeholder or text.
   - If a label is not linked to its input, use the element's ID and tell me about it.
   - Keep them simple: locators and user actions only. No assertions inside actions.

3. Fixtures. Create tests/fixtures.ts with test.extend:
   - One fixture for each page object: loginPage, roomsPage, bookingPage, confirmPage.
   - An `authenticatedPage` fixture. It logs in through the UI, waits until the
     Available Rooms page is visible, and then gives the page to the test.
   - Don't use storageState or a "log in once" setup. BookNow keeps its state in
     JS variables, and a reload sends you back to the login page. Each test must
     log in again.
   - Leave the normal `page` logged out, so the login specs can test the login form.

4. Credentials.
   - Read BOOKNOW_EMAIL and BOOKNOW_PASSWORD from process.env.
   - Don't add default values. If either one is missing, stop with a clear error.
   - .env.example already exists. Don't change it.

5. Check. Run `npx playwright test --list` to make sure the config and fixtures compile.
   There are no specs yet, so "No tests found" is expected at this stage. Only
   TypeScript or config errors count as failures.

When you're done, explain how a spec imports `test` and `expect` from tests/fixtures.ts
and uses `authenticatedPage`, so it never repeats the login steps. Also list any
locators you flagged.
```


## Test cases draft + test authoring skill 

```
Following @.claude/skills/test-authoring/SKILL.md and the test matrix in @test-cases-draft-review.md,
write specs only for feature sections marked `Status: APPROVED`. Put each feature in its own
file: tests/login.spec.ts, tests/rooms.spec.ts, tests/booking.spec.ts and tests/confirm.spec.ts.
Reuse and extend the page objects and fixtures that already exist in tests/.

Also handle the "Review Notes" section at the end of the draft:
- Dates: build booking dates relative to today in the fixture. Don't hardcode
  dates like 2026-12-01, because they will soon be in the past.
- Open questions: where the expected text is still an OPEN QUESTION, assert only
  what the draft asserts (for example, that the element is visible) and mark it
  with a `// OPEN QUESTION: ...` comment.
- Flagged items: apply the suggestions under "Flagged" (duplicates, branching steps,
  non-deterministic results). Leave TC-CONF-12 unautomated until its question is answered.
  Tell me which suggestions you applied and which you skipped.

Then walk me through how the specs satisfy each rule in the skill.
```


## Agentic review of the test cases

```
Review created test specs critically and report on four things:

1. LOCATORS — are they readable and stable (role/label based), or fragile structural chains that will break on a redesign? Flag any fragile ones.

2. ASSERTIONS — does each assertion check something that actually matters, or just that the page did not crash? Flag any weak or missing assertions.

3. FALSE GREENS — is there anything that would pass even if the feature were
   broken (waiting on an always-present element, asserting on static text)?

4. PLANNED REGRESSIONS — does every @regression test assert what requirements.md
   requires? Flag any that use test.fail, test.skip, test.fixme or expect.soft,
   or that weaken an assertion to match what the broken app does now.

For each issue, suggest the stronger version. Do not change the files yet.