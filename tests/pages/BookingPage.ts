import type { Locator, Page } from '@playwright/test';

export type BookingField = 'fname' | 'lname' | 'email' | 'phone' | 'checkin' | 'checkout' | 'guests';

export const BOOKING_FIELDS: readonly BookingField[] = ['fname', 'lname', 'email', 'phone', 'checkin', 'checkout', 'guests'];

export const BOOKING_LABELS = [
  'First Name',
  'Last Name',
  'Email Address',
  'Phone Number',
  'Check-in Date',
  'Check-out Date',
  'Number of Guests',
] as const;

export interface GuestDetails {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  /** yyyy-mm-dd */
  checkIn?: string;
  /** yyyy-mm-dd */
  checkOut?: string;
  guests?: string;
}

/** A complete set of form values (every field given). */
export type BookingData = Required<GuestDetails>;

/** Form values that clear every field, including the Guests default of 1. */
export const EMPTY_FORM: BookingData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  checkIn: '',
  checkOut: '',
  guests: '',
};

/**
 * Flagged: every booking-form <label> lacks a `for` attribute, so none of the
 * inputs have an accessible name and getByLabel cannot find them. Inputs and
 * their error messages are located by their stable IDs (book-<field>,
 * err-<field>). Recommend adding for="book-<field>" to each label.
 */
export class BookingPage {
  /** Flagged: page sections have no accessible name; located by ID. */
  readonly section: Locator;
  readonly heading: Locator;
  readonly guestDetailsHeading: Locator;
  readonly stayDetailsHeading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly checkInInput: Locator;
  readonly checkOutInput: Locator;
  readonly guestsInput: Locator;
  readonly bookNowButton: Locator;
  /** Book Now even while the booking section is hidden (getByRole skips hidden elements by default). */
  readonly bookNowButtonIncludingHidden: Locator;
  readonly summaryPanel: Locator;
  readonly summaryHeading: Locator;
  readonly summaryRoomName: Locator;
  /** Flagged: summary rows have no IDs; the row is matched by its "Price per night" label. */
  readonly summaryPricePerNight: Locator;
  readonly summaryNights: Locator;
  readonly summaryTotal: Locator;

  constructor(private readonly page: Page) {
    this.section = page.locator('#page-booking');
    this.heading = page.getByRole('heading', { name: 'Complete Your Booking' });
    this.guestDetailsHeading = page.getByRole('heading', { name: 'Guest Details' });
    this.stayDetailsHeading = page.getByRole('heading', { name: 'Stay Details' });
    this.firstNameInput = page.locator('#book-fname');
    this.lastNameInput = page.locator('#book-lname');
    this.emailInput = page.locator('#book-email');
    this.phoneInput = page.locator('#book-phone');
    this.checkInInput = page.locator('#book-checkin');
    this.checkOutInput = page.locator('#book-checkout');
    this.guestsInput = page.locator('#book-guests');
    this.bookNowButton = page.getByRole('button', { name: 'Book Now' });
    this.bookNowButtonIncludingHidden = page.getByRole('button', { name: 'Book Now', includeHidden: true });
    this.summaryPanel = page.locator('#booking-summary');
    this.summaryHeading = this.summaryPanel.getByRole('heading', { name: 'Booking Summary' });
    // Flagged: summary room name has no ID or accessible name; located by class.
    this.summaryRoomName = this.summaryPanel.locator('.summary-room-name');
    this.summaryPricePerNight = this.summaryPanel.locator('.summary-row').filter({ hasText: 'Price per night' });
    this.summaryNights = page.locator('#summary-nights');
    this.summaryTotal = page.locator('#summary-total');
  }

  /** The input for a field, by its stable ID. */
  input(field: BookingField): Locator {
    return this.page.locator(`#book-${field}`);
  }

  /** A visible label text inside the booking section (labels are not linked to inputs). */
  label(text: string): Locator {
    return this.section.getByText(text, { exact: true });
  }

  /** Validation message under a form field (err-<field>). */
  fieldError(field: BookingField): Locator {
    return this.page.locator(`#err-${field}`);
  }

  /** Fills only the fields that are given, so tests can leave fields empty on purpose. */
  async fillForm(details: GuestDetails) {
    const entries: [Locator, string | undefined][] = [
      [this.firstNameInput, details.firstName],
      [this.lastNameInput, details.lastName],
      [this.emailInput, details.email],
      [this.phoneInput, details.phone],
      [this.checkInInput, details.checkIn],
      [this.checkOutInput, details.checkOut],
      [this.guestsInput, details.guests],
    ];
    for (const [input, value] of entries) {
      if (value !== undefined) await input.fill(value);
    }
  }

  async submit() {
    await this.bookNowButton.click();
  }

  async doubleClickSubmit() {
    await this.bookNowButton.dblclick();
  }

  /** Clears then fills both dates, so a change event fires even if a value is unchanged. */
  async setDates(checkIn: string, checkOut: string) {
    await this.checkInInput.fill('');
    await this.checkOutInput.fill('');
    await this.checkInInput.fill(checkIn);
    await this.checkOutInput.fill(checkOut);
  }

  /**
   * Fires Book Now's click handler even when the booking section is hidden.
   * Used by unauthenticated-access tests so the same step runs on every build.
   */
  async triggerSubmit() {
    await this.bookNowButtonIncludingHidden.dispatchEvent('click');
  }
}
