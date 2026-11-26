import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  /** Flagged: page sections have no accessible name; located by ID. */
  readonly section: Locator;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  /** Flagged: no role="alert" or accessible name, so it is located by its stable ID. */
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.section = page.locator('#page-login');
    this.heading = page.getByRole('heading', { name: 'Welcome Back' });
    // Scoped to the login section: getByLabel also matches hidden elements, so once the
    // booking form's "Email Address" label is linked it would match two inputs.
    this.emailInput = this.section.getByLabel('Email Address');
    this.passwordInput = this.section.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.errorMessage = page.locator('#login-error');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
