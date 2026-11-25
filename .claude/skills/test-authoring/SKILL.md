---
name: test-authoring
description: Rules for writing and updating Playwright TypeScript tests for BookNow (locators, assertions, page objects, fixtures, credentials). Use whenever creating, editing or healing a spec in tests/.
---

# Playwright Test Authoring Standard

This document is the authoritative standard for authoring automated Playwright tests in TypeScript. Whenever instructed to generate or update tests, adhere strictly to these rules.

---

## 1. Locators & Element Selection

Always use user-facing, accessibility-first locators that reflect how humans and assistive technologies perceive the page:

1. **`page.getByRole(role, { name })`** — First preference for interactive elements (buttons, headings, links, dialogs, checkboxes).
2. **`page.getByLabel(text)`** — First preference for form inputs associated with labels.
3. **`page.getByPlaceholder(text)` / `page.getByText(text)`** — Secondary preference when roles or labels are absent.

### Prohibited
- **No brittle CSS chains**: Never use structural or DOM-dependent paths (e.g., `div > div:nth-child(2) > p > span`, `.container > div.row:first-child`).
- **No raw XPath**: Avoid XPath selectors unless targeting complex sibling relationships impossible with Playwright APIs.
- **Unstable locators**: If no clean, accessible locator is available, flag it and recommend adding a stable attribute (such as `data-testid="..."`).
- **Unassociated form labels**: Check the real markup before using `getByLabel`. A visible `<label>` that is not associated with its input is not an accessible locator. Prefer an existing stable, documented input ID over a placeholder selector, and flag the missing label association; recommend connecting the label with `for`/`id` or adding an accessible name.

---

## 2. Assertions & Verifications

Every test must assert the **actual, verifiable business outcome** of the action being tested.

- **Outcome-focused**: Assert changes in state, calculated values, visibility, URL, or error text:
  ```ts
  await expect(page.getByRole('heading', { name: 'Our Products' })).toBeVisible();
  await expect(cartPage.cartBadge).toHaveText('2');
  await expect(page.locator('#toast')).toContainText('added to cart');
  ```
- **Prohibited**:
  - Never finish a test merely with "the page didn't throw an error".
  - Never assert on static boilerplate that never changes (e.g., asserting the generic footer exists after submitting a checkout form).
  - Never use raw JavaScript `assert` or untimed conditions; use Playwright web assertions (`expect(locator)...`).

---

## 3. Test Structure & Page Object Models (POM)

Maintain a clean, scalable directory and file structure:

- **One spec per feature area**: Group tests into dedicated spec files under `tests/` (e.g., `tests/login.spec.ts`, `tests/cart.spec.ts`, `tests/checkout.spec.ts`).
- **Lightweight Page Objects**: Create light POM classes in a dedicated pages directory (e.g., `tests/pages/LoginPage.ts`) to encapsulate locators and user actions:
  ```ts
  export class LoginPage {
    constructor(private page: Page) {}
    readonly usernameInput = this.page.getByLabel('Username');
    readonly passwordInput = this.page.getByLabel('Password');
    readonly signInButton = this.page.getByRole('button', { name: 'Sign In' });

    async goto() {
      await this.page.goto('/');
    }

    async login(user: string, pass: string) {
      await this.usernameInput.fill(user);
      await this.passwordInput.fill(pass);
      await this.signInButton.click();
    }
  }
  ```
- Keep POMs lightweight: do not over-engineer deep inheritance trees or bury assertions inside action methods unless verifying POM page transitions.

---

## 4. Fixtures & Shared Setup

- **DRY prerequisite journeys**: Repeated multi-step setups (such as logging in or seeding cart items) must be defined as reusable Playwright custom fixtures (`test.extend(...)`).
- **Never copy-paste setup**: Do not duplicate identical 5-line login or navigation steps across 10 different test files. Consume the fixture directly:
  ```ts
  test('user can adjust cart item quantity', async ({ authenticatedUser, cartPage }) => {
    // authenticatedUser fixture handles setup cleanly
  });
  ```

---

## 5. Test Isolation & Independence

- **Zero cross-test dependencies**: Every test must be completely independent and executable in isolation, in parallel, and in any random order.
- **Fresh state**: Each test begins with its own isolated browser context, storage state, and clean slate. Never rely on cookies, cart items, or session state left behind by an earlier test.

---

## 6. Secrets & Environment Variables

- **No hardcoded credentials**: Never commit or write passwords, access tokens, or private emails into test code or POMs.
- **Environment variables**: Read credentials only from `BOOKNOW_EMAIL` and `BOOKNOW_PASSWORD` (loaded from `.env` by the Playwright config). Never add fallback values; fail fast with a clear error if either is missing:
  ```ts
  const email = process.env.BOOKNOW_EMAIL;
  const password = process.env.BOOKNOW_PASSWORD;
  if (!email || !password) {
    throw new Error('Set BOOKNOW_EMAIL and BOOKNOW_PASSWORD in .env (see .env.example)');
  }
  ```

---

## 7. Planned Regressions (Known Defects)

Test cases flagged `Planned Regression` in `test-cases-draft-review.md` cover known bugs in `booknow-broken`.

- **Assert the required behavior**: The expected result comes from `requirements.md`, never from what the broken app currently does.
- **Expected to fail on booknow-broken**: A red result is the intended outcome and becomes a bug report. It should pass on `booknow-fixed`.
- **Never hide the failure**: Do not use `test.fail()`, `test.skip()`, `test.fixme()` or `expect.soft()` on these tests, and do not loosen or delete an assertion to get a green run.
- **Tag the test**: Put the TC ID and `@regression` in the title, e.g. `test('TC-BOOK-07 @regression rejects checkout before checkin', ...)`, so these tests can be run with `-g @regression`.

---

## 8. Strictly Prohibited Anti-Patterns

1. ❌ **No arbitrary sleep calls**: `page.waitForTimeout(...)` or `setTimeout(...)` are strictly forbidden. Always rely on Playwright's built-in auto-waiting and web assertions (`toBeVisible()`, `toHaveText()`, etc.).
2. ❌ **No hardcoded secrets**: All credentials must be sourced from environment variables.
3. ❌ **No static/vacuous assertions**: Assertions must verify the dynamic consequence of the tested user action.
4. ❌ **No brittle selector paths**: Structural CSS/XPath chains are banned.
5. ❌ **No masking real defects**: Never skip, mark as expected-fail, or weaken an assertion to make a test that reveals a requirement deviation pass.
