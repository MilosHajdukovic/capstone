import type { Locator, Page } from '@playwright/test';

export type RoomName = 'Deluxe Room' | 'Superior Room' | 'Family Suite' | 'Penthouse Suite';

export const ROOM_NAMES: readonly RoomName[] = ['Deluxe Room', 'Superior Room', 'Family Suite', 'Penthouse Suite'];

export class RoomsPage {
  /** Flagged: page sections have no accessible name; located by ID. */
  readonly section: Locator;
  readonly heading: Locator;
  readonly grid: Locator;
  /**
   * Flagged: room cards are plain <div>s with no role, accessible name or
   * data-testid. Cards are matched by the `.room-card` class; recommend
   * data-testid="room-card-<id>" (or role="article" with aria-label).
   */
  readonly cards: Locator;

  constructor(private readonly page: Page) {
    this.section = page.locator('#page-rooms');
    this.heading = page.getByRole('heading', { name: 'Available Rooms' });
    this.grid = page.locator('#rooms-grid');
    this.cards = this.grid.locator('.room-card');
  }

  /** The card whose room name matches exactly. */
  card(name: RoomName): Locator {
    return this.cards.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  selectButton(name: RoomName): Locator {
    return this.card(name).getByRole('button', { name: 'Select Room' });
  }

  /** Flagged: room name has no heading role; located by class inside the card. */
  roomName(name: RoomName): Locator {
    return this.card(name).locator('.room-name');
  }

  /** Flagged: located by class inside the card. */
  description(name: RoomName): Locator {
    return this.card(name).locator('.room-desc');
  }

  /** Flagged: price elements have no accessible name; located by class inside the card. */
  originalPrice(name: RoomName): Locator {
    return this.card(name).locator('.price-original');
  }

  /** Flagged: see originalPrice. */
  discountedPrice(name: RoomName): Locator {
    return this.card(name).locator('.price-discounted');
  }

  /** Flagged: see originalPrice. */
  discountBadge(name: RoomName): Locator {
    return this.card(name).locator('.badge-discount');
  }

  /** Flagged: see originalPrice. */
  availabilityBadge(name: RoomName): Locator {
    return this.card(name).locator('.availability-badge');
  }

  /**
   * The card's <img> element, whatever its alt text. Flagged: getByRole('img')
   * misses images with alt="" (they become presentational), so presence checks
   * use the tag inside the card. Accessible-name checks use getByRole in the spec.
   */
  image(name: RoomName): Locator {
    return this.card(name).locator('img');
  }

  async selectRoom(name: RoomName) {
    await this.selectButton(name).click();
  }

  async doubleClickSelectRoom(name: RoomName) {
    await this.selectButton(name).dblclick();
  }
}
