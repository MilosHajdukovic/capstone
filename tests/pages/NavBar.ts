import type { Locator, Page } from '@playwright/test';

export class NavBar {
  readonly navigation: Locator;
  /**
   * Flagged: an <a> without href, so it has no link role. Located by exact text
   * inside the navigation landmark. Recommend <a href="#rooms"> (or a <button>).
   */
  readonly roomsLink: Locator;
  /**
   * Flagged: the logo is a clickable <div> with no role or accessible name.
   * Located by its exact text. Recommend making it a link.
   */
  readonly logo: Locator;
  /** The Rooms link even while the navbar is hidden (getByRole skips hidden elements by default). */
  readonly roomsLinkIncludingHidden: Locator;

  constructor(page: Page) {
    this.navigation = page.getByRole('navigation');
    this.roomsLink = this.navigation.getByText('Rooms', { exact: true });
    this.logo = this.navigation.getByText('BookNow', { exact: true });
    this.roomsLinkIncludingHidden = page
      .getByRole('navigation', { includeHidden: true })
      .getByText('Rooms', { exact: true });
  }

  async goToRooms() {
    await this.roomsLink.click();
  }

  async clickLogo() {
    await this.logo.click();
  }

  /**
   * Fires the Rooms link's click handler even when the navbar is hidden.
   * Used by unauthenticated-access tests so the same step runs on every build.
   */
  async triggerRoomsLink() {
    await this.roomsLinkIncludingHidden.dispatchEvent('click');
  }
}
