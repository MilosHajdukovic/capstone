import { test, expect } from './fixtures';
import type { LoginPage } from './pages/LoginPage';
import type { RoomsPage } from './pages/RoomsPage';

/**
 * Login error check (draft Conventions): stays on the login page, shows a
 * non-empty error, and the Available Rooms heading is not visible.
 */
async function expectLoginRejected(loginPage: LoginPage, roomsPage: RoomsPage) {
  // The error is the element that changes, so it goes first: the other checks
  // were already true before Sign In was clicked.
  // OPEN QUESTION: exact login error wording is not specified; assert non-empty text only.
  await expect(loginPage.errorMessage).toBeVisible();
  await expect(loginPage.errorMessage).toHaveText(/\S/);
  await expect(loginPage.section).toBeVisible();
  await expect(roomsPage.heading).toBeHidden();
}

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  // ── Positive ────────────────────────────────────────────────────────────

  test('TC-LOGIN-01 valid credentials sign in and open the Available Rooms page', async ({
    loginPage,
    roomsPage,
    credentials,
  }) => {
    await loginPage.login(credentials.email, credentials.password);

    await expect(roomsPage.heading).toBeVisible();
    // Fixture assertion: 4 comes from the app's ROOMS data, not from the spec.
    await expect(roomsPage.cards).toHaveCount(4);
    await expect(loginPage.section).toBeHidden();
    // The whole login section is hidden, so check the error's own state, not its visibility.
    await expect(loginPage.errorMessage).toContainClass('hidden');
  });

  test('TC-LOGIN-02 nav bar becomes visible after a successful login', async ({
    loginPage,
    roomsPage,
    navBar,
    credentials,
  }) => {
    await loginPage.login(credentials.email, credentials.password);

    await expect(roomsPage.heading).toBeVisible();
    await expect(navBar.navigation).toBeVisible();
  });

  test('TC-LOGIN-03 @regression password field masks typed characters', async ({ loginPage, credentials }) => {
    await loginPage.passwordInput.fill(credentials.password);

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC-LOGIN-10 @regression nav bar is hidden on the login page before authentication', async ({
    loginPage,
    navBar,
  }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(navBar.navigation).toBeHidden();
  });

  test('TC-LOGIN-19 @regression a successful login marks the session as authenticated', async ({
    page,
    loginPage,
    roomsPage,
    credentials,
  }) => {
    await loginPage.login(credentials.email, credentials.password);
    await expect(roomsPage.heading).toBeVisible();

    // Coupled to the app global `isLoggedIn` (named in CLAUDE.md); breaks if it is renamed.
    await expect.poll(() => page.evaluate(() => isLoggedIn)).toBe(true);
  });

  // ── Negative ────────────────────────────────────────────────────────────

  test('TC-LOGIN-04 @regression rejects a wrong password with an error and stays on the login page', async ({
    loginPage,
    roomsPage,
    credentials,
  }) => {
    await loginPage.login(credentials.email, 'wrongpass123');

    await expectLoginRejected(loginPage, roomsPage);
  });

  test('TC-LOGIN-05 @regression rejects an unregistered email with the correct password', async ({
    loginPage,
    roomsPage,
    credentials,
  }) => {
    await loginPage.login('wrong@booknow.com', credentials.password);

    await expectLoginRejected(loginPage, roomsPage);
  });

  test('TC-LOGIN-06 @regression rejects submission with both fields empty', async ({ loginPage, roomsPage }) => {
    await loginPage.signInButton.click();

    await expectLoginRejected(loginPage, roomsPage);
  });

  test('TC-LOGIN-07 @regression rejects an empty password', async ({ loginPage, roomsPage, credentials }) => {
    await loginPage.login(credentials.email, '');

    await expectLoginRejected(loginPage, roomsPage);
  });

  test('TC-LOGIN-08 @regression rejects an empty email', async ({ loginPage, roomsPage, credentials }) => {
    await loginPage.login('', credentials.password);

    await expectLoginRejected(loginPage, roomsPage);
  });

  // One test per data row, so each row starts from a fresh page.
  for (const [label, email] of [
    ['no @', 'guestbooknow.com'],
    ['no domain', 'guest@'],
    ['no local part', '@booknow.com'],
  ] as const) {
    test(`TC-LOGIN-09 @regression rejects an email with ${label} (${email})`, async ({
      loginPage,
      roomsPage,
      credentials,
    }) => {
      await loginPage.login(email, credentials.password);

      await expectLoginRejected(loginPage, roomsPage);
    });
  }

  test('TC-LOGIN-11 @regression nav "Rooms" link does not open the Rooms page before login', async ({
    loginPage,
    roomsPage,
    navBar,
  }) => {
    // One path on every build: fire the link's click handler even if the navbar is hidden.
    // The link must exist, or "still on login" would pass without anything being clicked.
    await expect(navBar.roomsLinkIncludingHidden).toHaveCount(1);
    await navBar.triggerRoomsLink();

    await expect(loginPage.section).toBeVisible();
    await expect(roomsPage.section).toBeHidden();
    await expect(roomsPage.heading).toBeHidden();
  });

  test('TC-LOGIN-17 @regression nav bar stays hidden after a failed login attempt', async ({
    loginPage,
    roomsPage,
    navBar,
    credentials,
  }) => {
    await loginPage.login(credentials.email, 'wrongpass123');

    await expectLoginRejected(loginPage, roomsPage);
    await expect(navBar.navigation).toBeHidden();
  });

  test('TC-LOGIN-18 @regression reloading after login returns to the login page and locks protected pages again', async ({
    page,
    loginPage,
    roomsPage,
    navBar,
    credentials,
  }) => {
    await loginPage.login(credentials.email, credentials.password);
    await expect(roomsPage.heading).toBeVisible();

    await page.reload();

    await expect(loginPage.section).toBeVisible();
    await expect(roomsPage.section).toBeHidden();
    await expect(navBar.navigation).toBeHidden();

    await page.evaluate(() => showPage('rooms'));

    await expect(loginPage.section).toBeVisible();
    await expect(roomsPage.section).toBeAttached(); // toBeHidden alone passes if the section is gone
    await expect(roomsPage.section).toBeHidden();
  });

  // ── Edge ────────────────────────────────────────────────────────────────

  test('TC-LOGIN-12 @open-question rejects an email with no top-level domain', async ({
    loginPage,
    roomsPage,
    credentials,
  }) => {
    await loginPage.login('guest@booknow', credentials.password);

    // OPEN QUESTION: does "contains @ and a domain" (L2) require a TLD? Proposed: rejected.
    await expectLoginRejected(loginPage, roomsPage);
  });

  test('TC-LOGIN-13 @open-question login with the valid email in uppercase', async ({ loginPage, roomsPage, credentials }) => {
    await loginPage.login(credentials.email.toUpperCase(), credentials.password);

    // OPEN QUESTION: is the email match case-insensitive? Either outcome is accepted until
    // the product owner decides; this checks the app reaches exactly one of them, not both or neither.
    await expect(roomsPage.heading.or(loginPage.errorMessage).filter({ visible: true })).toHaveCount(1);
  });

  test('TC-LOGIN-14 @open-question login with the valid email padded with spaces', async ({ loginPage, roomsPage, credentials }) => {
    await loginPage.login(` ${credentials.email} `, credentials.password);

    // OPEN QUESTION: should leading/trailing whitespace be trimmed? Either outcome is accepted
    // until the product owner decides; this checks the app reaches exactly one of them, not both or neither.
    await expect(roomsPage.heading.or(loginPage.errorMessage).filter({ visible: true })).toHaveCount(1);
  });

  test('TC-LOGIN-15 @open-question rejects whitespace-only email and password', async ({ loginPage, roomsPage }) => {
    await loginPage.login('   ', '   ');

    // OPEN QUESTION: does "empty" include whitespace-only values? Proposed: rejected.
    await expectLoginRejected(loginPage, roomsPage);
  });

  test('TC-LOGIN-16 double-clicking Sign In with valid credentials lands on Available Rooms once', async ({
    loginPage,
    roomsPage,
    credentials,
  }) => {
    await loginPage.emailInput.fill(credentials.email);
    await loginPage.passwordInput.fill(credentials.password);
    await loginPage.signInButton.dblclick();

    await expect(roomsPage.heading).toBeVisible();
    await expect(roomsPage.cards).toHaveCount(4);
    await expect(loginPage.section).toBeHidden();
    // The whole login section is hidden, so check the error's own state, not its visibility.
    await expect(loginPage.errorMessage).toContainClass('hidden');
  });

  test('TC-LOGIN-20 @regression valid login succeeds after a failed attempt without a reload', async ({
    loginPage,
    roomsPage,
    credentials,
  }) => {
    await loginPage.login(credentials.email, 'wrongpass123');
    await expectLoginRejected(loginPage, roomsPage);

    await loginPage.passwordInput.fill(credentials.password);
    await loginPage.signInButton.click();

    await expect(roomsPage.heading).toBeVisible();
    await expect(loginPage.section).toBeHidden();
    // The failed attempt showed the error; it must be cleared by the app, not just hidden with the page.
    await expect(loginPage.errorMessage).toContainClass('hidden');
  });
});
