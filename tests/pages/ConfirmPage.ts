import type { Locator, Page } from '@playwright/test';

export type ConfirmRowLabel = 'Guest' | 'Email' | 'Room' | 'Check-in' | 'Check-out' | 'Nights' | 'Total Charged';

export class ConfirmPage {
  /** Flagged: page sections have no accessible name; located by ID. */
  readonly section: Locator;
  readonly heading: Locator;
  /**
   * Flagged: located by ID, and the element exists only in booknow-fixed.
   * booknow-broken has no #confirm-ref, so assertions on it fail there (a finding).
   */
  readonly bookingReference: Locator;
  /** Flagged: same as bookingReference (#confirm-summary is missing in booknow-broken). */
  readonly bookingSummary: Locator;
  /** Flagged: summary rows have no IDs; each row is matched by its exact label text. */
  readonly summaryRows: Locator;
  /** Flagged: the subtitle has no ID or accessible name; located by class. */
  readonly subtitle: Locator;
  readonly browseMoreRoomsButton: Locator;

  constructor(private readonly page: Page) {
    this.section = page.locator('#page-confirm');
    this.heading = page.getByRole('heading', { name: 'Booking Confirmed!' });
    this.bookingReference = page.locator('#confirm-ref');
    this.bookingSummary = page.locator('#confirm-summary');
    this.summaryRows = this.bookingSummary.locator('.confirm-row');
    this.subtitle = this.section.locator('.confirm-subtitle');
    this.browseMoreRoomsButton = page.getByRole('button', { name: 'Browse More Rooms' });
  }

  /** The summary row whose label is exactly `label`, e.g. row('Guest'). */
  row(label: ConfirmRowLabel): Locator {
    return this.summaryRows.filter({ has: this.page.getByText(label, { exact: true }) });
  }

  async browseMoreRooms() {
    await this.browseMoreRoomsButton.click();
  }
}
